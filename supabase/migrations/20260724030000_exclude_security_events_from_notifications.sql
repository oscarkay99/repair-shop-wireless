-- Sign-in/out events are now written to wireless.audit_logs (table_name =
-- 'security') for the Activity Log's benefit. get_my_notifications() feeds
-- the TopBar bell for every user, so without this exclusion everyone would
-- get a bell ping (and admin a ping for every OTHER staff member too) each
-- time anyone signed in or out. The Activity Log page reads audit_logs
-- directly and is unaffected by this function.

create or replace function wireless.get_my_notifications(p_limit int default 30)
returns table (
  id          uuid,
  action      text,
  table_name  text,
  entity_id   text,
  actor_name  text,
  created_at  timestamptz
)
language plpgsql
security definer
set search_path = wireless, public
stable
as $$
declare
  v_role text := wireless.current_user_role();
  v_uid  uuid := auth.uid();
begin
  if v_uid is null or v_role is null then
    return;
  end if;

  if v_role = 'admin' then
    return query
      select a.id, a.action, a.table_name, a.entity_id, a.actor_name, a.created_at
      from wireless.audit_logs a
      where a.actor_name is not null
        and a.table_name <> 'security'
      order by a.created_at desc
      limit p_limit;
  else
    return query
      select a.id, a.action, a.table_name, a.entity_id, a.actor_name, a.created_at
      from wireless.audit_logs a
      where a.actor_name is not null
        and a.table_name <> 'security'
        and (
          a.actor_id = v_uid
          or (
            a.table_name = 'tickets'
            and a.entity_id in (
              select t.id::text
              from wireless.tickets t
              join wireless.technicians tech on tech.id = t.technician_id
              where tech.profile_id = v_uid
            )
          )
        )
      order by a.created_at desc
      limit p_limit;
  end if;
end;
$$;
