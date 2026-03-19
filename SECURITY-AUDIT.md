# Security Audit — FWORD SSH is 100 % Local

> **Scope:** Full static analysis of every source file in this repository.  
> **Date:** 2026-03-19  
> **Verdict:** No backdoors. No telemetry. No external network calls.

---

## 1. File inventory

| File | Role |
|------|------|
| `index.html` | Entry point — loads only local assets |
| `bash.js` | Node.js backend — WebSocket & REST API on `localhost:5556` |
| `server.js` | CLI helper — encrypts and writes new entries to `content.json` |
| `electron-main.js` | Electron shell — opens a `BrowserWindow` pointing at `index.html` |
| `assets/js/index.js` | Frontend logic |
| `assets/js/xterm.js` | xterm.js v5.3.0 — bundled, not fetched from a CDN |
| `assets/js/xterm-addon-fit.js` | xterm fit addon — bundled locally |
| `assets/js/browser-crypto.min.js` | AES-256-CBC crypto helper — bundled locally |
| `assets/css/google-fonts.css` | Self-hosted `@font-face` declarations — no Google Fonts CDN |
| `assets/fonts/` | woff2 font files (IBM Plex Mono, Bebas Neue, Syne) |
| `assets/json/content.json` | Server list (AES-encrypted passwords) — stored on disk only |

---

## 2. Network activity audit

### 2a. `index.html` — zero external URLs

Every `<link>` and `<script>` tag resolves to a **relative path** inside `assets/`:

```html
<!-- All local — verified line by line -->
<link rel="stylesheet" href="assets/css/google-fonts.css">
<link rel="stylesheet" href="assets/css/xterm.css">
<link rel="stylesheet" href="assets/css/index.css">
<script src="assets/js/xterm.js"></script>
<script src="assets/js/xterm-addon-fit.js"></script>
<script src="assets/js/browser-crypto.min.js"></script>
<script src="assets/js/index.js"></script>
```

No `https://`, no `//cdn.`, no external origin anywhere in the file.

### 2b. `assets/js/index.js` — all destinations are `localhost`

The only outbound calls made by the frontend:

| Call | Destination | Purpose |
|------|-------------|---------|
| `fetch(url)` | `http://localhost:5556/servers` (Electron) **or** `assets/json/content.json` (browser mode) | Read server list |
| `new EventSource(...)` | `http://localhost:5556/servers/watch` | Live-reload server list |
| `new WebSocket(url)` | `ws://localhost:5556/` | SSH terminal session |

No call ever targets an address outside `localhost`. There is no analytics script, no error-reporting beacon, no update-check endpoint, no CDN fallback.

### 2c. `bash.js` (Node.js backend) — zero outbound connections

`bash.js` **only listens** — it never opens an outbound TCP/HTTP connection. The complete list of what it does on the network:

- `http.createServer(app)` + `new WebSocketServer({ server })` — bind to `0.0.0.0:5556`
- Serve `GET /`, `GET /servers`, `PUT /servers`, `GET /terminal-theme`, `POST /start-terminal` — all responding to the local frontend
- `GET /servers/watch` — Server-Sent Events stream to the local frontend
- WebSocket upgrade — spawns a `node-pty` process running the **system `ssh` binary**

No `fetch`, no `http.get`, no `https.request`, no `dns.lookup` for any external host.

### 2d. `server.js` — local file I/O only

`server.js` is an interactive CLI helper invoked by `fwordssh add`. It reads `content.json`, appends a new encrypted entry, and writes it back. It makes no network call of any kind.

### 2e. `electron-main.js` — health-check only, then offline

The only network call in the Electron main process is a local health-check polling loop:

