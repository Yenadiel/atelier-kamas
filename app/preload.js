const { contextBridge, ipcRenderer, webFrame } = require('electron');

const info = ipcRenderer.sendSync('app-info') || {};

contextBridge.exposeInMainWorld('atelier', {
  gm: true,                       // interface « compagnon »
  version: info.version || '',
  platform: info.platform || '',
  minimize: () => ipcRenderer.send('win-minimize'),
  close: () => ipcRenderer.send('win-close'),
  setOpacity: (v) => ipcRenderer.send('win-opacity', v),
  setOnTop: (v) => ipcRenderer.send('win-on-top', !!v),
  setZoom: (z) => webFrame.setZoomFactor(Math.max(0.7, Math.min(1.5, +z || 1))),
  setShortcuts: (map) => ipcRenderer.invoke('set-shortcuts', map),
  onShortcut: (cb) => ipcRenderer.on('shortcut', (_e, name) => cb(name)),
  onForceOpaque: (cb) => ipcRenderer.on('force-opaque', () => cb()),
  // mises à jour obligatoires
  getUpdate: () => ipcRenderer.sendSync('update-get'),
  onUpdate: (cb) => ipcRenderer.on('update-state', (_e, st) => cb(st)),
  openDownload: () => ipcRenderer.send('update-open'),
  installUpdate: () => ipcRenderer.send('update-install'),
  // Almanax du jour (DofusDB)
  getAlmanax: (iso) => ipcRenderer.invoke('almanax', iso),
  // compatibilité avec l'ancienne fenêtre compacte (inutilisée dans l'interface compagnon)
  toggleCompact: () => {},
  showMain: () => {}
});
