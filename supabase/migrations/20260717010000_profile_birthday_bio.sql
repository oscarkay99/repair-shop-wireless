-- Staff had no way to actually enter their birthday anywhere — the Birthday
-- Banner feature was reading from a hardcoded mock list. Add real columns and
-- a narrow function so every role (not just admin/sales_manager, who are the
-- only roles allowed to read other people's profiles directly) can see whose
-- birthday is coming up without exposing the rest of their profile data.
alter table wireless.profiles add column if not exists birthday date;
alter table wireless.profiles add column if not exists bio text not null default '';

create or replace function wireless.get_upcoming_birthdays()
returns table (id uuid, name text, avatar text, role text, birthday date)
language sql
security definer
set search_path = wireless, public
as $$
  select id, name, avatar, role, birthday
  from wireless.profiles
  where birthday is not null;
$$;

revoke all on function wireless.get_upcoming_birthdays() from public;
grant execute on function wireless.get_upcoming_birthdays() to authenticated;
