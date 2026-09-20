# Paystack Edge Function configuration

Deploy these functions only to the isolated staging Supabase project first:

- `paystack-payment-info`
- `paystack-initialize`
- `paystack-status`
- `paystack-webhook` (`--no-verify-jwt`; authenticity is the Paystack HMAC)
- `paystack-reconcile` (`--no-verify-jwt`; protected by its own high-entropy secret)

Required server secrets:

```text
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_ENVIRONMENT=test
CUSTOMER_APP_ORIGINS=https://staging-user.wirelesscares.com,http://localhost:5173
PAYSTACK_CALLBACK_URL=https://staging-user.wirelesscares.com/?payment_return=1
PAYSTACK_RECONCILE_SECRET=<high-entropy random secret>
```

`ALLOW_PAYSTACK_LIVE=true` is intentionally required in addition to a live key.
Never define Paystack's secret as a `VITE_` variable.

Configure Paystack test mode to send webhooks to the staging
`paystack-webhook` function. Invoke `paystack-reconcile` every five minutes
from the trusted scheduler, passing `x-reconcile-secret`.
