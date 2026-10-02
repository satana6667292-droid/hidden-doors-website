#!/usr/bin/env bash
set -euo pipefail

WORKTREE_ROOT="$(pwd)"

CATALOG_REPO="${CATALOG_REPO:-https://github.com/satana6667292-droid/hidden-doors-catalog-2026.git}"
CATALOG_REF="${CATALOG_REF:-main}"
DEST="${CATALOG_DEST:-site/catalog}"
# Catalog public master: master21

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "Building Hidden Doors catalog from $CATALOG_REPO@$CATALOG_REF -> $DEST"

git clone --depth 1 --branch "$CATALOG_REF" "$CATALOG_REPO" "$tmp/catalog"
cd "$tmp/catalog"

cat bundle/site-bundle.part* > "$tmp/site-bundle.zip"
mkdir -p "$tmp/unpacked" "$tmp/catalog-site"
unzip -q "$tmp/site-bundle.zip" -d "$tmp/unpacked"
cp -a "$tmp/unpacked/hidden-doors-catalog-2026-site/." "$tmp/catalog-site/"

# Approved/corrected catalog page assets.
for n in 002 003 004 005 028 032; do
  cat page-overrides/page-${n}.b64.part* | base64 -d > "$tmp/page-${n}.webp"
  cp "$tmp/page-${n}.webp" "$tmp/catalog-site/assets/pages/page-${n}.webp"
  cp "$tmp/page-${n}.webp" "$tmp/catalog-site/assets/thumbs/page-${n}.webp"
done

# Bake the approved FOLIO MASTER v1 directly into generated raster assets.
# This removes all historical embedded numbers first, then writes exactly one final folio.
if ! python3 -c "import PIL" >/dev/null 2>&1; then
  python3 -m pip install --quiet --user Pillow
fi
python3 "$tmp/catalog/scripts/bake_folio_master.py" \
  --site "$tmp/catalog-site" \
  --font "$WORKTREE_ROOT/site/assets/manrope-600.ttf"

# The original catalog app is internal editor only.
cp "$tmp/catalog-site/index.html" "$tmp/catalog-site/editor.html"
cp catalog-master.js editor-pre.js editor-v4.js editor-media.js visual-fixes.js resolved-corrections.js public-view.js public-view.css public-index.html "$tmp/catalog-site/"

python3 - "$tmp/catalog-site/editor.html" "$tmp/catalog-site/index.html" <<'PY'
from pathlib import Path
import sys

editor=Path(sys.argv[1])
public=Path(sys.argv[2])

s=editor.read_text(encoding="utf-8")
needle='<script src="app.js"></script>'
inject='''<script src="catalog-master.js?v=master12"></script>
  <script src="editor-pre.js?v=master12"></script>
  <script src="app.js"></script>
  <script src="resolved-corrections.js?v=master12"></script>
  <script src="editor-v4.js?v=master12"></script>
  <script src="editor-media.js?v=master12"></script>
  <script src="visual-fixes.js?v=master12"></script>'''
if needle not in s:
    raise SystemExit("Catalog editor: app.js script tag not found")
editor.write_text(s.replace(needle,inject,1),encoding="utf-8")
public.write_text(Path("public-index.html").read_text(encoding="utf-8"),encoding="utf-8")
PY

cd - >/dev/null
rm -rf "$DEST"
mkdir -p "$DEST"
cp -a "$tmp/catalog-site/." "$DEST/"
rm -f "$DEST/CNAME"

test -s "$DEST/index.html"
test -s "$DEST/editor.html"
test -s "$DEST/catalog-master.js"
test -s "$DEST/public-view.js"
test -s "$DEST/assets/pages/page-032.webp"

echo "Catalog ready: $DEST"
