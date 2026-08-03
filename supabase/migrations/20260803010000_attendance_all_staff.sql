-- wireless.attendance shipped scoped to wireless.technicians, but every
-- other role (reception, finance, sales_manager, inventory_manager, admin,
-- manager themselves) never gets a technicians row, so they had no way to
-- clock in and Admin/Manager could never see them in the Attendance tab.
-- Re-point the table at wireless.profiles instead — every staff member has
-- exactly one row there regardless of role — and simplify self-scoping from
-- wireless.my_technician_id() to plain auth.uid() (profiles.id IS the auth
-- user id). The table shipped minutes ago with zero rows, so this is a
-- clean column swap, not a backfill.

drop trigger if exists trg_prevent_unauthorized_attendance_edit on wireless.attendance;
drop trigger if exists set_updated_at on wireless.attendance;
drop trigger if exists audit_attendance_changes on wireless.attendance;
drop policy if exists attendance_read on wireless.attendance;
drop policy if exists attendance_insert on wireless.attendance;
drop policy if exists attendance_update on wireless.attendance;
drop policy if exists attendance_delete on wireless.attendance;
drop index if exists wireless.attendance_one_open_session_idx;
drop index if exists wireless.attendance_technician_idx;

alter table wireless.attendance drop column technician_id;
alter table wireless.attendance add column profile_id uuid not null references wireless.profiles(id) on delete cascade;

create index attendance_profile_idx on wireless.attendance (profile_id, clock_in desc);
create unique index attendance_one_open_session_idx on wireless.attendance (profile_id) where (clock_out is null);

create policy attendance_read on wireless.attendance for select to authenticated
  using (
    wireless.has_permission('attendance:view')
    or wireless.has_permission('attendance:manage')
    or profile_id = auth.uid()
  );

create policy attendance_insert on wireless.attendance for insert to authenticated
  with check (
    wireless.has_permission('attendance:manage')
    or profile_id = auth.uid()
  );

create policy attendance_update on wireless.attendance for update to authenticated
  using (
    wireless.has_permission('attendance:manage')
    or profile_id = auth.uid()
  )
  with check (
    wireless.has_permission('attendance:manage')
    or profile_id = auth.uid()
  );

create policy attendance_delete on wireless.attendance for delete to authenticated
  using (wireless.has_permission('attendance:manage'));

-- Self-service staff may only close out their own open session (set
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

  if old.profile_id <> new.profile_id
     or old.clock_in <> new.clock_in
     or old.notes is distinct from new.notes then
    raise exception 'Staff can only clock out their own session';
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
