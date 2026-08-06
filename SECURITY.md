# Security model

This is a living reference for how security is actually implemented in this
system, not a checklist of intentions. Written 2026-08-06 after a full audit
of both live apps (`operations.wirelesscares.com`, `user.wirelesscares.com`)
and the shared self-hosted Supabase backend. Update this file when the model
changes — a future developer (or AI agent) should be able to read this
instead of re-deriving it from migration history.

## Stack

- Frontend: React 19 + Vite + TS, deployed as a static SPA via nginx
- Backend: self-hosted Supabase (Postgres 15, GoTrue auth, PostgREST, Storage) on a single VPS, behind Kong as the API gateway
- A small custom Node service, `wireless-admin` (source lives on the VPS only, not in this repo), handles privileged actions the client can't safely do itself: creating users, resetting passwords, sending invoice emails, signing storage URLs for the public tracker
- The same VPS also hosts a second, unrelated client's stack (Rogernort) in fully separate Docker containers and a separate Postgres instance — not shared tables, not the SaaS-style multi-tenant pattern

## Authentication

- Real auth only. Demo/mock accounts (`mockUsers` in `src/hooks/useAuth.ts`) are reachable **only** when Supabase isn't configured at all (local dev with no `.env`) — never in production, and never as a fallback when real auth fails.
- Session tokens live in `localStorage` (standard supabase-js behavior). The risk this creates is XSS, not CSRF — there's no cookie-based auth here, so classic CSRF doesn't apply.
- Password minimum: 8 characters, enforced both client-side (every form that sets one) and server-side (`GOTRUE_PASSWORD_MIN_LENGTH=8` on the VPS).
- Login (`/auth/v1/token`) is rate-limited at the Kong gateway: 20/min, 200/hour, keyed by the real client IP (see "IP address handling" below). Stock GoTrue has no lockout of its own.
- Google OAuth has no domain restriction at the provider level — any Google account can complete the handshake. The real gate is `loadProfileFromSession()` in `useAuth.ts`, which only grants a session if the email matches an existing **active** `wireless.profiles` row. This is a single-layer defense, not defense-in-depth.
- MFA does not exist. (A "Two-Factor Authentication" toggle in Settings used to claim otherwise — it was pure UI, wired to nothing. Fixed to say "not yet available.") GoTrue supports TOTP natively; a real implementation is scoped but deliberately not rushed — it touches the core login flow (enrollment, a second challenge step, recovery codes) and a half-tested version would be worse than the honest "not available" label.

## Server access

- SSH is key-only. `PasswordAuthentication no`, set at `/etc/ssh/sshd_config.d/00-harden.conf` (named to sort before two pre-existing, mutually contradictory `50-cloud-init.conf` / `60-cloudimg-settings.conf` fragments — sshd honors only the *first* occurrence of a directive across included files, so file naming order matters here).
- `PermitRootLogin prohibit-password` — **not** `no`. The staff app's deploy pipeline authenticates as root over SSH with its own dedicated key (`github-actions-deploy@wirelesscares`); setting this to a bare `no` blocks that too, not just password auth, and broke production deploys for about 10 minutes during this hardening pass before being caught and fixed. `prohibit-password` closes the actual risk (password-based root login) while leaving already-scoped key-based automation alone.
- Interactive/admin access goes through a named account (`oscar`, sudo-enabled, password required for `sudo` specifically) instead of shared root credentials. The root password itself was never changed — only SSH's willingness to accept it was disabled — since it may still be needed via the hosting provider's own console outside of SSH.

## Backups

- Daily `pg_dump -Fc` (custom/binary format — **not** plain SQL text; a plain-text dump piped through `psql` was tested and found to silently drop `auth.users` on restore due to an unrelated schema mismatch cascading the parser), GPG-encrypted (`gpg --encrypt`, recipient key fingerprint in the backup script) at 2:30 AM, `/opt/wireless/backups` on the VPS, 14-day local rotation, failure alerts via ntfy.
- The GPG private key exists nowhere on the server — generated there transiently, exported, handed off, then deleted from the box entirely. Only the public key remains, which can encrypt but not decrypt. Whoever holds the private key offline is the only one who can ever restore a backup.
- Restore is tested, not just assumed: verified by decrypting a real backup and restoring it into an isolated `supabase/postgres` container, confirming real row counts (users, tickets, customers, invoices) matched production.
- **Known gap:** this backup is local to the same VPS as the live database. It protects against bad migrations, human error, and accidental deletion — not against losing the VPS itself. Off-site storage (S3, Backblaze B2, etc.) needs an account decision before it can be added.

