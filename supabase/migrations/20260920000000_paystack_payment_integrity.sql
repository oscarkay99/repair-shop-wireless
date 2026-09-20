-- Paystack customer payments. This migration deliberately keeps gateway attempts
-- separate from wireless.payments: the latter remains the ledger of confirmed
-- money, while abandoned/failed/unknown gateway activity stays auditable here.

create sequence if not exists wireless.payment_receipt_number_seq start 1;

alter table wireless.payments add column if not exists receipt_number text;
alter table wireless.payments add column if not exists provider text;
alter table wireless.payments add column if not exists provider_reference text;
alter table wireless.payments add column if not exists provider_transaction_id text;
alter table wireless.payments add column if not exists currency text not null default 'GHS';
alter table wireless.payments add column if not exists channel text;
alter table wireless.payments add column if not exists paid_at timestamptz;

update wireless.payments
set receipt_number = 'PAY-' || to_char(coalesce(created_at, now()), 'YYYY') || '-' ||
  lpad(nextval('wireless.payment_receipt_number_seq')::text, 6, '0')
where receipt_number is null;

alter table wireless.payments alter column receipt_number set not null;
alter table wireless.payments alter column receipt_number set default
  ('PAY-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('wireless.payment_receipt_number_seq')::text, 6, '0'));
create unique index if not exists payments_receipt_number_idx on wireless.payments (receipt_number);
create unique index if not exists payments_provider_reference_idx
  on wireless.payments (provider, provider_reference)
  where provider is not null and provider_reference is not null;

create table wireless.paystack_payment_attempts (
  id                       uuid primary key default gen_random_uuid(),
  invoice_id               uuid not null references wireless.invoices(id) on delete restrict,
  ticket_id                uuid not null references wireless.tickets(id) on delete restrict,
  customer_id              uuid references wireless.customers(id) on delete set null,
  idempotency_key          uuid not null unique,
  request_hash             text not null,
  paystack_reference       text not null unique,
  payment_option           text not null check (payment_option in ('full','deposit','custom')),
  expected_amount          bigint not null check (expected_amount > 0), -- pesewas
  paid_amount              bigint check (paid_amount is null or paid_amount >= 0),
  currency                 text not null default 'GHS' check (currency = 'GHS'),
  payment_status           text not null default 'pending' check (payment_status in (
    'pending','processing','success','failed','cancelled','expired',
    'requires_verification','refund_pending','refunded'
  )),
  payment_channel          text,
  customer_email           text not null,
  customer_phone           text,
  metadata                 jsonb not null default '{}'::jsonb,
  gateway_response         text,
  failure_reason           text,
  environment              text not null check (environment in ('test','live')),
  provider_transaction_id  text,
  authorization_url        text,
  initiated_at             timestamptz not null default now(),
  verified_at              timestamptz,
  completed_at             timestamptz,
  failed_at                timestamptz,
  cancelled_at             timestamptz,
  last_webhook_at          timestamptz,
  webhook_event_id         text,
  verification_attempts    integer not null default 0 check (verification_attempts >= 0),
  last_verification_attempt timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index paystack_attempts_invoice_idx on wireless.paystack_payment_attempts (invoice_id, created_at desc);
create index paystack_attempts_status_idx on wireless.paystack_payment_attempts (payment_status, updated_at);
create unique index paystack_one_active_attempt_per_invoice_idx
  on wireless.paystack_payment_attempts (invoice_id)
  where payment_status in ('pending','processing','requires_verification');

alter table wireless.paystack_payment_attempts enable row level security;

create table wireless.paystack_webhook_events (
  id                    uuid primary key default gen_random_uuid(),
  event_key             text not null unique,
  event_type            text not null,
  payment_reference     text,
  provider_transaction_id text,
  payload               jsonb not null,
  payload_hash          text not null,
  processing_status     text not null default 'received' check (processing_status in ('received','processed','ignored','rejected')),
  processing_error      text,
  received_at           timestamptz not null default now(),
  processed_at          timestamptz
);

create index paystack_webhooks_reference_idx on wireless.paystack_webhook_events (payment_reference, received_at desc);
alter table wireless.paystack_webhook_events enable row level security;

create table wireless.paystack_public_rate_limits (
  ip text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
alter table wireless.paystack_public_rate_limits enable row level security;

create or replace function wireless.enforce_paystack_attempt_transition()
returns trigger language plpgsql as $$
begin
  if new.payment_status = old.payment_status then return new; end if;
  if not (
    (old.payment_status = 'pending' and new.payment_status in ('processing','failed','cancelled','expired','requires_verification')) or
    (old.payment_status = 'processing' and new.payment_status in ('success','failed','cancelled','expired','requires_verification')) or
    (old.payment_status = 'requires_verification' and new.payment_status in ('processing','success','failed','cancelled','expired')) or
    (old.payment_status = 'success' and new.payment_status = 'refund_pending') or
    (old.payment_status = 'refund_pending' and new.payment_status in ('success','refunded'))
  ) then
    raise exception 'Invalid payment state transition from % to %', old.payment_status, new.payment_status;
  end if;
  return new;
end;
$$;

create trigger enforce_paystack_attempt_transition
before update of payment_status on wireless.paystack_payment_attempts
for each row execute function wireless.enforce_paystack_attempt_transition();

create trigger set_paystack_attempt_updated_at
before update on wireless.paystack_payment_attempts
for each row execute function wireless.set_updated_at();

-- Service-role-only credential resolver. The browser cannot query invoices or
-- payment rows directly; it must prove possession of the ticket token or the
-- exact ticket-number + phone combination through an Edge Function.
create or replace function wireless.get_public_invoice_payment_info(
  p_public_token uuid default null,
  p_ticket_number text default null,
  p_phone text default null,
  p_request_ip text default 'unknown'
)
returns jsonb
language plpgsql
security definer
set search_path = wireless, public
as $$
declare
  v_ticket wireless.tickets%rowtype;
  v_invoice wireless.invoices%rowtype;
  v_attempts int;
  v_phone_norm text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_payments jsonb;
  v_active wireless.paystack_payment_attempts%rowtype;
begin
  insert into wireless.paystack_public_rate_limits as rl (ip, window_start, attempts)
  values (coalesce(nullif(p_request_ip, ''), 'unknown'), now(), 1)
  on conflict (ip) do update set
    attempts = case when rl.window_start < now() - interval '5 minutes' then 1 else rl.attempts + 1 end,
    window_start = case when rl.window_start < now() - interval '5 minutes' then now() else rl.window_start end
  returning attempts into v_attempts;
  if v_attempts > 20 then raise exception 'Too many attempts. Please wait a few minutes and try again.'; end if;

  select t.* into v_ticket
  from wireless.tickets t
  where (p_public_token is not null and t.public_token = p_public_token)
     or (p_public_token is null
         and nullif(trim(coalesce(p_ticket_number, '')), '') is not null
         and length(v_phone_norm) >= 9
         and lower(t.ticket_number) = lower(trim(p_ticket_number))
         and right(regexp_replace(coalesce(t.customer_phone, ''), '[^0-9]', '', 'g'), 9) = right(v_phone_norm, 9))
  order by t.created_at desc limit 1;

  if v_ticket.id is null then raise exception 'Ticket not found.'; end if;

  select i.* into v_invoice
  from wireless.invoices i
  where i.ticket_id = v_ticket.id and i.status <> 'cancelled'
  order by i.created_at desc limit 1;

  if v_invoice.id is null then
    return jsonb_build_object('has_invoice', false, 'ticket_number', v_ticket.ticket_number);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'receipt_number', p.receipt_number,
    'amount_pesewas', round(p.amount * 100)::bigint,
    'paid_at', coalesce(p.paid_at, p.created_at),
    'channel', coalesce(p.channel, p.method),
    'reference', p.provider_reference
  ) order by coalesce(p.paid_at, p.created_at) desc), '[]'::jsonb)
  into v_payments from wireless.payments p where p.invoice_id = v_invoice.id;

  select * into v_active from wireless.paystack_payment_attempts
  where invoice_id = v_invoice.id and payment_status in ('pending','processing','requires_verification')
  order by created_at desc limit 1;

  return jsonb_build_object(
    'has_invoice', true,
    'ticket_number', v_ticket.ticket_number,
    'invoice_number', v_invoice.invoice_number,
    'total_pesewas', round(v_invoice.total * 100)::bigint,
    'paid_pesewas', round(v_invoice.amount_paid * 100)::bigint,
    'balance_pesewas', greatest(0, round((v_invoice.total - v_invoice.amount_paid) * 100)::bigint),
    'status', v_invoice.status,
    'payments', v_payments,
    'active_payment_reference', v_active.paystack_reference,
    'active_payment_status', v_active.payment_status
  );
