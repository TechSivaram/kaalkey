const { app, BrowserWindow, ipcMain, protocol, screen } = require("electron");

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

// Register a secure, standard custom scheme before app readiness.
// This gives the packaged renderer a stable origin instead of file://.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "kaalkey",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// ==================================================
// 1. KaalKey application identity
// ==================================================

app.setName("KaalKey");

const appDataPath = app.getPath("appData");
const userDataPath = path.join(appDataPath, "KaalKey");

fs.mkdirSync(userDataPath, { recursive: true });

app.setPath("userData", userDataPath);

console.log("[KaalKey] User data:", app.getPath("userData"));
console.log("[KaalKey] App name:", app.getName());

// ==================================================
// 2. PIN storage
// ==================================================

const lockFile = path.join(userDataPath, "vault-lock.json");
const windowStateFile = path.join(userDataPath, "desktop-window.json");
const SIDEBAR_MIN_WIDTH = 393; // Matches the web splitter's minWidth.
const SIDEBAR_DEFAULT_WIDTH = 450;
const SIDEBAR_MAX_WIDTH = 560;
const WINDOW_MIN_HEIGHT = 500;

let failedAttempts = 0;
let blockedUntil = 0;

function readLockData() {
  try {
    return JSON.parse(fs.readFileSync(lockFile, "utf8"));
  } catch {
    return null;
  }
}

function hashPin(pin, salt) {
  return crypto.scryptSync(pin, salt, 32).toString("hex");
}

// Check PIN configuration
ipcMain.handle("desktop-lock:status", () => ({
  configured: !!readLockData(),
  timeoutMs: 5 * 60 * 1000,
}));

// Configure PIN
ipcMain.handle("desktop-lock:set-pin", (_, pin) => {
  if (typeof pin !== "string" || !/^\d{6,12}$/.test(pin)) {
    return {
      success: false,
      error: "PIN must contain 6–12 digits.",
    };
  }

  const salt = crypto.randomBytes(16).toString("hex");

  const data = {
    salt,
    hash: hashPin(pin, salt),
  };

  fs.writeFileSync(lockFile, JSON.stringify(data), {
    encoding: "utf8",
    mode: 0o600,
  });

  failedAttempts = 0;
  blockedUntil = 0;

  return { success: true };
});

// Reset only the desktop PIN. Authenticator account storage is not touched.
ipcMain.handle("desktop-lock:reset-pin", () => {
  try {
    if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
    failedAttempts = 0;
    blockedUntil = 0;
    return { success: true };
  } catch (error) {
    console.error("[KaalKey] Failed to reset desktop PIN:", error);
    return { success: false, error: "reset_failed" };
  }
});

// Verify PIN
ipcMain.handle("desktop-lock:verify-pin", (_, pin) => {
  if (Date.now() < blockedUntil) {
    return {
      success: false,
      error: "Too many attempts. Try again later.",
    };
  }

  const data = readLockData();

  if (!data || typeof pin !== "string") {
    return { success: false };
  }

  const actual = Buffer.from(hashPin(pin, data.salt), "hex");
  const expected = Buffer.from(data.hash, "hex");

  const valid = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);

  if (valid) {
    failedAttempts = 0;
    blockedUntil = 0;
    return { success: true };
  }

  failedAttempts += 1;

  if (failedAttempts >= 5) {
    failedAttempts = 0;
    blockedUntil = Date.now() + 30_000;
  }

  return { success: false };
});

// ==================================================
// 3. Renderer diagnostics
// ==================================================

