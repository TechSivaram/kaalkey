const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

app.disableHardwareAcceleration();

// Give this diagnostic run a fresh, writable profile.
const profilePath = path.join(os.tmpdir(), "KaalKey-Electron-Diagnostic");

fs.mkdirSync(profilePath, { recursive: true });

app.setPath("userData", profilePath);
app.setPath("sessionData", path.join(profilePath, "session"));

fs.mkdirSync(app.getPath("sessionData"), { recursive: true });

console.log("User data:", app.getPath("userData"));
console.log("Session data:", app.getPath("sessionData"));

app
  .whenReady()
  .then(async () => {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    win.webContents.on("did-finish-load", () => {
      console.log("SUCCESS: KaalKey web renderer loaded");
    });

    win.webContents.on("render-process-gone", (_, details) => {
      console.error("Renderer crashed:", details);
    });

    try {
      await win.loadURL("http://localhost:8081");
    } catch (error) {
      console.error("Navigation failed:", error);
    }
  })
  .catch(console.error);
