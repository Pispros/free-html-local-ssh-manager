'use strict';

const { app, BrowserWindow, session } = require('electron');
const http                   = require('http');
const path                   = require('path');

const PORT = 5556;
let mainWindow = null;

function startServer() {
  // If FWORDSSH_DATA_DIR was passed from the environment (e.g. via the
  // Exec= line in the .desktop file) honour it. Otherwise fall back to
  // the assets/json directory inside the app bundle.
  if (!process.env.FWORDSSH_DATA_DIR) {
    const appPath = app.getAppPath();
    process.env.FWORDSSH_DATA_DIR = appPath.endsWith('app.asar')
      ? path.join(appPath.replace('app.asar', 'app.asar.unpacked'), 'assets', 'json')
      : path.join(appPath, 'assets', 'json');
  }
  require('./bash.js');
}

function waitForServer(maxAttempts = 30, intervalMs = 400) {
  return new Promise(resolve => {
    let attempts = maxAttempts;
    (function poll() {
      if (attempts-- <= 0) {
        console.warn('[backend] server did not start in time – opening window anyway');
        return resolve();
      }
      const req = http.get(`http://127.0.0.1:${PORT}/`, res => {
        res.resume();
        resolve();
      });
      req.setTimeout(300);
      req.on('error',   () => setTimeout(poll, intervalMs));
      req.on('timeout', () => { req.destroy(); setTimeout(poll, intervalMs); });
    })();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          820,
    minWidth:        900,
    minHeight:       600,
    backgroundColor: '#050709',
    autoHideMenuBar: true,
    title:           'FWORD // SSH',
    icon:            path.join(app.getAppPath(), 'assets/img/icon.png'),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(app.getAppPath(), 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  // Allow clipboard read/write from the renderer (needed for terminal copy/paste)
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'clipboard-read' || permission === 'clipboard-sanitized-write');
  });

  startServer();
  await waitForServer();
  createWindow();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
