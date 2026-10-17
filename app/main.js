const { app, BrowserWindow, protocol, globalShortcut, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');

protocol.registerSchemesAsPrivileged([
  { scheme: 'atelier', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

// web/ est copié dans l'appli à l'installation ; en développement on lit ../web
const WEB = fs.existsSync(path.join(__dirname, 'web')) ? path.join(__dirname, 'web') : path.join(__dirname, '..', 'web');
const ICON = path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png');
const PRELOAD = path.join(__dirname, 'preload.js');
let main = null, compact = null, quitting = false;

// position et taille des fenêtres, gardées d'une session à l'autre
const stateFile = () => path.join(app.getPath('userData'), 'fenetres-v2.json');
function loadState() { try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return {}; } }
const state = loadState();
function saveState() {
  try {
    if (main && !main.isDestroyed()) { state.main = main.getNormalBounds(); state.mainMax = main.isMaximized(); }
    if (compact && !compact.isDestroyed()) state.compact = compact.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify(state));
  } catch {}
}
function onScreen(b) {
  if (!b) return false;
  return screen.getAllDisplays().some(d => {
    const a = d.workArea;
    return b.x < a.x + a.width - 40 && b.x + b.width > a.x + 40 && b.y >= a.y - 10 && b.y < a.y + a.height - 40;
  });
}

function guard(win) {
  // les liens externes s'ouvrent dans le navigateur
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('atelier://')) { e.preventDefault(); shell.openExternal(url); } });
}

function createMain() {
  const b = onScreen(state.main) ? state.main : { width: 1320, height: 900 };
  main = new BrowserWindow({
    ...b, minWidth: 420, minHeight: 500, title: 'Atelier Kamas', icon: ICON,
    autoHideMenuBar: true, backgroundColor: '#eef1ec', show: false,
    webPreferences: { preload: PRELOAD, contextIsolation: true, sandbox: true, spellcheck: false }
  });
  main.setMenuBarVisibility(false);
  if (state.mainMax) main.maximize();
  guard(main);
  main.loadURL('atelier://app/index.html');
  main.once('ready-to-show', () => main.show());
  main.on('close', saveState);
  main.on('closed', () => { main = null; app.quit(); });
}

function createCompact() {
  const wa = screen.getPrimaryDisplay().workArea;
  const def = { width: 460, height: 760, x: wa.x + wa.width - 480, y: wa.y + 40 };
  const b = onScreen(state.compact) ? state.compact : def;
  compact = new BrowserWindow({
    ...b, minWidth: 340, minHeight: 360, frame: false, alwaysOnTop: true, skipTaskbar: true,
    resizable: true, maximizable: false, fullscreenable: false, show: false, title: 'Atelier Kamas · compact',
    icon: ICON, backgroundColor: '#fbfcfa',
    webPreferences: { preload: PRELOAD, contextIsolation: true, sandbox: true, spellcheck: false }
  });
  compact.setAlwaysOnTop(true, 'screen-saver', 1);
  compact.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  guard(compact);
  compact.loadURL('atelier://app/index.html?overlay');
  compact.on('close', e => { if (!quitting) { e.preventDefault(); saveState(); compact.hide(); } });
  // le jeu en plein écran reprend le dessus à chaque clic : on remet la fenêtre compacte au premier plan
  const keepOnTop = () => {
    if (!compact || compact.isDestroyed() || !compact.isVisible()) return;
    compact.setAlwaysOnTop(true, 'screen-saver', 1);
    compact.moveTop();
  };
  compact.on('blur', () => { keepOnTop(); setTimeout(keepOnTop, 150); setTimeout(keepOnTop, 600); });
  compact.on('show', keepOnTop);
  setInterval(keepOnTop, 1000);
  compact.on('moved', saveState);
  compact.on('resized', saveState);
}

function toggleCompact() {
  if (!compact) createCompact();
  if (compact.isVisible()) { compact.hide(); }
  else {
    const show = () => { compact.showInactive(); compact.setAlwaysOnTop(true, 'screen-saver', 1); compact.moveTop(); };
    if (compact.webContents.isLoading()) compact.once('ready-to-show', show); else show();
  }
  saveState();
}

ipcMain.on('toggle-compact', toggleCompact);
ipcMain.on('show-main', () => { if (!main) createMain(); if (main.isMinimized()) main.restore(); main.show(); main.focus(); });
ipcMain.on('compact-opacity', (e, v) => { if (compact) compact.setOpacity(Math.max(0.4, Math.min(1, +v || 1))); });

if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', () => { if (main) { if (main.isMinimized()) main.restore(); main.show(); main.focus(); } });
  app.whenReady().then(() => {
    protocol.handle('atelier', req => {
      let p = decodeURIComponent(new URL(req.url).pathname);
      if (!p || p === '/') p = '/index.html';
      const f = path.normalize(path.join(WEB, p));
      if (!f.startsWith(WEB)) return new Response('Accès refusé', { status: 403 });
      const ext = path.extname(f).toLowerCase();
      const type = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }[ext] || 'application/octet-stream';
      try { return new Response(fs.readFileSync(f), { headers: { 'content-type': type } }); }
      catch { return new Response('Introuvable', { status: 404 }); }
    });
    createMain();
    createCompact();
    globalShortcut.register('CommandOrControl+Shift+K', toggleCompact);
    if (state.compactOpen) toggleCompact();
  });
  app.on('before-quit', () => { quitting = true; state.compactOpen = !!(compact && compact.isVisible()); saveState(); });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
