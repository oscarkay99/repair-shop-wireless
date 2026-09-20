#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/run-paystack-reconciliation.sh"
MARKER='# wireless-staging-paystack-reconciliation'
ENTRY="*/5 * * * * $RUNNER $MARKER"

if [[ ! -x "$RUNNER" ]]; then
  echo "Reconciliation runner is missing or is not executable: $RUNNER" >&2
  exit 1
fi

existing="$(crontab -l 2>/dev/null || true)"
{
  printf '%s\n' "$existing" | grep -Fv "$MARKER" || true
  printf '%s\n' "$ENTRY"
} | sed '/^[[:space:]]*$/d' | crontab -

echo "Installed staging Paystack reconciliation every five minutes."
