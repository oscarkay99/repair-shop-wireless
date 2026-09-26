-- "Job done" visibility for reception.
--
-- A technician finishing a job moves the ticket to `ready`, but nothing
-- recorded *when*: reception's "Done Today" counted completed_at, which is
-- only set once the customer collects, so finished jobs never showed up
-- there. And the only push on a status change was the generic
-- "<name> update a tickets record" sent to admins and the assigned techs,
-- never to reception, who hand the device back.
--
-- 1. tickets.ready_at: stamped by the database when a ticket enters
--    `ready`, so no client can forget or fake it. The trigger's name sorts
--    after trg_prevent_unauthorized_ticket_status_change (same-timing
--    triggers fire alphabetically), so the technician guard compares only
--    what the technician actually changed and never rejects the stamp.
-- 2. Backfilled from the audit log for tickets already ready or completed.
-- 3. A push to active receptionists and managers when a job is done.
begin;

alter table wireless.tickets add column if not exists ready_at timestamptz;

create or replace function wireless.stamp_ticket_ready_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'ready' and old.status is distinct from 'ready' then
    new.ready_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_ticket_ready_at on wireless.tickets;
create trigger trg_stamp_ticket_ready_at
  before update of status on wireless.tickets
  for each row
  when (new.status is distinct from old.status)
  execute function wireless.stamp_ticket_ready_at();

-- Backfill without firing user triggers: no audit rows, no push, and no
-- updated_at bump (which would reset every ticket's staleness clock).
alter table wireless.tickets disable trigger user;
update wireless.tickets t
set ready_at = coalesce((
  select max(a.created_at)
  from wireless.audit_logs a
  where a.table_name = 'tickets'
    and a.entity_id = t.id::text
    and a.after_data ->> 'status' = 'ready'
    and coalesce(a.before_data ->> 'status', '') <> 'ready'
), case when t.status = 'ready' then t.updated_at end)
where t.status in ('ready', 'completed')
  and t.ready_at is null;
alter table wireless.tickets enable trigger user;

create or replace function wireless.notify_reception_job_done()
returns trigger
language plpgsql
security definer
set search_path = wireless, public, extensions
as $$
declare
  v_recipients uuid[];
  v_actor text;
begin
  select array_agg(id) into v_recipients
  from wireless.profiles
  where role in ('receptionist', 'manager')
    and status = 'active'
    and id is distinct from auth.uid();

  if v_recipients is null then
    return new;
  end if;

  select name into v_actor from wireless.profiles where id = auth.uid();

  perform net.http_post(
    url := 'http://wireless-admin:8787/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', coalesce(current_setting('app.settings.internal_push_secret', true), '')
    ),
    body := jsonb_build_object(
      'recipients', to_jsonb(v_recipients),
      'title', format('Job done: %s', new.ticket_number),
      'body', format('%s is ready for pickup%s', coalesce(nullif(new.device, ''), 'Device'),
                     coalesce(' (finished by ' || v_actor || ')', '')),
      'url', '/reception'
    )
  );
  return new;
exception when others then
  -- Push delivery must never block a status change.
  raise warning 'notify_reception_job_done failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists trg_notify_reception_job_done on wireless.tickets;
create trigger trg_notify_reception_job_done
  after update of status on wireless.tickets
  for each row
  when (new.status = 'ready' and old.status is distinct from 'ready')
  execute function wireless.notify_reception_job_done();

commit;
