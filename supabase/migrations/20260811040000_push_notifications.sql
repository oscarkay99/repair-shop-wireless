-- Push notifications for installed PWAs (Android + iOS 16.4+ home-screen
-- installs both support Web Push). Recipients mirror exactly what
-- wireless.get_my_notifications() already treats as "pertains to me" —
-- admin sees every notification-worthy event, everyone else only sees
-- their own actions or events on tickets they're an assigned technician
-- on — minus the actor themselves, since pushing someone a notification
-- about the action they just took is noise the in-app bell doesn't have
-- to worry about but a push notification does.

-- Added retroactively for reproducibility — this was enabled by hand at the
-- same time this migration was first applied, so a fresh environment
-- rebuilt from migrations alone would otherwise be missing it.
create extension if not exists pg_net with schema extensions;

-- ── 1. One row per subscribed browser/device ────────────────────────────
create table wireless.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references wireless.profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index push_subscriptions_profile_idx on wireless.push_subscriptions (profile_id);

alter table wireless.push_subscriptions enable row level security;

-- A user manages only their own subscriptions (one row per device they've
-- enabled notifications on — subscribing again from the same browser
-- upserts by endpoint rather than duplicating).
create policy push_subscriptions_all on wireless.push_subscriptions for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ── 2. Send trigger ───────────────────────────────────────────────────
-- Fires after the same audit_logs inserts get_my_notifications() already
-- surfaces (real actor, not a security event), computes who should be
-- pushed using that identical rule, and hands off to wireless-admin (the
-- existing internal service, reachable only on the docker-compose network)
-- to actually deliver the Web Push messages. Never blocks or fails the
-- write that triggered it — pg_net's http_post is fire-and-forget from a
-- background worker, so a push-delivery outage can't break ticket/invoice/
-- payment writes.
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

  if new.table_name = 'tickets' then
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
      'url', case when new.table_name = 'tickets' then '/tickets' else '/' end
    )
  );

  return new;
exception when others then
  -- pg_net or the internal service being unreachable must never break the
  -- write that triggered this — log to Postgres's own log and move on.
  raise warning 'notify_push_on_audit_log failed: %', sqlerrm;
  return new;
end;
$$;

create trigger trg_notify_push_on_audit_log
  after insert on wireless.audit_logs
  for each row execute function wireless.notify_push_on_audit_log();