end;
$$;

create or replace function wireless.create_public_paystack_attempt(
  p_public_token uuid,
  p_ticket_number text,
  p_phone text,
  p_request_ip text,
  p_customer_email text,
  p_payment_option text,
  p_custom_amount bigint,
  p_idempotency_key uuid,
  p_request_hash text,
  p_environment text
)
returns jsonb
language plpgsql
security definer
set search_path = wireless, public
as $$
declare
  v_info jsonb;
  v_invoice wireless.invoices%rowtype;
  v_ticket wireless.tickets%rowtype;
  v_existing wireless.paystack_payment_attempts%rowtype;
  v_amount bigint;
  v_balance bigint;
  v_half_target bigint;
  v_reference text;
  v_attempt_id uuid;
begin
  if p_payment_option not in ('full','deposit','custom') then raise exception 'Invalid payment option.'; end if;
  if p_environment not in ('test','live') then raise exception 'Invalid payment environment.'; end if;
  if p_customer_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then raise exception 'A valid email address is required.'; end if;

  select * into v_existing from wireless.paystack_payment_attempts where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_hash <> p_request_hash then raise exception 'Idempotency key was reused with different payment details.'; end if;
    return jsonb_build_object('attempt_id', v_existing.id, 'reference', v_existing.paystack_reference,
      'status', v_existing.payment_status, 'authorization_url', v_existing.authorization_url,
      'amount_pesewas', v_existing.expected_amount);
  end if;

  v_info := wireless.get_public_invoice_payment_info(p_public_token, p_ticket_number, p_phone, p_request_ip);
  if not coalesce((v_info->>'has_invoice')::boolean, false) then raise exception 'No invoice is available for this ticket.'; end if;

  select i, t into v_invoice, v_ticket
  from wireless.invoices i join wireless.tickets t on t.id = i.ticket_id
  where i.invoice_number = v_info->>'invoice_number'
  for update of i;

  v_balance := greatest(0, round((v_invoice.total - v_invoice.amount_paid) * 100)::bigint);
  if v_balance <= 0 then raise exception 'This invoice is already paid in full.'; end if;

  select * into v_existing from wireless.paystack_payment_attempts
  where invoice_id = v_invoice.id and payment_status in ('pending','processing','requires_verification')
  order by created_at desc limit 1;
  if v_existing.id is not null then
    return jsonb_build_object('attempt_id', v_existing.id, 'reference', v_existing.paystack_reference,
      'status', v_existing.payment_status, 'authorization_url', v_existing.authorization_url,
      'amount_pesewas', v_existing.expected_amount,
      'existing', true);
  end if;

  if p_payment_option = 'full' then
    v_amount := v_balance;
  elsif p_payment_option = 'deposit' then
    v_half_target := ceil(round(v_invoice.total * 100)::numeric / 2)::bigint;
    v_amount := greatest(0, v_half_target - round(v_invoice.amount_paid * 100)::bigint);
    if v_amount <= 0 then raise exception 'The 50%% deposit has already been completed.'; end if;
  else
    v_amount := coalesce(p_custom_amount, 0);
  end if;

  if v_amount < 100 then raise exception 'The minimum payment is GHS 1.00.'; end if;
  if v_amount > v_balance then raise exception 'Payment cannot exceed the outstanding balance.'; end if;

  v_attempt_id := gen_random_uuid();
  v_reference := 'WLS-' || replace(v_attempt_id::text, '-', '');
  insert into wireless.paystack_payment_attempts (
    id, invoice_id, ticket_id, customer_id, idempotency_key, request_hash,
    paystack_reference, payment_option, expected_amount, customer_email,
    customer_phone, environment, metadata
  ) values (
    v_attempt_id, v_invoice.id, v_ticket.id, v_invoice.customer_id, p_idempotency_key, p_request_hash,
    v_reference, p_payment_option, v_amount, lower(trim(p_customer_email)),
    v_ticket.customer_phone, p_environment,
    jsonb_build_object('invoice_number', v_invoice.invoice_number, 'ticket_number', v_ticket.ticket_number)
  );

  return jsonb_build_object('attempt_id', v_attempt_id, 'reference', v_reference,
    'status', 'pending', 'amount_pesewas', v_amount,
    'invoice_number', v_invoice.invoice_number, 'ticket_number', v_ticket.ticket_number);
