const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  isAdmin: () => ipcRenderer.invoke('app:isAdmin'),
  requestAdmin: () => ipcRenderer.invoke('app:requestAdmin'),

  // Dialog methods
  showError: (title, content) => ipcRenderer.invoke('dialog:showError', title, content),
  showMessage: (options) => ipcRenderer.invoke('dialog:showMessage', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),

  // Shell methods
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // Protocol handling
  onProtocolHandle: (callback) => {
    ipcRenderer.on('protocol:handle', (event, url) => callback(url));
  },

  // Remove protocol listener
  removeProtocolListener: () => {
    ipcRenderer.removeAllListeners('protocol:handle');
  },

  // System info
  getSystemInfo: () => ({
    platform: process.platform,
    arch: process.arch,
    version: process.version
  })
});

// Security: Remove Node.js globals
delete window.require;
delete window.exports;
delete window.module;
delete window.process;
delete window.global;
delete window.Buffer;
delete window.setImmediate;
delete window.clearImmediate;