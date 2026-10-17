// Atelier Kamas — appli de bureau (Windows, macOS, Linux)
// Une seule petite fenêtre sans bordure, toujours au premier plan, façon compagnon de jeu.
const { app, BrowserWindow, protocol, globalShortcut, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');

protocol.registerSchemesAsPrivileged([
  { scheme: 'atelier', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

// web/ est copié dans l'appli au moment du build ; en développement on lit ../web
const WEB = fs.existsSync(path.join(__dirname, 'web')) ? path.join(__dirname, 'web') : path.join(__dirname, '..', 'web');
const ICON = path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png');
const PRELOAD = path.join(__dirname, 'preload.js');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};

let win = null;
let onTop = true;
const shortcutMap = {};

// position / taille de la fenêtre, gardées d'une session à l'autre
const stateFile = () => path.join(app.getPath('userData'), 'fenetre.json');
function loadState() { try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return {}; } }
const state = loadState();
function saveState() {
  try { if (win && !win.isDestroyed()) { state.bounds = win.getNormalBounds(); fs.writeFileSync(stateFile(), JSON.stringify(state)); } } catch {}
}
function onScreen(b) {
  if (!b) return false;
  return screen.getAllDisplays().some(d => {
    const a = d.workArea;
    return b.x < a.x + a.width - 40 && b.x + b.width > a.x + 40 && b.y >= a.y - 10 && b.y < a.y + a.height - 40;
  });
}

function keepOnTop() {
  if (!win || win.isDestroyed() || !win.isVisible() || !onTop) return;
  win.setAlwaysOnTop(true, 'screen-saver', 1);
  win.moveTop();
}

function createWindow() {
  const wa = screen.getPrimaryDisplay().workArea;
  const def = { width: 380, height: 640, x: wa.x + wa.width - 400, y: wa.y + 40 };
  const b = onScreen(state.bounds) ? state.bounds : def;
  win = new BrowserWindow({
    ...b, minWidth: 280, minHeight: 340,
    frame: false, alwaysOnTop: true, show: false, title: 'Atelier Kamas', icon: ICON,
    backgroundColor: '#1d2730', fullscreenable: false, maximizable: false,
    webPreferences: { preload: PRELOAD, contextIsolation: true, sandbox: true, spellcheck: false }
  });
  win.setAlwaysOnTop(true, 'screen-saver', 1);
  if (process.platform === 'darwin') win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // les liens externes s'ouvrent dans le navigateur
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('atelier://')) { e.preventDefault(); shell.openExternal(url); } });

  win.loadURL('atelier://app/index.html?app');
  win.once('ready-to-show', () => win.show());
  // le jeu en plein écran reprend le dessus à chaque clic : on remet la fenêtre devant
  win.on('blur', () => { keepOnTop(); setTimeout(keepOnTop, 150); setTimeout(keepOnTop, 600); });
  win.on('moved', saveState);
  win.on('resized', saveState);
  win.on('close', saveState);
  win.on('closed', () => { win = null; });
}

function toggleWindow() {
  if (!win) return createWindow();
  if (win.isVisible() && !win.isMinimized()) win.hide();
  else { if (win.isMinimized()) win.restore(); win.showInactive(); keepOnTop(); }
}

// ---- liaison avec la page ----
ipcMain.on('app-info', e => { e.returnValue = { version: app.getVersion(), platform: process.platform }; });
ipcMain.on('win-minimize', () => win && win.minimize());
ipcMain.on('win-close', () => win && win.close());
ipcMain.on('win-opacity', (e, v) => { if (win) win.setOpacity(Math.max(0.4, Math.min(1, +v || 1))); });
ipcMain.on('win-on-top', (e, v) => {
  onTop = !!v;
  if (!win) return;
  win.setAlwaysOnTop(onTop, 'screen-saver', 1);
  if (onTop) keepOnTop();
});
ipcMain.handle('set-shortcuts', (e, map) => {
  globalShortcut.unregisterAll();
  const failed = [];
  for (const [name, accel] of Object.entries(map || {})) {
    if (!accel) continue;
    try {
      const ok = globalShortcut.register(accel, () => {
        if (name === 'toggle') return toggleWindow();
        if (win && !win.isDestroyed()) win.webContents.send('shortcut', name);
      });
      if (!ok) failed.push(name);
    } catch { failed.push(name); }
  }
  Object.assign(shortcutMap, map);
  return failed;
});

if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  app.whenReady().then(() => {
    protocol.handle('atelier', req => {
      let p = decodeURIComponent(new URL(req.url).pathname);
      if (!p || p === '/') p = '/index.html';
      const f = path.normalize(path.join(WEB, p));
      if (!f.startsWith(WEB)) return new Response('Accès refusé', { status: 403 });
      const type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
      try { return new Response(fs.readFileSync(f), { headers: { 'content-type': type } }); }
      catch { return new Response('Introuvable', { status: 404 }); }
    });
    createWindow();
    // filet de sécurité : la page enregistre ses propres raccourcis au chargement
    globalShortcut.register('CommandOrControl+Shift+K', toggleWindow);
    setInterval(keepOnTop, 1000);
  });
  app.on('activate', () => { if (!win) createWindow(); else win.show(); });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
