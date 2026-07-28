#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFO_PLIST="$ROOT_DIR/ios/App/App/Info.plist"
APPICON_DIR="$ROOT_DIR/ios/App/App/Assets.xcassets/AppIcon.appiconset"
ICON_SOURCE="$ROOT_DIR/.build/AppIcon-1024.png"
ICON_GENERATOR="$ROOT_DIR/scripts/generate-ios-icon.py"
CONTENTS_JSON="$APPICON_DIR/Contents.json"

if [ ! -f "$INFO_PLIST" ]; then
  echo "ERROR: Missing generated Info.plist: $INFO_PLIST"
  exit 1
fi

set_or_add_string() {
  local key="$1"
  local value="$2"
  /usr/libexec/PlistBuddy -c "Set :$key $value" "$INFO_PLIST" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :$key string $value" "$INFO_PLIST"
}

set_or_add_bool() {
  local key="$1"
  local value="$2"
  /usr/libexec/PlistBuddy -c "Set :$key $value" "$INFO_PLIST" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :$key bool $value" "$INFO_PLIST"
}

set_or_add_string CFBundleDisplayName "Cliff Crash Crew"
set_or_add_string CFBundleName "Cliff Crash Crew"
set_or_add_bool ITSAppUsesNonExemptEncryption false
set_or_add_bool UIRequiresFullScreen true

/usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations" "$INFO_PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations array" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait" "$INFO_PLIST"

/usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations~ipad" "$INFO_PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations~ipad array" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations~ipad:0 string UIInterfaceOrientationPortrait" "$INFO_PLIST"

mkdir -p "$ROOT_DIR/.build"
python3 "$ICON_GENERATOR" "$ICON_SOURCE"

if [ ! -s "$ICON_SOURCE" ]; then
  echo "ERROR: Native app icon generation failed: $ICON_SOURCE"
  exit 1
fi

mkdir -p "$APPICON_DIR"
rm -f "$APPICON_DIR"/*.png
cp "$ICON_SOURCE" "$APPICON_DIR/AppIcon-1024.png"

# Generate the asset-catalog manifest with Python's JSON serializer so it is
# guaranteed to use valid JSON quoting and UTF-8 encoding on Codemagic macOS.
python3 - "$CONTENTS_JSON" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
manifest = {
    "images": [
        {
            "filename": "AppIcon-1024.png",
            "idiom": "universal",
            "platform": "ios",
            "size": "1024x1024",
        }
    ],
    "info": {
        "author": "xcode",
        "version": 1,
    },
}
path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

# Parse it immediately so this step fails here with a clear message rather
# than later during the Xcode archive.
with path.open("r", encoding="utf-8") as handle:
    json.load(handle)
print(f"{path}: JSON OK")
PY

plutil -lint "$INFO_PLIST"
python3 -m json.tool "$CONTENTS_JSON" >/dev/null

echo "Configured Cliff Crash Crew iOS metadata and app icon."