-- The notification bell has been failing for every non-admin user since
-- 20260910030000_hr_notifications.sql: its leave_requests / staff_queries
-- subqueries used a bare `id`, which inside this PL/pgSQL function is
-- ambiguous with the `id` output column, so every call raised
-- "column reference "id" is ambiguous" (341 times on 2026-09-26 alone).
-- Technicians, receptionists and managers got no in-app notifications at
-- all, including ticket assignments. Admins take a different branch and
-- were unaffected. Identical definition except those two references are
-- now qualified.
create or replace function wireless.get_my_notifications(p_limit int default 30)
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
            a.table_name in ('tickets', 'ticket_technicians')
            and a.entity_id in (
              select tt.ticket_id::text
              from wireless.ticket_technicians tt
              join wireless.technicians tech on tech.id = tt.technician_id
              where tech.profile_id = v_uid
            )
          )
          or (
            a.table_name = 'leave_requests'
            and (
              a.entity_id in (select lr.id::text from wireless.leave_requests lr where lr.profile_id = v_uid)
              or (wireless.has_permission('leave:manage') and a.action = 'insert')
            )
          )
          or (
            a.table_name = 'staff_queries'
            and (
              a.entity_id in (select sq.id::text from wireless.staff_queries sq where sq.profile_id = v_uid)
              or wireless.has_permission('hr_queries:manage')
            )
          )
          or (
            a.table_name = 'staff_query_messages'
            and (
              a.entity_id in (
                select m.id::text
                from wireless.staff_query_messages m
                join wireless.staff_queries q on q.id = m.query_id
                where q.profile_id = v_uid
              )
              or wireless.has_permission('hr_queries:manage')
            )
          )
        )
      order by a.created_at desc
      limit p_limit;
  end if;
end;
$$;
