const { app, BrowserWindow } = require("electron");
const path = require("path");

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  console.log("Electron:", process.versions.electron);
  console.log("Chrome:", process.versions.chrome);

  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    show: true,
  });

  win.webContents.on("did-finish-load", () => {
    console.log("SUCCESS: HTML loaded!");
  });

  win.webContents.on("render-process-gone", (_, details) => {
    console.error("Renderer crashed:", details);
  });

  win.webContents.on("did-fail-load", (_, code, description, url) => {
    console.error("Load failed:", code, description, url);
  });

  try {
    await win.loadFile(path.join(__dirname, "electron-test.html"));
  } catch (error) {
    console.error("Navigation failed:", error);
  }
});
