#!/usr/bin/env bash
set -euo pipefail

umask 077
if [[ -e .env || -e kong.yml ]]; then
  echo "Refusing to overwrite existing staging secrets." >&2
  exit 1
fi

b64url() {
  openssl base64 -A | tr '+/' '-_' | tr -d '='
}

sign_jwt() {
  local role="$1"
  local header payload unsigned signature
  header="$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | b64url)"
  payload="$(printf '{"role":"%s","iss":"supabase","iat":1700000000,"exp":2147483647}' "$role" | b64url)"
  unsigned="${header}.${payload}"
  signature="$(printf '%s' "$unsigned" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | b64url)"
  printf '%s.%s' "$unsigned" "$signature"
}

# This value is embedded in PostgreSQL connection URIs. Hex avoids reserved URI
# characters without relying on every consuming service to encode it identically.
POSTGRES_PASSWORD="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 32)"
ANON_KEY="$(sign_jwt anon)"
SERVICE_ROLE_KEY="$(sign_jwt service_role)"
PAYSTACK_RECONCILE_SECRET="$(openssl rand -hex 32)"

{
  printf 'POSTGRES_PASSWORD=%s\n' "$POSTGRES_PASSWORD"
  printf 'JWT_SECRET=%s\n' "$JWT_SECRET"
  printf 'ANON_KEY=%s\n' "$ANON_KEY"
  printf 'SERVICE_ROLE_KEY=%s\n' "$SERVICE_ROLE_KEY"
  printf 'PAYSTACK_RECONCILE_SECRET=%s\n' "$PAYSTACK_RECONCILE_SECRET"
  printf 'PAYSTACK_SECRET_KEY=\n'
} > .env

sed \
  -e "s|__ANON_KEY__|${ANON_KEY}|g" \
  -e "s|__SERVICE_ROLE_KEY__|${SERVICE_ROLE_KEY}|g" \
  kong.yml.template > kong.yml

chmod 600 .env
# The parent staging directory is mode 750. Kong runs as a non-root container
# user and needs to read this bind-mounted file; the service-role JWT remains
# unreachable to non-members on the host because they cannot traverse the parent.
chmod 644 kong.yml
echo "Generated isolated staging credentials. PAYSTACK_SECRET_KEY remains unset."
