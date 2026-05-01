/* ══════════════════════════════════════════════════════════
   HACKER RAIN
══════════════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById("rain-canvas");
  const ctx = canvas.getContext("2d");
  const CHARS =
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/\\|{}[]!@#$%^&*";
  let cols, drops, W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols = Math.floor(W / 16);
    drops = Array.from({ length: cols }, () => (Math.random() * -H) / 16);
  }

  function draw() {
    ctx.fillStyle = "rgba(5,7,9,.065)";
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < cols; i++) {
      const y = drops[i] * 16;
      // leading char — bright
      ctx.font = '13px "IBM Plex Mono", monospace';
      ctx.fillStyle = `rgba(180,255,180,${0.7 + Math.random() * 0.3})`;
      ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * 16, y);
      // trailing char — dim green
      ctx.fillStyle = `rgba(0,${Math.floor(160 + Math.random() * 95)},${Math.floor(40 + Math.random() * 40)},${0.15 + Math.random() * 0.25})`;
      ctx.fillText(
        CHARS[Math.floor(Math.random() * CHARS.length)],
        i * 16,
        y - 16,
      );

      drops[i] += 0.35 + Math.random() * 0.5;
      if (drops[i] * 16 > H + 50 && Math.random() > 0.975)
        drops[i] = -Math.floor((Math.random() * H) / 16);
    }
  }

  resize();
  window.addEventListener("resize", resize);
  setInterval(draw, 50);
})();

/* ══════════════════════════════════════════════════════════
   CRYPTO
══════════════════════════════════════════════════════════ */
const { Buffer, createDecipheriv, pbkdf2Sync } = window.browserCrypto;
function decrypt(enc, pwd, salt) {
  const [iv, data] = enc.split(":").map((p) => Buffer.from(p, "hex"));
  const key = pbkdf2Sync(pwd, salt, 10000, 32, "sha256");
  const d = createDecipheriv("aes-256-cbc", key, iv);
  return d.update(data, "hex", "utf-8") + d.final("utf-8");
}

/* ══════════════════════════════════════════════════════════
   GENERIC DIALOG (prompt / confirm replacement)
══════════════════════════════════════════════════════════ */
function showDialog({
  title = "",
  message = "",
  input = false,
  placeholder = "",
  inputType = "text",
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("dialog-overlay");
    const modal = document.getElementById("dialog-modal");
    const okBtn = document.getElementById("dlg-ok");
    const cancelBtn = document.getElementById("dlg-cancel");
    const closeBtn = document.getElementById("dlg-close");
    const msgEl = document.getElementById("dlg-msg");
    const inp = document.getElementById("dlg-input");

    // Content
    document.getElementById("dlg-title").textContent = title;
    msgEl.textContent = message;
    msgEl.style.display = message ? "block" : "none";
    inp.style.display = input ? "block" : "none";
    inp.type = inputType;
    inp.placeholder = placeholder;
    inp.value = "";
    // Force input theme inline so Electron/Chromium native styles can't override
    Object.assign(inp.style, {
      background: "#050709",
      backgroundColor: "#050709",
      color: "#d0e8d0",
      border: "1px solid rgba(0,255,100,.22)",
      borderRadius: "5px",
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: "12px",
      letterSpacing: ".05em",
      padding: "0 12px",
      height: "38px",
      width: "100%",
      outline: "none",
      boxSizing: "border-box",
      caretColor: "#00ff64",
    });
    okBtn.className = "hdr-btn " + (danger ? "danger-btn" : "accent");
    okBtn.textContent = danger ? "Delete" : "OK";

    // Force overlay styles inline — guarantees correct layout regardless of CSS cache
    Object.assign(overlay.style, {
      display: "flex",
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      background: "rgba(5,7,9,.85)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "99999",
    });
    Object.assign(modal.style, {
      width: "360px",
      maxWidth: "calc(100vw - 32px)",
      background: "#0d1219",
      border: "1px solid rgba(0,255,100,.25)",
      borderRadius: "8px",
      overflow: "hidden",
      flexShrink: "0",
    });

    if (input)
      setTimeout(() => {
        inp.focus();
        inp.addEventListener(
          "focus",
          () => {
            inp.style.borderColor = "#00ff64";
            inp.style.boxShadow =
              "0 0 0 3px rgba(0,255,100,.12), 0 0 12px rgba(0,255,100,.08)";
          },
          { once: false },
        );
        inp.addEventListener(
          "blur",
          () => {
            inp.style.borderColor = "rgba(0,255,100,.22)";
            inp.style.boxShadow = "none";
          },
          { once: false },
        );
      }, 60);

    function close(val) {
      overlay.style.display = "none";
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      closeBtn.removeEventListener("click", onCancel);
      overlay.removeEventListener("click", onBackdrop);
      inp.removeEventListener("keydown", onKey);
      resolve(val);
    }
    function onOk() {
      close(input ? inp.value : true);
    }
    function onCancel() {
      close(null);
    }
    function onBackdrop(e) {
      if (e.target === overlay) close(null);
    }
    function onKey(e) {
      if (e.key === "Enter") onOk();
      else if (e.key === "Escape") onCancel();
    }

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    closeBtn.addEventListener("click", onCancel);
    overlay.addEventListener("click", onBackdrop);
    inp.addEventListener("keydown", onKey);
  });
}

/* ══════════════════════════════════════════════════════════
   PALETTE SYSTEM
══════════════════════════════════════════════════════════ */
const PALETTE_KEY = "fword_ssh_palette";
const CUSTOM_PALETTES_KEY = "fword_ssh_custom_palettes";

let customPalettes = {};

function loadCustomPalettes() {
  try {
    const saved = localStorage.getItem(CUSTOM_PALETTES_KEY);
    if (saved) customPalettes = JSON.parse(saved);
  } catch {
    customPalettes = {};
  }
}

