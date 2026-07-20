-- Real notifications for the TopBar bell/toast, which today always shows
-- "No notifications yet" because nothing feeds it. wireless.audit_logs
-- already captures every insert/update/delete on the wireless tables, but
-- its RLS only lets admin/sales_manager/inventory_manager read it directly,
-- and technician/receptionist have no path to it at all. Rather than widen
-- that policy (which would let every role read every other user's raw
-- actions), expose a narrow SECURITY DEFINER RPC, same pattern already used
-- by wireless.lookup_ticket and wireless.get_upcoming_birthdays:
--   - admin: sees everything (mirrors the existing admin-only Activity Log).
--   - everyone else: only their own actions, plus — for technicians — any
--     change to a ticket assigned to them (so a receptionist marking their
--     ticket ready notifies them, not just their own actions).

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
      order by a.created_at desc
      limit p_limit;
  else
    return query
      select a.id, a.action, a.table_name, a.entity_id, a.actor_name, a.created_at
      from wireless.audit_logs a
      where a.actor_id = v_uid
         or (
           a.table_name = 'tickets'
           and a.entity_id in (
             select t.id::text
             from wireless.tickets t
             join wireless.technicians tech on tech.id = t.technician_id
             where tech.profile_id = v_uid
           )
         )
      order by a.created_at desc
      limit p_limit;
  end if;
end;
$$;

revoke all on function wireless.get_my_notifications(int) from public;
grant execute on function wireless.get_my_notifications(int) to authenticated;
