#!/bin/bash
# Wireless health monitor — systemd timer (wireless-monitor.timer), every 2 minutes. Source of truth is
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

# readlink -f: find sibling scripts even when started through a symlink.
DIR="$(dirname "$(readlink -f "$0")")"

# Never run two copies at once: they race on the state file and turn
# passing checks into false alerts (happened 2026-09-26).
exec 9>/run/wireless-monitor.lock
flock -n 9 || { echo "$(date -u +%FT%TZ) monitor: previous run still in progress, skipping" >&2; exit 0; }
# The ntfy topic is effectively a password (anyone who knows it can read
# and post alerts), and this repo is public, so it lives only on the server
# in /opt/wireless/ops/alerts.env (NTFY_TOPIC=...), shared with backup-db.sh.
ALERTS_ENV=/opt/wireless/ops/alerts.env
# shellcheck source=/dev/null
[ -r "$ALERTS_ENV" ] && . "$ALERTS_ENV"
TOPIC="${NTFY_TOPIC:-}"
if [ -z "$TOPIC" ]; then
  echo "$(date -u +%FT%TZ) monitor: NTFY_TOPIC missing from $ALERTS_ENV; alerts cannot be sent" >&2
fi
STATE_FILE="/opt/wireless/.monitor_state"
API="https://api.wirelesscares.com"
REMIND_AFTER_SECONDS=3600
touch "$STATE_FILE"

notify() {
  [ -n "$TOPIC" ] || { echo "$(date -u +%FT%TZ) ALERT (unsent): $1 — $2" >&2; return 0; }
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

# check <name> <ok detail> <fail detail> <expected> <actual>
# (if/else, not `a && ok || fail`, which also fires the fail branch
# whenever recording the success itself returns non-zero)
check() {
  if [ "$5" = "$4" ]; then record "$1" ok "$2"; else record "$1" fail "$3"; fi
}

http_code() { curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$@"; }

# ── Public endpoints ──────────────────────────────────────────────────
for site in operations.wirelesscares.com user.wirelesscares.com; do
  code=$(http_code "https://$site/")
  check "$site" "HTTP $code" "https://$site/ returned HTTP $code" 200 "$code"
done
ADMIN_ENV=$(docker inspect wireless-admin --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null)
ANON_KEY=$(printf '%s\n' "$ADMIN_ENV" | grep -m1 '^ANON_KEY=' | cut -d= -f2-)
SERVICE_KEY=$(printf '%s\n' "$ADMIN_ENV" | grep -m1 '^SERVICE_ROLE_KEY=' | cut -d= -f2-)
# The gateway requires an apikey even for health (401 without one).
code=$(http_code -H "apikey: $ANON_KEY" "$API/auth/v1/health")
check "auth API" "HTTP $code" "$API/auth/v1/health returned HTTP $code" 200 "$code"

# ── Containers ────────────────────────────────────────────────────────
for c in wireless-db wireless-kong wireless-auth wireless-rest wireless-storage wireless-realtime wireless-meta wireless-admin wireless-imgproxy; do
  s=$(docker inspect -f '{{.State.Status}}' "$c" 2>/dev/null)
  check "container $c" "running again" "status: ${s:-not found}" running "$s"
done

# ── Database logins, per service, with the credentials it runs with ───
# Only "OK|FAIL <container>: ..." lines name a check; anything else (e.g. a
# shell error) must not become a bogus check name. No parseable lines at
# all means the checker itself is broken, which is its own alert.
checked=0
while IFS= read -r line; do
  if [[ $line =~ ^(OK|FAIL)\ +([a-z0-9-]+): ]]; then
    checked=$((checked + 1))
    check "db login ${BASH_REMATCH[2]}" "$line" "$line" OK "${BASH_REMATCH[1]}"
  fi
done < <("$DIR/check-db-credentials.sh" 2>&1)
check "db login checker" "running" "check-db-credentials.sh produced no results" yes "$([ $checked -gt 0 ] && echo yes)"

# ── Real requests through the gateway (these need a working DB) ──────
if [ -n "$SERVICE_KEY" ]; then
  auth=(-H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY")
  code=$(http_code -X POST "${auth[@]}" -H "Content-Type: application/json" \
    -d '{"prefix":"repairs","limit":1}' "$API/storage/v1/object/list/repair-media")
  check "storage requests" "HTTP $code" "Listing repair-media returned HTTP $code — photo uploads and viewing are likely failing" 200 "$code"
  code=$(http_code "${auth[@]}" -H "Accept-Profile: wireless" "$API/rest/v1/tickets?select=id&limit=1")
  check "database API requests" "HTTP $code" "Reading tickets returned HTTP $code — the app is likely failing to load data" 200 "$code"
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

# ── Recurring database errors ─────────────────────────────────────────
# PostgREST turns SQL errors into 4xx responses, so the 5xx scan above
# can't see them. A broken function then fails silently for every user:
# the notification bell failed ~340 times a day from 2026-09-10 to
# 2026-09-26 with "column reference "id" is ambiguous". Alert when one
# error message repeats 5+ times since the last run. Occasional RLS
# denials (a request correctly refused) stay below the threshold.
top=$(docker logs --since 3m wireless-db 2>&1 | grep -oE 'ERROR:  .*' | sed -E 's/ at character [0-9]+//' \
  | sort | uniq -c | sort -rn | head -1)
top_count=$(printf '%s' "$top" | awk '{print $1+0}')
if [ "${top_count:-0}" -ge 5 ]; then
  record "recurring database errors" fail "$top_count× in the last few minutes: $(printf '%s' "$top" | sed -E 's/^ *[0-9]+ ERROR:  //' | cut -c1-160)"
else
  record "recurring database errors" ok "no repeating database errors"
fi
