-- Retires the dead 'busy' status (nothing live ever set it — only
-- 'available'/'off_duty' were ever written) in favor of a real 'on_break'
-- state, for the new dedicated technician portal's status toggle.
alter table wireless.technicians drop constraint if exists technicians_status_check;
alter table wireless.technicians add constraint technicians_status_check
  check (status in ('available','on_break','off_duty'));
