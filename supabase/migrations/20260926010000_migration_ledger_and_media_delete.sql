-- 1. Migration ledger. Migrations have been applied by hand over SSH with no
-- record of which ones reached production (SECURITY.md already flagged the
-- 2026-09-18 RLS migration as possibly unapplied), and one manual apply
-- ended with supabase_admin's password being reset out from under the
-- storage service. ops/wireless/apply-migration.sh is now the only
-- supported path: it backs up, applies, and records the file here, and
-- `--status` diffs the repo against this table.
--
-- 2. repair-media deletes. "repair_media_bucket_delete" let any signed-in
-- user delete any object in the bucket, i.e. destroy repair evidence. The
-- app never deletes storage objects itself (removing a photo only deletes
-- its ticket_media row), so deletes are limited to an admin or the
-- technician currently assigned to that ticket.
begin;

create table if not exists wireless.schema_migrations (
  filename    text primary key,
  sha256      text,
  applied_at  timestamptz not null default now(),
  applied_by  text not null default current_user,
  -- 'applied'  : recorded by apply-migration.sh at apply time
  -- 'baseline' : pre-ledger migration, recorded retroactively
  source      text not null default 'applied' check (source in ('applied', 'baseline'))
);

alter table wireless.schema_migrations enable row level security;
revoke all on wireless.schema_migrations from anon, authenticated;

drop policy if exists repair_media_bucket_delete on storage.objects;
create policy repair_media_bucket_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'repair-media'
  and (
    wireless.is_admin()
    or (
      split_part(name, '/', 1) = 'repairs'
      and wireless.can_upload_ticket_media(split_part(name, '/', 2))
    )
  )
);

-- Restrictive, so a future bucket-wide permissive delete policy can't
-- silently reopen this.
drop policy if exists repair_media_delete_guard on storage.objects;
create policy repair_media_delete_guard on storage.objects
as restrictive for delete to authenticated
using (
  bucket_id <> 'repair-media'
  or wireless.is_admin()
  or (
    split_part(name, '/', 1) = 'repairs'
    and wireless.can_upload_ticket_media(split_part(name, '/', 2))
  )
);

commit;