function attachRendererDiagnostics(win) {
  const contents = win.webContents;

  contents.on("dom-ready", () => {
    console.log("[KaalKey] DOM ready");
  });

  contents.on("did-finish-load", async () => {
    console.log("[KaalKey] Page loaded successfully");

    try {
      const bridge = await contents.executeJavaScript("typeof window.kaalkeyDesktop");

      console.log("[KaalKey] Desktop bridge:", bridge);
    } catch (error) {
      console.error("[KaalKey] Bridge check failed:", error);
    }

    win.show();
  });

  contents.on("did-fail-load", (_, errorCode, errorDescription, validatedURL) => {
    console.error("[KaalKey] Page load failed:", {
      errorCode,
      errorDescription,
      validatedURL,
    });
  });

  contents.on("render-process-gone", (_, details) => {
    console.error("[KaalKey] Renderer process gone:", details);
  });

  contents.on("console-message", (_, details) => {
    console.log(`[KaalKey Renderer ${details.level}]:`, details.message);
  });

  contents.on("unresponsive", () => {
    console.error("[KaalKey] Renderer became unresponsive");
  });

  contents.on("responsive", () => {
    console.log("[KaalKey] Renderer became responsive");
  });
}

// ==================================================
// 4. Packaged application protocol
// ==================================================

const APP_SCHEME = "kaalkey";
const APP_HOST = "bundle";
const DIST_DIR = path.resolve(__dirname, "../dist");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

async function registerKaalKeyProtocol() {
  if (!app.isPackaged) return;

  await protocol.handle(APP_SCHEME, async (request) => {
    try {
      const url = new URL(request.url);

      if (url.hostname !== APP_HOST) {
        return new Response("Not found", { status: 404 });
      }

      let requestPath = decodeURIComponent(url.pathname || "/");
      if (requestPath === "/" || requestPath.endsWith("/")) {
        requestPath += "index.html";
      }

      // Resolve only within the packaged dist directory.
      const filePath = path.resolve(DIST_DIR, `.${requestPath}`);
      const relativePath = path.relative(DIST_DIR, filePath);

      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        return new Response("Forbidden", { status: 403 });
      }

      let resolvedPath = filePath;

      // Expo Router may request a client-side route directly. Serve the
      // exported entry document for extensionless navigation paths only.
      if (!path.extname(resolvedPath) && request.method === "GET") {
        try {
          const stat = await fs.promises.stat(resolvedPath);
          if (stat.isDirectory()) {
            resolvedPath = path.join(resolvedPath, "index.html");
          }
        } catch {
          resolvedPath = path.join(DIST_DIR, "index.html");
        }
      }

      const body = await fs.promises.readFile(resolvedPath);
      const contentType =
        MIME_TYPES[path.extname(resolvedPath).toLowerCase()] || "application/octet-stream";

      return new Response(request.method === "HEAD" ? null : body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control":
            path.extname(resolvedPath) === ".html"
              ? "no-cache"
              : "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      console.error("[KaalKey] Protocol request failed:", request.url, error);
      return new Response("Not found", { status: 404 });
    }
  });

  console.log("[KaalKey] Custom protocol registered:", `${APP_SCHEME}://${APP_HOST}/`);
}

// ==================================================
// 5. Desktop window modes
// ==================================================

let mainWindow;
let windowMode = "sidebar";

function readWindowState() {
  try {
    const state = JSON.parse(fs.readFileSync(windowStateFile, "utf8"));
    return state?.mode === "expanded" ? "expanded" : "sidebar";
  } catch {
    return "sidebar";
  }
}

function saveWindowState() {
  try {
    fs.writeFileSync(windowStateFile, JSON.stringify({ mode: windowMode }), {
      encoding: "utf8",
      mode: 0o600,
    });
  } catch (error) {
    console.error("[KaalKey] Could not save window state:", error);
  }
}

function getSidebarBounds(display = screen.getPrimaryDisplay()) {
  const { x, y, width, height } = display.workArea;
  const minWidth = Math.min(SIDEBAR_MIN_WIDTH, width);
  const maxWidth = Math.max(minWidth, Math.min(SIDEBAR_MAX_WIDTH, width));
  const desiredWidth = Math.max(minWidth, Math.min(SIDEBAR_DEFAULT_WIDTH, maxWidth));
  return {
    x: x + width - desiredWidth,
    y,
    width: desiredWidth,
    height,
  };
}

function getExpandedBounds(display = screen.getPrimaryDisplay()) {
  return { ...display.workArea };
}

