// Atelier Kamas — appli de bureau (Windows, macOS, Linux)
// Une seule petite fenêtre sans bordure, toujours au premier plan, façon compagnon de jeu.
const { app, BrowserWindow, protocol, globalShortcut, ipcMain, shell, screen, Tray, Menu, nativeImage, net } = require('electron');
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

// ---- journal (diagnostic) : %APPDATA%/Atelier Kamas/journal.txt ----
const logFile = () => path.join(app.getPath('userData'), 'journal.txt');
function log(...a) {
  try {
    const f = logFile();
    if (fs.existsSync(f) && fs.statSync(f).size > 512 * 1024) fs.renameSync(f, f + '.old');
    fs.appendFileSync(f, `[${new Date().toISOString()}] ${a.map(x => (x && x.stack) || String(x)).join(' ')}\n`);
  } catch {}
}
process.on('uncaughtException', e => log('ERREUR', e));

// ---- accélération graphique ----
// L'appli n'a besoin d'aucune puissance graphique. Sous Windows, certains pilotes
// n'affichent rien dans une fenêtre sans bordure (l'appli tourne, la fenêtre reste
// invisible) : on dessine donc en mode logiciel par défaut. Réactivable via l'icône K.
const gpuOnFlag = () => path.join(app.getPath('userData'), 'avec-gpu');
const noGpuFlag = () => path.join(app.getPath('userData'), 'sans-gpu');
const NO_GPU = process.argv.includes('--sans-gpu') || fs.existsSync(noGpuFlag()) ||
  (process.platform === 'win32' && !fs.existsSync(gpuOnFlag()) && !process.argv.includes('--avec-gpu'));
if (NO_GPU) app.disableHardwareAcceleration();

let win = null;
let tray = null;
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

// Remise au premier plan : le jeu en plein écran repasse devant à chaque clic.
// Mais si l'utilisateur va dans la barre des tâches (icônes cachées, menu Démarrer,
// horloge…), on laisse la place aux menus de Windows quelques secondes.
let shellUntil = 0;
function cursorOnTaskbar() {
  const p = screen.getCursorScreenPoint();
  const a = screen.getDisplayNearestPoint(p).workArea;
  return !(p.x >= a.x && p.x < a.x + a.width && p.y >= a.y && p.y < a.y + a.height);
}
function keepOnTop() {
  if (!win || win.isDestroyed() || !win.isVisible() || win.isMinimized() || !onTop) return;
  if (cursorOnTaskbar()) { shellUntil = Date.now() + 6000; return; }
  if (Date.now() < shellUntil) return;
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
  // la fenêtre s'affiche dès qu'elle est prête… et dans tous les cas au bout de 4 s
  const reveal = (why) => {
    if (!win || win.isDestroyed() || win.isVisible()) return;
    log('affichage de la fenêtre (' + why + ')');
    win.show();
  };
  win.once('ready-to-show', () => reveal('prête'));
  win.webContents.once('did-finish-load', () => reveal('page chargée'));
  setTimeout(() => reveal('délai de sécurité'), 4000);
  win.webContents.on('did-fail-load', (e, code, desc, url) => log('échec de chargement', code, desc, url));
  win.webContents.on('render-process-gone', (e, d) => { log('page plantée', d.reason); if (d.reason !== 'clean-exit') setTimeout(() => win && !win.isDestroyed() && win.reload(), 500); });
  win.webContents.on('console-message', (e, level, msg) => { if (level >= 3) log('page :', msg); });
  // le jeu en plein écran reprend le dessus à chaque clic : on remet la fenêtre devant
  win.on('blur', () => { if (cursorOnTaskbar()) { shellUntil = Date.now() + 6000; return; } setTimeout(keepOnTop, 150); setTimeout(keepOnTop, 600); });
  win.on('focus', () => { shellUntil = 0; });
  win.on('moved', saveState);
  win.on('resized', saveState);
  win.on('close', saveState);
  win.on('closed', () => { win = null; });
}

function recenter() {
  if (!win) return createWindow();
  const wa = screen.getPrimaryDisplay().workArea;
  win.setBounds({ width: 380, height: 640, x: wa.x + wa.width - 400, y: wa.y + 40 });
  if (win.isMinimized()) win.restore();
  win.show(); win.focus();
  saveState();
}

