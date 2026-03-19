# FWORD SSH

> Manage encrypted local SSH connections with an HTML / Node.js app.  
> You can inspect every line of code — no backdoors, no telemetry. 🙂
>
> 🔍 **Independent audit available:** see [SECURITY-AUDIT.md](SECURITY-AUDIT.md) for a full line-by-line analysis confirming that the app is 100 % local with no external network calls, no CDN, and no telemetry.

<img src="screen.gif" />
<img src="screen-2.png" />

---

## Supported OS

| Platform | Browser mode | Desktop (Electron) |
|----------|-------------|-------------------|
| **Linux**  | ✅ | ✅ AppImage |
| **macOS**  | ✅ | ✅ DMG |

---

## Features

- **In-browser SSH terminal** — Connect to any server directly from the browser via a live xterm.js / WebSocket session (port 5556)
- **Multi-tile workspace** — Multiple SSH sessions open simultaneously with automatic tiling layout (1 → 2 → grid)
- **Drag-to-swap** — Drag any terminal tile onto another to swap positions
- **Fullscreen tile** — Expand a single terminal to fill the workspace and restore it back
- **Session pills** — Quick-switch between open terminals from the top bar
- **Terminal color palette** — 5 built-in themes (Fword Dark, Dracula, Nord, Gruvbox, Tokyo Night) + full 18-color customizer with live hex editing; save unlimited custom palettes to localStorage
- **IP reveal toggle** — Server IPs are masked by default; click the eye icon to reveal/hide
- **SSH command copy** — Copy `ssh user@host` to clipboard in one click
- **Encrypted passwords** — Passwords are AES-256-CBC encrypted with a magic salt; the salt is required each time you copy a password
- **Hacker rain background** — Animated matrix-style katakana / hex rain canvas
- **Fully offline** — xterm.js, xterm-addon-fit, browser-crypto and all fonts are bundled locally — no CDN requests at runtime

---

## Asset structure

```
assets/
  css/
    index.css               # app styles
    xterm.css               # terminal stylesheet (local)
    google-fonts.css        # self-hosted font faces
  fonts/                    # woff2 files (IBM Plex Mono, Bebas Neue, Syne)
  js/
    index.js                # app logic
    xterm.js                # xterm.js v5.3.0 (local)
    xterm-addon-fit.js      # fit addon (local)
    browser-crypto.min.js   # AES-256-CBC decryption (local)
  json/
    content.json            # server list
electron-main.js            # Electron entry point
bash.js                     # Node backend (WebSocket SSH bridge, port 5556)
server.js                   # Standalone HTTP server (browser mode)
```

---

## Browser mode (Linux & macOS)

Runs the app as a regular website served by Node.js — no Electron needed.

### Requirements

- Node.js ≥ 18
- Nodemon (global)
- A web server pointing at this directory (Nginx / Apache / etc.) **or** use the built-in server

```bash
sudo npm install -g nodemon
```

> The app always uses **port 5556** for its WebSocket SSH bridge.

### Install

Clone into your web server's publish directory (default `/var/www/html`).  
If you use a different path, edit lines 5 & 11 in the `fwordssh` file.

```bash
bash install.sh
```

### Usage

```bash
# Install Node dependencies
npm install

# Start the backend
fwordssh app

# Add a new SSH host
fwordssh add
```

---

## Desktop app — Linux (Electron → AppImage)

### Prerequisites

```bash
# Node.js ≥ 18 + npm
sudo apt install nodejs npm          # Debian/Ubuntu
# or
sudo pacman -S nodejs npm            # Arch

# Yarn (used by the build scripts)
npm install -g yarn

# Native build tools required by node-pty
sudo apt install build-essential python3   # Debian/Ubuntu
# or
sudo pacman -S base-devel python           # Arch
```

### Build

```bash
# 1. Install dependencies
npm install

# 2. Build the AppImage
yarn build:linux
# Output: dist/FWORD SSH-*.AppImage
```

### Install to app launcher (optional)

```bash
bash install-desktop.sh
# Registers a .desktop file and installs the AppImage to ~/.local/bin
# so FWORD SSH appears in GNOME / KDE / XFCE app launchers
```

### Uninstall desktop integration

```bash
bash uninstall-desktop.sh
```

### Run without installing

```bash
chmod +x "dist/FWORD SSH-*.AppImage"
./dist/FWORD\ SSH-*.AppImage
```

---

## Desktop app — macOS (Electron → DMG)

### Prerequisites

```bash
# Node.js ≥ 18 (recommended via nvm or Homebrew)
brew install node

# Yarn
npm install -g yarn

# Xcode Command Line Tools (required for node-pty native compilation)
xcode-select --install
```

### Build

```bash
# 1. Install dependencies
npm install

# 2. Build the DMG
yarn build:mac
# Output: dist/FWORD SSH-*.dmg
```

### Install

```bash
open dist/FWORD\ SSH-*.dmg
# Drag FWORD SSH.app to /Applications in the installer window
```

### Uninstall

```bash
# Drag FWORD SSH.app from /Applications to the Trash
# or:
rm -rf /Applications/FWORD\ SSH.app
```

---

## Development (Electron with hot-reload)

```bash
npm install

# Terminal 1 — backend with auto-restart
nodemon bash.js

# Terminal 2 — Electron window
npm run electron:dev    # opens DevTools via --inspect=5858
```

---

## Have a good time hacking!
