-- Two problems with the notification feed:
--
-- 1. 20260728000000's rewrite of get_my_notifications (to add multi-
--    technician support) silently dropped the `actor_name is not null`
--    and `table_name <> 'security'` filters that 20260723000000 and
--    20260724030000 had deliberately added. That's why null-actor rows
--    (e.g. a direct-SQL migration run with no authenticated session, or
--    the earlier security-event rows) were reaching the bell again,
--    showing as "Someone updated a customer record".
--
-- 2. Even for genuine, correctly-attributed actions, the feed only ever
--    showed a generic "<actor> updated a <table> record" — before_data/
--    after_data have always been captured in full on every audit_logs
--    row (see capture_audit_log()), just never selected or surfaced.
--    Exposes them here so the frontend can name which field(s) changed.

-- CREATE OR REPLACE can't change a RETURNS TABLE column set, only DROP+CREATE can.
drop function if exists wireless.get_my_notifications(int);

create function wireless.get_my_notifications(p_limit int default 30)
returns table (
  id          uuid,
  action      text,
  table_name  text,
  entity_id   text,
  actor_name  text,
  created_at  timestamptz,
  before_data jsonb,
  after_data  jsonb
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
      select a.id, a.action, a.table_name, a.entity_id, a.actor_name, a.created_at, a.before_data, a.after_data
      from wireless.audit_logs a
      where a.actor_name is not null
        and a.table_name <> 'security'
      order by a.created_at desc
      limit p_limit;
  else
    return query
      select a.id, a.action, a.table_name, a.entity_id, a.actor_name, a.created_at, a.before_data, a.after_data
      from wireless.audit_logs a
      where a.actor_name is not null
        and a.table_name <> 'security'
        and (
          a.actor_id = v_uid
          or (
            a.table_name = 'tickets'
            and a.entity_id in (
              select tt.ticket_id::text
              from wireless.ticket_technicians tt
              join wireless.technicians tech on tech.id = tt.technician_id
              where tech.profile_id = v_uid
            )
          )
        )
      order by a.created_at desc
      limit p_limit;
  end if;
end;
$$;