function createTray() {
  try {
    let img = nativeImage.createFromPath(path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png'));
    if (process.platform !== 'win32') img = img.resize({ width: 18, height: 18 });
    tray = new Tray(img);
    tray.setToolTip('Atelier Kamas');
    const menu = () => Menu.buildFromTemplate([
      { label: 'Afficher Atelier Kamas', click: () => { if (!win) createWindow(); else { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } } },
      { label: 'Recentrer la fenêtre', click: recenter },
      { label: 'Fenêtre opaque (si elle est invisible)', click: () => { if (!win) return; win.setOpacity(1); layered = false; win.webContents.send('force-opaque'); win.show(); } },
      { type: 'separator' },
      { label: 'Accélération graphique (si la fenêtre s\'affiche bien)', type: 'checkbox', checked: !NO_GPU, click: () => {
          try {
            if (NO_GPU) { fs.rmSync(noGpuFlag(), { force: true }); fs.writeFileSync(gpuOnFlag(), '1'); }
            else { fs.rmSync(gpuOnFlag(), { force: true }); fs.writeFileSync(noGpuFlag(), '1'); }
          } catch {}
          app.relaunch(); app.exit(0);
        } },
      { label: 'Ouvrir le journal (diagnostic)', click: () => shell.openPath(logFile()) },
      { type: 'separator' },
      { label: 'Quitter', click: () => app.quit() }
    ]);
    tray.setContextMenu(menu());
    tray.on('click', () => { if (!win) createWindow(); else { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  } catch (e) { log('icône de notification impossible', e); }
}

function toggleWindow() {
  if (!win) return createWindow();
  if (win.isVisible() && !win.isMinimized()) win.hide();
  else { if (win.isMinimized()) win.restore(); win.showInactive(); keepOnTop(); }
}

// ---- mises à jour obligatoires ----
// Chaque nouvelle version publiée sur GitHub doit être installée : la page affiche un écran
// bloquant. Windows (installateur) et Linux (AppImage) se mettent à jour tout seuls ;
// portable, macOS (non signé) et .deb : bouton vers la page de téléchargement.
const REPO = 'Yenadiel/atelier-kamas';
const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
let updateState = { state: 'idle' };
function sendUpdate(st) { updateState = st; if (win && !win.isDestroyed()) win.webContents.send('update-state', st); }
const newer = (a, b) => { const x = String(a).replace(/^v/, '').split('.').map(Number), y = String(b).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) > (y[i] || 0)) return true; if ((x[i] || 0) < (y[i] || 0)) return false; } return false; };
const canAutoUpdate = () => app.isPackaged && !process.env.PORTABLE_EXECUTABLE_DIR &&
  (process.platform === 'win32' || (process.platform === 'linux' && !!process.env.APPIMAGE));
let autoUpdater = null;
async function checkForUpdate() {
  if (!app.isPackaged || ['progress', 'ready'].includes(updateState.state)) return;
  let latest = null;
  try {
    const r = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { 'User-Agent': 'atelier-kamas', Accept: 'application/vnd.github+json' } });
    if (r.ok) latest = (await r.json()).tag_name;
  } catch (e) { log('vérification de mise à jour impossible', e); return; }
  if (!latest || !newer(latest, app.getVersion())) return;
  log('nouvelle version disponible', latest);
  const version = latest.replace(/^v/, '');
  if (!canAutoUpdate()) return sendUpdate({ state: 'manual', version, url: RELEASES_URL });
  try {
    if (!autoUpdater) {
      autoUpdater = require('electron-updater').autoUpdater;
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.on('download-progress', p => sendUpdate({ state: 'progress', version, percent: Math.round(p.percent || 0) }));
      autoUpdater.on('update-downloaded', () => {
        sendUpdate({ state: 'ready', version });
        setTimeout(() => { try { autoUpdater.quitAndInstall(true, true); } catch (e) { log('installation impossible', e); } }, 4000);
      });
      autoUpdater.on('error', e => { log('mise à jour automatique en échec', e); sendUpdate({ state: 'manual', version, url: RELEASES_URL, error: true }); });
    }
    sendUpdate({ state: 'progress', version, percent: 0 });
    await autoUpdater.checkForUpdates();
  } catch (e) { log('mise à jour automatique impossible', e); sendUpdate({ state: 'manual', version, url: RELEASES_URL, error: true }); }
}
ipcMain.on('update-get', e => { e.returnValue = updateState; });
ipcMain.on('update-open', () => shell.openExternal(RELEASES_URL));
ipcMain.on('update-install', () => { try { autoUpdater && autoUpdater.quitAndInstall(true, true); } catch (e) { log(e); } });