end;
$$;

create or replace function wireless.mark_paystack_initialized(
  p_reference text, p_authorization_url text
)
returns void language plpgsql security definer set search_path = wireless, public as $$
begin
  update wireless.paystack_payment_attempts set payment_status = 'processing',
    authorization_url = p_authorization_url
  where paystack_reference = p_reference and payment_status = 'pending';
  if not found then raise exception 'Payment attempt cannot be initialized.'; end if;
end;
$$;

create or replace function wireless.mark_paystack_requires_verification(p_reference text, p_reason text)
returns void language plpgsql security definer set search_path = wireless, public as $$
begin
  update wireless.paystack_payment_attempts set payment_status = 'requires_verification',
    failure_reason = left(coalesce(p_reason, 'Gateway result unknown'), 500),
    verification_attempts = verification_attempts + 1, last_verification_attempt = now()
  where paystack_reference = p_reference and payment_status in ('pending','processing');
end;
$$;

create or replace function wireless.finalize_paystack_success(
  p_reference text,
  p_paid_amount bigint,
  p_currency text,
  p_channel text,
  p_gateway_response text,
  p_provider_transaction_id text,
  p_paid_at timestamptz,
  p_webhook_event_key text default null,
  p_webhook_payload jsonb default null,
  p_payload_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = wireless, public
as $$
declare
  v_attempt wireless.paystack_payment_attempts%rowtype;
  v_invoice wireless.invoices%rowtype;
  v_payment_id uuid;
  v_receipt text;
  v_total_paid numeric;
begin
  select * into v_attempt from wireless.paystack_payment_attempts
  where paystack_reference = p_reference for update;
  if v_attempt.id is null then raise exception 'Unknown payment reference.'; end if;

  if p_webhook_event_key is not null then
    insert into wireless.paystack_webhook_events (
      event_key, event_type, payment_reference, provider_transaction_id, payload, payload_hash
    ) values (p_webhook_event_key, 'charge.success', p_reference, p_provider_transaction_id,
      coalesce(p_webhook_payload, '{}'::jsonb), coalesce(p_payload_hash, ''))
    on conflict (event_key) do nothing;
  end if;

  if v_attempt.payment_status in ('success','refund_pending','refunded') then
    select id, receipt_number into v_payment_id, v_receipt from wireless.payments
    where provider = 'paystack' and provider_reference = p_reference;
    if p_webhook_event_key is not null then
      update wireless.paystack_webhook_events set processing_status = 'processed', processed_at = now()
      where event_key = p_webhook_event_key;
    end if;
    return jsonb_build_object('payment_id', v_payment_id, 'receipt_number', v_receipt, 'already_processed', true);
  end if;
  if v_attempt.payment_status not in ('processing','requires_verification') then
    raise exception 'Payment is not in a confirmable state.';
  end if;
  if p_paid_amount <> v_attempt.expected_amount or upper(p_currency) <> v_attempt.currency then
    update wireless.paystack_payment_attempts set payment_status = 'requires_verification',
      paid_amount = p_paid_amount, failure_reason = 'Verified amount or currency mismatch', verified_at = now(),
      verification_attempts = verification_attempts + 1, last_verification_attempt = now()
    where id = v_attempt.id;
    if p_webhook_event_key is not null then
      update wireless.paystack_webhook_events set processing_status = 'rejected',
        processing_error = 'Verified payment amount or currency mismatch', processed_at = now()
      where event_key = p_webhook_event_key;
    end if;
    return jsonb_build_object('integrity_error', true,
      'message', 'Verified payment amount or currency does not match the expected transaction.');
  end if;

  select * into v_invoice from wireless.invoices where id = v_attempt.invoice_id for update;
  v_receipt := 'PAY-' || to_char(coalesce(p_paid_at, now()), 'YYYY') || '-' ||
    lpad(nextval('wireless.payment_receipt_number_seq')::text, 6, '0');

  insert into wireless.payments (
    amount, method, invoice_id, customer_id, customer_name, reference, notes,
    recorded_by, client_token, receipt_number, provider, provider_reference,
    provider_transaction_id, currency, channel, paid_at
  )
  select p_paid_amount::numeric / 100,
    case when p_channel = 'mobile_money' then 'MoMo'
         when p_channel = 'bank_transfer' then 'Bank Transfer' else 'Card' end,
    v_attempt.invoice_id, v_attempt.customer_id, coalesce(c.name, ''), p_reference,
    'Verified Paystack customer payment', null, v_attempt.id, v_receipt, 'paystack', p_reference,
    p_provider_transaction_id, upper(p_currency), p_channel, coalesce(p_paid_at, now())
  from wireless.customers c where c.id = v_attempt.customer_id
  returning id into v_payment_id;

  select coalesce(sum(amount), 0) into v_total_paid
  from wireless.payments where invoice_id = v_attempt.invoice_id;

  update wireless.invoices set amount_paid = v_total_paid,
    status = case when v_total_paid >= total then 'paid' when v_total_paid > 0 then 'partial' else 'unpaid' end,
    payment_method = case when p_channel = 'mobile_money' then 'MoMo'
                          when p_channel = 'bank_transfer' then 'Bank Transfer' else 'Card' end,
    updated_at = now()
  where id = v_attempt.invoice_id;

  update wireless.paystack_payment_attempts set payment_status = 'success', paid_amount = p_paid_amount,
    payment_channel = p_channel, gateway_response = left(p_gateway_response, 500),
    provider_transaction_id = p_provider_transaction_id, verified_at = now(), completed_at = coalesce(p_paid_at, now()),
    last_webhook_at = case when p_webhook_event_key is null then last_webhook_at else now() end,
    webhook_event_id = coalesce(p_webhook_event_key, webhook_event_id),
    verification_attempts = verification_attempts + 1, last_verification_attempt = now(), failure_reason = null
  where id = v_attempt.id;

  if p_webhook_event_key is not null then
    update wireless.paystack_webhook_events set processing_status = 'processed', processed_at = now()
    where event_key = p_webhook_event_key;
  end if;

  return jsonb_build_object('payment_id', v_payment_id, 'receipt_number', v_receipt,
    'invoice_number', v_invoice.invoice_number,
    'balance_pesewas', greatest(0, round((v_invoice.total - v_total_paid) * 100)::bigint),
    'already_processed', false);
end;
$$;

create or replace function wireless.record_paystack_terminal_status(
  p_reference text, p_status text, p_reason text
)
returns void language plpgsql security definer set search_path = wireless, public as $$
begin
  if p_status not in ('failed','cancelled','expired','requires_verification') then raise exception 'Invalid terminal status.'; end if;
  update wireless.paystack_payment_attempts set payment_status = p_status,
    failure_reason = left(coalesce(p_reason, 'Payment was not completed'), 500),
    failed_at = case when p_status in ('failed','expired') then now() else failed_at end,
    cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
    verification_attempts = verification_attempts + 1, last_verification_attempt = now()
  where paystack_reference = p_reference
    and payment_status in ('pending','processing','requires_verification');
end;
$$;

revoke all on table wireless.paystack_payment_attempts from public, anon, authenticated;
revoke all on table wireless.paystack_webhook_events from public, anon, authenticated;
revoke all on table wireless.paystack_public_rate_limits from public, anon, authenticated;
revoke all on function wireless.get_public_invoice_payment_info(uuid,text,text,text) from public, anon, authenticated;
revoke all on function wireless.create_public_paystack_attempt(uuid,text,text,text,text,text,bigint,uuid,text,text) from public, anon, authenticated;
revoke all on function wireless.mark_paystack_initialized(text,text) from public, anon, authenticated;
revoke all on function wireless.mark_paystack_requires_verification(text,text) from public, anon, authenticated;
revoke all on function wireless.finalize_paystack_success(text,bigint,text,text,text,text,timestamptz,text,jsonb,text) from public, anon, authenticated;
revoke all on function wireless.record_paystack_terminal_status(text,text,text) from public, anon, authenticated;

grant execute on function wireless.get_public_invoice_payment_info(uuid,text,text,text) to service_role;
grant execute on function wireless.create_public_paystack_attempt(uuid,text,text,text,text,text,bigint,uuid,text,text) to service_role;
grant execute on function wireless.mark_paystack_initialized(text,text) to service_role;
grant execute on function wireless.mark_paystack_requires_verification(text,text) to service_role;
grant execute on function wireless.finalize_paystack_success(text,bigint,text,text,text,text,timestamptz,text,jsonb,text) to service_role;
grant execute on function wireless.record_paystack_terminal_status(text,text,text) to service_role;

drop trigger if exists audit_paystack_attempt_changes on wireless.paystack_payment_attempts;
create trigger audit_paystack_attempt_changes after insert or update on wireless.paystack_payment_attempts
for each row execute function wireless.capture_audit_log();

comment on table wireless.paystack_payment_attempts is
  'Paystack checkout lifecycle and recovery state. Only confirmed success is copied into wireless.payments.';
