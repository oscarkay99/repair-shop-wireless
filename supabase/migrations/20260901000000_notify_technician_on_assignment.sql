-- Technician assignment has lived exclusively in wireless.ticket_technicians
-- since 20260728000000 (tickets.technician_id is frozen, no longer written —
-- see src/services/repairs.ts setTicketTechnicians, always a delete+insert
-- into ticket_technicians). But two things still only know about the old
-- world:
--
-- 1. wireless.capture_audit_log() derives entity_id from `->>'id'` only.
--    ticket_technicians has a composite primary key (ticket_id,
--    technician_id) and no id column, so every assignment audit row lands
--    with entity_id = null.
-- 2. wireless.get_my_notifications() and wireless.notify_push_on_audit_log()
--    both gate their "is this a ticket event?" branch on
--    table_name = 'tickets' — a ticket_technicians row never matches, even
--    once it has a usable entity_id.
--
-- Combined, an assigned technician currently gets no bell notification and
-- no push when a receptionist/admin assigns them to a ticket — they only
-- ever see events they personally caused. Fixes both layers so assignment
-- notifies the same way any other ticket event already does.

-- ── 1. Give ticket_technicians rows a usable entity_id ──────────────────
-- Falls back to ticket_id only when 'id' is absent, so every other audited
-- table (all of which have a real id column) is unaffected.
create or replace function wireless.capture_audit_log()
returns trigger
language plpgsql
security definer
set search_path = wireless
as $$
declare
  actor_id   uuid := auth.uid();
  actor_name text;
  entity_id  text;
  old_row    jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  new_row    jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
begin
  if tg_table_name = 'audit_logs' then return coalesce(new, old); end if;

  entity_id := coalesce(
    coalesce(new_row, old_row) ->> 'id',
    coalesce(new_row, old_row) ->> 'ticket_id'
  );
  if actor_id is not null then
    select name into actor_name from wireless.profiles where id = actor_id;
  end if;

  insert into wireless.audit_logs (action, table_name, entity_id, actor_id, actor_name, before_data, after_data)
  values (lower(tg_op), tg_table_name, entity_id, actor_id, actor_name, old_row, new_row);

  return coalesce(new, old);
exception when others then
  return coalesce(new, old);
end;
$$;

-- ── 2. Bell feed: treat ticket_technicians like tickets ─────────────────
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
        )
      order by a.created_at desc
      limit p_limit;
  end if;
end;
$$;

-- ── 3. Push: same widening, same recipient rule ──────────────────────────
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
      'recipients', to_jsonb(v_recipients),
      'title', v_title,
      'body', coalesce(new.action, 'update') || ' on ' || new.table_name,
      'url', case when new.table_name in ('tickets', 'ticket_technicians') then '/tickets' else '/' end
    )
  );

  return new;
exception when others then
  raise warning 'notify_push_on_audit_log failed: %', sqlerrm;
  return new;
end;
$$;
