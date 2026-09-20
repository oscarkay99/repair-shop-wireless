#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET=/etc/nginx/sites-available/wireless
SNIPPET=/etc/nginx/snippets/wireless-staging-location.conf
INCLUDE_LINE='    include /etc/nginx/snippets/wireless-staging-location.conf;'

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this installer through sudo." >&2
  exit 1
fi

if [[ ! -f "$TARGET" ]]; then
  echo "Wireless nginx site was not found at $TARGET." >&2
  exit 1
fi

install -m 0644 "$SOURCE_DIR/nginx-staging-location.conf" "$SNIPPET"

backup=''
if ! grep -Fq "$INCLUDE_LINE" "$TARGET"; then
  backup="${TARGET}.pre-staging-$(date -u +%Y%m%dT%H%M%SZ)"
  temporary="$(mktemp)"
  cp -a "$TARGET" "$backup"
  trap 'rm -f "$temporary"' EXIT

  awk -v include_line="$INCLUDE_LINE" '
    !inserted && $0 ~ /^[[:space:]]*server_name api[.]wirelesscares[.]com;/ {
      print
      print ""
      print include_line
      inserted = 1
      next
    }
    { print }
    END { if (!inserted) exit 2 }
  ' "$TARGET" > "$temporary"

  install -m 0644 "$temporary" "$TARGET"
fi

if ! nginx -t; then
  if [[ -n "$backup" ]]; then
    cp -a "$backup" "$TARGET"
    nginx -t
  fi
  echo "nginx validation failed; the previous site configuration was restored." >&2
  exit 1
fi

systemctl reload nginx
echo "Installed and reloaded the isolated /staging/ API route."
