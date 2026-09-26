-- Repair evidence may only be uploaded by an active technician assigned to
-- the ticket. Admin privileges and generic media grants are not exceptions.
-- Use a SECURITY DEFINER lookup to avoid nested ticket/assignment RLS and
-- rely exclusively on the current wireless schema, not legacy public data.
begin;

create or replace function wireless.can_upload_ticket_media(p_ticket_number text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from wireless.profiles p
    join wireless.technicians tech on tech.profile_id = p.id
    join wireless.ticket_technicians tt on tt.technician_id = tech.id
    join wireless.tickets t on t.id = tt.ticket_id
    where p.id = auth.uid()
      and p.status = 'active'
      and p.role = 'technician'
      and t.ticket_number = p_ticket_number
  );
$$;

revoke all on function wireless.can_upload_ticket_media(text) from public;
grant execute on function wireless.can_upload_ticket_media(text) to authenticated;

-- Remove policies left behind by the public -> wireless migration. They
-- otherwise continue evaluating obsolete role/table dependencies alongside
-- the current policies. Current wireless read/delete policies stay in place.
drop policy if exists repair_media_bucket_read_authenticated on storage.objects;
drop policy if exists repair_media_bucket_insert_limited_roles on storage.objects;
drop policy if exists repair_media_bucket_update_limited_roles on storage.objects;
drop policy if exists repair_media_bucket_delete_limited_roles on storage.objects;
drop policy if exists repair_media_bucket_read_staff_or_owner on storage.objects;
drop policy if exists repair_media_bucket_insert_staff_only on storage.objects;
drop policy if exists repair_media_bucket_update_staff_only on storage.objects;
drop policy if exists repair_media_bucket_delete_staff_only on storage.objects;

drop policy if exists repair_media_bucket_insert on storage.objects;
create policy repair_media_bucket_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'repair-media'
  and split_part(name, '/', 1) = 'repairs'
  and wireless.can_upload_ticket_media(split_part(name, '/', 2))
);

-- Restrictive guards prevent another permissive bucket-wide policy from
-- restoring admin/receptionist uploads. Other buckets are unaffected.
drop policy if exists repair_media_technician_insert_guard on storage.objects;
create policy repair_media_technician_insert_guard on storage.objects
as restrictive for insert to authenticated
with check (
  bucket_id <> 'repair-media'
  or (
    split_part(name, '/', 1) = 'repairs'
    and wireless.can_upload_ticket_media(split_part(name, '/', 2))
  )
);

-- The client creates unique objects (upsert:false). If another policy grants
-- UPDATE, it must not permit a non-technician to replace repair evidence or
-- move a file from another bucket into repair-media.
drop policy if exists repair_media_technician_update_guard on storage.objects;
create policy repair_media_technician_update_guard on storage.objects
as restrictive for update to authenticated
using (
  bucket_id <> 'repair-media'
  or (
    split_part(name, '/', 1) = 'repairs'
    and wireless.can_upload_ticket_media(split_part(name, '/', 2))
  )
)
with check (
  bucket_id <> 'repair-media'
  or (
    split_part(name, '/', 1) = 'repairs'
    and wireless.can_upload_ticket_media(split_part(name, '/', 2))
  )
);

-- Allow the assigned technician to read the newly uploaded object before
-- its ticket_media row exists (the upload response can require SELECT).
-- Other staff still read via the existing ticket_media-backed read policy.
drop policy if exists repair_media_assigned_technician_read on storage.objects;
create policy repair_media_assigned_technician_read on storage.objects
for select to authenticated
using (
  bucket_id = 'repair-media'
  and split_part(name, '/', 1) = 'repairs'
  and wireless.can_upload_ticket_media(split_part(name, '/', 2))
);

drop policy if exists ticket_media_insert on wireless.ticket_media;
create policy ticket_media_insert on wireless.ticket_media
for insert to authenticated
with check (wireless.can_upload_ticket_media(ticket_number));

drop policy if exists ticket_media_technician_insert_guard on wireless.ticket_media;
create policy ticket_media_technician_insert_guard on wireless.ticket_media
as restrictive for insert to authenticated
with check (
  wireless.can_upload_ticket_media(ticket_number)
  and uploaded_by_id = auth.uid()
  and split_part(file_path, '/', 1) = 'repairs'
  and split_part(file_path, '/', 2) = ticket_number
);

drop policy if exists ticket_media_technician_update_guard on wireless.ticket_media;
create policy ticket_media_technician_update_guard on wireless.ticket_media
as restrictive for update to authenticated
using (wireless.can_upload_ticket_media(ticket_number))
with check (
  wireless.can_upload_ticket_media(ticket_number)
  and uploaded_by_id = auth.uid()
  and split_part(file_path, '/', 1) = 'repairs'
  and split_part(file_path, '/', 2) = ticket_number
);

commit;
