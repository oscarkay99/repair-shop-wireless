-- Tickets could only ever be assigned to one technician (tickets.technician_id
-- / technician_name). Introduces wireless.ticket_technicians as a many-to-many
-- join so a ticket can have any number of assigned technicians, all equal —
-- no "primary" concept — and every one of them can see the ticket, update its
-- progress, and gets its workload/completion credit, same as a sole assignee
-- always could.
--
-- tickets.technician_id / technician_name are deliberately NOT dropped here —
-- left in place, frozen (the app stops writing to them from this point on),
-- as a rollback safety net. A later cleanup migration can drop them once
-- nothing depends on them.
--
-- Every RLS policy and trigger that used to gate on "technician_id equals my
-- own technician row" is rewritten here to check membership in
-- ticket_technicians instead: wireless.tickets (read/update),
-- wireless.ticket_media (read/insert/delete), wireless.ticket_comments
-- (read), wireless.ticket_parts (read), and the
-- prevent_unauthorized_ticket_status_change trigger. wireless.get_my_notifications
-- is rewritten the same way so a technician still gets notified about tickets
-- they're one of several assignees on.

-- ── 1. The join table ───────────────────────────────────────────────────

create table wireless.ticket_technicians (
  ticket_id     uuid not null references wireless.tickets(id) on delete cascade,
  technician_id uuid not null references wireless.technicians(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  assigned_by   uuid references wireless.profiles(id) on delete set null,
  primary key (ticket_id, technician_id)
);

create index ticket_technicians_technician_idx on wireless.ticket_technicians (technician_id);

alter table wireless.ticket_technicians enable row level security;

-- A technician can see every assignee on any ticket they're themselves
-- assigned to (so they can see who they're sharing the job with) — the
-- self-referential subquery is a standard "visible to my own group" RLS
-- pattern and terminates immediately (a row is always its own witness).
create policy ticket_technicians_read on wireless.ticket_technicians for select to authenticated
  using (
    wireless.has_permission('tickets:view')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.ticket_technicians mine
        where mine.ticket_id = ticket_technicians.ticket_id
          and mine.technician_id = wireless.my_technician_id()
      )
    )
  );

-- Assignment itself stays an edit-permission action, same boundary as today
-- (only roles that could already change the Technician field can change it).
create policy ticket_technicians_insert on wireless.ticket_technicians for insert to authenticated
  with check (wireless.has_permission('tickets:edit'));

create policy ticket_technicians_delete on wireless.ticket_technicians for delete to authenticated
  using (wireless.has_permission('tickets:edit'));

create trigger audit_ticket_technicians_changes
  after insert or delete on wireless.ticket_technicians
  for each row execute function wireless.capture_audit_log();

-- ── 2. Backfill existing single-technician tickets ──────────────────────

insert into wireless.ticket_technicians (ticket_id, technician_id)
select id, technician_id from wireless.tickets where technician_id is not null
on conflict do nothing;

-- ── 3. Freeze the legacy columns (kept, not written to going forward) ───

comment on column wireless.tickets.technician_id is
  'Legacy single-technician FK, superseded by wireless.ticket_technicians (many-to-many). Frozen for rollback safety — the app no longer writes to it.';
comment on column wireless.tickets.technician_name is
  'Legacy single-technician display name, superseded by wireless.ticket_technicians + wireless.technicians.name. Frozen for rollback safety — the app no longer writes to it.';

-- ── 4. Rewrite tickets policies ──────────────────────────────────────────

drop policy tickets_read on wireless.tickets;
create policy tickets_read on wireless.tickets for select to authenticated
  using (
    wireless.has_permission('tickets:view')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.ticket_technicians tt
        where tt.ticket_id = tickets.id
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  );

drop policy tickets_update on wireless.tickets;
create policy tickets_update on wireless.tickets for update to authenticated
  using (
    wireless.has_permission('tickets:edit')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.ticket_technicians tt
        where tt.ticket_id = tickets.id
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  )
  with check (
    wireless.has_permission('tickets:edit')
    or wireless.current_role_scopes_tickets()
  );

-- ── 5. Rewrite ticket_media policies (joined via ticket_number) ──────────

