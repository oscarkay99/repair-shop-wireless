# Wireless production operations

Everything that runs on the Wireless VPS (`187.127.233.218`, `/opt/wireless`)
lives here. Edit it here, commit it, then install it with
`ops/wireless/install.sh`. Don't edit the copies on the server.

## Rules

1. **Never change a database password by hand.** No `ALTER ROLE … PASSWORD`,
   no editing `POSTGRES_PASSWORD` in `.env` on its own. In September 2026 a
   password prompt during a manual migration was "fixed" by resetting
   `supabase_admin`'s password. Storage kept working on the connections it
   already had, then every photo upload failed with a 500 until 2026-09-26.
2. **Apply migrations only with `ops/wireless/apply-migration.sh`.** It backs
   up first and never prompts for a password. The migration, its ledger
   entry and the DB checks (`db-checks.sql`) run in one transaction, which
   commits only if every check passes. A migration that breaks a function
   or a role's access is rejected and nothing changes. Try one first with
   `--dry-run <file>`; see what's pending with `--status`.
3. **Release the app only with `ops/wireless/release.sh`.** It refuses
   unless `development` is pushed, every migration is applied in
   production, and the production DB checks pass, then tags the next
   version. The deploy re-runs the full CI suite and stops if it fails.
4. **Restart services only with `safe-restart.sh`** (on the VPS:
   `/opt/wireless/ops/safe-restart.sh storage`). It refuses to restart a
   service that can't log into the database, because the restart would drop
   the connections it's still running on and take it fully down.
5. **A successful `psql -h 127.0.0.1` inside `wireless-db` proves nothing.**
   Local connections there are trusted and accept any password. Use
   `check-db-credentials.sh`, which tests each service's real login over
   the network.

## Scripts

| Script | Runs on | Purpose |
| --- | --- | --- |
| `wireless/monitor.sh` | VPS, systemd `wireless-monitor.timer` every 2 min | Sites, containers, per-service DB logins, real storage and REST requests, 5xx in logs, repeating DB errors, and `db-checks.sql` every 10 min. Alerts to the ntfy topic on change, and hourly while down. Output: `journalctl -u wireless-monitor` |
| `wireless/check-db-credentials.sh` | VPS | Logs into Postgres as each service, with the credentials that container is running with |
| `wireless/safe-restart.sh <service>` | VPS | Credential preflight, recreate, then verify it came back |
| `wireless/apply-migration.sh` | your machine | Backup, then apply + record + check in one transaction; `--dry-run`, `--status`, `--check` |
| `wireless/db-checks.sql` | used by the two scripts above | `plpgsql_check` on every wireless function, plus a smoke test as one real user of each role (the app's read-only RPCs and every table it reads). Keep its RPC/table lists in sync with the app |
| `wireless/release.sh` | your machine | Preconditions above, then tag the next `v*` and watch the deploy |
| `wireless/install.sh` | your machine | Copies the VPS scripts to `/opt/wireless/ops` and installs the systemd timer (the only scheduler; don't add a cron entry too) |

Alerts go to an ntfy topic set in `/opt/wireless/ops/alerts.env`
(`NTFY_TOPIC=...`), which the backup script also reads. Subscribe to it in
the ntfy app. The topic name works like a password (anyone who has it can
read and send alerts), so it's never committed. This repo is public.

## If a service can't log into the database

1. `/opt/wireless/ops/check-db-credentials.sh` shows which service and which role.
2. Every service is configured from `/opt/wireless/supabase/.env`. Make the
   database match `.env`, not the other way round:
   ```sh
   cd /opt/wireless/supabase
   PW=$(grep -E "^POSTGRES_PASSWORD=" .env | cut -d= -f2-)
   printf "alter role <role> with password :'pw';\n" \
     | docker exec -i wireless-db psql -U supabase_admin -h 127.0.0.1 -d postgres -v ON_ERROR_STOP=1 -v pw="$PW"
   ```
3. Re-run the check, then `safe-restart.sh <service>` if the service still
   holds broken connections.
