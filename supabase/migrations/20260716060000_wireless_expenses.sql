-- Real backing table for the Expenses & P&L page — previously 100% local mock
-- data with no persistence, silently feeding fake numbers into the Dashboard's
-- Net P/L calculation. Admin-only, matching the 'Expenses' module permission
-- (only the admin role has that module in rolePermissions).
create table if not exists wireless.expenses (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'expense' check (type in ('expense', 'income')),
  category text not null,
  description text not null,
  amount numeric not null default 0,
  date date not null default current_date,
  status text not null default 'Paid' check (status in ('Paid', 'Pending')),
  vendor text,
  receipt boolean not null default false,
  approved boolean not null default true,
  notes text,
  created_by uuid references wireless.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on wireless.expenses (date desc);
create index if not exists expenses_type_idx on wireless.expenses (type);

alter table wireless.expenses enable row level security;

drop policy if exists expenses_read on wireless.expenses;
create policy expenses_read on wireless.expenses
  for select
  to authenticated
  using (wireless.has_any_role(array['admin']));

drop policy if exists expenses_write on wireless.expenses;
create policy expenses_write on wireless.expenses
  for all
  to authenticated
  using (wireless.has_any_role(array['admin']))
  with check (wireless.has_any_role(array['admin']));

drop trigger if exists set_updated_at on wireless.expenses;
create trigger set_updated_at
  before update on wireless.expenses
  for each row execute function wireless.set_updated_at();

drop trigger if exists audit_expenses_changes on wireless.expenses;
create trigger audit_expenses_changes
  after insert or delete or update on wireless.expenses
  for each row execute function wireless.capture_audit_log();
