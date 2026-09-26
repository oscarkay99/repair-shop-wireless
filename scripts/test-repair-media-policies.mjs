// Run against an isolated PostgreSQL engine, never a live Supabase project:
// npm install --prefix /tmp/wireless-media-tests --no-save @electric-sql/pglite
// node scripts/test-repair-media-policies.mjs /tmp/wireless-media-tests
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
  // Minimal schema fixture. The migration and existing media-read policies
  // below are loaded from the actual SQL files, not copied implementations.
  await db.exec(`
    create role authenticated;
    create schema auth;
    create schema wireless;
    create schema storage;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create table wireless.profiles (id uuid primary key, role text, status text);
    create table wireless.technicians (id uuid primary key, profile_id uuid);
    create table wireless.tickets (id uuid primary key, ticket_number text unique);
    create table wireless.ticket_technicians (ticket_id uuid, technician_id uuid);
    create table wireless.ticket_media (
      ticket_number text, file_path text, uploaded_by_id uuid
    );
    create table storage.objects (bucket_id text, name text);
    alter table wireless.ticket_media enable row level security;
    alter table storage.objects enable row level security;
    grant usage on schema wireless, storage, auth to authenticated;
    grant select, insert, update, delete on all tables in schema wireless, storage to authenticated;
    create function wireless.current_user_role() returns text language sql stable security definer as $$
      select role from wireless.profiles where id = auth.uid() and status = 'active'
    $$;
    create function wireless.has_permission(text) returns boolean language sql stable security definer as $$
      select coalesce(wireless.current_user_role() in ('admin', 'receptionist', 'custom'), false)
    $$;
    create function wireless.current_role_scopes_tickets() returns boolean language sql stable security definer as $$
      select coalesce(wireless.current_user_role() = 'technician', false)
    $$;
    create function wireless.is_admin() returns boolean language sql stable security definer as $$
      select coalesce(wireless.current_user_role() = 'admin', false)
    $$;
    create function wireless.my_technician_id() returns uuid language sql stable security definer as $$
      select id from wireless.technicians where profile_id = auth.uid() limit 1
    $$;
    -- Deliberately broad grants prove that restrictive upload guards cannot
    -- be bypassed by unrelated permissive policies or generic media grants.
    create policy broad_insert on storage.objects for insert to authenticated with check (true);
    create policy broad_update on storage.objects for update to authenticated using (true) with check (true);
    create policy other_bucket_read on storage.objects for select to authenticated using (bucket_id <> 'repair-media');
    create policy repair_media_bucket_delete on storage.objects for delete to authenticated using (bucket_id = 'repair-media');
    create policy broad_delete on storage.objects for delete to authenticated using (true);
    create role anon;
    create policy broad_media_insert on wireless.ticket_media for insert to authenticated with check (true);
    create policy broad_media_update on wireless.ticket_media for update to authenticated using (true) with check (true);
    -- Simulate stale policies with broken dependencies. The new migration
    -- must remove them, not just add another permissive rule alongside them.
    create function public.legacy_media_policy() returns boolean language plpgsql as $$
      begin raise exception 'obsolete public schema dependency'; end
    $$;
    create policy repair_media_bucket_insert_staff_only on storage.objects
      for insert to authenticated with check (public.legacy_media_policy());
    create policy repair_media_bucket_read_staff_or_owner on storage.objects
      for select to authenticated using (public.legacy_media_policy());
  `);

  for (const [file, policy] of [
    ['20260728000000_ticket_multiple_technicians.sql', 'ticket_media_read'],
    ['20260806000000_repair_media_private_signed_urls.sql', '"repair_media_bucket_read"'],
  ]) {
    const sql = await sqlFile(file);
    const start = sql.indexOf(`create policy ${policy} `);
    assert.ok(start >= 0);
    await db.exec(sql.slice(start, sql.indexOf(';', start) + 1));
  }
  await db.exec(await sqlFile('20260926000000_technician_only_repair_uploads.sql'));
  await db.exec(await sqlFile('20260926010000_migration_ledger_and_media_delete.sql'));
  const actors = ['technician', 'technician', 'admin', 'receptionist', 'custom', 'technician'];
  for (const [i, role] of actors.entries()) {
    await db.query('insert into wireless.profiles values ($1, $2, $3)', [uid(i + 1), role, i === 5 ? 'pending' : 'active']);
    await db.query('insert into wireless.technicians values ($1, $1)', [uid(i + 1)]);
  }
  await db.exec(`
    insert into wireless.tickets values ('${uid(100)}', 'TK-OWN'), ('${uid(101)}', 'TK-OTHER');
    insert into wireless.ticket_technicians
      select '${uid(100)}', id from wireless.technicians where id <> '${uid(2)}';
    insert into wireless.ticket_technicians values ('${uid(101)}', '${uid(2)}');
  `);
  const asActor = async (actor, action) => {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [actor ? uid(actor) : '']);
    await db.exec('set role authenticated');
    try { return await action(); } finally { await db.exec('reset role'); }
  };
  const denied = async (actor, sql, params = []) => {
    await assert.rejects(asActor(actor, () => db.query(sql, params)), error => error.code === '42501');
    assertions++;
  };
  const upload = 'insert into storage.objects values ($1, $2) returning name';
  const attachment = 'insert into wireless.ticket_media values ($1, $2, $3) returning ticket_number';
  const path = 'repairs/TK-OWN/received/proof.jpg';

  // Upload response is readable before any attachment record exists.
  assert.equal((await asActor(1, () => db.query(upload, ['repair-media', path]))).rows.length, 1);
  assertions++;
  for (const actor of [2, 3, 4, 5, 6, null]) {
    await denied(actor, upload, ['repair-media', path]);
    await denied(actor, attachment, ['TK-OWN', path, actor ? uid(actor) : null]);
  }
  for (const invalidPath of ['other/TK-OWN/proof.jpg', 'repairs/TK-OTHER/received/proof.jpg', 'repairs/missing/received/proof.jpg', 'proof.jpg']) {
    await denied(1, upload, ['repair-media', invalidPath]);
  }
  await denied(1, attachment, ['TK-OWN', path, uid(3)]);
  await denied(1, attachment, ['TK-OWN', 'repairs/TK-OTHER/received/proof.jpg', uid(1)]);
  await denied(1, attachment, ['TK-OWN', null, uid(1)]);
  assert.equal((await asActor(1, () => db.query(attachment, ['TK-OWN', path, uid(1)]))).rows.length, 1);
  assertions++;

  // Admin/reception viewing remains available once the attachment exists.
  for (const actor of [3, 4]) {
    assert.equal((await asActor(actor, () => db.query('select * from storage.objects where name = $1', [path]))).rows.length, 1);
    assert.equal((await asActor(actor, () => db.query('update storage.objects set name = name where name = $1 returning name', [path]))).rows.length, 0);
    assert.equal((await asActor(actor, () => db.query('update wireless.ticket_media set file_path = file_path returning file_path'))).rows.length, 0);
    assertions += 3;
  }
  // Broad grants for other buckets still work, but moving into repair-media
  // or into a ticket assigned to somebody else is rejected.
  await asActor(3, () => db.query(upload, ['branding', 'logo.png']));
  await denied(3, 'update storage.objects set bucket_id = $1, name = $2 where bucket_id = $3', ['repair-media', path, 'branding']);
  await denied(1, 'update storage.objects set name = $1 where name = $2', ['repairs/TK-OTHER/received/proof.jpg', path]);
  await db.query('insert into wireless.ticket_technicians values ($1, $2)', [uid(100), uid(2)]);
  assert.equal((await asActor(2, () => db.query(upload, ['repair-media', 'repairs/TK-OWN/received/second.jpg']))).rows.length, 1);
  assertions++;
  await db.query('delete from wireless.ticket_technicians where technician_id = $1', [uid(1)]);
  await denied(1, upload, ['repair-media', 'repairs/TK-OWN/received/after-reassignment.jpg']);

  // Deleting repair evidence: only an admin or the currently assigned
  // technician. RLS filters deletes silently (0 rows), it doesn't raise.
  const del = 'delete from storage.objects where bucket_id = $1 and name = $2 returning name';
  const deleted = async (actor, bucket, name) => (await asActor(actor, () => db.query(del, [bucket, name]))).rows.length;
  assert.equal(await deleted(4, 'repair-media', path), 0);  // receptionist
  assert.equal(await deleted(5, 'repair-media', path), 0);  // custom role
  assert.equal(await deleted(1, 'repair-media', path), 0);  // no longer assigned
  assert.equal(await deleted(null, 'repair-media', path), 0);
  assert.equal(await deleted(2, 'repair-media', 'repairs/TK-OWN/received/second.jpg'), 1);
  assert.equal(await deleted(3, 'repair-media', path), 1);  // admin
  assert.equal(await deleted(3, 'branding', 'logo.png'), 1); // other buckets untouched
  assertions += 7;

  // The migration ledger is never reachable through the API roles.
  await denied(3, 'select * from wireless.schema_migrations');
  await denied(null, 'insert into wireless.schema_migrations (filename) values ($1)', ['x.sql']);

  console.log(`Repair media policies: ${assertions} assertions passed in isolated PostgreSQL.`);
} finally {
  await db.close();
}
