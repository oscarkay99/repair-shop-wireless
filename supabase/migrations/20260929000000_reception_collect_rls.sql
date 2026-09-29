-- Fix: "Mark Collected" did nothing for reception.
--
-- 20260928000000 gave Receptionist tickets:collect and taught the status
-- trigger to allow ready -> completed, but tickets_update (RLS) still only
-- admits tickets:edit holders or the assigned technician. Receptionist has
-- neither, so the UPDATE matched zero rows: no error, the UI showed
-- "Status updated", and the ticket snapped back on refresh.
--
-- Add a narrow RLS path: a tickets:collect holder may update a ticket that
-- is currently 'ready', and only to leave it as 'completed'. The trigger
-- still limits that update to status/service_stage/completed_at/updated_at.

begin;

drop policy tickets_update on wireless.tickets;
create policy tickets_update on wireless.tickets for update to authenticated
  using (
    wireless.has_permission('tickets:edit')
    or (status = 'ready' and wireless.has_permission('tickets:collect'))
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
    or (status = 'completed' and wireless.has_permission('tickets:collect'))
    or wireless.current_role_scopes_tickets()
  );

commit;
