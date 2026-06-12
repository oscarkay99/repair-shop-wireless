# Supabase Setup

This project now supports Supabase for:

- Email/password authentication
- Password reset emails
- Core business tables used by the current `src/services/*` modules

## Local app configuration

The frontend reads:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Those values belong in `.env.local`.

## AI function configuration

The Supabase Edge Functions that power AI replies, AI post generation, POS AI, and weekly AI insights read:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Recommended default:

- `OPENAI_MODEL=gpt-4.1-mini`

If `OPENAI_MODEL` is not set, the functions now default to `gpt-4.1-mini`.

## Apply the backend schema

Apply the migrations in `supabase/migrations/` in order. For the repair portal + customer website flow, the important newer migrations are:

- `20260609123000_repair_media.sql`
- `20260609143000_repair_diagnosis_and_customer_linking.sql`
- `20260609170000_customer_portal_auth_and_rls.sql`

That last migration is what:

- adds the safe `customer` auth role
- links website signups to `customers`
- restricts customers to only their own repairs/media
- allows website users to create only initial intake bookings

You can run them in the Supabase SQL editor, or apply them through the Supabase CLI after linking the project.

## Admin access still needed

The frontend can connect with the publishable key, but creating tables, policies, and server-side resources still requires either:

- A Supabase personal access token for CLI login, or
- The project service role key for admin-level automation

## Wireless Website Configuration

The static customer website in `wireless-site/` uses:

- `wireless-site/assets/js/config.js`

Set these two values there before testing the public login/booking portal:

- `WIRELESS_SUPABASE_URL`
- `WIRELESS_SUPABASE_PUBLISHABLE_KEY`
