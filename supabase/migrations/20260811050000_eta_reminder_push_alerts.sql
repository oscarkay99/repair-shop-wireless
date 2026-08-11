-- Scheduled (not event-triggered) push alerts for a ticket's promised ETA —
-- the one thing notify_push_on_audit_log() structurally can't do, since it
-- only ever fires when someone writes to the database. A ticket sitting
-- quietly as its ETA approaches has no write happening to hang a trigger
-- off, so this runs on a timer instead and checks the clock itself.
--
-- Two alerts per ticket, each sent exactly once per ETA (rescheduling a
-- ticket's eta_date resets both — see the trigger below):
--   1. "due soon"  — fires once, the moment a ticket comes within 24h of
--      its eta_date (mirrors etaTier()'s due_soon window exactly).
--   2. "overdue"   — fires once, the moment eta_date passes with the
--      ticket still open.
--
-- Recipients: admin (all), receptionist (all, matched by dashboard_variant
-- so any custom role actually routed to that portal is included, not just
-- one literally named "receptionist"), and whichever technician(s) are
-- assigned to that specific ticket — the person actually doing the work
-- gets alerted about their own ticket, not just oversight roles.

-- Already loaded via shared_preload_libraries on this instance (confirmed:
-- the standard Supabase Postgres image ships with it preloaded), so this
-- never needs a server restart — just registers the SQL-level objects.
create extension if not exists pg_cron with schema extensions;

alter table wireless.tickets
  add column if not exists eta_reminder_sent_at timestamptz,
  add column if not exists eta_overdue_alert_sent_at timestamptz;

-- Rescheduling a ticket's ETA (pushing it out, or pulling it in) means the
-- old promise no longer applies — give the new one its own fresh reminder
-- cycle rather than silently staying "already notified" against a deadline
-- that no longer exists.
create or replace function wireless.reset_eta_reminder_state()
returns trigger
language plpgsql
as $$
begin
  if new.eta_date is distinct from old.eta_date then
    new.eta_reminder_sent_at := null;
    new.eta_overdue_alert_sent_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reset_eta_reminder_state on wireless.tickets;
create trigger trg_reset_eta_reminder_state
  before update of eta_date on wireless.tickets
  for each row execute function wireless.reset_eta_reminder_state();

create or replace function wireless.check_eta_reminders()
returns void
language plpgsql
security definer
set search_path = wireless, public, extensions
as $$
declare
  t record;
  v_recipients uuid[];
  v_secret text := current_setting('app.settings.internal_push_secret', true);
  v_active_statuses text[] := array['received','diagnosis_paid','diagnosing','awaiting_approval','parts_pending','in_progress','ready'];
begin
  -- ── Due soon: within 24h of eta_date, not yet reminded ────────────────
  for t in
    select id, ticket_number, device
    from wireless.tickets
    where status = any(v_active_statuses)
      and eta_date is not null
      and eta_date > now()
      and eta_date <= now() + interval '24 hours'
      and eta_reminder_sent_at is null
  loop
    select array_agg(distinct p) into v_recipients from (
      select id as p from wireless.profiles where role = 'admin' and status = 'active'
      union
      select pr.id as p from wireless.profiles pr
        join wireless.roles r on r.id = pr.role
        where r.dashboard_variant = 'receptionist' and pr.status = 'active'
      union
      select tech.profile_id as p from wireless.ticket_technicians tt
        join wireless.technicians tech on tech.id = tt.technician_id
        where tt.ticket_id = t.id and tech.profile_id is not null
    ) recipients;

    if v_recipients is not null and array_length(v_recipients, 1) > 0 then
      perform net.http_post(
        url := 'http://wireless-admin:8787/send-push',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(v_secret, '')),
        body := jsonb_build_object(
          'recipients', to_jsonb(v_recipients),
          'title', format('Ticket %s due soon', t.ticket_number),
          'body', format('%s is due within 24 hours.', t.device),
          'url', '/tickets'
        )
      );
    end if;

    update wireless.tickets set eta_reminder_sent_at = now() where id = t.id;
  end loop;

  -- ── Overdue: eta_date has passed, not yet alerted ─────────────────────
  for t in
    select id, ticket_number, device
    from wireless.tickets
    where status = any(v_active_statuses)
      and eta_date is not null
      and eta_date <= now()
      and eta_overdue_alert_sent_at is null
  loop
    select array_agg(distinct p) into v_recipients from (
      select id as p from wireless.profiles where role = 'admin' and status = 'active'
      union
      select pr.id as p from wireless.profiles pr
        join wireless.roles r on r.id = pr.role
        where r.dashboard_variant = 'receptionist' and pr.status = 'active'
      union
      select tech.profile_id as p from wireless.ticket_technicians tt
        join wireless.technicians tech on tech.id = tt.technician_id
        where tt.ticket_id = t.id and tech.profile_id is not null
    ) recipients;

    if v_recipients is not null and array_length(v_recipients, 1) > 0 then
      perform net.http_post(
        url := 'http://wireless-admin:8787/send-push',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(v_secret, '')),
        body := jsonb_build_object(
          'recipients', to_jsonb(v_recipients),
          'title', format('Ticket %s is overdue', t.ticket_number),
          'body', format('%s has passed its promised ETA.', t.device),
          'url', '/tickets'
        )
      );
    end if;

    update wireless.tickets set eta_overdue_alert_sent_at = now() where id = t.id;
  end loop;
exception when others then
  raise warning 'check_eta_reminders failed: %', sqlerrm;
end;
$$;

-- cron.schedule() upserts by jobname, so this is safe to re-run.
select cron.schedule('wireless-eta-reminders', '*/30 * * * *', $$select wireless.check_eta_reminders()$$);