drop policy ticket_media_read on wireless.ticket_media;
create policy ticket_media_read on wireless.ticket_media for select to authenticated
  using (
    wireless.has_permission('ticket_media:view')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.tickets t
        join wireless.ticket_technicians tt on tt.ticket_id = t.id
        where t.ticket_number = ticket_media.ticket_number
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  );

drop policy ticket_media_insert on wireless.ticket_media;
create policy ticket_media_insert on wireless.ticket_media for insert to authenticated
  with check (
    wireless.has_permission('ticket_media:create')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.tickets t
        join wireless.ticket_technicians tt on tt.ticket_id = t.id
        where t.ticket_number = ticket_media.ticket_number
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  );

drop policy ticket_media_delete on wireless.ticket_media;
create policy ticket_media_delete on wireless.ticket_media for delete to authenticated
  using (
    (uploaded_by_id = auth.uid())
    or wireless.has_permission('ticket_media:delete')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.tickets t
        join wireless.ticket_technicians tt on tt.ticket_id = t.id
        where t.ticket_number = ticket_media.ticket_number
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  );

-- ── 6. Rewrite ticket_comments / ticket_parts read policies ──────────────

drop policy ticket_comments_read on wireless.ticket_comments;
create policy ticket_comments_read on wireless.ticket_comments for select to authenticated
  using (
    wireless.has_permission('ticket_comments:view')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.ticket_technicians tt
        where tt.ticket_id = ticket_comments.ticket_id
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  );

drop policy ticket_parts_read on wireless.ticket_parts;
create policy ticket_parts_read on wireless.ticket_parts for select to authenticated
  using (
    wireless.has_permission('ticket_parts:view')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.ticket_technicians tt
        where tt.ticket_id = ticket_parts.ticket_id
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  );

-- ── 7. Rewrite the technician-self-edit trigger ──────────────────────────

create or replace function wireless.prevent_unauthorized_ticket_status_change()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $function$
declare
  is_own_ticket boolean;
  old_j jsonb;
  new_j jsonb;
  allowed_keys text[] := array['status', 'notes_json', 'job_type', 'updated_at'];
  k text;
begin
  if wireless.is_admin() then
    return new;
  end if;

  is_own_ticket := wireless.current_role_scopes_tickets()
    and exists (
      select 1 from wireless.ticket_technicians tt
      join wireless.technicians tech on tech.id = tt.technician_id
      where tt.ticket_id = old.id
        and tech.profile_id = auth.uid()
    );

  if is_own_ticket then
    old_j := to_jsonb(old);
    new_j := to_jsonb(new);
    foreach k in array allowed_keys loop
      old_j := old_j - k;
      new_j := new_j - k;
    end loop;
    if old_j is distinct from new_j then
      raise exception 'Technicians can only update a ticket''s progress (status/notes), not its details';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status or new.notes_json is distinct from old.notes_json then
    raise exception 'Only an assigned technician or an admin can update a ticket''s status or notes';
  end if;

  return new;
end;
$function$;

-- ── 8. Rewrite get_my_notifications so any assigned technician is notified ─

create or replace function wireless.get_my_notifications(p_limit int default 30)
returns table (
  id          uuid,
  action      text,
  table_name  text,
  entity_id   text,
  actor_name  text,
  created_at  timestamptz
)
language plpgsql
security definer
set search_path = wireless, public
stable
as $$
declare
  v_role text := wireless.current_user_role();
  v_uid  uuid := auth.uid();
begin
  if v_uid is null or v_role is null then
    return;
  end if;

  if v_role = 'admin' then
    return query
      select a.id, a.action, a.table_name, a.entity_id, a.actor_name, a.created_at
      from wireless.audit_logs a
      order by a.created_at desc
      limit p_limit;
  else
    return query
      select a.id, a.action, a.table_name, a.entity_id, a.actor_name, a.created_at
      from wireless.audit_logs a
      where a.actor_id = v_uid
         or (
           a.table_name = 'tickets'
           and a.entity_id in (
             select tt.ticket_id::text
             from wireless.ticket_technicians tt
             join wireless.technicians tech on tech.id = tt.technician_id
             where tech.profile_id = v_uid
           )
         )
      order by a.created_at desc
      limit p_limit;
  end if;
end;
$$;
