-- HR leave management: leave types, running balances, and a self-service
-- request/approval workflow. Keyed off profiles.id (not technicians.id) so
-- every role — not just technicians — can request leave, following the same
-- widening attendance went through in 20260803010000_attendance_all_staff.sql
-- (whose bare `profile_id = auth.uid()` self-row pattern this mirrors).

create table wireless.leave_types (
  id          text primary key,
  label       text not null,
  paid        boolean not null default true,
  color       text not null default '#64748B',
  created_at  timestamptz not null default now()
);

insert into wireless.leave_types (id, label, paid, color) values
  ('annual', 'Annual Leave', true, '#10B981'),
  ('sick', 'Sick Leave', true, '#F59E0B'),
  ('unpaid', 'Unpaid Leave', false, '#64748B'),
  ('compassionate', 'Compassionate Leave', true, '#8B5CF6'),
  ('maternity', 'Maternity Leave', true, '#EC4899'),
  ('paternity', 'Paternity Leave', true, '#3B82F6'),
  ('study', 'Study Leave', false, '#06B6D4');

alter table wireless.leave_types enable row level security;

create policy leave_types_read on wireless.leave_types for select to authenticated
  using (wireless.is_active_user());

create policy leave_types_write on wireless.leave_types for all to authenticated
  using (wireless.has_permission('leave:manage'))
  with check (wireless.has_permission('leave:manage'));

create table wireless.leave_balances (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references wireless.profiles(id) on delete cascade,
  leave_type_id      text not null references wireless.leave_types(id),
  year               int not null,
  entitled_days      numeric(5,1) not null default 0,
  used_days          numeric(5,1) not null default 0,
  carried_over_days  numeric(5,1) not null default 0,
  updated_at         timestamptz not null default now(),
  unique (profile_id, leave_type_id, year)
);

create index leave_balances_profile_idx on wireless.leave_balances (profile_id, year);

alter table wireless.leave_balances enable row level security;

create policy leave_balances_read on wireless.leave_balances for select to authenticated
  using (
    profile_id = auth.uid()
    or wireless.has_permission('leave:view')
    or wireless.has_permission('leave:manage')
  );

create policy leave_balances_write on wireless.leave_balances for all to authenticated
  using (wireless.has_permission('leave:manage'))
  with check (wireless.has_permission('leave:manage'));

create trigger set_updated_at before update on wireless.leave_balances
  for each row execute function wireless.set_updated_at();

create table wireless.leave_requests (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references wireless.profiles(id) on delete cascade,
  leave_type_id   text not null references wireless.leave_types(id),
  start_date      date not null,
  end_date        date not null check (end_date >= start_date),
  days_requested  numeric(6,1) generated always as ((end_date - start_date) + 1) stored,
  reason          text,
  status          text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  decided_by      uuid references wireless.profiles(id) on delete set null,
  decided_at      timestamptz,
  decision_note   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index leave_requests_profile_idx on wireless.leave_requests (profile_id, start_date desc);
create index leave_requests_status_idx on wireless.leave_requests (status);
create index leave_requests_approved_range_idx on wireless.leave_requests (start_date, end_date) where status = 'approved';

alter table wireless.leave_requests enable row level security;

create policy leave_requests_read on wireless.leave_requests for select to authenticated
  using (
    profile_id = auth.uid()
    or wireless.has_permission('leave:view')
    or wireless.has_permission('leave:manage')
  );

create policy leave_requests_insert on wireless.leave_requests for insert to authenticated
  with check (
    (profile_id = auth.uid() and status = 'pending')
    or wireless.has_permission('leave:manage')
  );

create policy leave_requests_update on wireless.leave_requests for update to authenticated
  using (profile_id = auth.uid() or wireless.has_permission('leave:manage'))
  with check (profile_id = auth.uid() or wireless.has_permission('leave:manage'));

create policy leave_requests_delete on wireless.leave_requests for delete to authenticated
  using (wireless.has_permission('leave:manage'));

-- Self-service: the owner may only cancel their own still-pending request —
-- never reassign it, never touch decision fields, never set status to
-- approved/rejected. Mirrors prevent_unauthorized_attendance_edit exactly.
create or replace function wireless.prevent_unauthorized_leave_edit()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $$
begin
  if wireless.has_permission('leave:manage') then
    return new;
  end if;

  if old.profile_id <> new.profile_id then
    raise exception 'Cannot reassign a leave request to another staff member';
  end if;
  if old.status <> 'pending' then
    raise exception 'Only a pending leave request can be changed by its owner';
  end if;
  if new.status not in ('pending', 'cancelled') then
    raise exception 'Staff can only cancel their own leave request, not approve or reject it';
  end if;
  if new.decided_by is distinct from old.decided_by or new.decided_at is distinct from old.decided_at then
    raise exception 'Staff cannot set decision fields on their own leave request';
  end if;

  return new;
end;
$$;

create trigger trg_prevent_unauthorized_leave_edit
  before update on wireless.leave_requests
  for each row execute function wireless.prevent_unauthorized_leave_edit();

-- Keeps leave_balances.used_days in sync as a request moves in/out of
-- 'approved' — created on first approval if no balance row exists yet, so
-- HR doesn't have to pre-seed every staff member's balance manually.
create or replace function wireless.apply_leave_balance_on_decision()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $$
begin
  if old.status is distinct from new.status then
    if new.status = 'approved' and old.status = 'pending' then
      insert into wireless.leave_balances (profile_id, leave_type_id, year, used_days)
      values (new.profile_id, new.leave_type_id, extract(year from new.start_date)::int, new.days_requested)
      on conflict (profile_id, leave_type_id, year)
      do update set used_days = wireless.leave_balances.used_days + excluded.used_days, updated_at = now();
    elsif old.status = 'approved' and new.status in ('rejected', 'cancelled') then
      update wireless.leave_balances
        set used_days = greatest(0, used_days - old.days_requested), updated_at = now()
        where profile_id = old.profile_id and leave_type_id = old.leave_type_id
          and year = extract(year from old.start_date)::int;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_apply_leave_balance_on_decision
  after update on wireless.leave_requests
  for each row execute function wireless.apply_leave_balance_on_decision();

create trigger set_updated_at before update on wireless.leave_requests
  for each row execute function wireless.set_updated_at();

create trigger audit_leave_requests_changes
  after insert or delete or update on wireless.leave_requests
  for each row execute function wireless.capture_audit_log();

-- ── Permissions ───────────────────────────────────────────────────────
-- Manager gets full manage, matching the precedent that manager already got
-- full attendance:manage (not just :view) in 20260803000000_attendance.sql.
update wireless.roles set permissions = permissions || array['leave:view', 'leave:manage']
where id = 'hr' and not ('leave:manage' = any(permissions));

update wireless.roles set permissions = permissions || array['leave:view', 'leave:manage']
where id = 'manager' and not ('leave:manage' = any(permissions));
