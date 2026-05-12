const { app, BrowserWindow, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// ── CLOUD URL ── Update this after deploying to Render ──────────────────────
const CLOUD_URL = 'https://YOUR-APP-NAME.onrender.com';
// ────────────────────────────────────────────────────────────────────────────

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Claude Messenger');

  const menu = Menu.buildFromTemplate([
    { label: 'Open Claude Messenger', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } }
  ]);
  tray.setContextMenu(menu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide();
    else { mainWindow.show(); mainWindow.focus(); }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 860,
    minWidth: 700,
    minHeight: 560,
    title: 'Claude Messenger',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#FAF7F4',
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(CLOUD_URL);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // X button minimises to tray
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Stay alive in tray on Windows
});

app.on('before-quit', () => { isQuitting = true; });
