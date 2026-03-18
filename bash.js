const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');
const pty        = require('node-pty');
const { exec }   = require('child_process');
const fs         = require('fs');
const path       = require('path');
const os         = require('os');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });
const PORT   = 5556;
const HOME   = os.homedir();

app.use(cors({ origin: '*' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ── Health ────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ message: 'Service running' }));

// ── Legacy native terminal ────────────────────────────────────────
app.post('/start-terminal', (req, res) => {
    const cmd = req.body.os.includes('Mac')
        ? `open -a Terminal.app "${req.body.command}"`
        : `gnome-terminal -- ${req.body.command}`;
    exec(cmd, err => err
        ? res.status(500).json({ message: 'Something went wrong!' })
        : res.json({ message: 'Terminal started!' }));
});

// ── Terminal color theme ──────────────────────────────────────────
// Tries to read the user's actual terminal palette in this order:
//   1. ~/.config/alacritty/alacritty.toml  (or .yml)
//   2. ~/.config/kitty/kitty.conf
//   3. ~/.Xresources / ~/.Xdefaults
//   4. dconf (GNOME Terminal) via shell
//   5. Returns null → client falls back to built-in dark theme

app.get('/terminal-theme', async (_req, res) => {
    const theme = await readSystemTheme();
    res.json(theme);
});

async function readSystemTheme() {
    // ── Alacritty TOML ────────────────────────────────────────────
    for (const f of [
        path.join(HOME, '.config/alacritty/alacritty.toml'),
        path.join(HOME, '.alacritty.toml'),
        path.join(HOME, '.config/alacritty/alacritty.yml'),
        path.join(HOME, '.alacritty.yml'),
    ]) {
        const t = tryParseAlacritty(f);
        if (t) { console.log('[theme] loaded from', f); return t; }
    }

    // ── Kitty ─────────────────────────────────────────────────────
    const kittyPath = path.join(HOME, '.config/kitty/kitty.conf');
    const kt = tryParseKitty(kittyPath);
    if (kt) { console.log('[theme] loaded from', kittyPath); return kt; }

    // ── Xresources / Xdefaults ────────────────────────────────────
    for (const f of [
        path.join(HOME, '.Xresources'),
        path.join(HOME, '.Xdefaults'),
    ]) {
        const xt = tryParseXresources(f);
        if (xt) { console.log('[theme] loaded from', f); return xt; }
    }

    // ── GNOME Terminal via dconf ──────────────────────────────────
    try {
        const gt = await readGnomeTheme();
        if (gt) { console.log('[theme] loaded from dconf'); return gt; }
    } catch { /* dconf not available */ }

    console.log('[theme] no system theme found, using built-in');
    return null;
}

function readFile(f) {
    try { return fs.readFileSync(f, 'utf8'); } catch { return null; }
}

/* Alacritty: supports both TOML and YAML, extracts [colors] section */
function tryParseAlacritty(f) {
    const raw = readFile(f);
    if (!raw) return null;
    const pick = (key) => {
        const m = raw.match(new RegExp(`${key}\\s*[=:]\\s*['"]?([#0-9a-fA-F]{4,9})['"]?`));
        return m ? normalizeHex(m[1]) : null;
    };
    const bg = pick('background'); const fg = pick('foreground');
    if (!bg && !fg) return null;
    return {
        background:   bg || '#0d1117',
        foreground:   fg || '#c9d1d9',
        cursor:       pick('cursor')   || pick('text') || '#00ff9d',
        black:        pick('black')    || '#1c2640',
        red:          pick('red')      || '#ff4757',
        green:        pick('green')    || '#00ff9d',
        yellow:       pick('yellow')   || '#ffd166',
        blue:         pick('blue')     || '#4cc9f0',
        magenta:      pick('magenta')  || '#c084fc',
        cyan:         pick('cyan')     || '#00ffff',
        white:        pick('white')    || '#c9d1d9',
    };
}

/* Kitty: key value pairs */
function tryParseKitty(f) {
    const raw = readFile(f);
    if (!raw) return null;
    const pick = (key) => {
        const m = raw.match(new RegExp(`^\\s*${key}\\s+([#0-9a-fA-F]{4,9})`, 'm'));
        return m ? normalizeHex(m[1]) : null;
    };
    const bg = pick('background'); const fg = pick('foreground');
    if (!bg && !fg) return null;
    return {
        background:   bg || '#0d1117',
        foreground:   fg || '#c9d1d9',
        cursor:       pick('cursor')          || '#00ff9d',
        black:        pick('color0')          || '#1c2640',
        red:          pick('color1')          || '#ff4757',
        green:        pick('color2')          || '#00ff9d',
        yellow:       pick('color3')          || '#ffd166',
        blue:         pick('color4')          || '#4cc9f0',
        magenta:      pick('color5')          || '#c084fc',
        cyan:         pick('color6')          || '#00ffff',
        white:        pick('color7')          || '#c9d1d9',
        brightBlack:  pick('color8')          || '#2a3a56',
        brightRed:    pick('color9')          || '#ff6b7a',
        brightGreen:  pick('color10')         || '#00ff9d',
        brightYellow: pick('color11')         || '#ffd166',
        brightBlue:   pick('color12')         || '#4cc9f0',
        brightMagenta:pick('color13')         || '#c084fc',
        brightCyan:   pick('color14')         || '#67e8f9',
        brightWhite:  pick('color15')         || '#f0f6fc',
    };
}

