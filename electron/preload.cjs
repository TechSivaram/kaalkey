const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kaalkeyDesktop", {
  lock: {
    getStatus: () => ipcRenderer.invoke("desktop-lock:status"),
    setPin: (pin) => ipcRenderer.invoke("desktop-lock:set-pin", pin),
    verifyPin: (pin) => ipcRenderer.invoke("desktop-lock:verify-pin", pin),
  },
});
