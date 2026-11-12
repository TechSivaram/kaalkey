#!/bin/sh
set -eu

APP_ID="com.techsivaram.kaalkey"
METAINFO_DIR="/usr/share/metainfo"
METAINFO_FILE="${APP_ID}.metainfo.xml"

# electron-builder installs the application under /opt/<productName>.
# Resolve the bundled metainfo from the known product installation path.
SOURCE="/opt/KaalKey Authenticator/resources/metainfo/${METAINFO_FILE}"

if [ -f "$SOURCE" ]; then
    install -d -m 0755 "$METAINFO_DIR"
    install -m 0644 "$SOURCE" "${METAINFO_DIR}/${METAINFO_FILE}"
    if command -v appstreamcli >/dev/null 2>&1; then
        appstreamcli validate "${METAINFO_DIR}/${METAINFO_FILE}" || true
    fi
else
    echo "KaalKey AppStream metadata not found at: $SOURCE" >&2
fi

exit 0
