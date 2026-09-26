#!/bin/bash
# Wireless health monitor — cron, every 5 minutes. Source of truth is
# ops/wireless/monitor.sh in the repair-shop-wireless repo; install with
# ops/wireless/install.sh, don't edit the copy on the server.
#
# Alerts to ntfy on state CHANGE (up->down, down->up), plus a reminder every
# hour while something stays down, so an outage is neither silent nor spammy.
#
# The original version only checked "container running" and "site answers".
# On 2026-09-26 wireless-storage was running and answering while failing
# every upload with a 500 (it couldn't log into Postgres). So this also
# checks what users actually depend on:
#   - each service can log into Postgres with its own credentials
#   - storage and REST can serve real authenticated requests
#   - no 5xx responses in the service logs since the last run
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
TOPIC="wireless-alerts-3911ae3824e88018"
STATE_FILE="/opt/wireless/.monitor_state"
API="https://api.wirelesscares.com"
REMIND_AFTER_SECONDS=3600
touch "$STATE_FILE"

notify() {
  curl -s --max-time 10 -H "Title: $1" -H "Priority: $3" -d "$2" "https://ntfy.sh/$TOPIC" >/dev/null || true
}

get_state() { grep "^$1=" "$STATE_FILE" 2>/dev/null | tail -1 | cut -d= -f2-; }
set_state() {
  grep -v "^$1=" "$STATE_FILE" > "$STATE_FILE.tmp" 2>/dev/null || true
  echo "$1=$2" >> "$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
}

# record <check name> <ok|fail> <detail>
# State is stored as "up" or "down:<epoch of last alert>".
record() {
  local name="$1" result="$2" detail="$3" prev now
  prev=$(get_state "$name"); now=$(date +%s)
  if [ "$result" = "ok" ]; then
    [ "${prev%%:*}" = "down" ] && notify "✅ RECOVERED: $name" "$detail" "default"
    set_state "$name" "up"
  else
    if [ "${prev%%:*}" != "down" ]; then
      notify "🔴 DOWN: $name" "$detail" "urgent"
      set_state "$name" "down:$now"
    elif [ $(( now - ${prev#down:} )) -ge $REMIND_AFTER_SECONDS ] 2>/dev/null; then
      notify "🔴 STILL DOWN: $name" "$detail" "high"
      set_state "$name" "down:$now"
    fi
  fi
}

http_code() { curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$@"; }

# ── Public endpoints ──────────────────────────────────────────────────
for site in operations.wirelesscares.com user.wirelesscares.com; do
  code=$(http_code "https://$site/")
  [ "$code" = "200" ] && record "$site" ok "HTTP $code" || record "$site" fail "https://$site/ returned HTTP $code"
done
ADMIN_ENV=$(docker inspect wireless-admin --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null)
ANON_KEY=$(printf '%s\n' "$ADMIN_ENV" | grep -m1 '^ANON_KEY=' | cut -d= -f2-)
SERVICE_KEY=$(printf '%s\n' "$ADMIN_ENV" | grep -m1 '^SERVICE_ROLE_KEY=' | cut -d= -f2-)
# The gateway requires an apikey even for health (401 without one).
code=$(http_code -H "apikey: $ANON_KEY" "$API/auth/v1/health")
[ "$code" = "200" ] && record "auth API" ok "HTTP $code" || record "auth API" fail "$API/auth/v1/health returned HTTP $code"

# ── Containers ────────────────────────────────────────────────────────
for c in wireless-db wireless-kong wireless-auth wireless-rest wireless-storage wireless-realtime wireless-meta wireless-admin wireless-imgproxy; do
  s=$(docker inspect -f '{{.State.Status}}' "$c" 2>/dev/null)
  [ "$s" = "running" ] && record "container $c" ok "running again" || record "container $c" fail "status: ${s:-not found}"
done

# ── Database logins, per service, with the credentials it runs with ───
# Only "OK|FAIL <container>: ..." lines name a check; anything else (e.g. a
# shell error) must not become a bogus check name. No parseable lines at
# all means the checker itself is broken, which is its own alert.
checked=0
while IFS= read -r line; do
  if [[ $line =~ ^(OK|FAIL)\ +([a-z0-9-]+): ]]; then
    checked=$((checked + 1))
    [ "${BASH_REMATCH[1]}" = "OK" ] && record "db login ${BASH_REMATCH[2]}" ok "$line" \
      || record "db login ${BASH_REMATCH[2]}" fail "$line"
  fi
done < <("$DIR/check-db-credentials.sh" 2>&1)
[ $checked -gt 0 ] && record "db login checker" ok "running" \
  || record "db login checker" fail "check-db-credentials.sh produced no results"

# ── Real requests through the gateway (these need a working DB) ──────
if [ -n "$SERVICE_KEY" ]; then
  auth=(-H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY")
  code=$(http_code -X POST "${auth[@]}" -H "Content-Type: application/json" \
    -d '{"prefix":"repairs","limit":1}' "$API/storage/v1/object/list/repair-media")
  [ "$code" = "200" ] && record "storage requests" ok "HTTP $code" \
    || record "storage requests" fail "Listing repair-media returned HTTP $code — photo uploads and viewing are likely failing"
  code=$(http_code "${auth[@]}" -H "Accept-Profile: wireless" "$API/rest/v1/tickets?select=id&limit=1")
  [ "$code" = "200" ] && record "database API requests" ok "HTTP $code" \
    || record "database API requests" fail "Reading tickets returned HTTP $code — the app is likely failing to load data"
else
  record "monitor config" fail "Could not read SERVICE_ROLE_KEY from wireless-admin; request checks skipped"
fi

# ── 5xx responses served since the last run ──────────────────────────
for c in wireless-storage wireless-rest wireless-auth; do
  errors=$(docker logs --since 6m "$c" 2>&1 | grep -E '"statusCode":5[0-9]{2}|" 5[0-9]{2} |\| 5[0-9]{2} \|' || true)
  count=$(printf '%s' "$errors" | grep -c . || true)
  if [ "${count:-0}" -eq 0 ]; then
    record "server errors $c" ok "no 5xx responses in the last 5 minutes"
  else
    sample=$(printf '%s' "$errors" | tail -1 | grep -oE '"message":"[^"]{0,160}' | head -1 | cut -d'"' -f4)
    record "server errors $c" fail "$count 5xx response(s) in the last 5 minutes${sample:+ — latest: $sample}"
  fi
done
