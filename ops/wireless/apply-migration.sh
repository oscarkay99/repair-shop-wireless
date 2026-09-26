#!/bin/bash
# The only supported way to apply a migration to Wireless production.
# Run from the repo root on your own machine.
#
#   ops/wireless/apply-migration.sh supabase/migrations/<file>.sql
#   ops/wireless/apply-migration.sh --dry-run <file>  # apply + check, then roll back
#   ops/wireless/apply-migration.sh --status          # repo vs production
#   ops/wireless/apply-migration.sh --check           # run the DB checks only
#   ops/wireless/apply-migration.sh --baseline <file> # record a migration that
#                                                     # was applied before the
#                                                     # ledger existed
#   ops/wireless/apply-migration.sh --no-transaction <file>
#                         # only for statements Postgres can't run in a
#                         # transaction (e.g. CREATE INDEX CONCURRENTLY)
#
# An apply is all-or-nothing: in ONE transaction it applies the file,
# records it in wireless.schema_migrations, and runs ops/wireless/db-checks.sql
# (static check of every PL/pgSQL function + a smoke test as each staff
# role). It commits only if every check passes; otherwise nothing changes.
# That would have stopped the Sept 2026 migration that broke the
# notification bell for all non-admin staff.
#
# It connects inside wireless-db via 127.0.0.1 with the password from .env,
# so it never prompts for a password. Never "fix" a password prompt by
# running ALTER ROLE ... PASSWORD: that is what broke photo uploads in
# September 2026 (see ops/README.md).
set -euo pipefail

HOST=root@187.127.233.218
KEY="${WIRELESS_SSH_KEY:-$HOME/.ssh/wireless_migration/id_ed25519}"
SSH=(ssh -i "$KEY" -o BatchMode=yes "$HOST")
MIGRATIONS_DIR=supabase/migrations
CHECKS=ops/wireless/db-checks.sql

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

sha() { shasum -a 256 "$1" | cut -d' ' -f1; }
applier() { git config user.email || whoami; }

# SQL literal: wrap in single quotes, doubling any inside.
lit() { printf "'%s'" "${1//\'/\'\'}"; }

ledger_insert() { # <filename> <sha256> <source>
  echo "insert into wireless.schema_migrations (filename, sha256, applied_by, source) values ($(lit "$1"), $(lit "$2"), $(lit "$(applier)"), $(lit "$3")) on conflict (filename) do nothing;"
}

# The migration body without its own top-level BEGIN;/COMMIT; lines, so it
# runs inside our single transaction instead of committing early.
migration_body() {
  awk 'tolower($0) !~ /^[ \t]*(begin|commit)[ \t]*;[ \t]*$/' "$1"
}

# checks_block: savepoint, run the checks, roll back to the savepoint, so
# the checks leave nothing behind (plpgsql_check isn't left installed).
checks_block() {
  echo "savepoint pre_checks;"
  cat "$CHECKS"
  echo "rollback to savepoint pre_checks;"
}

require_file() {
  [ -f "$1" ] || { echo "No such file: $1" >&2; exit 1; }
  if grep -qxF "$(basename "$1")" <<<"$(applied_list)"; then
    echo "$(basename "$1") is already recorded as applied. Refusing to re-apply." >&2; exit 1
  fi
}

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
  --check)
    { echo "begin;"; cat "$CHECKS"; echo "rollback;"; } | remote_psql -q
    ;;
  --baseline)
    f="${2:?usage: --baseline <file>}"
    ledger_has_table || { echo "Ledger table missing." >&2; exit 1; }
    ledger_insert "$(basename "$f")" "$(sha "$f")" baseline | remote_psql -q
    echo "Recorded $(basename "$f") as baseline (applied before the ledger existed)."
    ;;
  --dry-run)
    f="${2:?usage: --dry-run <file>}"; require_file "$f"
    echo "==> Dry run of $(basename "$f") (rolled back)"
    { echo "begin;"; migration_body "$f"; ledger_insert "$(basename "$f")" "$(sha "$f")" applied; checks_block; echo "rollback;"; } | remote_psql
    echo "==> Dry run passed; nothing was changed."
    ;;
  --no-transaction)
    f="${2:?usage: --no-transaction <file>}"; require_file "$f"
    echo "==> Backing up production"
    "${SSH[@]}" /opt/wireless/scripts/backup-db.sh
    echo "==> Applying $(basename "$f") WITHOUT a transaction (cannot be rolled back automatically)"
    remote_psql < "$f"
    ledger_insert "$(basename "$f")" "$(sha "$f")" applied | remote_psql -q
    echo "==> Running DB checks"
    if ! { echo "begin;"; cat "$CHECKS"; echo "rollback;"; } | remote_psql -q; then
      echo "DB CHECKS FAILED after a non-transactional apply. Fix forward or restore from the backup just taken." >&2
      exit 1
    fi
    ;;
  ""|-h|--help)
    sed -n '2,27p' "$0"; exit 0
    ;;
  -*)
    echo "Unknown option: $1" >&2; exit 2
    ;;
  *)
    f="$1"; require_file "$f"
    ledger_has_table || { echo "Ledger table missing." >&2; exit 1; }
    echo "==> Backing up production"
    "${SSH[@]}" /opt/wireless/scripts/backup-db.sh
    echo "==> Applying $(basename "$f") with checks, in one transaction"
    if { echo "begin;"; migration_body "$f"; ledger_insert "$(basename "$f")" "$(sha "$f")" applied; checks_block; echo "commit;"; } | remote_psql; then
      echo "==> Applied, checks passed, recorded in wireless.schema_migrations"
    else
      echo "==> FAILED: nothing was applied (the transaction was rolled back). See the error above." >&2
      exit 1
    fi
    ;;
esac
