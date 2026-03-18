/**
 * Electron main process – FWORD SSH Manager
 *
 * Workflow:
 *  1. Spawn bash.js (the Express + WebSocket backend) as a hidden child
 *     process using ELECTRON_RUN_AS_NODE so Electron's own Node binary is
 *     reused without needing a separate system-node installation.
 *  2. Poll localhost:5556 until the server answers (up to ~12 s).
 *  3. Open the BrowserWindow loading index.html.
 *
 * The backend process is killed when the Electron app exits.
 */

'use strict';

const { app, BrowserWindow } = require('electron');
const { spawn }              = require('child_process');
const http                   = require('http');
const path                   = require('path');
const fs                     = require('fs');

const PORT = 5556;

let mainWindow    = null;
let serverProcess = null;

/* ─────────────────────────────────────────────────────────────────
   Start the Express / WS backend (bash.js)
   Using ELECTRON_RUN_AS_NODE makes Electron act as plain Node.js,
   so native addons (node-pty) compiled for Electron's ABI work
   correctly in both dev and a packaged app.
───────────────────────────────────────────────────────────────── */
function startServer(dataDir) {
  // In a packaged app electron-builder copies bash.js to resources/.
  // In dev it lives right next to this file.
  const scriptPath = app.isPackaged
    ? path.join(process.resourcesPath, 'bash.js')
    : path.join(__dirname, 'bash.js');

  const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
  if (dataDir) env.FWORDSSH_DATA_DIR = dataDir;

  serverProcess = spawn(process.execPath, [scriptPath], {
    env,
    stdio: 'inherit',   // forward server logs to the Electron console
  });

  serverProcess.on('error', err =>
    console.error('[backend] failed to start:', err));

  serverProcess.on('exit', (code, signal) =>
    console.log(`[backend] exited  code=${code}  signal=${signal}`));
}

/* ─────────────────────────────────────────────────────────────────
   Poll until the backend answers an HTTP request (or give up)
───────────────────────────────────────────────────────────────── */
function waitForServer(maxAttempts = 30, intervalMs = 400) {
  return new Promise(resolve => {
    let attempts = maxAttempts;

    (function poll() {
      if (attempts-- <= 0) {
        console.warn('[backend] server did not start in time – opening window anyway');
        return resolve();
      }

      const req = http.get(`http://127.0.0.1:${PORT}/`, res => {
        res.resume();   // drain so the socket is released
        resolve();
      });

      req.setTimeout(300);
      req.on('error',   () => setTimeout(poll, intervalMs));
      req.on('timeout', () => { req.destroy(); setTimeout(poll, intervalMs); });
    })();
  });
}

/* ─────────────────────────────────────────────────────────────────
   BrowserWindow
───────────────────────────────────────────────────────────────── */
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
      nodeIntegration:  false,   // keep renderer sandboxed
      contextIsolation: true,
    },
  });

  // The page makes XHR/WS requests to localhost:5556 — loading from file://
  // is fine because the backend is on the same machine.
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => { mainWindow = null; });
}

/* ─────────────────────────────────────────────────────────────────
   App lifecycle
───────────────────────────────────────────────────────────────── */
app.whenReady().then(async () => {
  // Always point at the live assets/json directory so that running
  // `node server.js` immediately reflects in the running app via SSE.
  // In a packaged app, assets/json is asarUnpacked (writable on disk).
  const dataDir = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'json')
    : path.join(__dirname, 'assets', 'json');
  startServer(dataDir);
  await waitForServer();
  createWindow();
});

// Re-create the window on macOS when the dock icon is clicked
app.on('activate', () => {
  if (!mainWindow) createWindow();
});

// Quit on all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Always kill the backend when the app exits
app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
