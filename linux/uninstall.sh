#!/usr/bin/env bash
# Remove Ladderr Linux protocol handler.
set -euo pipefail

DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}"
LADDERR_DIR="$DATA_DIR/ladderr"
APP_DIR="$DATA_DIR/applications"

rm -f "$APP_DIR/ladderr.desktop"
rm -rf "$LADDERR_DIR"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi

echo "Ladderr Linux handler removed."
