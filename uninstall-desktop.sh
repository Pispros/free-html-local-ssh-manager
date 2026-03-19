#!/usr/bin/env bash
# uninstall-desktop.sh
# Removes the FWORD SSH desktop integration installed by install-desktop.sh.
# Does NOT delete your server list (content.json in ~/.config/FWORD SSH/).

set -e

# macOS: nothing to uninstall via this script
if [[ "$(uname)" == "Darwin" ]]; then
  echo "On macOS, drag FWORD SSH.app out of /Applications to uninstall."
  exit 0
fi

INSTALL_DIR="$HOME/.local/bin"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
DESKTOP_DIR="$HOME/.local/share/applications"

removed=0

if [[ -f "$INSTALL_DIR/fwordssh.AppImage" ]]; then
  rm -f "$INSTALL_DIR/fwordssh.AppImage"
  echo "✔  Removed $INSTALL_DIR/fwordssh.AppImage"
  removed=1
fi

if [[ -f "$ICON_DIR/fwordssh.png" ]]; then
  rm -f "$ICON_DIR/fwordssh.png"
  echo "✔  Removed $ICON_DIR/fwordssh.png"
  removed=1
fi

if [[ -f "$DESKTOP_DIR/fwordssh.desktop" ]]; then
  rm -f "$DESKTOP_DIR/fwordssh.desktop"
  echo "✔  Removed $DESKTOP_DIR/fwordssh.desktop"
  removed=1
fi

if [[ $removed -eq 0 ]]; then
  echo "Nothing to remove – FWORD SSH does not appear to be installed."
  exit 0
fi

# Refresh desktop database & icon cache
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

echo ""
echo "FWORD SSH has been uninstalled."

DATA_DIR="$HOME/.config/FWORD SSH"
if [[ -d "$DATA_DIR" ]]; then
  read -r -p "Remove server data ($DATA_DIR)? [y/N] " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    rm -rf "$DATA_DIR"
    echo "✔  Removed $DATA_DIR"
  else
    echo "Server data kept at: $DATA_DIR"
  fi
fi