/* Xresources: *.color0 … *.color15, *.background, *.foreground */
function tryParseXresources(f) {
    const raw = readFile(f);
    if (!raw) return null;
    const pick = (key) => {
        const m = raw.match(new RegExp(`\\*\\.?${key}\\s*:\\s*([#0-9a-fA-F]{4,9})`));
        return m ? normalizeHex(m[1]) : null;
    };
    const bg = pick('background'); const fg = pick('foreground');
    if (!bg && !fg) return null;
    const colors = Array.from({ length: 16 }, (_, i) => pick(`color${i}`));
    return {
        background:    bg || '#0d1117',
        foreground:    fg || '#c9d1d9',
        cursor:        pick('cursorColor') || '#00ff9d',
        black:         colors[0]  || '#1c2640',
        red:           colors[1]  || '#ff4757',
        green:         colors[2]  || '#00ff9d',
        yellow:        colors[3]  || '#ffd166',
        blue:          colors[4]  || '#4cc9f0',
        magenta:       colors[5]  || '#c084fc',
        cyan:          colors[6]  || '#00ffff',
        white:         colors[7]  || '#c9d1d9',
        brightBlack:   colors[8]  || '#2a3a56',
        brightRed:     colors[9]  || '#ff6b7a',
        brightGreen:   colors[10] || '#00ff9d',
        brightYellow:  colors[11] || '#ffd166',
        brightBlue:    colors[12] || '#4cc9f0',
        brightMagenta: colors[13] || '#c084fc',
        brightCyan:    colors[14] || '#67e8f9',
        brightWhite:   colors[15] || '#f0f6fc',
    };
}

/* GNOME Terminal via dconf */
function readGnomeTheme() {
    return new Promise((resolve) => {
        exec("dconf read /org/gnome/terminal/legacy/profiles:/:$(dconf list /org/gnome/terminal/legacy/profiles:/ | head -1)/background-color", (err, stdout) => {
            if (err || !stdout.trim()) return resolve(null);
            // minimal: just surface background and foreground
            const bg = stdout.trim().replace(/'/g, '').replace(/rgb\((\d+),(\d+),(\d+)\)/, (_, r, g, b) =>
                '#' + [r,g,b].map(n => parseInt(n).toString(16).padStart(2,'0')).join(''));
            resolve(bg ? { background: bg } : null);
        });
    });
}

function normalizeHex(v) {
    if (!v) return null;
    const h = v.startsWith('#') ? v : '#' + v;
    // Expand 4-char (#RGB) to 7-char
    if (h.length === 4) return '#' + h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
    return h;
}

// ── WebSocket SSH sessions ────────────────────────────────────────
wss.on('connection', (ws, req) => {
    const url  = new URL(req.url, `http://localhost:${PORT}`);
    const host = url.searchParams.get('host');
    const user = url.searchParams.get('user') || 'root';
    const cols = parseInt(url.searchParams.get('cols') || '220', 10);
    const rows = parseInt(url.searchParams.get('rows') || '50',  10);

    if (!host) {
        ws.send(JSON.stringify({ type: 'error', data: 'Missing host\r\n' }));
        return ws.close();
    }

    console.log(`[SSH] ${user}@${host} (${cols}x${rows})`);

    let ptyProcess;
    try {
        ptyProcess = pty.spawn('ssh', [
            '-o', 'StrictHostKeyChecking=ask',
            '-o', 'ConnectTimeout=10',
            `${user}@${host}`
        ], { name: 'xterm-256color', cols, rows, cwd: HOME, env: process.env });
    } catch (err) {
        ws.send(JSON.stringify({ type: 'error', data: `Spawn failed: ${err.message}\r\n` }));
        return ws.close();
    }

    ptyProcess.onData(data => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'data', data })); });
    ptyProcess.onExit(({ exitCode }) => {
        console.log(`[SSH] exit ${exitCode} for ${user}@${host}`);
        if (ws.readyState === ws.OPEN) { ws.send(JSON.stringify({ type: 'exit', code: exitCode })); ws.close(); }
    });

    ws.on('message', raw => {
        try {
            const m = JSON.parse(raw);
            if (m.type === 'data')   ptyProcess.write(m.data);
            if (m.type === 'resize') ptyProcess.resize(m.cols, m.rows);
        } catch { /* ignore */ }
    });
    ws.on('close', () => { try { ptyProcess.kill(); } catch {} });
    ws.on('error', ()  => { try { ptyProcess.kill(); } catch {} });
});

server.listen(PORT, () => {
    console.log(`\n  fword-ssh backend`);
    console.log(`  HTTP → http://localhost:${PORT}`);
    console.log(`  WS   → ws://localhost:${PORT}/?user=<u>&host=<h>\n`);
});