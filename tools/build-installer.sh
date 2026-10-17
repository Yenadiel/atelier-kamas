#!/usr/bin/env bash
# Construit dist/AtelierKamas-Installation.zip (≈ 8 Mo) : l'installateur Windows télécharge Electron lui-même.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=dist/AtelierKamas
rm -rf dist && mkdir -p "$OUT/app"
cp app/main.js app/preload.js app/package.json app/icon.png app/icon.ico "$OUT/app/"
cp -r web "$OUT/app/web" && rm -f "$OUT/app/web/index.artifact.html"
cp installer/* "$OUT/"
(cd dist && zip -qr -9 AtelierKamas-Installation.zip AtelierKamas)
ls -la dist/AtelierKamas-Installation.zip
