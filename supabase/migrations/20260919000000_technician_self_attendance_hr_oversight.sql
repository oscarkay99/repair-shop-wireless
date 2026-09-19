-- Technician self-attendance with HR oversight.
--
-- Only active Technician profiles may be attendance subjects. Technicians
-- clock only themselves using server timestamps and may read only their own
-- rows. HR can read all technician attendance and create/edit corrections
-- with a mandatory reason. Admin retains emergency access. Manager and all
-- other operational roles have no attendance access.

alter table wireless.attendance
  add column if not exists correction_reason text;

drop policy if exists attendance_read on wireless.attendance;
create policy attendance_read on wireless.attendance for select to authenticated
using (
  (
    wireless.current_user_role() = 'technician'
    and profile_id = auth.uid()
  )
  or wireless.is_admin()
  or (
    wireless.current_user_role() = 'hr'
    and exists (
      select 1 from wireless.profiles p
      where p.id = profile_id and p.role = 'technician'
    )
  )
);

drop policy if exists attendance_insert on wireless.attendance;
create policy attendance_insert on wireless.attendance for insert to authenticated
with check (
  wireless.is_admin()
  or wireless.current_user_role() = 'hr'
  or (
    wireless.current_user_role() = 'technician'
    and profile_id = auth.uid()
  )
);

drop policy if exists attendance_update on wireless.attendance;
create policy attendance_update on wireless.attendance for update to authenticated
using (
  wireless.is_admin()
  or wireless.current_user_role() = 'hr'
  or (
    wireless.current_user_role() = 'technician'
    and profile_id = auth.uid()
  )
)
with check (
  wireless.is_admin()
  or wireless.current_user_role() = 'hr'
  or (
    wireless.current_user_role() = 'technician'
    and profile_id = auth.uid()
  )
);

drop policy if exists attendance_delete on wireless.attendance;
create policy attendance_delete on wireless.attendance for delete to authenticated
using (wireless.is_admin());

create or replace function wireless.enforce_attendance_boundaries()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $$
declare
  actor_role text := wireless.current_user_role();
  subject_role text;
  subject_status text;
begin
  if tg_op = 'DELETE' then
    if not wireless.is_admin() then
      raise exception 'Only Admin can delete an attendance record';
    end if;
    return old;
  end if;

  select p.role, p.status
    into subject_role, subject_status
    from wireless.profiles p
    where p.id = new.profile_id;

  if subject_role is distinct from 'technician' or subject_status is distinct from 'active' then
    raise exception 'Attendance can only be recorded for an active Technician';
  end if;

  if wireless.is_admin() or actor_role = 'hr' then
    if nullif(btrim(new.correction_reason), '') is null then
      raise exception 'A correction reason is required for HR/Admin attendance changes';
    end if;
    if tg_op = 'UPDATE' and new.correction_reason is not distinct from old.correction_reason then
      raise exception 'A new correction reason is required for each attendance correction';
    end if;
    if new.clock_out is not null and new.clock_out < new.clock_in then
      raise exception 'Clock out cannot be earlier than clock in';
    end if;
    new.recorded_by := auth.uid();
    return new;
  end if;

  if actor_role is distinct from 'technician' or new.profile_id is distinct from auth.uid() then
    raise exception 'Technicians can only manage their own attendance';
  end if;

  if tg_op = 'INSERT' then
    new.clock_in := statement_timestamp();
    new.clock_out := null;
    new.notes := null;
    new.correction_reason := null;
    new.recorded_by := auth.uid();
    return new;
  end if;

  if old.profile_id is distinct from new.profile_id
     or old.clock_in is distinct from new.clock_in
     or old.notes is distinct from new.notes
     or old.correction_reason is distinct from new.correction_reason
     or old.recorded_by is distinct from new.recorded_by
     or old.clock_out is not null
     or new.clock_out is null then
    raise exception 'Technicians can only clock out their own open attendance session';
  end if;

  new.clock_out := statement_timestamp();
  return new;
end;
$$;

drop trigger if exists trg_prevent_unauthorized_attendance_edit on wireless.attendance;
drop trigger if exists trg_enforce_attendance_boundaries on wireless.attendance;
create trigger trg_enforce_attendance_boundaries
  before insert or update or delete on wireless.attendance
  for each row execute function wireless.enforce_attendance_boundaries();
