#!/usr/bin/env bash
set -euo pipefail

CATALOG_REPO="${CATALOG_REPO:-https://github.com/satana6667292-droid/hidden-doors-catalog-2026.git}"
CATALOG_REF="${CATALOG_REF:-main}"
DEST="${CATALOG_DEST:-site/catalog}"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "Building Hidden Doors catalog from $CATALOG_REPO@$CATALOG_REF -> $DEST"

git clone --depth 1 --branch "$CATALOG_REF" "$CATALOG_REPO" "$tmp/catalog"

cd "$tmp/catalog"

cat bundle/site-bundle.part* > "$tmp/site-bundle.zip"
mkdir -p "$tmp/unpacked" "$tmp/catalog-site"
unzip -q "$tmp/site-bundle.zip" -d "$tmp/unpacked"
cp -a "$tmp/unpacked/hidden-doors-catalog-2026-site/." "$tmp/catalog-site/"

# Approved/corrected catalog page overrides.
for n in 002 003 028; do
  cat page-overrides/page-${n}.b64.part* | base64 -d > "$tmp/page-${n}.webp"
  cp "$tmp/page-${n}.webp" "$tmp/catalog-site/assets/pages/page-${n}.webp"
  cp "$tmp/page-${n}.webp" "$tmp/catalog-site/assets/thumbs/page-${n}.webp"
done

cp editor-pre.js editor-v4.js editor-media.js visual-fixes.js resolved-corrections.js public-view.js public-view.css "$tmp/catalog-site/"

python3 - "$tmp/catalog-site/index.html" <<'PY'
from pathlib import Path
import sys

p=Path(sys.argv[1])
s=p.read_text(encoding="utf-8")
needle='<script src="app.js"></script>'
inject='''<script src="editor-pre.js?v=site-master-2"></script>
  <script src="app.js"></script>
  <script src="resolved-corrections.js?v=site-master-2"></script>
  <script src="editor-v4.js?v=site-master-2"></script>
  <script src="editor-media.js?v=site-master-2"></script>
  <link rel="stylesheet" href="public-view.css?v=site-public-2">
  <script src="public-view.js?v=site-public-2"></script>
  <script src="visual-fixes.js?v=site-master-2"></script>'''
if needle not in s:
    raise SystemExit("Catalog index: app.js script tag not found")
s=s.replace(needle, inject, 1)

# The catalog is designed to live on the main Hidden Doors site under /catalog/.
# Relative assets continue to work both on preview and production.
s=s.replace(
    '<title>Hidden Doors — Каталог 2026</title>',
    '<title>Каталог Hidden Doors 2026 — двери 36, 42 и 59 мм</title>'
)
p.write_text(s,encoding="utf-8")
PY

cd - >/dev/null
rm -rf "$DEST"
mkdir -p "$DEST"
cp -a "$tmp/catalog-site/." "$DEST/"
rm -f "$DEST/CNAME"

test -s "$DEST/index.html"
test -s "$DEST/app.js"
test -d "$DEST/assets/pages"

echo "Catalog ready: $DEST"