// ---- Almanax du jour (API publique DofusDB, appelée ici pour éviter les soucis de CORS) ----
const almanaxCache = {};
ipcMain.handle('almanax', async (e, iso) => {
  const d = new Date(iso || Date.now());
  const key = d.toISOString().slice(0, 10);
  if (almanaxCache[key]) return almanaxCache[key];
  const paris = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', year: 'numeric', month: 'numeric', day: 'numeric' }).format(d); // M/D/YYYY
  try {
    const r = await net.fetch(`https://api.dofusdb.fr/almanax?date=${paris}`, { headers: { 'User-Agent': 'atelier-kamas' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const a = await r.json();
    const it = (a.items && a.items[0]) || {};
    const strip = t => String(t || '').replace(/<[^>]+>/g, '').trim();
    const res = {
      date: key,
      bonus: strip(a.name && a.name.fr), desc: strip(a.desc && a.desc.fr),
      itemId: it.id || (a.itemIds && a.itemIds[0]) || null, itemName: strip(it.name && it.name.fr),
      qty: (a.quantities && a.quantities[0]) || 1, img: it.img || '',
      npc: strip(a.npc && a.npc.name && a.npc.name.fr)
    };
    almanaxCache[key] = res;
    return res;
  } catch (err) { log('almanax indisponible', err); return null; }
});

// ---- liaison avec la page ----
ipcMain.on('app-info', e => { e.returnValue = { version: app.getVersion(), platform: process.platform }; });
ipcMain.on('win-minimize', () => win && win.minimize());
ipcMain.on('win-close', () => win && win.close());
// Opacité : à 100 % on ne touche à rien (une fenêtre « superposée » peut ne pas s'afficher
// sur le moniteur avec certains pilotes / l'affichage multiplan, tout en apparaissant en capture).
let layered = false;
ipcMain.on('win-opacity', (e, v) => {
  if (!win) return;
  const o = Math.max(0.4, Math.min(1, +v || 1));
  if (o >= 0.999) { if (layered) { win.setOpacity(1); layered = false; } return; }
  win.setOpacity(o); layered = true;
});
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
  // relancer l'appli alors qu'elle tourne déjà : on ramène la fenêtre au centre de l'écran principal si besoin
  app.on('second-instance', () => {
    log('seconde instance : on ré-affiche la fenêtre');
    if (!win) return createWindow();
    if (win.isMinimized()) win.restore();
    if (!onScreen(win.getBounds())) recenter();
    win.show(); win.focus();
  });
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
    log(`démarrage v${app.getVersion()} · ${process.platform} ${process.getSystemVersion ? process.getSystemVersion() : ''}${NO_GPU ? ' · sans accélération graphique' : ''}`);
    createWindow();
    createTray();
    setTimeout(checkForUpdate, 5000);
    setInterval(checkForUpdate, 30 * 60 * 1000);
    // filet de sécurité : la page enregistre ses propres raccourcis au chargement
    globalShortcut.register('CommandOrControl+Shift+K', toggleWindow);
    setInterval(keepOnTop, 1500);
  });
  // si le processus graphique plante, on relance automatiquement sans accélération graphique
  app.on('child-process-gone', (e, d) => {
    log('processus arrêté', d.type, d.reason, d.exitCode);
    if (d.type === 'GPU' && d.reason !== 'clean-exit' && !NO_GPU) {
      try { fs.rmSync(gpuOnFlag(), { force: true }); fs.writeFileSync(noGpuFlag(), '1'); } catch {}
      app.relaunch(); app.exit(0);
    }
  });
  app.on('activate', () => { if (!win) createWindow(); else win.show(); });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
