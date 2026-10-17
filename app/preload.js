const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('atelier', {
  toggleCompact: () => ipcRenderer.send('toggle-compact'),
  showMain: () => ipcRenderer.send('show-main'),
  setOpacity: (v) => ipcRenderer.send('compact-opacity', v)
});