function saveCustomPalettes() {
  try {
    localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(customPalettes));
  } catch {}
}

async function saveCurrentAsCustom() {
  const raw = await showDialog({
    title: "Save Palette",
    input: true,
    placeholder: "Palette name…",
  });
  if (!raw) return;
  const name = raw.trim().slice(0, 40);
  if (!name) return;
  if (PRESETS[name]) {
    showToast("Cannot override a built-in preset");
    return;
  }
  customPalettes[name] = { ...editingPalette };
  saveCustomPalettes();
  activePreset = name;
  buildPaletteModal();
  showToast(`Palette "${name}" saved`);
}

async function deleteCustomPalette(name) {
  const ok = await showDialog({
    title: "Delete Palette",
    message: `Delete palette "${name}"?`,
    danger: true,
  });
  if (!ok) return;
  delete customPalettes[name];
  saveCustomPalettes();
  if (activePreset === name) {
    activePreset = "Fword Dark";
    editingPalette = { ...PRESETS["Fword Dark"] };
  }
  buildPaletteModal();
  showToast(`Palette "${name}" deleted`);
}

const PRESETS = {
  "Fword Dark": {
    background: "#060b13",
    foreground: "#c8e6c9",
    cursor: "#00ff9f",
    black: "#0e1826",
    red: "#ff3355",
    green: "#00ff9f",
    yellow: "#ffc107",
    blue: "#4cc9f0",
    magenta: "#c77dff",
    cyan: "#00e5ff",
    white: "#c8e6c9",
    brightBlack: "#1e3248",
    brightRed: "#ff6680",
    brightGreen: "#33ffaa",
    brightYellow: "#ffe566",
    brightBlue: "#74d7f7",
    brightMagenta: "#da9fff",
    brightCyan: "#80f0ff",
    brightWhite: "#e8f5e9",
  },
  Dracula: {
    background: "#282a36",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    black: "#21222c",
    red: "#ff5555",
    green: "#50fa7b",
    yellow: "#f1fa8c",
    blue: "#bd93f9",
    magenta: "#ff79c6",
    cyan: "#8be9fd",
    white: "#f8f8f2",
    brightBlack: "#6272a4",
    brightRed: "#ff6e6e",
    brightGreen: "#69ff94",
    brightYellow: "#ffffa5",
    brightBlue: "#d6acff",
    brightMagenta: "#ff92df",
    brightCyan: "#a4ffff",
    brightWhite: "#ffffff",
  },
  Nord: {
    background: "#2e3440",
    foreground: "#d8dee9",
    cursor: "#d8dee9",
    black: "#3b4252",
    red: "#bf616a",
    green: "#a3be8c",
    yellow: "#ebcb8b",
    blue: "#81a1c1",
    magenta: "#b48ead",
    cyan: "#88c0d0",
    white: "#e5e9f0",
    brightBlack: "#4c566a",
    brightRed: "#bf616a",
    brightGreen: "#a3be8c",
    brightYellow: "#ebcb8b",
    brightBlue: "#81a1c1",
    brightMagenta: "#b48ead",
    brightCyan: "#8fbcbb",
    brightWhite: "#eceff4",
  },
  Gruvbox: {
    background: "#1d2021",
    foreground: "#ebdbb2",
    cursor: "#ebdbb2",
    black: "#282828",
    red: "#cc241d",
    green: "#98971a",
    yellow: "#d79921",
    blue: "#458588",
    magenta: "#b16286",
    cyan: "#689d6a",
    white: "#a89984",
    brightBlack: "#928374",
    brightRed: "#fb4934",
    brightGreen: "#b8bb26",
    brightYellow: "#fabd2f",
    brightBlue: "#83a598",
    brightMagenta: "#d3869b",
    brightCyan: "#8ec07c",
    brightWhite: "#ebdbb2",
  },
  "Tokyo Night": {
    background: "#1a1b26",
    foreground: "#a9b1d6",
    cursor: "#c0caf5",
    black: "#32344a",
    red: "#f7768e",
    green: "#9ece6a",
    yellow: "#e0af68",
    blue: "#7aa2f7",
    magenta: "#ad8ee6",
    cyan: "#449dab",
    white: "#787c99",
    brightBlack: "#444b6a",
    brightRed: "#ff7a93",
    brightGreen: "#b9f27c",
    brightYellow: "#ff9e64",
    brightBlue: "#7da6ff",
    brightMagenta: "#bb9af7",
    brightCyan: "#0db9d7",
    brightWhite: "#acb0d0",
  },
};

const COLOR_LABELS = [
  ["background", "Background"],
  ["foreground", "Foreground"],
  ["cursor", "Cursor"],
  ["black", "Black"],
  ["red", "Red"],
  ["green", "Green"],
  ["yellow", "Yellow"],
  ["blue", "Blue"],
  ["magenta", "Magenta"],
  ["cyan", "Cyan"],
  ["white", "White"],
  ["brightBlack", "Br.Black"],
  ["brightRed", "Br.Red"],
  ["brightGreen", "Br.Green"],
  ["brightYellow", "Br.Yellow"],
  ["brightBlue", "Br.Blue"],
  ["brightMagenta", "Br.Magenta"],
  ["brightCyan", "Br.Cyan"],
];

let currentPalette = {};

function loadPalette() {
  try {
    const saved = localStorage.getItem(PALETTE_KEY);
    if (saved)
      currentPalette = { ...PRESETS["Fword Dark"], ...JSON.parse(saved) };
    else currentPalette = { ...PRESETS["Fword Dark"] };
  } catch {
    currentPalette = { ...PRESETS["Fword Dark"] };
  }
}

function savePalette(p) {
  currentPalette = { ...p };
  try {
    localStorage.setItem(PALETTE_KEY, JSON.stringify(currentPalette));
  } catch {}
}

