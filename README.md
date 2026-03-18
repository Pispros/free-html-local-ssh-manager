# free-html-local-ssh-manager (3 minutes install)
Manage encrypted local ssh connections with HTML/Nodejs app ~ You can inspect the code and won't find any backdoor! :) <br>

# Screens
<img src="screen.png" />
<img src="screen-2.png" />

# Supported Os
Linux | MacOs

# Fonctionnalities & Some ideas :)
Once you click on "command" button, a terminal is launched with ssh command to remote host. Your password is encrypted with a magic salt once you create a new host and you need that magic salt every time you click on password button which will copy/paste the host password in your clipboard from the browser. It can be a collaborative free tool to share access to multiple servers. Password Protected page can also be added! 

It works perfectly with ssh-keys managed cloud VPS!

### New features
- **In-browser SSH terminal** — Click "Connect" on any server card to open a live xterm.js terminal session directly in the browser via WebSocket (port 5556), no separate SSH client needed
- **Multi-tile workspace** — Multiple SSH sessions open simultaneously as resizable tiles with automatic tiling layout (1→2→grid)
- **Drag-to-swap** — Drag any terminal tile onto another to swap their positions in the workspace
- **Fullscreen tile** — Expand any single terminal to fill the entire workspace and restore it back
- **Session pills** — Quick-switch between open terminals from the top bar
- **Terminal color palette** — 5 built-in themes (Fword Dark, Dracula, Nord, Gruvbox, Tokyo Night) with a full 18-color customizer; palette is saved to localStorage and applied live to all open terminals
- **IP reveal toggle** — Server IPs are masked by default; click the eye icon on a card to reveal/hide
- **SSH command copy** — Copy the `ssh user@host` command to clipboard in one click
- **Hacker rain background** — Animated matrix-style katakana/hex rain canvas on the main page
- **Fully offline** — All JS libraries (xterm.js, xterm-addon-fit, browser-crypto) and fonts (IBM Plex Mono, Bebas Neue, Syne) are bundled locally; no CDN requests at runtime

# Asset structure
```
assets/
  css/
    index.css          # app styles
    xterm.css          # terminal stylesheet (local)
    google-fonts.css   # self-hosted font faces
  fonts/               # woff2 font files (IBM Plex Mono, Bebas Neue, Syne)
  js/
    index.js           # app logic
    xterm.js           # xterm.js v5.3.0 (local)
    xterm-addon-fit.js # fit addon (local)
    browser-crypto.min.js # AES-256-CBC decryption (local)
  json/
    content.json       # server list
```

# Requirements

1 - Nodemon installed globally
```bash
 sudo npm install -g nodemon
```

2 - Web Server (Nginx or Apache or whatever you like that reads website by folders)

Note : App uses port 5556

# Installation
Clone repository in the publish directory of your web server (by default /var/www/html if not you must edit line 5 & 11 in "fwordssh" file from this repository to set the path to the directory where you cloned it.)

```bash
 bash install.sh
```

# Instructions

1 - Install npm packages
```bash
 npm install
```

2 - Run app (Just like your regular linux command :) )
```bash
 fwordssh app
```

3 - Add a new host (Just like your regular linux command :) )
```bash
 fwordssh add
```

# Have a good time hacking!
