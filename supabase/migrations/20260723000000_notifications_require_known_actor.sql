-- Notifications should always say WHO did something, not "Someone did X".
-- The blank-actor rows in wireless.audit_logs are from direct-SQL/migration
-- backfills, not real staff actions through the app — confirmed live: a
-- genuine authenticated request always captures actor_id/actor_name
-- correctly. Rather than surface that system noise as vague "Someone"
-- entries, exclude anything without a known actor from the feed entirely.

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
      order by a.created_at desc
      limit p_limit;
  else
    return query
      select a.id, a.action, a.table_name, a.entity_id, a.actor_name, a.created_at
      from wireless.audit_logs a
      where a.actor_name is not null
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
