#!/bin/bash
# Installs the Wireless ops scripts on the VPS and schedules the monitor.
# Run from the repo root: ops/wireless/install.sh
# Idempotent — re-run after changing anything in ops/wireless/.
set -euo pipefail

HOST=root@187.127.233.218
KEY="${WIRELESS_SSH_KEY:-$HOME/.ssh/wireless_migration/id_ed25519}"
DEST=/opt/wireless/ops
CRON_LINE="*/5 * * * * $DEST/monitor.sh >> /var/log/wireless-monitor.log 2>&1"

ssh -i "$KEY" -o BatchMode=yes "$HOST" "mkdir -p $DEST"
scp -q -i "$KEY" -o BatchMode=yes \
  ops/wireless/monitor.sh ops/wireless/check-db-credentials.sh ops/wireless/safe-restart.sh \
  "$HOST:$DEST/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<EOF
set -euo pipefail
chmod 750 $DEST/*.sh
# Retire the old unscheduled monitor so there is one copy, not two.
if [ -f /opt/wireless/monitor.sh ] && [ ! -L /opt/wireless/monitor.sh ]; then
  mv /opt/wireless/monitor.sh /opt/wireless/monitor.sh.retired-\$(date +%Y%m%d)
fi
ln -sfn $DEST/monitor.sh /opt/wireless/monitor.sh
# Drop state keys from the retired monitor's naming scheme.
sed -i -E '/^(container_|api\.wirelesscares\.com=)/d' /opt/wireless/.monitor_state 2>/dev/null || true
( crontab -l 2>/dev/null | grep -vF "$DEST/monitor.sh" ; echo "$CRON_LINE" ) | crontab -
echo "Installed. Cron:"; crontab -l | grep -F "$DEST/monitor.sh"
echo "Credential check:"; $DEST/check-db-credentials.sh || true
EOF