function buildXtermTheme(p) {
  return {
    background: p.background || "#060b13",
    foreground: p.foreground || "#c8e6c9",
    cursor: p.cursor || "#00ff9f",
    cursorAccent: p.background || "#060b13",
    selectionBackground: "rgba(0,255,159,.18)",
    black: p.black || "#0e1826",
    red: p.red || "#ff3355",
    green: p.green || "#00ff9f",
    yellow: p.yellow || "#ffc107",
    blue: p.blue || "#4cc9f0",
    magenta: p.magenta || "#c77dff",
    cyan: p.cyan || "#00e5ff",
    white: p.white || "#c8e6c9",
    brightBlack: p.brightBlack || "#1e3248",
    brightRed: p.brightRed || "#ff6680",
    brightGreen: p.brightGreen || "#33ffaa",
    brightYellow: p.brightYellow || "#ffe566",
    brightBlue: p.brightBlue || "#74d7f7",
    brightMagenta: p.brightMagenta || "#da9fff",
    brightCyan: p.brightCyan || "#80f0ff",
    brightWhite: p.brightWhite || "#e8f5e9",
  };
}

/* ── Palette modal UI ─────────────────────────────── */
let editingPalette = {};
let activePreset = "Fword Dark";

function buildPaletteModal() {
  // presets
  const prow = document.getElementById("preset-row");
  prow.innerHTML = "";

  // built-in presets
  Object.keys(PRESETS).forEach((name) => {
    const b = document.createElement("button");
    b.className = "preset-btn" + (name === activePreset ? " active" : "");
    b.textContent = name;
    b.addEventListener("click", () => {
      activePreset = name;
      editingPalette = { ...PRESETS[name] };
      buildPaletteModal();
    });
    prow.appendChild(b);
  });

  // custom palettes (with delete button)
  Object.keys(customPalettes).forEach((name) => {
    const wrap = document.createElement("div");
    wrap.className = "preset-wrap";
    const b = document.createElement("button");
    b.className = "preset-btn" + (name === activePreset ? " active" : "");
    b.textContent = name;
    b.addEventListener("click", () => {
      activePreset = name;
      editingPalette = { ...customPalettes[name] };
      buildPaletteModal();
    });
    const del = document.createElement("button");
    del.className = "preset-del";
    del.title = "Delete";
    del.innerHTML = "&times;";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCustomPalette(name);
    });
    wrap.appendChild(b);
    wrap.appendChild(del);
    prow.appendChild(wrap);
  });

  // "+ Save as New" button
  const addBtn = document.createElement("button");
  addBtn.className = "preset-btn preset-add";
  addBtn.textContent = "+ Save as New";
  addBtn.addEventListener("click", saveCurrentAsCustom);
  prow.appendChild(addBtn);

  // color rows
  const grid = document.getElementById("color-grid");
  grid.innerHTML = "";
  COLOR_LABELS.forEach(([key, label]) => {
    const val = editingPalette[key] || "#000000";

    const row = document.createElement("div");
    row.className = "color-row";

    // Swatch (visual indicator + hidden native picker)
    const swWrap = document.createElement("div");
    swWrap.className = "color-swatch";
    swWrap.style.background = val;

    const nativePicker = document.createElement("input");
    nativePicker.type = "color";
    nativePicker.value = val;
    // Keep it off-screen rather than opacity:0 so Electron can still open it
    Object.assign(nativePicker.style, {
      position: "absolute",
      opacity: "0",
      width: "1px",
      height: "1px",
      top: "0",
      left: "0",
      pointerEvents: "none",
    });
    swWrap.appendChild(nativePicker);

    // Label
    const lbl = document.createElement("span");
    lbl.className = "color-lbl";
    lbl.textContent = label;

    // Editable hex field — force dark styles inline so Electron can't override
    const hexInp = document.createElement("input");
    hexInp.type = "text";
    hexInp.className = "color-hex-input";
    hexInp.value = val;
    hexInp.maxLength = 7;
    hexInp.spellcheck = false;
    hexInp.autocomplete = "off";
    Object.assign(hexInp.style, {
      background: "#050709",
      backgroundColor: "#050709",
      color: "#d0e8d0",
      WebkitTextFillColor: "#d0e8d0",
      caretColor: "#00ff64",
      border: "1px solid rgba(0,255,100,.18)",
      borderRadius: "4px",
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: "11px",
      letterSpacing: ".07em",
      height: "26px",
      padding: "0 8px",
      outline: "none",
      boxSizing: "border-box",
      flex: "1",
      minWidth: "0",
    });
    hexInp.addEventListener("focus", () => {
      hexInp.style.borderColor = "#00ff64";
      hexInp.style.boxShadow = "0 0 0 2px rgba(0,255,100,.1)";
    });
    hexInp.addEventListener("blur", () => {
      hexInp.style.borderColor = "rgba(0,255,100,.18)";
      hexInp.style.boxShadow = "none";
    });

    // Color-picker trigger button
    const pickBtn = document.createElement("button");
    pickBtn.className = "color-pick-btn";
    pickBtn.title = "Pick color";
    pickBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41-6.6 6.6A2 2 0 0 0 5 16v3h3a2 2 0 0 0 1.42-.59l6.6-6.6 1.41 1.42 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 0 0 0-1.65z"/></svg>`;

    // Sync helper
    function applyColor(hex) {
      const clean = hex.trim().toLowerCase();
      if (!/^#[0-9a-f]{6}$/.test(clean)) return;
      editingPalette[key] = clean;
      swWrap.style.background = clean;
      nativePicker.value = clean;
      hexInp.value = clean;
    }

    // Native picker → everything else
    nativePicker.addEventListener("input", () =>
      applyColor(nativePicker.value),
    );

    // Hex text field: update live as user types valid hex
    hexInp.addEventListener("input", () => {
      let v = hexInp.value.trim();
      if (!v.startsWith("#")) v = "#" + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) applyColor(v);
    });
    hexInp.addEventListener("blur", () => {
      // Snap back to last valid value on bad input
      let v = hexInp.value.trim();
      if (!v.startsWith("#")) v = "#" + v;
      if (!/^#[0-9a-f]{6}$/.test(v.toLowerCase()))
        hexInp.value = editingPalette[key];
    });
    hexInp.addEventListener("keydown", (e) => e.stopPropagation());

    // Picker button → programmatically open native picker
    pickBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      nativePicker.style.pointerEvents = "auto";
      nativePicker.click();
      setTimeout(() => {
        nativePicker.style.pointerEvents = "none";
      }, 300);
    });

    // Click on swatch also opens picker
    swWrap.addEventListener("click", () => {
      nativePicker.style.pointerEvents = "auto";
      nativePicker.click();
      setTimeout(() => {
        nativePicker.style.pointerEvents = "none";
      }, 300);
    });

    row.appendChild(swWrap);
    row.appendChild(lbl);
    row.appendChild(hexInp);
    row.appendChild(pickBtn);
    grid.appendChild(row);
  });
}

