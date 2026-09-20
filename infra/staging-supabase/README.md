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
