-- RBAC/RLS audit fixes. Closes gaps that trace back to the very first
-- schema and were never swept up by either the pending-status hardening
-- (20260719000000) or the custom-roles rewrite (20260727000000):
--   1. payments_read was `USING (true)` since the table's first migration —
--      any authenticated row, including a pending signup, could read the
--      entire payments ledger.
--   2. ticket_comments_insert was `WITH CHECK (auth.uid() IS NOT NULL)`
--      since the very first schema — the one ticket_comments policy both
--      prior sweeps missed.
--   3. ticket_parts_write was the one ticket_* table never scoped to a
--      technician's own assignment, unlike every sibling read/write policy.
--   4. profiles_insert had no role/status guard at all — a client-initiated
--      insert (the OAuth-new-identity path in useAuth.ts) could set any
--      role/status it liked as long as `id = auth.uid()`.
--   5. handle_new_user() honored a self-reported is_system role (i.e.
--      'admin') verbatim as long as the id matched a real row.
-- Also narrows ticket_comments_update to the reassignment/approval-request
-- rows it was actually built to let staff resolve, and closes the direct-
-- insert idempotency bypass on wireless.payments.

-- ── 1. New permissions: payments:view, ticket_comments:create ───────────
-- Backfilled onto every existing role that already does adjacent work
-- (matched by existing permissions, not role id, so it also reaches
-- self-created custom roles like 'manager'). Admin is excluded —
-- trg_prevent_system_role_mutation blocks any UPDATE to its row, and it
-- doesn't need the array entry since has_permission() bypasses it
-- unconditionally regardless of what's actually seeded.

update wireless.roles
set permissions = array_append(permissions, 'payments:view')
where 'payments:create' = any(permissions)
  and not ('payments:view' = any(permissions))
  and not is_system;

update wireless.roles
set permissions = array_append(permissions, 'ticket_comments:create')
where ('tickets:create' = any(permissions) or 'tickets:edit' = any(permissions))
  and not ('ticket_comments:create' = any(permissions))
  and not is_system;

-- ── 2. payments_read ──────────────────────────────────────────────────
drop policy payments_read on wireless.payments;
create policy payments_read on wireless.payments for select to authenticated
  using (wireless.has_permission('payments:view'));

-- ── 3. Payment idempotency: client_token can no longer be omitted ───────
-- record_payment() is deliberately security invoker (its own migration's
-- comment: "both writes stay subject to normal RLS for whoever calls it"),
-- so revoking table-level INSERT to force every write through the RPC
-- would break the RPC's own insert too. Instead: every insert — via the
-- RPC or direct — must now carry a client_token, closing the specific gap
-- (a caller omitting it to skip the existing unique index entirely). A
-- privileged direct insert that generates its own fresh token each time is
-- a separate trust concern already implied by holding payments:create, not
-- something a constraint can close.
update wireless.payments set client_token = gen_random_uuid() where client_token is null;
alter table wireless.payments alter column client_token set not null;

-- ── 4. ticket_parts_write: scope to the caller's own assigned ticket ────
-- when their access comes from scope_tickets_to_technician (technician).
-- Roles holding ticket_parts:create outside that scope (sales_manager,
-- receptionist, manager) are unaffected — matches how every other
-- ticket_* table already reads for a scoped role, via ticket_technicians.
drop policy ticket_parts_write on wireless.ticket_parts;
create policy ticket_parts_write on wireless.ticket_parts for all to authenticated
  using (
    wireless.has_permission('ticket_parts:create')
    and (
      not wireless.current_role_scopes_tickets()
      or exists (
        select 1 from wireless.ticket_technicians tt
        where tt.ticket_id = ticket_parts.ticket_id
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  )
  with check (
    wireless.has_permission('ticket_parts:create')
    and (
      not wireless.current_role_scopes_tickets()
      or exists (
        select 1 from wireless.ticket_technicians tt
        where tt.ticket_id = ticket_parts.ticket_id
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  );

-- ── 5. ticket_comments_insert: require a real permission or assignment ──
drop policy ticket_comments_insert on wireless.ticket_comments;
create policy ticket_comments_insert on wireless.ticket_comments for insert to authenticated
  with check (
    wireless.has_permission('ticket_comments:create')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.ticket_technicians tt
        where tt.ticket_id = ticket_comments.ticket_id
          and tt.technician_id = wireless.my_technician_id()
      )
    )
  );

-- ── 6. ticket_comments_update: only the reassignment/approval-request ───
-- rows it was actually built to let staff resolve, not any internal note.
drop policy ticket_comments_update on wireless.ticket_comments;
create policy ticket_comments_update on wireless.ticket_comments for update to authenticated
  using (wireless.has_permission('ticket_comments:view') and request_type is not null)
  with check (wireless.has_permission('ticket_comments:view') and request_type is not null);

-- ── 7. profiles_insert: role/status guard ────────────────────────────────
-- A client-initiated insert may either (a) match an existing ACTIVE profile
-- under the same email and role — the one legitimate re-provisioning case
-- (a new OAuth identity for someone already active under a different auth
-- id), already how useAuth.ts's own upsert decides what to write — or
-- (b) land as 'pending' and never as an is_system role (i.e. never
-- 'admin'). handle_new_user()'s trigger insert is unaffected — it's
-- SECURITY DEFINER, owned by the table owner, and bypasses RLS entirely.
drop policy profiles_insert on wireless.profiles;
create policy profiles_insert on wireless.profiles for insert to authenticated
  with check (
    id = auth.uid()
    and (
      exists (
        select 1 from wireless.profiles p
        where p.email = email
          and p.status = 'active'
          and p.role = role
          and p.id <> id
      )
      or (
        status = 'pending'
        and not exists (select 1 from wireless.roles r where r.id = role and r.is_system)
      )
    )
  );

-- ── 8. handle_new_user(): never honor a self-reported is_system role ────
create or replace function wireless.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
begin
  insert into wireless.profiles (id, email, name, role, avatar, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,'user'),'@',1)),
    case
      when exists (
        select 1 from wireless.roles
        where id = coalesce(new.raw_user_meta_data->>'role','') and not is_system
      )
        then new.raw_user_meta_data->>'role'
      else 'receptionist'
    end,
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.email,'U')),1)),
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;
