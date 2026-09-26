// Run against an isolated PostgreSQL engine, never a live Supabase project:
// npm install --prefix /tmp/wireless-media-tests --no-save @electric-sql/pglite
// node scripts/test-ticket-ready-stamp.mjs /tmp/wireless-media-tests
//
// Proves the "job done" stamp coexists with the technician guard trigger:
// an assigned technician can still mark a ticket ready, the database (not
// the client) sets ready_at, a technician can't write ready_at themselves,
// and reception is pushed exactly once.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(resolve(process.argv[2] ?? '.', 'package.json'));
const { PGlite } = require('@electric-sql/pglite');
const db = new PGlite();
const sqlFile = name => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
const uid = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
let assertions = 0;

try {
  await db.exec(`
    create role authenticated;
    create schema auth; create schema wireless; create schema net; create schema extensions;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create table wireless.profiles (id uuid primary key, name text, role text, status text);
    create table wireless.technicians (id uuid primary key, profile_id uuid);
    create table wireless.tickets (
      id uuid primary key, ticket_number text, device text, status text,
      service_stage text, completed_at timestamptz, notes_json jsonb, job_type text,
      updated_at timestamptz, parts_json jsonb, customer_name text
    );
    create table wireless.ticket_technicians (ticket_id uuid, technician_id uuid);
    create table wireless.audit_logs (
      id serial, table_name text, entity_id text, created_at timestamptz,
      before_data jsonb, after_data jsonb
    );
    -- pg_net stand-in: record what would have been sent.
    create table net.sent (url text, body jsonb);
    create function net.http_post(url text, headers jsonb, body jsonb) returns bigint language sql as $$
      insert into net.sent values (url, body) returning 1::bigint
    $$;
    create function wireless.current_user_role() returns text language sql stable security definer as $$
      select role from wireless.profiles where id = auth.uid() and status = 'active'
    $$;
    create function wireless.is_admin() returns boolean language sql stable security definer as $$
      select coalesce(wireless.current_user_role() = 'admin', false)
    $$;
    create function wireless.current_role_scopes_tickets() returns boolean language sql stable security definer as $$
      select coalesce(wireless.current_user_role() = 'technician', false)
    $$;
    create function wireless.set_updated_at() returns trigger language plpgsql as $$
      begin new.updated_at := now(); return new; end
    $$;
    create trigger set_updated_at before update on wireless.tickets
      for each row execute function wireless.set_updated_at();
    grant usage on schema wireless, auth, net to authenticated;
    grant select, insert, update on all tables in schema wireless, net to authenticated;
    grant execute on all functions in schema net to authenticated;
  `);

  // The real technician guard, as currently deployed.
  await db.exec(await sqlFile('20260826000000_fix_technician_recommended_parts_update.sql'));
  await db.exec(`create trigger trg_prevent_unauthorized_ticket_status_change before update on wireless.tickets
    for each row execute function wireless.prevent_unauthorized_ticket_status_change();`);

  // A ticket already ready before the migration, with audit history.
  await db.exec(`
    insert into wireless.profiles values
      ('${uid(1)}', 'Kofi', 'technician', 'active'),
      ('${uid(2)}', 'Yaw', 'technician', 'active'),
      ('${uid(3)}', 'Ama', 'receptionist', 'active'),
      ('${uid(4)}', 'Esther', 'manager', 'active'),
      ('${uid(5)}', 'Old', 'receptionist', 'inactive');
    insert into wireless.technicians values ('${uid(11)}', '${uid(1)}'), ('${uid(12)}', '${uid(2)}');
    insert into wireless.tickets (id, ticket_number, device, status, updated_at) values
      ('${uid(100)}', 'TK-1', 'iPhone 13', 'in_progress', now()),
      ('${uid(101)}', 'TK-OLD', 'Galaxy S21', 'ready', '2026-09-20T10:00:00Z');
    insert into wireless.ticket_technicians values ('${uid(100)}', '${uid(11)}'), ('${uid(101)}', '${uid(11)}');
    insert into wireless.audit_logs (table_name, entity_id, created_at, before_data, after_data) values
      ('tickets', '${uid(101)}', '2026-09-19T15:00:00Z', '{"status":"in_progress"}', '{"status":"ready"}');
  `);

  await db.exec(await sqlFile('20260926020000_ticket_ready_at_and_reception_push.sql'));

  const one = async sql => (await db.query(sql)).rows[0];
  const asActor = async (actor, sql) => {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid(actor)]);
    await db.exec('set role authenticated');
    try { return await db.query(sql); } finally { await db.exec('reset role'); }
  };

  // Backfill took the audit timestamp and didn't bump updated_at or push.
  const old = await one(`select ready_at, updated_at from wireless.tickets where ticket_number = 'TK-OLD'`);
  assert.equal(new Date(old.ready_at).toISOString(), '2026-09-19T15:00:00.000Z');
  assert.equal(new Date(old.updated_at).toISOString(), '2026-09-20T10:00:00.000Z');
  assert.equal((await one('select count(*)::int n from net.sent')).n, 0);
  assertions += 3;

  // Unassigned technician still can't change status.
  await assert.rejects(asActor(2, `update wireless.tickets set status = 'ready' where ticket_number = 'TK-1'`),
    /Only an assigned technician or an admin/);
  // Assigned technician can't set ready_at directly (can't fake "done").
  await assert.rejects(asActor(1, `update wireless.tickets set ready_at = now() - interval '3 days' where ticket_number = 'TK-1'`),
    /Technicians can only update a ticket's progress/);
  assertions += 2;

  // Assigned technician marks the job done, with the fields the app sends.
  await asActor(1, `update wireless.tickets set status = 'ready', service_stage = 'pickup' where ticket_number = 'TK-1'`);
  const done = await one(`select status, ready_at from wireless.tickets where ticket_number = 'TK-1'`);
  assert.equal(done.status, 'ready');
  assert.ok(done.ready_at, 'ready_at stamped');
  assertions += 2;

  const sent = (await db.query('select url, body from net.sent')).rows;
  assert.equal(sent.length, 1);
  assert.equal(sent[0].body.title, 'Job done: TK-1');
  assert.equal(sent[0].body.body, 'iPhone 13 is ready for pickup (finished by Kofi)');
  assert.deepEqual([...sent[0].body.recipients].sort(), [uid(3), uid(4)]); // active reception + manager only
  assertions += 4;

  // Collecting later keeps ready_at and doesn't push again.
  await asActor(1, `update wireless.tickets set status = 'completed', completed_at = now() where ticket_number = 'TK-1'`);
  const collected = await one(`select ready_at from wireless.tickets where ticket_number = 'TK-1'`);
  assert.equal(new Date(collected.ready_at).getTime(), new Date(done.ready_at).getTime());
  assert.equal((await one('select count(*)::int n from net.sent')).n, 1);
  assertions += 2;

  console.log(`Ticket ready stamp: ${assertions} assertions passed in isolated PostgreSQL.`);
} finally {
  await db.close();
}
