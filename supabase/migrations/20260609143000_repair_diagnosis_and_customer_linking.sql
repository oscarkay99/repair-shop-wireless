alter table public.customers
  add column if not exists website_auth_user_id uuid unique,
  add column if not exists has_website_account boolean not null default false,
  add column if not exists source text not null default 'admin';

alter table public.customers
  drop constraint if exists customers_source_check;

alter table public.customers
  add constraint customers_source_check
  check (source in ('website', 'admin', 'imported'));

alter table public.repairs
  add column if not exists customer_id text references public.customers(id) on delete set null,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists website_auth_user_id uuid,
  add column if not exists job_type text not null default 'diagnosis_to_repair',
  add column if not exists service_stage text not null default 'diagnosis',
  add column if not exists quote_status text not null default 'not_sent',
  add column if not exists diagnosis_summary text,
  add column if not exists diagnosis_fee numeric(10, 2) not null default 200,
  add column if not exists diagnosis_paid_at timestamptz,
  add column if not exists quote_amount numeric(10, 2),
  add column if not exists quote_sent_at timestamptz,
  add column if not exists approval_decision_at timestamptz,
  add column if not exists repair_started_at timestamptz,
  add column if not exists cost_num numeric(10, 2),
  add column if not exists completed_date text,
  add column if not exists payments jsonb not null default '[]'::jsonb;

alter table public.repairs
  drop constraint if exists repairs_job_type_check;

alter table public.repairs
  add constraint repairs_job_type_check
  check (job_type in ('diagnosis_only', 'diagnosis_to_repair'));

alter table public.repairs
  drop constraint if exists repairs_service_stage_check;

alter table public.repairs
  add constraint repairs_service_stage_check
  check (service_stage in ('intake', 'diagnosis', 'approval', 'repair', 'pickup', 'closed'));

alter table public.repairs
  drop constraint if exists repairs_quote_status_check;

alter table public.repairs
  add constraint repairs_quote_status_check
  check (quote_status in ('not_sent', 'pending', 'approved', 'declined'));

alter table public.repairs
  drop constraint if exists repairs_status_check;

alter table public.repairs
  add constraint repairs_status_check
  check (status in ('received', 'diagnosis_paid', 'diagnosing', 'awaiting_approval', 'parts_pending', 'in_progress', 'ready', 'completed', 'diagnosis_only_closed', 'cancelled'));

create index if not exists repairs_customer_id_idx on public.repairs (customer_id);
create index if not exists repairs_website_auth_user_id_idx on public.repairs (website_auth_user_id);
create index if not exists customers_website_auth_user_id_idx on public.customers (website_auth_user_id);
