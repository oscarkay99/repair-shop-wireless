-- HR staff folder: a document repository per profile (contracts, IDs,
-- certificates, disciplinary/performance records, payroll docs). Keyed off
-- profiles.id so every role — not just technicians — has a folder.
--
-- Private storage bucket + storage.objects RLS that joins the object name
-- back to this metadata table mirrors repair-media's own private-bucket
-- pattern exactly (20260806000000_repair_media_private_signed_urls.sql).
-- `confidential` lets HR keep a document (e.g. a disciplinary file) out of
-- the owner's own view while still being visible to HR/managers.

create table wireless.staff_documents (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references wireless.profiles(id) on delete cascade,
  file_path     text not null,
  file_name     text not null,
  file_size     integer,
  mime_type     text,
  category      text not null default 'other'
                check (category in ('contract', 'id', 'certificate', 'performance', 'disciplinary', 'payroll', 'other')),
  title         text,
  notes         text,
  confidential  boolean not null default false,
  uploaded_by   uuid references wireless.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index staff_documents_profile_idx on wireless.staff_documents (profile_id, created_at desc);

alter table wireless.staff_documents enable row level security;

create policy staff_documents_read on wireless.staff_documents for select to authenticated
  using (
    wireless.has_permission('hr_documents:view')
    or wireless.has_permission('hr_documents:manage')
    or (profile_id = auth.uid() and confidential = false)
  );

create policy staff_documents_insert on wireless.staff_documents for insert to authenticated
  with check (wireless.has_permission('hr_documents:manage'));

create policy staff_documents_update on wireless.staff_documents for update to authenticated
  using (wireless.has_permission('hr_documents:manage'))
  with check (wireless.has_permission('hr_documents:manage'));

create policy staff_documents_delete on wireless.staff_documents for delete to authenticated
  using (wireless.has_permission('hr_documents:manage'));

create trigger set_updated_at before update on wireless.staff_documents
  for each row execute function wireless.set_updated_at();

create trigger audit_staff_documents_changes
  after insert or delete or update on wireless.staff_documents
  for each row execute function wireless.capture_audit_log();

-- ── Private storage bucket ───────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'staff-documents',
  'staff-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "staff_documents_bucket_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'staff-documents'
    and exists (
      select 1 from wireless.staff_documents d
      where d.file_path = storage.objects.name
        and (
          wireless.has_permission('hr_documents:view')
          or wireless.has_permission('hr_documents:manage')
          or (d.profile_id = auth.uid() and d.confidential = false)
        )
    )
  );

create policy "staff_documents_bucket_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'staff-documents' and wireless.has_permission('hr_documents:manage'));

create policy "staff_documents_bucket_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'staff-documents' and wireless.has_permission('hr_documents:manage'));

-- ── Permissions ───────────────────────────────────────────────────────
update wireless.roles set permissions = permissions || array['hr_documents:view', 'hr_documents:manage']
where id = 'hr' and not ('hr_documents:manage' = any(permissions));

update wireless.roles set permissions = permissions || array['hr_documents:view']
where id = 'manager' and not ('hr_documents:view' = any(permissions));
