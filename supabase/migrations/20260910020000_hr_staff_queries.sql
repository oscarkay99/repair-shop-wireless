-- HR staff queries: a formal, two-way workflow. HR issues a query to a
-- staff member (subject + opening message); the staff member must respond;
-- HR can close it once satisfied. Full trail kept per staff member.
--
-- Split into a `staff_queries` header (case metadata/status) and an
-- append-only `staff_query_messages` child table (the entire trail,
-- including the opening message) — a single `response` column can't
-- represent HR follow-ups after the staff reply, which "full trail" needs.

create table wireless.staff_queries (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references wireless.profiles(id) on delete cascade,
  issued_by   uuid not null references wireless.profiles(id) on delete set null,
  subject     text not null,
  category    text not null default 'general' check (category in ('conduct', 'performance', 'attendance', 'policy', 'other')),
  status      text not null default 'open' check (status in ('open', 'responded', 'closed')),
  due_date    date,
  closed_by   uuid references wireless.profiles(id) on delete set null,
  closed_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index staff_queries_profile_idx on wireless.staff_queries (profile_id, created_at desc);
create index staff_queries_status_idx on wireless.staff_queries (status);

alter table wireless.staff_queries enable row level security;

create policy staff_queries_read on wireless.staff_queries for select to authenticated
  using (
    profile_id = auth.uid()
    or wireless.has_permission('hr_queries:view')
    or wireless.has_permission('hr_queries:manage')
  );

create policy staff_queries_insert on wireless.staff_queries for insert to authenticated
  with check (wireless.has_permission('hr_queries:manage') and issued_by = auth.uid());

create policy staff_queries_update on wireless.staff_queries for update to authenticated
  using (wireless.has_permission('hr_queries:manage'))
  with check (wireless.has_permission('hr_queries:manage'));

create policy staff_queries_delete on wireless.staff_queries for delete to authenticated
  using (wireless.has_permission('hr_queries:manage'));

create trigger set_updated_at before update on wireless.staff_queries
  for each row execute function wireless.set_updated_at();

create trigger audit_staff_queries_changes
  after insert or delete or update on wireless.staff_queries
  for each row execute function wireless.capture_audit_log();

create table wireless.staff_query_messages (
  id          uuid primary key default gen_random_uuid(),
  query_id    uuid not null references wireless.staff_queries(id) on delete cascade,
  author_id   uuid not null references wireless.profiles(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index staff_query_messages_query_idx on wireless.staff_query_messages (query_id, created_at asc);

alter table wireless.staff_query_messages enable row level security;

create policy staff_query_messages_read on wireless.staff_query_messages for select to authenticated
  using (
    exists (
      select 1 from wireless.staff_queries q
      where q.id = query_id
        and (
          q.profile_id = auth.uid()
          or wireless.has_permission('hr_queries:view')
          or wireless.has_permission('hr_queries:manage')
        )
    )
  );

-- Whoever is being queried may always reply while it's open; HR/managers
-- with hr_queries:manage may post a follow-up any time it's not closed.
create policy staff_query_messages_insert on wireless.staff_query_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from wireless.staff_queries q
      where q.id = query_id and q.status <> 'closed'
        and (q.profile_id = auth.uid() or wireless.has_permission('hr_queries:manage'))
    )
  );

-- No update/delete policy — the trail is append-only by design.

create trigger audit_staff_query_messages_changes
  after insert on wireless.staff_query_messages
  for each row execute function wireless.capture_audit_log();

-- Whoever hasn't acted yet is always shown as "awaiting them": the queried
-- staff member posting flips it to 'responded' (HR's cue to review/close);
-- HR/a manager posting a follow-up flips it back to 'open' (the staff
-- member's cue that a reply is needed again).
create or replace function wireless.update_staff_query_status_on_message()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $$
declare
  v_profile_id uuid;
begin
  select profile_id into v_profile_id from wireless.staff_queries where id = new.query_id;
  update wireless.staff_queries
    set status = case when new.author_id = v_profile_id then 'responded' else 'open' end,
        updated_at = now()
    where id = new.query_id;
  return new;
end;
$$;

create trigger trg_update_staff_query_status_on_message
  after insert on wireless.staff_query_messages
  for each row execute function wireless.update_staff_query_status_on_message();

-- ── Permissions ───────────────────────────────────────────────────────
-- Manager gets read-only oversight; issuing a formal disciplinary query
-- stays HR-only by default (a plain resource:action string, so any admin
-- can widen this later from Settings > Team & Roles).
update wireless.roles set permissions = permissions || array['hr_queries:view', 'hr_queries:manage']
where id = 'hr' and not ('hr_queries:manage' = any(permissions));

update wireless.roles set permissions = permissions || array['hr_queries:view']
where id = 'manager' and not ('hr_queries:view' = any(permissions));
