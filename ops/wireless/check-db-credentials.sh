#!/bin/bash
# Verifies every Wireless service can log into Postgres with the credentials
# it is actually running with — read from the container's own environment,
# not from .env — over the docker network, exactly as the service connects.
#
# Why: on ~2026-09-01 supabase_admin's password was reset by hand during a
# manual migration. wireless-storage kept serving from connections it
# already held, then failed every photo upload with a 500 once it needed
# new ones. Nothing noticed for weeks. Connections to 127.0.0.1 *inside*
# wireless-db are trusted (any password works), so a psql there proves
# nothing — this script never uses that path.
#
# Usage: check-db-credentials.sh [container ...]   (default: all)
# Exit 0 = all OK. Prints one line per check; never prints secrets.
set -uo pipefail

DB_CONTAINER=wireless-db
DEFAULT_CONTAINERS=(wireless-storage wireless-rest wireless-auth wireless-realtime wireless-meta)
containers=("$@")
[ ${#containers[@]} -eq 0 ] && containers=("${DEFAULT_CONTAINERS[@]}")

db_ip=$(docker inspect "$DB_CONTAINER" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' 2>/dev/null | awk '{print $1}')
if [ -z "$db_ip" ]; then
  echo "FAIL $DB_CONTAINER: not running / no network address"
  exit 1
fi

container_env() { docker inspect "$1" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null; }
env_value() { printf '%s\n' "$1" | grep -m1 "^$2=" | cut -d= -f2-; }

# user|password from a postgres:// URL. The password is everything between
# the first ':' after the user and the LAST '@' (compose substitutes it
# raw, so it may itself contain '@', ':' or '/').
parse_url() {
  local rest=${1#*://}
  local creds=${rest%@*}
  printf '%s|%s' "${creds%%:*}" "${creds#*:}"
}

credentials_for() {
  local env url
  env=$(container_env "$1") || return 1
  for var in DATABASE_URL PGRST_DB_URI GOTRUE_DB_DATABASE_URL; do
    url=$(env_value "$env" "$var")
    if [ -n "$url" ]; then parse_url "$url"; return 0; fi
  done
  # realtime / postgres-meta use discrete variables instead of a URL.
  local user pass
  user=$(env_value "$env" DB_USER); pass=$(env_value "$env" DB_PASSWORD)
  [ -z "$user" ] && { user=$(env_value "$env" PG_META_DB_USER); pass=$(env_value "$env" PG_META_DB_PASSWORD); }
  [ -n "$user" ] || return 1
  printf '%s|%s' "$user" "$pass"
}

status=0
for c in "${containers[@]}"; do
  creds=$(credentials_for "$c") || { echo "FAIL $c: no database credentials found in its environment"; status=1; continue; }
  user=${creds%%|*}; pass=${creds#*|}
  if out=$(docker exec -e PGPASSWORD="$pass" -e PGCONNECT_TIMEOUT=5 "$DB_CONTAINER" \
        psql -h "$db_ip" -U "$user" -d postgres -Atc 'select 1' 2>&1); then
    echo "OK   $c: logs in as $user"
  else
    echo "FAIL $c: cannot log in as $user — $(printf '%s' "$out" | tail -1 | sed -E 's/^psql: error: //' | cut -c1-160)"
    status=1
  fi
done
exit $status
