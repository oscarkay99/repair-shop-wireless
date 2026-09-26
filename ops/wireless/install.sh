#!/bin/bash
# Installs the Wireless ops scripts on the VPS and schedules the monitor.
# Run from the repo root: ops/wireless/install.sh
# Idempotent — re-run after changing anything in ops/wireless/.
set -euo pipefail

HOST=root@187.127.233.218
KEY="${WIRELESS_SSH_KEY:-$HOME/.ssh/wireless_migration/id_ed25519}"
DEST=/opt/wireless/ops

SCRIPTS=(monitor.sh check-db-credentials.sh safe-restart.sh db-checks.sql)
ssh -i "$KEY" -o BatchMode=yes "$HOST" "mkdir -p $DEST/.incoming"
scp -q -i "$KEY" -o BatchMode=yes "${SCRIPTS[@]/#/ops/wireless/}" "$HOST:$DEST/.incoming/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<EOF
set -euo pipefail
# Rename into place: atomic, and a run already in progress keeps reading
# the old file. Overwriting in place makes a running bash script read
# garbage mid-run (this sent a false alert on 2026-09-26).
for f in ${SCRIPTS[*]}; do chmod 750 $DEST/.incoming/\$f && mv -f $DEST/.incoming/\$f $DEST/\$f; done
sed -i -E '/^db login line=/d' /opt/wireless/.monitor_state 2>/dev/null || true
# Retire the old unscheduled monitor so there is one copy, not two.
if [ -f /opt/wireless/monitor.sh ] && [ ! -L /opt/wireless/monitor.sh ]; then
  mv /opt/wireless/monitor.sh /opt/wireless/monitor.sh.retired-\$(date +%Y%m%d)
fi
rm -f /opt/wireless/monitor.sh   # old path; the timer runs $DEST/monitor.sh directly
# Drop state keys from the retired monitor's naming scheme.
sed -i -E '/^(container_|api\.wirelesscares\.com=)/d' /opt/wireless/.monitor_state 2>/dev/null || true
# One scheduler only: the systemd timer (a oneshot service never overlaps
# itself). Remove any cron entry an earlier install added.
crontab -l 2>/dev/null | grep -vF "$DEST/monitor.sh" | crontab -
cat > /etc/systemd/system/wireless-monitor.service <<UNIT
[Unit]
Description=Wireless health monitor (source: repair-shop-wireless ops/wireless/monitor.sh)

[Service]
Type=oneshot
ExecStart=$DEST/monitor.sh
UNIT
cat > /etc/systemd/system/wireless-monitor.timer <<UNIT
[Unit]
Description=Run the Wireless health monitor every 2 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=2min
AccuracySec=15s

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now wireless-monitor.timer >/dev/null
echo "Installed. Timer:"; systemctl list-timers wireless-monitor.timer --no-pager | sed -n 2p
echo "Credential check:"; $DEST/check-db-credentials.sh || true
EOF