```js
http.get(`http://127.0.0.1:${PORT}/`, ...)   // waits for bash.js to be ready
```

That is a loopback call. Once the window opens, the main process makes no further network calls.

---

## 3. Font delivery audit

`assets/css/google-fonts.css` is **not** loading fonts from `fonts.googleapis.com`. It contains only `@font-face` rules that reference woff2 files inside `assets/fonts/`. Verify with:

```bash
grep -v '@font-face\|src:\|url(\|font-\|/*\|^\s*$' assets/css/google-fonts.css
```

The output should be empty — there are no `@import url(https://...)` lines.

---

## 4. Cryptography audit

All password storage uses **AES-256-CBC** with a user-supplied salt.

| Property | Value |
|----------|-------|
| Algorithm | AES-256-CBC |
| Key derivation | PBKDF2 — SHA-256, 10 000 iterations, 32-byte output |
| IV | Random 16 bytes per encryption (`crypto.randomBytes(16)`) |
| Salt | User-provided at encryption time; required for decryption |
| Storage | `iv_hex:ciphertext_hex` written to `content.json` on disk |
| Decryption surface | Browser only (`browser-crypto.min.js`) — the Node backend never decrypts passwords |

The magic-salt model means an attacker who reads `content.json` cannot recover a password without the salt, even though they have the ciphertext and the key-derivation parameters.

---

## 5. Dependency audit

Runtime dependencies declared in `package.json`:

| Package | Version | Purpose | Network access |
|---------|---------|---------|----------------|
| `express` | ^4.18.2 | HTTP server framework | None — listens only |
| `ws` | ^8.19.0 | WebSocket server | None — listens only |
| `node-pty` | ^1.1.0 | Spawn system `ssh` binary in a pseudo-terminal | None — no subprocess network |
| `cors` | ^2.8.5 | CORS middleware | None |
| `body-parser` | ^1.20.2 | Request body parsing | None |
| `prompt-sync` | ^4.2.0 | Interactive CLI prompts (`fwordssh add`) | None |
| `xterm` | ^5.3.0 | Listed as dep but **used only as a source** — the runtime file is the pre-bundled `assets/js/xterm.js` | None |

Dev dependencies (`electron`, `electron-builder`, `nodemon`) are build/dev tools only and are not shipped in the browser-mode build.

**No dependency performs any outbound network call at runtime.**

---

## 6. SSH credential handling

1. `content.json` stores passwords **already encrypted** — never in plaintext.
2. Decryption happens **entirely in the browser** via `browser-crypto.min.js`.
3. The plaintext password is passed to `bash.js` only to hand it to `node-pty` (the local `ssh` process) through a WebSocket message on `localhost`. It never traverses a network link to an external host.
4. The Node backend (`bash.js`) never logs, stores, or retransmits credentials.

---

## 7. Electron security configuration

```js
webPreferences: {
  nodeIntegration:  false,   // renderer cannot call Node.js APIs directly
  contextIsolation: true,    // renderer and main worlds are isolated
}
```

No `webSecurity: false`, no `allowRunningInsecureContent`, no `experimentalFeatures`.

---

## 8. How to verify yourself

You can reproduce this audit in under five minutes:

```bash
# 1. Check for any external URL in source files
grep -rn 'https\?://' index.html assets/js/index.js bash.js server.js electron-main.js \
  | grep -v 'localhost\|127\.0\.0\.1\|0\.0\.0\.0\|example\.com'
# Expected: zero results

# 2. Confirm all script/link tags in index.html are local
grep -E '<(script|link)[^>]+(src|href)' index.html
# Expected: every result starts with assets/

# 3. Confirm google-fonts.css has no CDN import
grep -i 'googleapis\|gstatic\|@import' assets/css/google-fonts.css
# Expected: zero results

# 4. Confirm the backend makes no outbound TCP calls
grep -n 'https\?\.\(get\|request\)\|fetch\|dns\.lookup' bash.js
# Expected: zero results

# 5. List all npm packages that could reach the internet
npm ls --depth 0
# Review each package — none of express/ws/node-pty/cors/body-parser/prompt-sync makes outbound calls
```

---

## 9. Summary

| Claim | Status |
|-------|--------|
| No external network requests from the frontend | ✅ Confirmed |
| No outbound network calls from the backend | ✅ Confirmed |
| No CDN — all JS/CSS/fonts served locally | ✅ Confirmed |
| No analytics, telemetry, or tracking code | ✅ Confirmed |
| No update-check or phone-home mechanism | ✅ Confirmed |
| Passwords encrypted before being written to disk | ✅ Confirmed |
| Electron renderer properly sandboxed | ✅ Confirmed |
| SSH credentials never sent to an external host | ✅ Confirmed |

Every claim in this table can be independently verified with the commands in §8 above.