function openPalette() {
  editingPalette = { ...currentPalette };
  buildPaletteModal();
  document.getElementById("palette-overlay").classList.add("open");
}
function closePaletteModal() {
  document.getElementById("palette-overlay").classList.remove("open");
}

document.getElementById("btn-palette").addEventListener("click", openPalette);
document
  .getElementById("btn-palette-ws")
  .addEventListener("click", openPalette);
document
  .getElementById("palette-close")
  .addEventListener("click", closePaletteModal);
document.getElementById("palette-overlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closePaletteModal();
});

document.getElementById("palette-reset").addEventListener("click", () => {
  activePreset = "Fword Dark";
  editingPalette = { ...PRESETS["Fword Dark"] };
  buildPaletteModal();
  showToast("Reset to Fword Dark");
});

document.getElementById("palette-save").addEventListener("click", () => {
  savePalette(editingPalette);
  // apply to all open terminals
  const theme = buildXtermTheme(currentPalette);
  tiles.forEach((t) => {
    try {
      t.term.options.theme = theme;
    } catch {}
  });
  closePaletteModal();
  showToast("Palette saved & applied");
});

/* ══════════════════════════════════════════════════════════
   VPS LIST
══════════════════════════════════════════════════════════ */
let sshList = [];

// window.electronAPI is injected exclusively by the Electron preload script
// (contextBridge.exposeInMainWorld). It is never present in a regular browser,
// so it is the most reliable way to detect the Electron runtime.
const IS_ELECTRON = typeof window.electronAPI !== "undefined";

async function getData() {
  try {
    const url = IS_ELECTRON
      ? "http://localhost:5556/servers"
      : "assets/json/content.json";
    const r = await fetch(url);
    const data = await r.json();

    // Handle mixed structure: groups and individual servers
    if (Array.isArray(data)) {
      // Check if we have a mixed array (some groups, some individual servers)
      const hasGroups = data.some(
        (item) => item.groupName && item.nestedServers,
      );
      const hasIndividualServers = data.some((item) => item.server && item.ip);

      if (hasGroups || hasIndividualServers) {
        // Keep the mixed structure as-is
        sshList = data;
      } else {
        // Empty array or unknown structure
        sshList = [];
      }
    } else if (data && typeof data === "object") {
      // Single object - could be a group or individual server
      if (data.groupName && data.nestedServers) {
        sshList = [data]; // Single group
      } else if (data.server && data.ip) {
        sshList = [data]; // Single individual server
      } else {
        sshList = [];
      }
    } else {
      sshList = [];
    }

    // If still empty, create demo data
    if (!sshList.length) {
      sshList = [
        {
          groupName: "Demo Group",
          nestedServers: [
            { server: "Demo VPS 1", ip: "192.168.1.1", user: "root", pwd: "" },
          ],
        },
        { server: "Standalone VPS", ip: "10.0.0.1", user: "admin", pwd: "" },
      ];
    }
  } catch {
    sshList = [
      {
        groupName: "Demo Group",
        nestedServers: [
          { server: "Demo VPS 1", ip: "192.168.1.1", user: "root", pwd: "" },
        ],
      },
      { server: "Standalone VPS", ip: "10.0.0.1", user: "admin", pwd: "" },
    ];
  }
  renderVpsList();
}

// Live-reload via SSE — only available in Electron where the backend is running
if (IS_ELECTRON) {
  (function watchServers() {
    const es = new EventSource("http://localhost:5556/servers/watch");
    es.onmessage = (e) => {
      if (e.data === "update") getData();
    };
    es.onerror = () => {
      es.close();
      setTimeout(watchServers, 3000);
    };
  })();
}

const EYE_OPEN_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z"/></svg>`;
const EYE_CLOSED_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2,5.27L3.28,4L20,20.72L18.73,22L15.65,18.92C14.5,19.3 13.28,19.5 12,19.5C7,19.5 2.73,16.39 1,12C1.69,10.24 2.79,8.69 4.19,7.46L2,5.27M12,9A3,3 0 0,1 15,12C15,12.35 14.94,12.69 14.83,13L11,9.17C11.31,9.06 11.65,9 12,9M12,4.5C17,4.5 21.27,7.61 23,12C22.18,14.08 20.79,15.88 19,17.19L17.58,15.76C18.94,14.82 20.06,13.54 20.82,12C19.17,8.64 15.76,6.5 12,6.5C10.91,6.5 9.84,6.68 8.84,7L7.3,5.47C8.74,4.85 10.33,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C12.69,17.5 13.37,17.43 14,17.29L11.72,15C10.29,14.85 9.15,13.71 9,12.28L5.6,8.87C4.61,9.72 3.78,10.78 3.18,12Z"/></svg>`;

