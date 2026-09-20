# Isolated VPS staging Supabase

This is a resource-limited, payment-testing stack. It uses separate Docker
containers, network, database volume, keys, and migration history. It does not
mount, join, or read the production Wireless stack.

The API gateway binds to `127.0.0.1:8100` and is not public until the host nginx
route for `/staging/` is installed. Secrets are generated on the VPS by
`generate-secrets.sh`; `.env` and the rendered `kong.yml` must never be
committed.

The stack intentionally excludes Studio, Analytics, Realtime, Auth, Storage,
and image transformation. Those services are not required for the public
ticket and Paystack test flow and would compete with production on the small
VPS.

## Paystack test-mode activation

Run `set-paystack-test-key.sh` interactively on the VPS. It accepts only an
`sk_test_` key, writes it without echoing it, and recreates only the staging
functions container. Never paste a Paystack secret into chat, Git, a browser
bundle, or a GitHub Pages setting.

Run `install-reconciliation-cron.sh` once as the staging service account. It
calls the private loopback gateway every five minutes so interrupted pending
payments are checked against Paystack. The runner sends the generated
reconciliation secret only to `127.0.0.1` and logs failures without logging
the secret or response payload.

Configure Paystack's **test-mode** webhook URL as:

`https://api.wirelesscares.com/staging/functions/v1/paystack-webhook`

The test callback URL is:

`https://oscarkay99.github.io/Wireless/customer-staging/?payment_return=1`
