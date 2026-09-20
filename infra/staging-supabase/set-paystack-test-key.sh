#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Staging .env was not found at $ENV_FILE." >&2
  exit 1
fi

while true; do
  if ! read -r -s -p "Enter the Paystack test secret key (sk_test_...; Ctrl+C to cancel): " paystack_key; then
    printf '\n'
    exit 1
  fi
  printf '\n'
  if [[ "$paystack_key" =~ ^sk_test_[A-Za-z0-9]+$ ]]; then
    break
  fi
  unset paystack_key
  echo "That was empty or invalid. The prompt remains active; do not paste the key at a shell prompt." >&2
done

temporary="$(mktemp "$SCRIPT_DIR/.env.XXXXXX")"
trap 'rm -f "$temporary"' EXIT
found=false

while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ "$line" == PAYSTACK_SECRET_KEY=* ]]; then
    printf 'PAYSTACK_SECRET_KEY=%s\n' "$paystack_key" >> "$temporary"
    found=true
  else
    printf '%s\n' "$line" >> "$temporary"
  fi
done < "$ENV_FILE"

if [[ "$found" == false ]]; then
  printf 'PAYSTACK_SECRET_KEY=%s\n' "$paystack_key" >> "$temporary"
fi

chmod 600 "$temporary"
mv "$temporary" "$ENV_FILE"
trap - EXIT
unset paystack_key

cd "$SCRIPT_DIR"
docker compose up -d --force-recreate functions
echo "Paystack test key installed and staging functions restarted. The key was not displayed."
