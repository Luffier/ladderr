#!/usr/bin/env bash
# Install Ladderr Linux protocol handler.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}"
LADDERR_DIR="$DATA_DIR/ladderr"
APP_DIR="$DATA_DIR/applications"

mkdir -p "$LADDERR_DIR" "$APP_DIR"

install -m 755 "$SCRIPT_DIR/ladderr-handler.sh" "$LADDERR_DIR/ladderr-handler.sh"

# Write the .desktop entry
cat > "$APP_DIR/ladderr.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Ladderr Protocol Handler
Exec="$LADDERR_DIR/ladderr-handler.sh" %u
NoDisplay=true
MimeType=x-scheme-handler/ladderr-open;x-scheme-handler/ladderr-select;
EOF

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
else
    echo "ladderr: 'update-desktop-database' not found; skipping (install desktop-file-utils if schemes don't register)." >&2
fi

if command -v xdg-mime >/dev/null 2>&1; then
    xdg-mime default ladderr.desktop x-scheme-handler/ladderr-open  || \
        echo "ladderr: 'xdg-mime default' failed; schemes may not be registered." >&2
    xdg-mime default ladderr.desktop x-scheme-handler/ladderr-select || \
        echo "ladderr: 'xdg-mime default' failed; schemes may not be registered." >&2
else
    echo "ladderr: 'xdg-mime' not found; could not set default handler. Install xdg-utils." >&2
fi

echo "Ladderr Linux handler installed to $LADDERR_DIR"
