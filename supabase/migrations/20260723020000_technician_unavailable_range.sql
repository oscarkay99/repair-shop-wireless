-- Collapses Available/On Break/Off Day down to Available/Unavailable, with a
-- real date range (from-to) rather than just an end date, so ticket
-- assignment can actually check "is this technician unavailable today"
-- instead of only showing an informational label.

update wireless.technicians set status = 'unavailable' where status in ('on_break','off_duty');

alter table wireless.technicians drop constraint if exists technicians_status_check;
alter table wireless.technicians add constraint technicians_status_check
  check (status in ('available','unavailable'));

-- leave_until was never actually a real column on the live database (despite
-- being referenced everywhere in the frontend) — every past status update
-- that included it silently failed at the PostgREST layer and was swallowed
-- by an error-only-warns service function, so no technician's status/leave
-- date has ever actually persisted. Adding both columns fresh.
alter table wireless.technicians add column if not exists unavailable_from date;
alter table wireless.technicians add column if not exists unavailable_until date;
