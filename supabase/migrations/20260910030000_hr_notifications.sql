-- Wires the new HR tables (leave_requests, staff_queries,
-- staff_query_messages) into the existing bell feed and push notification
-- pipeline, following the exact additive-branch pattern
-- 20260901000000_notify_technician_on_assignment.sql used to widen these
-- same two functions for ticket_technicians. Both functions are replaced in
-- full (not diffed) since Postgres has no partial function alter — every
-- branch below is additive, nothing from the previous version is removed.
--
-- Recipients:
--   leave_requests        — the requester sees any update to their own row;
--                            everyone holding leave:manage sees a new
--                            (pending) request land, so they know to act.
--   staff_queries          — the queried staff member sees it issued/closed;
--                            everyone holding hr_queries:manage sees it too
--                            (oversight, and so a second HR user picks up
--                            after the one who issued it).
--   staff_query_messages    — same recipients as the parent query: the
--                            queried staff member and hr_queries:manage
--                            holders, whichever side didn't just post.

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
              a.entity_id in (select id::text from wireless.leave_requests where profile_id = v_uid)
              or (wireless.has_permission('leave:manage') and a.action = 'insert')
            )
          )
          or (
            a.table_name = 'staff_queries'
            and (
              a.entity_id in (select id::text from wireless.staff_queries where profile_id = v_uid)
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

create or replace function wireless.notify_push_on_audit_log()
returns trigger
language plpgsql
security definer
set search_path = wireless, public, extensions
as $$
declare
  v_recipients uuid[];
  v_title text;
  v_secret text;
  v_url text := '/';
begin
  if new.actor_name is null or new.table_name = 'security' then
    return new;
  end if;

  select array_agg(id) into v_recipients
  from wireless.profiles
  where role = 'admin' and status = 'active' and id is distinct from new.actor_id;

  if new.table_name in ('tickets', 'ticket_technicians') then
    v_recipients := coalesce(v_recipients, array[]::uuid[]) || coalesce((
      select array_agg(distinct tech.profile_id)
      from wireless.ticket_technicians tt
      join wireless.technicians tech on tech.id = tt.technician_id
      where tt.ticket_id::text = new.entity_id
        and tech.profile_id is not null
        and tech.profile_id is distinct from new.actor_id
    ), array[]::uuid[]);
    v_url := '/tickets';
  end if;

  if new.table_name = 'leave_requests' then
    v_recipients := coalesce(v_recipients, array[]::uuid[]) || coalesce((
      select array_agg(distinct p.id)
      from wireless.profiles p
      join wireless.roles r on r.id = p.role
      where p.status = 'active'
        and 'leave:manage' = any(r.permissions)
        and p.id is distinct from new.actor_id
    ), array[]::uuid[]) || coalesce((
      select array_agg(lr.profile_id)
      from wireless.leave_requests lr
      where lr.id::text = new.entity_id
        and lr.profile_id is distinct from new.actor_id
    ), array[]::uuid[]);
    v_url := '/profile';
  end if;

  if new.table_name = 'staff_queries' then
    v_recipients := coalesce(v_recipients, array[]::uuid[]) || coalesce((
      select array_agg(distinct p.id)
      from wireless.profiles p
      join wireless.roles r on r.id = p.role
      where p.status = 'active'
        and 'hr_queries:manage' = any(r.permissions)
        and p.id is distinct from new.actor_id
    ), array[]::uuid[]) || coalesce((
      select array_agg(q.profile_id)
      from wireless.staff_queries q
      where q.id::text = new.entity_id
        and q.profile_id is distinct from new.actor_id
    ), array[]::uuid[]);
    v_url := '/profile';
  end if;

  if new.table_name = 'staff_query_messages' then
    v_recipients := coalesce(v_recipients, array[]::uuid[]) || coalesce((
      select array_agg(distinct p.id)
      from wireless.profiles p
      join wireless.roles r on r.id = p.role
      where p.status = 'active'
        and 'hr_queries:manage' = any(r.permissions)
        and p.id is distinct from new.actor_id
    ), array[]::uuid[]) || coalesce((
      select array_agg(distinct q.profile_id)
      from wireless.staff_query_messages m
      join wireless.staff_queries q on q.id = m.query_id
      where m.id::text = new.entity_id
        and q.profile_id is distinct from new.actor_id
    ), array[]::uuid[]);
    v_url := '/profile';
  end if;

  if v_recipients is null or array_length(v_recipients, 1) is null then
    return new;
  end if;

  v_title := format('%s %s a %s record', new.actor_name, new.action, new.table_name);
  v_secret := current_setting('app.settings.internal_push_secret', true);

  perform net.http_post(
    url := 'http://wireless-admin:8787/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object(
      'recipients', to_jsonb(array(select distinct unnest(v_recipients))),
      'title', v_title,
      'body', coalesce(new.action, 'update') || ' on ' || new.table_name,
      'url', v_url
    )
  );

  return new;
exception when others then
  raise warning 'notify_push_on_audit_log failed: %', sqlerrm;
  return new;
end;
$$;
