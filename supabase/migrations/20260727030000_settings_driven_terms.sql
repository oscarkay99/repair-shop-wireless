-- Lets Settings edit the actual Repair Service Terms text shown on the
-- customer portal's /service-terms page (linked from every invoice/receipt),
-- instead of that page's copy being hardcoded in the portal's own source.

alter table wireless.settings add column terms_and_conditions text default
'## Diagnosis & Quotes
A diagnosis fee may apply and is charged to inspect and identify the issue with your device. Any repair cost quoted after diagnosis is an estimate based on the visible issue at the time of inspection — the final cost may change if additional problems are discovered once the repair is underway. We will seek your approval before proceeding with any repair beyond what was originally quoted.

## Parts Used
Repairs may use new, refurbished, or compatible aftermarket parts unless you specifically request and pay for original manufacturer (OEM) parts and we confirm availability. Parts removed from your device during a repair become our property unless you ask to keep them at drop-off.

## Payment
Any diagnosis fee is due at drop-off. The remaining balance is due in full before your device is released to you, regardless of the payment method used for any deposit.

## Warranty
Repairs are covered by the warranty period stated on your invoice, starting from the date the repair is completed. The warranty covers only the specific repair performed and does not cover physical damage, water/liquid damage, or issues unrelated to the original repair, however they occur after pickup.

## Your Data
You are responsible for backing up any data on your device before drop-off. We take reasonable care during repair but are not liable for data loss, and are not responsible for recovering, transferring, or backing up your data unless that service was specifically requested and agreed in advance.

## Pre-Existing Conditions
We are not responsible for pre-existing damage, prior repairs, or issues unrelated to the repair requested, including problems that surface after your device has been opened for inspection but were already present beforehand.

## Unclaimed Devices
Please collect your device promptly once notified it is ready. Devices left uncollected for an extended period may be subject to a storage fee or, after reasonable attempts to contact you, treated as abandoned in accordance with applicable local law.

## Liability
Our liability in connection with any repair is limited to the amount paid for that repair. We are not liable for any indirect, incidental, or consequential loss, including loss of use, data, or business arising from the device being under repair.

## Changes
These terms may be updated from time to time; the version in effect at the time you drop off your device applies to that repair.';

-- Public, read-only, single-field lookup — safe to expose to anon since the
-- terms text itself isn't sensitive. Mirrors the existing anon-callable RPC
-- pattern (lookup_ticket, resolve_login_email) rather than granting any
-- direct table access to wireless.settings.
create or replace function wireless.get_service_terms()
returns text
language sql
stable
security definer
set search_path to 'wireless'
as $$
  select terms_and_conditions from wireless.settings where id = 'store'
$$;

grant execute on function wireless.get_service_terms() to anon, authenticated;
