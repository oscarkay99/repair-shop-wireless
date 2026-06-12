create table if not exists public.repair_media (
  id uuid primary key default gen_random_uuid(),
  repair_id text not null references public.repairs(id) on delete cascade,
  stage text not null check (stage in ('received', 'diagnosed', 'parts_pending', 'in_progress', 'quality_check', 'ready', 'completed')),
  media_type text not null check (media_type in ('image', 'video')),
  file_path text,
  file_url text not null,
  thumbnail_url text,
  file_name text not null,
  file_size integer not null check (file_size > 0 and file_size <= 5242880),
  mime_type text not null,
  duration_seconds numeric(6, 2),
  caption text,
  uploaded_by text,
  created_at timestamptz not null default now()
);

create index if not exists repair_media_repair_id_idx on public.repair_media (repair_id);
create index if not exists repair_media_stage_idx on public.repair_media (stage);
create index if not exists repair_media_created_at_idx on public.repair_media (created_at desc);

alter table public.repair_media enable row level security;

drop policy if exists "repair_media_read_authenticated" on public.repair_media;
create policy "repair_media_read_authenticated"
on public.repair_media
for select
to authenticated
using (true);

drop policy if exists "repair_media_manage_limited_roles" on public.repair_media;
create policy "repair_media_manage_limited_roles"
on public.repair_media
for all
to authenticated
using (public.has_any_role(array['admin', 'technician']))
with check (public.has_any_role(array['admin', 'technician']));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'repair-media',
  'repair-media',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "repair_media_bucket_read_authenticated" on storage.objects;
create policy "repair_media_bucket_read_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'repair-media');

drop policy if exists "repair_media_bucket_insert_limited_roles" on storage.objects;
create policy "repair_media_bucket_insert_limited_roles"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'repair-media'
  and public.has_any_role(array['admin', 'technician'])
);

drop policy if exists "repair_media_bucket_update_limited_roles" on storage.objects;
create policy "repair_media_bucket_update_limited_roles"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'repair-media'
  and public.has_any_role(array['admin', 'technician'])
)
with check (
  bucket_id = 'repair-media'
  and public.has_any_role(array['admin', 'technician'])
);

drop policy if exists "repair_media_bucket_delete_limited_roles" on storage.objects;
create policy "repair_media_bucket_delete_limited_roles"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'repair-media'
  and public.has_any_role(array['admin', 'technician'])
);
