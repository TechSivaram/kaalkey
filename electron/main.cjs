const { app, BrowserWindow, shell, screen, session } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

// Give Chromium dedicated, writable per-user cache directories.
// Keep Electron's existing userData/sessionData location unchanged so
// existing KaalKey local data is not moved or reset.
const userDataPath = app.getPath("userData");
const chromiumCachePath = path.join(userDataPath, "ChromiumCache");
const gpuCachePath = path.join(userDataPath, "GpuCache");

fs.mkdirSync(chromiumCachePath, { recursive: true });
fs.mkdirSync(gpuCachePath, { recursive: true });

app.commandLine.appendSwitch("disk-cache-dir", chromiumCachePath);
app.commandLine.appendSwitch("gpu-cache-dir", gpuCachePath);

const isDev = !app.isPackaged;
const desktopEntry = path.join(__dirname, "..", "dist-desktop", "index.html");
const desktopEntryUrl = pathToFileURL(desktopEntry).href;

function isTrustedAppOrigin(origin) {
  try {
    const parsed = new URL(origin);

    if (isDev) {
      return (
        parsed.protocol === "http:" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
        parsed.port === "8081"
      );
    }

    return parsed.protocol === "file:";
  } catch {
    return false;
  }
}

function configurePermissions() {
  // KaalKey's desktop QR scanner needs camera video only.
  // Microphone and all unrelated browser permissions remain denied.
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, requestingOrigin, details, callback) => {
      const isCameraRequest =
        permission === "media" &&
        Array.isArray(details?.mediaTypes) &&
        details.mediaTypes.includes("video") &&
        !details.mediaTypes.includes("audio");

      callback(isCameraRequest && isTrustedAppOrigin(requestingOrigin));
    },
  );
}

function isAppNavigation(url) {
  try {
    const target = new URL(url);

    if (isDev) {
      return (
        target.protocol === "http:" &&
        (target.hostname === "localhost" || target.hostname === "127.0.0.1") &&
        target.port === "8081"
      );
    }

    const expected = new URL(desktopEntryUrl);
    return target.protocol === "file:" && target.pathname === expected.pathname;
  } catch {
    return false;
  }
}

function createWindow() {
  // Place the default 1:2 window against the right edge of the work area.
  // Clamp dimensions for smaller displays while preserving the 1:2 ratio.
  const { workArea } = screen.getPrimaryDisplay();
  const margin = 16;
  const availableWidth = Math.max(320, workArea.width - margin * 2);
  const availableHeight = Math.max(640, workArea.height - margin * 2);
  const width = Math.min(400, availableWidth, availableHeight / 2);
  const height = width * 2;
  const x = workArea.x + workArea.width - width - margin;
  const y = workArea.y + Math.max(margin, (workArea.height - height) / 2);

  const window = new BrowserWindow({
    width: Math.round(width),
    height: Math.round(height),
    x: Math.round(x),
    y: Math.round(y),
    minWidth: 320,
    minHeight: 640,
    maximizable: true,
    resizable: true,
    fullscreenable: true,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#ffffff",
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
    },
  });

  window.once("ready-to-show", () => window.show());

  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (new URL(url).protocol === "https:") {
        void shell.openExternal(url);
      }
    } catch {
      // Reject malformed or unsupported URLs.
    }
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isAppNavigation(url)) return;

    event.preventDefault();
    try {
      if (new URL(url).protocol === "https:") {
        void shell.openExternal(url);
      }
    } catch {
      // Reject malformed or unsupported URLs.
    }
  });

  if (isDev) {
    void window.loadURL("http://localhost:8081");
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    void window.loadFile(desktopEntry);
  }
}

app.whenReady().then(() => {
  configurePermissions();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
