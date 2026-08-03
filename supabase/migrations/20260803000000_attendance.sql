-- Technician clock in/out tracking. Each row is one shift session for one
-- technician; clock_out stays null while the shift is open. A technician can
-- self-service clock in/out (open + close their own session) without needing
-- attendance:manage — they just can't touch anyone else's record or backdate
-- their own clock_in once set (enforced below via trigger, same pattern as
-- prevent_unauthorized_ticket_status_change for tickets). Admin/Manager get
-- full visibility and the ability to add/correct/delete any record via the
-- new attendance:view / attendance:manage permissions.

create table wireless.attendance (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references wireless.technicians(id) on delete cascade,
  clock_in      timestamptz not null default now(),
  clock_out     timestamptz,
  notes         text,
  recorded_by   uuid references wireless.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index attendance_technician_idx on wireless.attendance (technician_id, clock_in desc);

-- At most one open (still clocked-in) session per technician.
create unique index attendance_one_open_session_idx on wireless.attendance (technician_id) where (clock_out is null);

alter table wireless.attendance enable row level security;

create policy attendance_read on wireless.attendance for select to authenticated
  using (
    wireless.has_permission('attendance:view')
    or wireless.has_permission('attendance:manage')
    or technician_id = wireless.my_technician_id()
  );

create policy attendance_insert on wireless.attendance for insert to authenticated
  with check (
    wireless.has_permission('attendance:manage')
    or technician_id = wireless.my_technician_id()
  );

create policy attendance_update on wireless.attendance for update to authenticated
  using (
    wireless.has_permission('attendance:manage')
    or technician_id = wireless.my_technician_id()
  )
  with check (
    wireless.has_permission('attendance:manage')
    or technician_id = wireless.my_technician_id()
  );

create policy attendance_delete on wireless.attendance for delete to authenticated
  using (wireless.has_permission('attendance:manage'));

-- Self-service technicians may only close out their own open session (set
-- clock_out) — not backdate clock_in, reattribute the record to someone
-- else, or edit notes attached by a manager's correction.
create or replace function wireless.prevent_unauthorized_attendance_edit()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $function$
begin
  if wireless.has_permission('attendance:manage') then
    return new;
  end if;

  if old.technician_id <> new.technician_id
     or old.clock_in <> new.clock_in
     or old.notes is distinct from new.notes then
    raise exception 'Technicians can only clock out their own session';
  end if;

  return new;
end;
$function$;

create trigger trg_prevent_unauthorized_attendance_edit
  before update on wireless.attendance
  for each row execute function wireless.prevent_unauthorized_attendance_edit();

create trigger set_updated_at
  before update on wireless.attendance
  for each row execute function wireless.set_updated_at();

create trigger audit_attendance_changes
  after insert or delete or update on wireless.attendance
  for each row execute function wireless.capture_audit_log();

-- ── Grant the module to Manager ──────────────────────────────────────────
-- Admin is a protected system role (trg_prevent_system_role_mutation blocks
-- any update to it, permissions included) — it doesn't need a grant anyway,
-- since wireless.has_permission() already treats is_admin() as an automatic
-- pass regardless of the seeded array. The client mirrors that by checking
-- user.role === 'admin' directly instead of relying on this permission.
update wireless.roles
set permissions = permissions || array['attendance:view', 'attendance:manage']
where id = 'manager'
  and not ('attendance:manage' = any(permissions));