function createServerCard(vps, serverIndex, animationIndex = serverIndex) {
  const card = document.createElement("div");
  card.className = "vps-card";
  card.style.animationDelay = animationIndex * 55 + "ms";
  card.innerHTML = `
    <div class="card-top">
      <div class="card-orb">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,255,100,.5)"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10l1.41-1.41L10 11.17l-1.41 1.41L6 10zm4 4h8v-2h-8v2z"/></svg>
      </div>
      <div class="card-info">
        <div class="card-name">${vps.server || "Unknown"}</div>
        <div class="card-ip">
          <span class="card-ip-val" id="cip-${serverIndex}">*.*.*.*</span>
          <button class="eye-btn" data-idx="${serverIndex}" data-show="false">${EYE_OPEN_ICON}</button>
        </div>
      </div>
    </div>
    <div class="card-bottom">
      <button class="card-btn primary" data-idx="${serverIndex}" data-action="connect"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>Connect</button>
      <button class="card-btn" data-idx="${serverIndex}" data-action="copy"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>SSH Cmd</button>
      <button class="card-btn" data-idx="${serverIndex}" data-action="pwd"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>Password</button>
    </div>`;
  return card;
}

function createGroupCard(group, groupIndex, animationIndex) {
  const count = Array.isArray(group.nestedServers) ? group.nestedServers.length : 0;
  const card = document.createElement("div");
  card.className = "vps-card group-card";
  card.style.animationDelay = animationIndex * 55 + "ms";
  card.innerHTML = `
    <div class="card-top">
      <div class="card-orb group-orb">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,255,100,.5)"><path d="M10 4H2v16h20V6H12l-2-2z"/></svg>
        <span class="group-badge">${count}</span>
      </div>
      <div class="card-info">
        <div class="card-name">${group.groupName || "Unnamed Group"}</div>
        <div class="card-ip"><span class="card-ip-val">Group • ${count} server${count !== 1 ? "s" : ""}</span></div>
      </div>
    </div>
    <div class="card-bottom">
      <button class="card-btn primary" data-action="view-group" data-group-idx="${groupIndex}"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z"/></svg>Open</button>
      <button class="card-btn" data-action="connect-all" data-group-idx="${groupIndex}"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>All</button>
    </div>`;
  return card;
}

function handleServerAction(btn) {
  const vps = window.sshListFlat[+btn.dataset.idx];
  if (!vps) return;
  if (btn.dataset.action === "connect") openTile(vps);
  if (btn.dataset.action === "copy") {
    navigator.clipboard.writeText(`ssh ${vps.user}@${vps.ip}`);
    showToast("SSH command copied!");
  }
  if (btn.dataset.action === "pwd") {
    showDialog({ title: "Decrypt Password", message: `${vps.server || vps.ip}`, input: true, placeholder: "Enter salt…", inputType: "password" }).then((salt) => {
      if (salt === null) return;
      try {
        navigator.clipboard.writeText(decrypt(vps.pwd, "your_password_here", String(salt)));
        showToast("Password copied!");
      } catch {
        showToast("Incorrect salt!");
      }
    });
  }
}

function wireServerCardEvents(root = document) {
  root.querySelectorAll(".eye-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = +btn.dataset.idx;
      const vps = window.sshListFlat[i];
      if (!vps) return;
      const show = btn.dataset.show === "false";
      btn.dataset.show = String(show);
      const ipEl = root.querySelector(`#cip-${i}`) || document.getElementById(`cip-${i}`);
      if (ipEl) ipEl.textContent = show ? vps.ip : "*.*.*.*";
      btn.innerHTML = show ? EYE_CLOSED_ICON : EYE_OPEN_ICON;
    });
  });
  root.querySelectorAll(".card-btn[data-idx]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleServerAction(btn);
    });
  });
}

function openGroupModal(group) {
  const overlay = document.getElementById("group-overlay");
  const title = document.getElementById("group-title");
  const count = document.getElementById("group-modal-count");
  const list = document.getElementById("group-server-grid");
  const servers = Array.isArray(group.nestedServers) ? group.nestedServers : [];
  title.textContent = group.groupName || "Unnamed Group";
  count.textContent = `${servers.length} server${servers.length !== 1 ? "s" : ""}`;
  list.innerHTML = "";
  servers.forEach((server, index) => list.appendChild(createServerCard(server, window.sshListFlat.indexOf(server), index)));
  overlay.classList.add("active");
  overlay.style.display = "flex";
  wireServerCardEvents(list);
}

function closeGroupModal() {
  const overlay = document.getElementById("group-overlay");
  overlay.classList.remove("active");
  overlay.style.display = "none";
}

function renderVpsList() {
  const grid = document.getElementById("vps-grid");
  grid.innerHTML = "";
  if (!sshList.length) {
    grid.innerHTML = '<p class="no-servers">No servers configured.</p>';
    return;
  }
  const groups = [];
  const individualServers = [];
  const allServers = [];
  sshList.forEach((item) => {
    if (item && item.groupName && Array.isArray(item.nestedServers)) {
      groups.push(item);
      item.nestedServers.forEach((server) => allServers.push(server));
    } else if (item && item.server && item.ip) {
      individualServers.push(item);
      allServers.push(item);
    }
  });
  window.sshListFlat = allServers;
  let cardIndex = 0;
  individualServers.forEach((vps) => {
    grid.appendChild(createServerCard(vps, allServers.indexOf(vps), cardIndex));
    cardIndex++;
  });
  groups.forEach((group, groupIndex) => {
    if (!group.nestedServers.length) return;
    const groupCard = createGroupCard(group, groupIndex, cardIndex);
    groupCard.addEventListener("click", (e) => {
      const actionBtn = e.target.closest(".card-btn");
      if (actionBtn?.dataset.action === "connect-all") {
        group.nestedServers.forEach((server) => openTile(server));
        return;
      }
      openGroupModal(group);
    });
    grid.appendChild(groupCard);
    cardIndex++;
  });
  if (!grid.children.length) grid.innerHTML = '<p class="no-servers">No servers configured.</p>';
  wireServerCardEvents(grid);
}

