const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Window control methods
  minimizeWindow: () => ipcRenderer.send("window-control", "minimize"),
  maximizeWindow: () => ipcRenderer.send("window-control", "maximize"),
  closeWindow: () => ipcRenderer.send("window-control", "close"),

  // Check if window is maximized
  isWindowMaximized: () => ipcRenderer.invoke("is-window-maximized"),

  // Listen for window state changes
  onWindowStateChange: (callback) => {
    ipcRenderer.on("window-state-changed", (event, isMaximized) => {
      callback(isMaximized);
    });
  },
});
