#!/usr/bin/env bash
# install-desktop.sh
# Installs FWORD SSH AppImage so it shows in the app launcher and can be
# pinned to the GNOME / KDE / XFCE dock.
#
# Usage:  bash install-desktop.sh [path/to/FWORD-SSH.AppImage]
# If the AppImage path is omitted the script looks in dist/ automatically.

set -e

# macOS: DMG is self-contained, user installs it manually
if [[ "$(uname)" == "Darwin" ]]; then
  echo "On macOS, open dist/FWORD\ SSH-*.dmg and drag the app to /Applications."
  exit 0
fi

APPIMAGE="${1:-$(ls -t "$(dirname "$0")/dist/"*AppImage 2>/dev/null | head -1)}"

if [[ -z "$APPIMAGE" || ! -f "$APPIMAGE" ]]; then
  echo "ERROR: AppImage not found. Run  bash build.sh  first, or pass the path as an argument."
  exit 1
fi

INSTALL_DIR="$HOME/.local/bin"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
DESKTOP_DIR="$HOME/.local/share/applications"

mkdir -p "$INSTALL_DIR" "$ICON_DIR" "$DESKTOP_DIR"

# Capture the absolute repo path now, at install time.
# This is stored in the .desktop Exec= line so the app always reads
# content.json from the live repo directory on every launch.
REPO_DATA_DIR="$(realpath "$(dirname "$0")/assets/json")"

# ── Copy AppImage ──────────────────────────────────────────────────
DEST="$INSTALL_DIR/fwordssh.AppImage"
cp -f "$APPIMAGE" "$DEST"
chmod +x "$DEST"
echo "✔  AppImage installed to $DEST"

# ── Copy icon ──────────────────────────────────────────────────────
ICON_SRC="$(dirname "$0")/assets/img/icon.png"
ICON_DEST="$ICON_DIR/fwordssh.png"
cp -f "$ICON_SRC" "$ICON_DEST"
echo "✔  Icon installed to $ICON_DEST"

# ── Write .desktop file ────────────────────────────────────────────
DESKTOP_FILE="$DESKTOP_DIR/fwordssh.desktop"
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=FWORD SSH
Comment=Your local SSH manager
Exec=env FWORDSSH_DATA_DIR=$REPO_DATA_DIR $DEST
Icon=fwordssh
Type=Application
Categories=Network;RemoteAccess;Utility;
StartupWMClass=fwordssh
Terminal=false
EOF

chmod +x "$DESKTOP_FILE"
echo "✔  Desktop entry written to $DESKTOP_FILE"

# ── Refresh desktop database & icon cache ─────────────────────────
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

echo ""
echo "Done! You can now:"
echo "  • Search for 'FWORD SSH' in your app launcher"
echo "  • Right-click it in the launcher → Pin to Dock / Add to Favourites"
echo ""
echo "To update your server list: edit assets/json/content.json — the app reloads automatically."