document.getElementById("group-close")?.addEventListener("click", closeGroupModal);
document.getElementById("group-overlay")?.addEventListener("click", (e) => {
  if (e.target.id === "group-overlay") closeGroupModal();
});

/* ══════════════════════════════════════════════════════════
   WORKSPACE
══════════════════════════════════════════════════════════ */
const WS = document.getElementById("workspace");
const ROOT = document.getElementById("tile-root");
const PILLS = document.getElementById("ws-pills");
const FAB = document.getElementById("ws-fab");
const OPBTN = document.getElementById("btn-open-ws");
const GAP = 3;

let tiles = [];
let wCount = 0;
let focused = null;

function openWS() {
  WS.classList.add("active");
  FAB.style.display = "none";
  OPBTN.style.display = "none";
}
function closeWS() {
  WS.classList.remove("active");
  if (tiles.length) {
    FAB.style.display = "flex";
    OPBTN.style.display = "flex";
  }
}

document.getElementById("btn-exit").addEventListener("click", closeWS);
FAB.addEventListener("click", openWS);
OPBTN.addEventListener("click", openWS);

/* ── Tiling layout ──────────────────────────────────── */
let splitCols = 0;
let splitRows = 0;
let colFracs = [];
let rowFracs = [];

function ensureSplitFracs(n) {
  const cols = n <= 2 ? n : n <= 4 ? 2 : n <= 6 ? 3 : Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  if (cols !== splitCols || rows !== splitRows) {
    splitCols = cols;
    splitRows = rows;
    colFracs = Array.from({ length: cols }, () => 1 / cols);
    rowFracs = Array.from({ length: rows }, () => 1 / rows);
  }
}

let fitTimer = null;
function scheduleAllFits() {
  clearTimeout(fitTimer);
  fitTimer = setTimeout(
    () =>
      tiles.forEach((t) => {
        try {
          t.fit.fit();
        } catch {}
      }),
    60,
  );
}

function applyLayout() {
  const tw = ROOT.offsetWidth;
  const th = ROOT.offsetHeight;
  if (!tw || !th) return;
  const n = tiles.length;
  if (!n) {
    renderResizers();
    return;
  }
  ensureSplitFracs(n);

  const cols = splitCols;
  const rows = splitRows;

  let cx = 0;
  const cumCols = [0];
  colFracs.forEach((f) => {
    cx += f;
    cumCols.push(cx);
  });
  let cy = 0;
  const cumRows = [0];
  rowFracs.forEach((f) => {
    cy += f;
    cumRows.push(cy);
  });

  tiles.forEach((t, i) => {
    if (t.fullscreen) return;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const tir = Math.min(cols, n - row * cols);
    let x, w;
    if (tir < cols) {
      x = col / tir;
      w = 1 / tir;
    } else {
      x = cumCols[col];
      w = colFracs[col];
    }
    const y = cumRows[row];
    const h = rowFracs[row];
    Object.assign(t.el.style, {
      left: Math.round(x * tw) + GAP + "px",
      top: Math.round(y * th) + GAP + "px",
      width: Math.round(w * tw) - GAP * 2 + "px",
      height: Math.round(h * th) - GAP * 2 + "px",
    });
  });
  scheduleAllFits();
  renderResizers();
}
window.addEventListener("resize", applyLayout);

/* ── Resizer handles ──────────────────────────────────── */
let resizeState = null;

function renderResizers() {
  ROOT.querySelectorAll(".tile-resizer").forEach((r) => r.remove());
  const n = tiles.length;
  if (n <= 1 || !splitCols) return;

  const tw = ROOT.offsetWidth;
  const th = ROOT.offsetHeight;
  const cols = splitCols;
  const rows = splitRows;

  let cx = 0;
  const cumCols = [0];
  colFracs.forEach((f) => {
    cx += f;
    cumCols.push(cx);
  });
  let cy = 0;
  const cumRows = [0];
  rowFracs.forEach((f) => {
    cy += f;
    cumRows.push(cy);
  });

  const lastRowCount = n - (rows - 1) * cols;
  const fullRowsCount = lastRowCount === cols ? rows : rows - 1;
  const fullRowsH = cumRows[fullRowsCount] * th;

  for (let i = 0; i < cols - 1; i++) {
    const x = Math.round(cumCols[i + 1] * tw);
    createResizer("v", x - 3, 0, 6, fullRowsH, i, null);
  }
  for (let j = 0; j < rows - 1; j++) {
    const y = Math.round(cumRows[j + 1] * th);
    createResizer("h", 0, y - 3, tw, 6, null, j);
  }
}

function createResizer(dir, left, top, width, height, colIdx, rowIdx) {
  const r = document.createElement("div");
  r.className = "tile-resizer tile-resizer-" + dir;
  Object.assign(r.style, {
    left: left + "px",
    top: top + "px",
    width: width + "px",
    height: height + "px",
  });
  r.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    startResize(e, dir, colIdx, rowIdx);
  });
  ROOT.appendChild(r);
}

function startResize(e, dir, colIdx, rowIdx) {
  resizeState = {
    dir,
    colIdx,
    rowIdx,
    startX: e.clientX,
    startY: e.clientY,
    startFracs: dir === "v" ? [...colFracs] : [...rowFracs],
    tw: ROOT.offsetWidth,
    th: ROOT.offsetHeight,
  };
  ROOT.classList.add("resizing");
  document.body.style.cursor = dir === "v" ? "col-resize" : "row-resize";
  document.body.style.userSelect = "none";
}