## Infrastructure hardening

- OS security patches apply automatically (`unattended-upgrades`, already configured before this review — confirmed active, not something added).
- Container images are scanned with Trivy. `wireless-studio` (Supabase's DB browser UI) was removed entirely after scanning turned up by far the largest vulnerability count in the stack (34 critical / 1219 high) on an image that had also been unhealthy for 6+ days, was never routed through Kong, and nothing depended on it — deleting it eliminated more real risk than patching it ever would have. The remaining images (Kong, GoTrue, PostgREST, Postgres, Storage, Realtime, Meta, imgproxy) still carry a meaningful CVE count each; these are vendor-maintained base images, and the fix is a coordinated version bump with compatibility testing, not something to force blindly.
- `security.txt` (RFC 9116) is served at `/.well-known/security.txt` on both domains for responsible disclosure.
- CSP and Permissions-Policy are live on both domains (see nginx configs on the VPS, not tracked in either repo). The CSP was built from what the code actually references (grepped both repos' external domains) rather than guessed, and required externalizing one small inline `<script>` in `index.html` first (`public/redirect-handler.js`) so `script-src` could stay strict with no `'unsafe-inline'`. `style-src` does allow `'unsafe-inline'` — React's inline `style={{}}` prop sets DOM style properties directly rather than through the attribute-parsing path CSP restricts, but Tailwind/third-party CSS in this app wasn't audited closely enough to be confident removing it wouldn't break something. Verified via curl that both sites still return 200 with the headers present; **actual client-side resource loading (fonts, the Google Maps embed, Google OAuth redirect) still needs a real browser to fully confirm.**

## Authorization

- Every table in the `wireless` schema has RLS enabled — verified directly against the live database, not just migration files.
- Permission model: `wireless.roles.permissions text[]`, checked via `wireless.has_permission('resource:action')`. Admin bypasses unconditionally at the DB layer (`wireless.is_admin()`), independent of what's in its own permissions array.
- **Admin is a protected system role** — `trg_prevent_system_role_mutation` blocks *any* `UPDATE`/`DELETE` on the admin row in `wireless.roles`, including adding a new permission string. This means a migration granting a new permission to "admin + manager" will fail on the admin half. Pattern used throughout: skip the admin grant in SQL, and check `user.role === 'admin'` directly on the client instead — `has_permission()` already treats admin as an automatic pass server-side.
- Technicians are scoped to their own assigned tickets via `wireless.ticket_technicians` (many-to-many; a ticket can have several assignees, all equal).
- Customer-facing lookups (ticket status, ticket photos) require an exact match on **both** ticket number and phone (numbers are sequential/guessable on their own), or a random unguessable per-ticket `public_token` (used by the QR code on printed receipts). Both paths are rate-limited server-side.
- Storage authorization is separate from table RLS and easy to forget: a bucket's `public` flag AND its `storage.objects` RLS policy both independently gate access. `repair-media` (customer photos) is private with an RLS policy mirroring `wireless.ticket_media`'s own read policy; the customer portal gets photos via short-lived (10 min) signed URLs minted by `wireless-admin`, not raw bucket URLs.

## IP address handling

This system sits behind nginx → Kong → PostgREST/GoTrue. Two headers matter and they are **not interchangeable**:

- `X-Real-IP` — nginx sets this via `proxy_set_header X-Real-IP $remote_addr`, a plain overwrite. Always the true connecting IP, never attacker-controllable. **Use this for anything security-sensitive** (rate limiting, abuse detection).
- `X-Forwarded-For` — nginx sets this via `$proxy_add_x_forwarded_for`, which **appends** to whatever the client already sent rather than replacing it. A client can set their own `X-Forwarded-For` and it will still be present (just with the real IP appended after it) — reading the first comma-separated segment gets you the attacker's chosen value, not their real IP. This was a real, live bug (three rate-limited RPCs were bypassable this way) before this audit.
- Kong itself doesn't trust either header by default — `KONG_REAL_IP_HEADER=X-Real-IP` and `KONG_TRUSTED_IPS=127.0.0.1` are set explicitly in `docker-compose.yml` so the `rate-limiting` plugin sees real client IPs instead of nginx's own loopback address.

## Rate-limited surfaces

| Surface | Limit | Keyed by |
|---|---|---|
| `/auth/v1/token` (login) | 20/min, 200/hr | Kong plugin, `X-Real-IP` |
| `wireless.lookup_ticket` | 8 / 5 min | Postgres table, `X-Real-IP` |
| `wireless.lookup_ticket_media` | 8 / 5 min | Postgres table, `X-Real-IP` |
| `wireless.resolve_login_email` | 20 / 5 min | Postgres table, `X-Real-IP` |
| `wireless.lookup_ticket_by_token` / `_media_by_token` | none | token entropy is the credential, by design |

## Input handling

- SQL injection: not a concern via the JS client (PostgREST parameterizes everything). Every `EXECUTE` in the schema's plpgsql functions uses quoted identifiers (`%I`) against hardcoded lists, never string-concatenated user input.
- XSS: no `dangerouslySetInnerHTML`/`innerHTML` anywhere in either frontend. React's default escaping is the only defense currently, which is sufficient given the above — but there's no CSP as a second layer yet (see Known gaps).
- Errors: `src/utils/errors.ts`'s `errMessage()` detects raw Postgres driver error text (constraint violations, missing-relation errors) and translates it to a schema-free message instead of showing it verbatim. Genuine `raise exception '...'` messages from our own RPCs (always plain English) pass through unchanged — that distinction is what the detection regex is for.
- File uploads: extensions taken from the browser-supplied filename are sanitized to a short alphanumeric token before being used in a storage path (`safeExtension()` in `src/services/repairs.ts`, mirrored in `settings.ts` for the logo). Both storage buckets enforce `allowed_mime_types` + `file_size_limit` server-side — client-side `accept=` attributes are UX only.

## Known gaps (not fixed, and why)

- **CSP needs live-browser confirmation.** Shipped and verified live via curl (headers present, both sites return 200), but resource-loading enforcement only happens client-side — a real browser pass (login, viewing ticket photos, the Delivery page's Google Maps embed, Google OAuth) is still needed to be fully sure nothing subtle broke.
- **Real MFA isn't built**, just honestly labeled as unavailable instead of fake. See Authentication above.
- **No automated authorization test suite.** Everything in this document was verified live (curl, direct DB queries, a real restore, a real decrypt) during the audit, but nothing re-checks it automatically on the next change. A regression here would currently only be caught by another manual pass.
- **No frontend error tracking** (Sentry-equivalent). A JS error in a real user's browser leaves no trace anywhere right now.
- **Uneven CI enforcement.** Neither repo blocks a push that fails typecheck/lint/build — those were run manually before every deploy during this audit.
- **Staging environment doesn't exist.** Single production environment, direct deploy. A reasonable tradeoff at current scale; revisit if deploy frequency or team size grows.
- **Off-site backup storage** needs a cloud account decision (S3, Backblaze B2, etc.) before it can be added — current backups are encrypted but still physically on the same VPS as the database.
- **Vendor image CVEs** (Kong, GoTrue, Postgres, PostgREST, Storage, Realtime, Meta, imgproxy) remain — see Infrastructure hardening above. Fixing these means coordinated version bumps with compatibility testing, not something to do blind.

## Where to look next

If you're an agent picking this codebase up cold: read `src/utils/access.ts` for the client-side permission model, any `supabase/migrations/*custom_roles*` or `*rls*` file for the DB-side equivalent, and grep for `has_permission` to see the pattern applied consistently. The migration files are dated and mostly self-documenting via their opening comments — read the *latest* migration touching a given table/function, not the first, since most things get revised more than once.
