#!/bin/bash
# Recreate one Wireless compose service, but only if it will be able to log
# into Postgres afterwards. On 2026-09-26 recreating wireless-storage while
# its DB credentials were stale turned "uploads fail" into "storage down"
# for 6 minutes, because it lost the connections it was still holding.
#
# Usage (on the VPS): safe-restart.sh <compose-service> [--force]
#   e.g. safe-restart.sh storage
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_DIR=/opt/wireless/supabase
service="${1:?usage: safe-restart.sh <compose-service> [--force]}"
force="${2:-}"

cd "$COMPOSE_DIR"
container=$(docker compose ps --format '{{.Service}} {{.Name}}' 2>/dev/null | awk -v s="$service" '$1==s {print $2}')
[ -n "$container" ] || { echo "No running compose service named '$service' in $COMPOSE_DIR" >&2; exit 2; }

# Checks the credentials the container is running with. If .env was
# changed on purpose since, recreate with --force after verifying it.
echo "Preflight: database login for $container"
if ! "$DIR/check-db-credentials.sh" "$container"; then
  if [ "$force" != "--force" ]; then
    echo "Refusing to restart: $container cannot log into the database with its current credentials." >&2
    echo "Fix the credential mismatch first (see ops/README.md). Restarting now would take it fully down." >&2
    exit 1
  fi
  echo "WARNING: --force given, restarting anyway." >&2
fi

docker compose up -d --no-deps --force-recreate "$service"

echo "Waiting for $container to start…"
for _ in $(seq 1 12); do
  sleep 5
  if [ "$(docker inspect -f '{{.State.Status}}' "$container")" = "running" ] \
     && "$DIR/check-db-credentials.sh" "$container" >/dev/null 2>&1; then
    echo "OK: $container is running and can log into the database."
    exit 0
  fi
done
echo "FAILED: $container did not come back healthy within 60s. Recent logs:" >&2
docker logs --since 2m "$container" 2>&1 | tail -20 >&2
exit 1