function handleResizeMove(e) {
  const { dir, colIdx, rowIdx, startX, startY, startFracs, tw, th } =
    resizeState;
  const MIN = 0.1;
  if (dir === "v") {
    const dx = (e.clientX - startX) / tw;
    const f = [...startFracs];
    const i = colIdx;
    const total = f[i] + f[i + 1];
    f[i] = Math.min(Math.max(f[i] + dx, MIN), total - MIN);
    f[i + 1] = total - f[i];
    colFracs = f;
  } else {
    const dy = (e.clientY - startY) / th;
    const f = [...startFracs];
    const j = rowIdx;
    const total = f[j] + f[j + 1];
    f[j] = Math.min(Math.max(f[j] + dy, MIN), total - MIN);
    f[j + 1] = total - f[j];
    rowFracs = f;
  }
  applyLayout();
}

/* ══════════════════════════════════════════════════════════
   OPEN TILE
══════════════════════════════════════════════════════════ */
function openTile(vps) {
  openWS();
  const id = ++wCount;
  const label = vps.server || vps.ip || `vps-${id}`;

  const SVG_FS = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
  const SVG_RST = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`;
  const SVG_X = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

  const el = document.createElement("div");
  el.className = "tile focused";
  el.id = `tile-${id}`;
  el.innerHTML = `
    <div class="tile-bar" id="tb-${id}">
      <div class="tile-dot" id="tdot-${id}"></div>
      <div class="tile-label">${label}<span class="tl-host"> — ${vps.ip}</span></div>
      <span class="swap-hint">drag to swap</span>
      <div class="tile-btns">
        <button class="tile-btn btn-fs"    id="fs-${id}">${SVG_FS}</button>
        <button class="tile-btn btn-close" id="cx-${id}">${SVG_X}</button>
      </div>
    </div>
    <div class="tile-body" id="body-${id}"></div>`;
  ROOT.appendChild(el);

  const term = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: "'IBM Plex Mono','Fira Code',monospace",
    scrollback: 5000,
    allowTransparency: true,
    overviewRulerWidth: 0,
    theme: buildXtermTheme(currentPalette),
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById(`body-${id}`));

  // Ctrl+Shift+C = copy selection, Ctrl+Shift+V = paste
  // Handler fires on keydown + keypress + keyup (3 times per keystroke).
  // We must: 1) only act on keydown, 2) preventDefault on ALL events to
  // stop the browser's native paste from also hitting xterm's hidden textarea.
  term.attachCustomKeyEventHandler((e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
      if (e.type === "keydown") {
        const sel = term.getSelection();
        if (sel) navigator.clipboard.writeText(sel).catch(() => {});
      }
      return false;
    }
    if (e.ctrlKey && e.shiftKey && e.key === "V") {
      e.preventDefault();
      if (e.type === "keydown") {
        navigator.clipboard
          .readText()
          .then((text) => {
            if (text) term.paste(text);
          })
          .catch(() => {});
      }
      return false;
    }
    return true;
  });

  // pill
  const pill = document.createElement("div");
  pill.className = "ws-pill active";
  pill.id = `pill-${id}`;
  pill.innerHTML = `<span class="pdot" id="pdot-${id}"></span>${label}`;
  pill.addEventListener("click", () => focusTile(id));
  PILLS.appendChild(pill);

  const entry = {
    id,
    el,
    term,
    fit,
    ws: null,
    pill,
    fullscreen: false,
    svgFs: SVG_FS,
    svgRst: SVG_RST,
  };
  tiles.push(entry);

  // wire buttons
  document.getElementById(`fs-${id}`).addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFS(id);
  });
  document.getElementById(`cx-${id}`).addEventListener("click", (e) => {
    e.stopPropagation();
    closeTile(id);
  });
  el.addEventListener("mousedown", () => focusTile(id));

  // drag-to-swap on titlebar
  document.getElementById(`tb-${id}`).addEventListener("mousedown", (e) => {
    if (e.target.closest(".tile-btn")) return;
    startSwapDrag(e, id);
  });

  applyLayout();
  focusTile(id);
  setTimeout(() => {
    fit.fit();
    connectSsh(entry, vps);
  }, 60);
}

/* ══════════════════════════════════════════════════════════
   DRAG-TO-SWAP
══════════════════════════════════════════════════════════ */
let swapState = null;

function startSwapDrag(e, id) {
  if (tiles.find((t) => t.id === id)?.fullscreen) return;
  swapState = { srcId: id, moved: false };
  document.body.style.userSelect = "none";
  document.getElementById(`tile-${id}`).classList.add("drag-src");
}

document.addEventListener("mousemove", (e) => {
  if (resizeState) {
    handleResizeMove(e);
    return;
  }
  if (!swapState) return;
  swapState.moved = true;
  // highlight potential drop target
  tiles.forEach((t) => t.el.classList.remove("drop-target"));
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const targetTile = el?.closest(".tile");
  if (targetTile && targetTile.id !== `tile-${swapState.srcId}`) {
    targetTile.classList.add("drop-target");
  }
});

document.addEventListener("mouseup", (e) => {
  if (resizeState) {
    resizeState = null;
    ROOT.classList.remove("resizing");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    return;
  }
  if (!swapState) return;
  const { srcId } = swapState;
  swapState = null;
  document.body.style.userSelect = "";

  const srcEl = document.getElementById(`tile-${srcId}`);
  srcEl?.classList.remove("drag-src");
  tiles.forEach((t) => t.el.classList.remove("drop-target"));

  const el = document.elementFromPoint(e.clientX, e.clientY);
  const targetEl = el?.closest(".tile");
  if (!targetEl || targetEl.id === `tile-${srcId}`) return;

  const targetId = +targetEl.id.replace("tile-", "");
  const si = tiles.findIndex((t) => t.id === srcId);
  const ti = tiles.findIndex((t) => t.id === targetId);
  if (si === -1 || ti === -1) return;

  // swap positions in array → layout engine re-tiles
  [tiles[si], tiles[ti]] = [tiles[ti], tiles[si]];
  applyLayout();
  showToast("Terminals swapped");
});

/* ══════════════════════════════════════════════════════════
   FOCUS / FULLSCREEN / CLOSE
══════════════════════════════════════════════════════════ */
function focusTile(id) {
  focused = id;
  tiles.forEach((t) => {
    const f = t.id === id;
    t.el.classList.toggle("focused", f);
    t.pill.classList.toggle("active", f);
  });
}

function toggleFS(id) {
  const entry = tiles.find((t) => t.id === id);
  if (!entry) return;
  entry.fullscreen = !entry.fullscreen;
  const tw = ROOT.offsetWidth;
  const th = ROOT.offsetHeight;
  if (entry.fullscreen) {
    Object.assign(entry.el.style, {
      left: "0",
      top: "0",
      width: tw + "px",
      height: th + "px",
      zIndex: "500",
    });
    document.getElementById(`fs-${id}`).innerHTML = entry.svgRst;
    document.getElementById(`fs-${id}`).classList.add("is-full");
  } else {
    entry.el.style.zIndex = "";
    document.getElementById(`fs-${id}`).innerHTML = entry.svgFs;
    document.getElementById(`fs-${id}`).classList.remove("is-full");
    applyLayout();
  }
  setTimeout(() => {
    try {
      entry.fit.fit();
    } catch {}
  }, 30);
}

function closeTile(id) {
  const entry = tiles.find((t) => t.id === id);
  if (!entry) return;
  try {
    entry.ws?.close();
  } catch {}
  entry.el.remove();
  entry.pill.remove();
  tiles = tiles.filter((t) => t.id !== id);
  applyLayout();
  if (!tiles.length) {
    closeWS();
    FAB.style.display = "none";
    OPBTN.style.display = "none";
    return;
  }
  if (focused === id) focusTile(tiles[tiles.length - 1].id);
}

/* ══════════════════════════════════════════════════════════
   SSH WEBSOCKET
══════════════════════════════════════════════════════════ */
function connectSsh(entry, vps) {
  const { term } = entry;
  const { cols, rows } = term;
  const url = `ws://localhost:5556/?user=${encodeURIComponent(vps.user)}&host=${encodeURIComponent(vps.ip)}&cols=${cols}&rows=${rows}`;
  const ws = new WebSocket(url);
  entry.ws = ws;

  term.writeln(
    `\x1b[2m  connecting \x1b[0m\x1b[36m${vps.user}@${vps.ip}\x1b[0m\x1b[2m…\x1b[0m`,
  );
  ws.onopen = () => {
    term.writeln("\x1b[32m  ✓ session open\x1b[0m\r\n");
    term.focus();
  };
  ws.onmessage = (ev) => {
    try {
      const m = JSON.parse(ev.data);
      if (m.type === "data") term.write(m.data);
      if (m.type === "error") term.writeln(`\r\n\x1b[31m  ✗ ${m.data}\x1b[0m`);
      if (m.type === "exit") {
        term.writeln(`\r\n\x1b[2m  [exit ${m.code}]\x1b[0m`);
        markDead(entry.id);
      }
    } catch {
      term.write(ev.data);
    }
  };
  ws.onerror = () => {
    term.writeln("\r\n\x1b[31m  ✗ backend unreachable\x1b[0m");
    markDead(entry.id);
  };
  ws.onclose = () => markDead(entry.id);
  term.onData((d) => {
    if (ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify({ type: "data", data: d }));
  });
  term.onResize(({ cols, rows }) => {
    if (ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify({ type: "resize", cols, rows }));
  });
}

