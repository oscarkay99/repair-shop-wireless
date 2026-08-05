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
- MFA does not exist. (A "Two-Factor Authentication" toggle in Settings used to claim otherwise — it was pure UI, wired to nothing. Fixed to say "not yet available.")

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

## Backups

- Daily `pg_dump -Fc` (custom/binary format — **not** plain SQL text; a plain-text dump piped through `psql` was tested and found to silently drop `auth.users` on restore due to an unrelated schema mismatch cascading the parser) at 2:30 AM, `/opt/wireless/backups` on the VPS, 14-day local rotation, failure alerts via ntfy.
- Restore is tested, not just assumed: verified by restoring into an isolated `supabase/postgres` container and confirming real row counts (users, tickets, customers, invoices) matched production.
- **Known gap:** this backup is local to the same VPS as the live database. It protects against bad migrations, human error, and accidental deletion — not against losing the VPS itself. Off-site storage (S3, Backblaze B2, etc.) needs an account decision before it can be added.

## Known gaps (not fixed, and why)

- **No Content-Security-Policy.** A wrong CSP can silently break Google OAuth redirects or Supabase Storage image loading. Needs a pass done with a real browser open to verify rendering — not something to guess at blind.
- **No automated authorization test suite.** Everything in this document was verified live (curl, direct DB queries, a real restore) during the audit, but nothing re-checks it automatically on the next change. A regression here would currently only be caught by another manual pass.
- **No frontend error tracking** (Sentry-equivalent). A JS error in a real user's browser leaves no trace anywhere right now.
- **Uneven CI enforcement.** Neither repo blocks a push that fails typecheck/lint/build — those were run manually before every deploy during this audit.
- **Staging environment doesn't exist.** Single production environment, direct deploy. A reasonable tradeoff at current scale; revisit if deploy frequency or team size grows.

## Where to look next

If you're an agent picking this codebase up cold: read `src/utils/access.ts` for the client-side permission model, any `supabase/migrations/*custom_roles*` or `*rls*` file for the DB-side equivalent, and grep for `has_permission` to see the pattern applied consistently. The migration files are dated and mostly self-documenting via their opening comments — read the *latest* migration touching a given table/function, not the first, since most things get revised more than once.
