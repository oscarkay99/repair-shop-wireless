#!/bin/bash
# The only supported way to apply a migration to Wireless production.
# Run from the repo root on your own machine.
#
#   ops/wireless/apply-migration.sh supabase/migrations/<file>.sql
#   ops/wireless/apply-migration.sh --status          # repo vs production
#   ops/wireless/apply-migration.sh --baseline <file> # record a migration that
#                                                     # was applied before the
#                                                     # ledger existed
#
# What it does for an apply:
#   1. refuses if the file is already recorded in wireless.schema_migrations
#   2. runs the nightly backup script first (encrypted, copied offsite)
#   3. applies the file with ON_ERROR_STOP, then records filename + sha256
#
# It connects inside wireless-db via 127.0.0.1 with the password from
# .env, so it never prompts for a password. Never "fix" a password prompt
# by running ALTER ROLE ... PASSWORD: that is what broke photo uploads in
# September 2026 (see ops/README.md).
set -euo pipefail

HOST=root@187.127.233.218
KEY="${WIRELESS_SSH_KEY:-$HOME/.ssh/wireless_migration/id_ed25519}"
SSH=(ssh -i "$KEY" -o BatchMode=yes "$HOST")
MIGRATIONS_DIR=supabase/migrations

# Runs SQL from stdin on production as supabase_admin; extra args go to psql.
remote_psql() {
  "${SSH[@]}" 'cd /opt/wireless/supabase && PW=$(grep -E "^POSTGRES_PASSWORD=" .env | cut -d= -f2-) && docker exec -i -e PGPASSWORD="$PW" wireless-db psql -U supabase_admin -h 127.0.0.1 -d postgres -v ON_ERROR_STOP=1 '"$*"
}

ledger_has_table() {
  [ "$(echo "select to_regclass('wireless.schema_migrations') is not null;" | remote_psql -At)" = "t" ]
}

applied_list() {
  ledger_has_table || return 0
  echo "select filename from wireless.schema_migrations order by 1;" | remote_psql -At
}

record() { # record <filename> <sha256> <source>
  printf "insert into wireless.schema_migrations (filename, sha256, applied_by, source) values (:'f', :'s', :'b', :'src') on conflict (filename) do nothing;\n" \
    | remote_psql -q -v "f=$1" -v "s=$2" -v "b=$(git config user.email || whoami)" -v "src=$3"
}

sha() { shasum -a 256 "$1" | cut -d' ' -f1; }

case "${1:-}" in
  --status)
    ledger_has_table || { echo "wireless.schema_migrations does not exist yet — apply 20260926010000_migration_ledger_and_media_delete.sql first."; exit 1; }
    applied=$(applied_list)
    missing=0
    for f in "$MIGRATIONS_DIR"/*.sql; do
      name=$(basename "$f")
      if ! grep -qxF "$name" <<<"$applied"; then echo "NOT RECORDED  $name"; missing=$((missing+1)); fi
    done
    echo "$missing migration(s) in the repo are not recorded as applied in production."
    [ $missing -eq 0 ]
    ;;
  --baseline)
    f="${2:?usage: --baseline <file>}"; name=$(basename "$f")
    ledger_has_table || { echo "Ledger table missing." >&2; exit 1; }
    record "$name" "$(sha "$f")" baseline
    echo "Recorded $name as baseline (applied before the ledger existed)."
    ;;
  ""|-h|--help)
    sed -n '2,20p' "$0"; exit 0
    ;;
  *)
    f="$1"; name=$(basename "$f")
    [ -f "$f" ] || { echo "No such file: $f" >&2; exit 1; }
    if grep -qxF "$name" <<<"$(applied_list)"; then
      echo "$name is already recorded as applied. Refusing to re-apply." >&2; exit 1
    fi
    echo "==> Backing up production"
    "${SSH[@]}" /opt/wireless/scripts/backup-db.sh
    echo "==> Applying $name"
    remote_psql < "$f"
    if ledger_has_table; then
      record "$name" "$(sha "$f")" applied
      echo "==> Recorded $name in wireless.schema_migrations"
    else
      echo "WARNING: ledger table missing; $name applied but not recorded." >&2
    fi
    ;;
esac