function markDead(id) {
  [`tdot-${id}`, `pdot-${id}`].forEach((did) =>
    document.getElementById(did)?.classList.add("dead"),
  );
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
let toastTimer;
function showToast(msg) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t?.remove(), 2500);
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
loadCustomPalettes();
loadPalette();
getData();

/* ══════════════════════════════════════════════════════════
   WINDOW CONTROLS (Electron only)
══════════════════════════════════════════════════════════ */

// Apply the electron class so CSS can show window controls + drag region.
// IS_ELECTRON is already true only when window.electronAPI exists.
if (IS_ELECTRON) {
  document.body.classList.add("electron");
}

function updateMaximizeButton(isMaximized) {
  const maximizeBtn = document.getElementById("window-maximize");
  if (!maximizeBtn) return;
  if (isMaximized) {
    maximizeBtn.innerHTML = `<svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
      <path d="M1 3H0V9h6V8H1V3z"/>
      <path d="M3 0v6h6V0H3zm5 5H4V1h4v4z"/>
    </svg>`;
    maximizeBtn.title = "Restore";
  } else {
    maximizeBtn.innerHTML = `<svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
      <path d="M0 0v9h9V0H0zm8 8H1V1h7v7z"/>
    </svg>`;
    maximizeBtn.title = "Maximize";
  }
}

if (IS_ELECTRON) {
  // Wire up window control buttons
  document.getElementById("window-minimize")?.addEventListener("click", () => {
    window.electronAPI.minimizeWindow();
  });

  document.getElementById("window-maximize")?.addEventListener("click", () => {
    window.electronAPI.maximizeWindow();
  });

  document.getElementById("window-close")?.addEventListener("click", () => {
    window.electronAPI.closeWindow();
  });

  // Sync maximize button icon with actual window state
  window.electronAPI.isWindowMaximized().then(updateMaximizeButton);
  window.electronAPI.onWindowStateChange(updateMaximizeButton);
}
