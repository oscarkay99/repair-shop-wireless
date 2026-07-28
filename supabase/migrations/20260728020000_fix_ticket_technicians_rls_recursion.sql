-- wireless.ticket_technicians_read's "am I one of the assignees on this same
-- ticket" check was written as a self-referential subquery on the same
-- table, reasoning it would terminate (a row is always its own witness).
-- In practice Postgres detects this as infinite recursion (error 42P17) —
-- evaluating the policy for a candidate row re-invokes the same policy for
-- the witness row, and that doesn't resolve to a fixed point the planner
-- can see through.
--
-- Standard fix: move the same-ticket check into a SECURITY DEFINER function
-- owned by supabase_admin (which has BYPASSRLS — confirmed via pg_roles),
-- so its internal query against ticket_technicians bypasses RLS entirely
-- instead of re-triggering the calling policy.

create or replace function wireless.ticket_has_my_technician(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = wireless
as $$
  select exists (
    select 1 from wireless.ticket_technicians tt
    where tt.ticket_id = p_ticket_id
      and tt.technician_id = wireless.my_technician_id()
  );
$$;

drop policy ticket_technicians_read on wireless.ticket_technicians;
create policy ticket_technicians_read on wireless.ticket_technicians for select to authenticated
  using (
    wireless.has_permission('tickets:view')
    or (
      wireless.current_role_scopes_tickets()
      and wireless.ticket_has_my_technician(ticket_technicians.ticket_id)
    )
  );
