-- Aligns wireless.tickets with the frontend's Repair domain model (diagnosis-first
-- workflow, quote/approval flow, denormalized customer contact, parts/notes/payments),
-- adds a ticket_media table for the technician photo-log feature, and finishes the
-- sales_rep -> retired role cleanup that was drafted but never applied (no DB access
-- at the time).

-- ============================================================
-- 1. Role cleanup: retire 'sales_rep', add 'receptionist'
-- ============================================================

alter table wireless.profiles drop constraint if exists profiles_role_check;
alter table wireless.profiles add constraint profiles_role_check
  check (role in ('admin','sales_manager','sales_rep','technician','inventory_manager','receptionist'));

update wireless.profiles set role = 'receptionist' where role = 'sales_rep';

alter table wireless.profiles alter column role set default 'receptionist';
alter table wireless.profiles drop constraint if exists profiles_role_check;
alter table wireless.profiles add constraint profiles_role_check
  check (role in ('admin','sales_manager','technician','inventory_manager','receptionist'));

create or replace function wireless.handle_new_user()
returns trigger language plpgsql security definer
set search_path = wireless as $$
begin
  insert into wireless.profiles (id, email, name, role, avatar)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,'user'),'@',1)),
    case
      when coalesce(new.raw_user_meta_data->>'role','') in
           ('admin','sales_manager','technician','inventory_manager','receptionist')
        then new.raw_user_meta_data->>'role'
      else 'receptionist'
    end,
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.email,'U')),1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop policy if exists "customers_write" on wireless.customers;
create policy "customers_write" on wireless.customers for all to authenticated
  using  (wireless.has_any_role(array['admin','sales_manager']))
  with check (wireless.has_any_role(array['admin','sales_manager']));

drop policy if exists "accessory_sales_write" on wireless.accessory_sales;
create policy "accessory_sales_write" on wireless.accessory_sales for all to authenticated
  using  (wireless.has_any_role(array['admin','sales_manager']))
  with check (wireless.has_any_role(array['admin','sales_manager']));

drop policy if exists "sale_items_write" on wireless.sale_items;
create policy "sale_items_write" on wireless.sale_items for all to authenticated
  using  (wireless.has_any_role(array['admin','sales_manager']))
  with check (wireless.has_any_role(array['admin','sales_manager']));

drop policy if exists "audit_logs_read" on wireless.audit_logs;
create policy "audit_logs_read" on wireless.audit_logs for select to authenticated
  using (wireless.has_any_role(array['admin','sales_manager','inventory_manager']));

-- ============================================================
-- 2. Extend wireless.tickets to match the frontend Repair model
-- ============================================================

alter table wireless.tickets alter column customer_id drop not null;
alter table wireless.tickets drop constraint if exists tickets_customer_id_fkey;
alter table wireless.tickets add constraint tickets_customer_id_fkey
  foreign key (customer_id) references wireless.customers(id) on delete set null;

alter table wireless.tickets drop constraint if exists tickets_status_check;
alter table wireless.tickets add constraint tickets_status_check
  check (status in (
    'received','diagnosis_paid','diagnosing','awaiting_approval','parts_pending',
    'in_progress','ready','completed','diagnosis_only_closed','cancelled'
  ));
alter table wireless.tickets alter column status set default 'received';

alter table wireless.tickets
  add column if not exists customer_name         text not null default '',
  add column if not exists customer_email        text,
  add column if not exists customer_phone        text,
  add column if not exists website_auth_user_id  uuid,
  add column if not exists device_type           text not null default 'Other',
  add column if not exists job_type              text not null default 'diagnosis_to_repair'
    check (job_type in ('diagnosis_only','diagnosis_to_repair')),
  add column if not exists service_stage         text not null default 'diagnosis'
    check (service_stage in ('intake','diagnosis','approval','repair','pickup','closed')),
  add column if not exists quote_status          text not null default 'not_sent'
    check (quote_status in ('not_sent','pending','approved','declined')),
  add column if not exists diagnosis_fee         numeric not null default 200,
  add column if not exists diagnosis_paid_at     timestamptz,
  add column if not exists quote_amount          numeric,
  add column if not exists quote_sent_at         timestamptz,
  add column if not exists approval_decision_at  timestamptz,
  add column if not exists repair_started_at     timestamptz,
  add column if not exists technician_name       text not null default '',
  add column if not exists eta                   text not null default '',
  add column if not exists cost_label            text not null default 'TBD',
  add column if not exists warranty              boolean not null default false,
  add column if not exists parts_json            jsonb not null default '[]',
  add column if not exists notes_json            jsonb not null default '[]',
  add column if not exists payments_json          jsonb not null default '[]';

