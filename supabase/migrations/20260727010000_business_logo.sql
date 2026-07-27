-- Lets an admin (or anyone with settings:edit) actually upload a business
-- logo from Settings > Branding — that button previously did nothing.

alter table wireless.settings add column logo_url text;

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy branding_bucket_read on storage.objects for select
  using (bucket_id = 'branding');

create policy branding_bucket_write on storage.objects for all
  to authenticated
  using (bucket_id = 'branding' and wireless.has_permission('settings:edit'))
  with check (bucket_id = 'branding' and wireless.has_permission('settings:edit'));
