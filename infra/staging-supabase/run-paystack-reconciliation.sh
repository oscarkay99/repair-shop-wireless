#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  logger -t wireless-staging-paystack "Reconciliation skipped: staging .env is missing."
  exit 1
fi

reconcile_secret="$(awk -F= '$1 == "PAYSTACK_RECONCILE_SECRET" { print substr($0, index($0, "=") + 1); exit }' "$ENV_FILE")"
if [[ ! "$reconcile_secret" =~ ^[a-f0-9]{64}$ ]]; then
  logger -t wireless-staging-paystack "Reconciliation skipped: secret is missing or invalid."
  exit 1
fi

if ! curl --silent --show-error --fail \
  --connect-timeout 5 --max-time 50 \
  --request POST \
  --header "x-reconcile-secret: $reconcile_secret" \
  --output /dev/null \
  http://127.0.0.1:8100/functions/v1/paystack-reconcile; then
  logger -t wireless-staging-paystack "Reconciliation request failed."
  exit 1
fi
