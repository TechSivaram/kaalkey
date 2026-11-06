const { app, BrowserWindow } = require("electron");

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  console.log("[Test] Electron ready");

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.on("did-finish-load", () => {
    console.log("[Test] Renderer loaded successfully");
  });

  win.webContents.on("render-process-gone", (_, details) => {
    console.error("[Test] Renderer crashed:", details);
  });

  win.webContents.on("did-fail-load", (_, code, description) => {
    console.error("[Test] Load failed:", code, description);
  });

  await win.loadURL("http://localhost:8081");
});
