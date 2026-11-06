const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kaalkeyDesktop", {
  lock: {
    getStatus: () => ipcRenderer.invoke("desktop-lock:status"),
    setPin: (pin) => ipcRenderer.invoke("desktop-lock:set-pin", pin),
    verifyPin: (pin) => ipcRenderer.invoke("desktop-lock:verify-pin", pin),
  },
  window: {
    getMode: () => ipcRenderer.invoke("desktop-window:get-mode"),
    toggleMode: () => ipcRenderer.invoke("desktop-window:toggle-mode"),
    minimize: () => ipcRenderer.invoke("desktop-window:minimize"),
    close: () => ipcRenderer.invoke("desktop-window:close"),
  },
});