function applyWindowMode(mode, persist = true) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const display = screen.getDisplayMatching(mainWindow.getBounds());
  windowMode = mode === "expanded" ? "expanded" : "sidebar";
  const bounds = windowMode === "expanded" ? getExpandedBounds(display) : getSidebarBounds(display);

  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  mainWindow.setMinimumSize(
    Math.min(SIDEBAR_MIN_WIDTH, display.workArea.width),
    Math.min(WINDOW_MIN_HEIGHT, display.workArea.height),
  );
  mainWindow.setBounds(bounds, true);

  if (persist) saveWindowState();
  console.log(`[KaalKey] Window mode: ${windowMode}`, bounds);
}

ipcMain.handle("desktop-window:minimize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
  return true;
});
ipcMain.handle("desktop-window:close", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  return true;
});
ipcMain.handle("desktop-window:get-mode", () => windowMode);
ipcMain.handle("desktop-window:toggle-mode", () => {
  const nextMode = windowMode === "sidebar" ? "expanded" : "sidebar";
  applyWindowMode(nextMode);
  return windowMode;
});

function createWindow() {
  console.log("[KaalKey] Creating desktop window");
  windowMode = readWindowState();
  const display = screen.getPrimaryDisplay();
  const initialBounds =
    windowMode === "expanded" ? getExpandedBounds(display) : getSidebarBounds(display);

  mainWindow = new BrowserWindow({
    ...initialBounds,
    frame: false,
    autoHideMenuBar: true,
    minWidth: Math.min(SIDEBAR_MIN_WIDTH, display.workArea.width),
    minHeight: Math.min(WINDOW_MIN_HEIGHT, display.workArea.height),
    show: false,
    backgroundColor: "#ffffff",
    resizable: true,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  attachRendererDiagnostics(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Keep sidebar mode full-height and right-aligned if the display work area changes.
  const repositionSidebar = () => {
    if (!mainWindow || mainWindow.isDestroyed() || windowMode !== "sidebar") return;
    const currentDisplay = screen.getDisplayMatching(mainWindow.getBounds());
    const current = mainWindow.getBounds();
    const sidebar = getSidebarBounds(currentDisplay);
    // Preserve a user-adjusted width while respecting the web splitter minimum.
    const width = Math.max(
      Math.min(SIDEBAR_MIN_WIDTH, currentDisplay.workArea.width),
      Math.min(current.width, Math.min(SIDEBAR_MAX_WIDTH, currentDisplay.workArea.width)),
    );
    mainWindow.setBounds({
      x: currentDisplay.workArea.x + currentDisplay.workArea.width - width,
      y: currentDisplay.workArea.y,
      width,
      height: currentDisplay.workArea.height,
    });
  };
  screen.on("display-metrics-changed", repositionSidebar);
  mainWindow.on("closed", () =>
    screen.removeListener("display-metrics-changed", repositionSidebar),
  );

  const startUrl = app.isPackaged ? `${APP_SCHEME}://${APP_HOST}/` : "http://localhost:8081";

  console.log("[KaalKey] Loading:", startUrl);
  mainWindow.loadURL(startUrl).catch((error) => {
    console.error("[KaalKey] loadURL rejected:", error);
  });
}

// ==================================================
// 6. Electron lifecycle
// ==================================================

app
  .whenReady()
  .then(async () => {
    console.log("[KaalKey] Electron ready");

    await registerKaalKeyProtocol();
    // KaalKey uses its own compact window controls; remove the native menu.
    const { Menu } = require("electron");
    Menu.setApplicationMenu(null);
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  .catch((error) => {
    console.error("[KaalKey] Startup failed:", error);
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ==================================================
// 7. Process-level diagnostics
// ==================================================

process.on("uncaughtException", (error) => {
  console.error("[KaalKey] Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("[KaalKey] Unhandled rejection:", error);
});

app.on("child-process-gone", (_, details) => {
  console.error("[KaalKey] Child process gone:", details);
});
