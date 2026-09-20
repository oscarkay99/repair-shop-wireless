# Paystack staging and release runbook

This integration is disabled in the customer build unless
`VITE_PAYMENTS_ENABLED=true`. It must first run against an isolated staging
Supabase project and Paystack test mode. A Git branch is not an environment:
never point a testing deployment at the production database or live key.

## System of record

- `wireless.invoices` is the amount owed and its current roll-up.
- `wireless.paystack_payment_attempts` records every checkout lifecycle,
  including interrupted and failed attempts.
- `wireless.payments` contains confirmed money only. One invoice can have many
  payment receipts; `(provider, provider_reference)` is unique.
- `wireless.paystack_webhook_events` is the replay/audit log.

The browser never supplies an authoritative invoice total. For `full` and
`deposit`, Postgres calculates the amount while holding the invoice row lock.
For `custom`, the customer proposes an amount in integer pesewas and Postgres
enforces the configured minimum and current outstanding balance.

## Staging prerequisites

1. Create or restore a scrubbed database into a separate staging Supabase
   project. Do not test migrations against production.
2. Apply `20260920000000_paystack_payment_integrity.sql` in staging.
3. Configure the Edge Function secrets listed in
   `supabase/functions/paystack-initialize/README.md` with `sk_test_...`.
4. Deploy the five Paystack functions. Webhook and reconciliation functions
   intentionally need `--no-verify-jwt`; they use HMAC and a scheduler secret.
5. Configure the Paystack **test** webhook URL.
6. Deploy the portal from `testing` with the staging Supabase URL/anon key and
   `VITE_PAYMENTS_ENABLED=true`.
7. Schedule reconciliation every five minutes.

## Required tests

- full, 50% deposit, custom partial, and final-balance payments;
- double-click, refresh, back/forward, two tabs, and repeated idempotency key;
- same idempotency key with different details (must reject);
- browser closed before authorization and after bank/MoMo authorization;
- cancel while Paystack is processing (must verify, never assume failure);
- callback missing, webhook missing, duplicate webhook, and webhook retry;
- invalid signature, malformed event, unknown reference, wrong environment;
- amount/currency mismatch (must remain `requires_verification`);
- simultaneous payment attempts for the same invoice;
- gateway timeout before and after Paystack accepts initialization;
- paid/cancelled invoice and attempted overpayment;
- receipt generation, invoice roll-up, audit record, and COGS trigger;
- reconciliation recovery after simulated function/database outage.

For every successful test, compare four values: Paystack transaction amount,
payment receipt amount, invoice `amount_paid`, and invoice balance.

## Production promotion

1. Review and merge `testing` only after staging evidence is signed off.
2. Take and verify a production backup.
3. Apply the backward-compatible migration while the feature flag is off.
4. Deploy functions with the live key but keep `ALLOW_PAYSTACK_LIVE` absent.
5. Deploy the portal with payments disabled and smoke-test ticket lookup.
6. Set `ALLOW_PAYSTACK_LIVE=true`, configure the live webhook, then enable the
   portal feature flag for a controlled transaction.
7. Reconcile that transaction end-to-end before general release.

Rollback the UI by turning off `VITE_PAYMENTS_ENABLED`; do not delete or edit
financial rows. Gateway attempts and confirmed receipts remain immutable audit
evidence even if checkout is temporarily disabled.
