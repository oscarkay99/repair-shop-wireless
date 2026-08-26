-- Attendance shipped self-service (anyone could clock themselves in/out),
-- but the shop wants this locked down to admin/manager only — staff no
-- longer clock themselves; whoever's running the front desk clocks everyone
-- in and out. Drop the `profile_id = auth.uid()` self-service branch from
-- both write policies, leaving only attendance:manage (which admin always
-- has implicitly via wireless.has_permission(), and manager was granted in
-- 20260803000000_attendance.sql). Read access is untouched — someone can
-- still see their own attendance history.

drop policy if exists attendance_insert on wireless.attendance;
create policy attendance_insert on wireless.attendance for insert to authenticated
  with check (wireless.has_permission('attendance:manage'));

drop policy if exists attendance_update on wireless.attendance;
create policy attendance_update on wireless.attendance for update to authenticated
  using (wireless.has_permission('attendance:manage'))
  with check (wireless.has_permission('attendance:manage'));
