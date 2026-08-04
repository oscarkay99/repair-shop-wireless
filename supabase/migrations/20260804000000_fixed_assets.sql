-- Fixed Assets (non-current assets) — shop equipment, tools, machines, etc.
-- Lives on the Expenses & P&L page as a new "Assets" tab, alongside
-- Overview/Transactions/Budgets. Admin can fully manage; Finance can view
-- only (unlike Expenses, where Finance already has full edit) — enforced
-- both here (assets:edit only granted to Finance's view counterpart) and
-- client-side in the Assets tab (canManage = user.role === 'admin', same
-- pattern used for Attendance/Performance since Admin is a protected system
-- role that can't carry a DB-seeded permission — wireless.has_permission()
-- already bypasses it unconditionally).

create table wireless.fixed_assets (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text not null default 'Equipment',
  purchase_date  date,
  purchase_cost  numeric not null default 0,
  current_value  numeric not null default 0,
  status         text not null default 'active' check (status in ('active', 'under_repair', 'disposed')),
  location       text,
  notes          text,
  created_by     uuid references wireless.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index fixed_assets_status_idx on wireless.fixed_assets (status);

alter table wireless.fixed_assets enable row level security;

create policy fixed_assets_read on wireless.fixed_assets for select to authenticated
  using (wireless.has_permission('assets:view') or wireless.has_permission('assets:edit'));

create policy fixed_assets_write on wireless.fixed_assets for all to authenticated
  using (wireless.has_permission('assets:edit'))
  with check (wireless.has_permission('assets:edit'));

create trigger set_updated_at
  before update on wireless.fixed_assets
  for each row execute function wireless.set_updated_at();

create trigger audit_fixed_assets_changes
  after insert or delete or update on wireless.fixed_assets
  for each row execute function wireless.capture_audit_log();

-- Finance gets view-only. Admin is a protected system role (any update to
-- it is blocked by trg_prevent_system_role_mutation) and doesn't need a
-- grant — wireless.has_permission() already treats is_admin() as an
-- automatic pass regardless of the seeded array; the client mirrors that
-- with an explicit role check instead of relying on this permission.
update wireless.roles
set permissions = permissions || array['assets:view']
where id = 'finance'
  and not ('assets:view' = any(permissions));
