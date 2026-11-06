const { app, BrowserWindow, ipcMain } = require("electron");

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

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
// 4. Create desktop window
// ==================================================

let mainWindow;

function createWindow() {
  console.log("[KaalKey] Creating desktop window");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: "#ffffff",

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,

      // Temporarily disabled for diagnostics.
      sandbox: false,
    },
  });

  attachRendererDiagnostics(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const startUrl = app.isPackaged
    ? `file://${path.join(__dirname, "../dist/index.html")}`
    : "http://localhost:8081";

  console.log("[KaalKey] Loading:", startUrl);

  mainWindow.loadURL(startUrl).catch((error) => {
    console.error("[KaalKey] loadURL rejected:", error);
  });
}

// ==================================================
// 5. Electron lifecycle
// ==================================================

app
  .whenReady()
  .then(() => {
    console.log("[KaalKey] Electron ready");

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
// 6. Process-level diagnostics
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