create index if not exists tickets_customer_phone_idx on wireless.tickets (customer_phone);
create index if not exists tickets_website_auth_user_idx on wireless.tickets (website_auth_user_id);

comment on column wireless.tickets.technician_name is
  'Denormalized technician display name used by the frontend; technician_id FK kept for future relational use, not yet synced by the app.';
comment on column wireless.tickets.parts_json is
  'Simple pending/ordered/installed status list shown to technicians. wireless.ticket_parts is a separate relational parts-consumption/billing ledger, not yet wired to the frontend.';
comment on column wireless.tickets.notes_json is
  'Free-text technician notes as shown in the app. wireless.ticket_comments is a richer relational alternative (author + internal flag), not yet wired to the frontend.';

-- ============================================================
-- 3. Tickets policies: only admin/receptionist create tickets
-- ============================================================

drop policy if exists "tickets_insert" on wireless.tickets;
create policy "tickets_insert" on wireless.tickets for insert to authenticated
  with check (wireless.has_any_role(array['admin','receptionist']));

drop policy if exists "tickets_update" on wireless.tickets;
create policy "tickets_update" on wireless.tickets for update to authenticated
  using (
    wireless.has_any_role(array['admin','receptionist'])
    or (wireless.current_user_role() = 'technician'
        and technician_id = (select id from wireless.technicians where profile_id = auth.uid() limit 1))
  )
  with check (
    wireless.has_any_role(array['admin','receptionist'])
    or wireless.current_user_role() = 'technician'
  );

-- ============================================================
-- 4. ticket_media (technician photo log)
-- ============================================================

create table if not exists wireless.ticket_media (
  id                uuid primary key default gen_random_uuid(),
  ticket_number     text not null references wireless.tickets(ticket_number) on delete cascade,
  stage             text not null check (stage in
                      ('received','diagnosed','parts_pending','in_progress','quality_check','ready','completed')),
  media_type        text not null check (media_type in ('image','video')),
  file_path         text,
  file_url          text not null,
  thumbnail_url     text,
  file_name         text not null,
  file_size         integer not null check (file_size > 0 and file_size <= 5242880),
  mime_type         text not null,
  duration_seconds  numeric(6,2),
  caption           text,
  uploaded_by       text,
  uploaded_by_id    uuid references wireless.profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists ticket_media_ticket_number_idx on wireless.ticket_media (ticket_number);
create index if not exists ticket_media_stage_idx on wireless.ticket_media (stage);

alter table wireless.ticket_media enable row level security;

drop policy if exists "ticket_media_read" on wireless.ticket_media;
create policy "ticket_media_read" on wireless.ticket_media for select to authenticated
  using (true);

drop policy if exists "ticket_media_insert" on wireless.ticket_media;
create policy "ticket_media_insert" on wireless.ticket_media for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists "ticket_media_delete" on wireless.ticket_media;
create policy "ticket_media_delete" on wireless.ticket_media for delete to authenticated
  using (uploaded_by_id = auth.uid() or wireless.has_any_role(array['admin','receptionist']));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'repair-media', 'repair-media', true, 5242880,
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "repair_media_bucket_read" on storage.objects;
create policy "repair_media_bucket_read" on storage.objects for select
  using (bucket_id = 'repair-media');

drop policy if exists "repair_media_bucket_insert" on storage.objects;
create policy "repair_media_bucket_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'repair-media');

drop policy if exists "repair_media_bucket_delete" on storage.objects;
create policy "repair_media_bucket_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'repair-media');

grant select, insert, delete on wireless.ticket_media to authenticated;
