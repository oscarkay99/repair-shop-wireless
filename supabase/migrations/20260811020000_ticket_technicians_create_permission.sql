-- setTicketTechnicians() (src/services/repairs.ts) is called from both
-- createRepair() and updateRepair() to assign technicians via
-- wireless.ticket_technicians — but ticket_technicians_insert/_delete
-- (20260728000000) only ever accepted tickets:edit. Receptionist (and any
-- other role holding tickets:create but not tickets:edit — confirmed live:
-- receptionist's current permissions array has tickets:create, no
-- tickets:edit) can create a ticket fine, but the immediately-following
-- technician-assignment insert is silently rejected by RLS, surfacing to
-- the whole operation as "Failed to create repair job" even though the
-- ticket row itself was created. This wasn't caught by the earlier audit
-- since it only manifests when a technician is actually selected at
-- creation time.
--
-- The client already treats this as one bundled capability — RepairsBoard's
-- own canManageTickets gate (which controls the reassignment UI) is
-- `tickets:edit OR tickets:create OR invoices:create`, not tickets:edit
-- alone. This brings the DB policy in line with what the client already
-- assumes, rather than granting receptionist blanket tickets:edit (which
-- would also open up editing device/issue/pricing on any existing ticket —
-- a bigger grant than this bug calls for, and tickets:edit was seeded for
-- receptionist in 20260727000000 but has since been deliberately removed
-- live via Settings, per the current wireless.roles state — not something
-- to casually restore wholesale).

drop policy ticket_technicians_insert on wireless.ticket_technicians;
create policy ticket_technicians_insert on wireless.ticket_technicians for insert to authenticated
  with check (wireless.has_permission('tickets:edit') or wireless.has_permission('tickets:create'));

drop policy ticket_technicians_delete on wireless.ticket_technicians;
create policy ticket_technicians_delete on wireless.ticket_technicians for delete to authenticated
  using (wireless.has_permission('tickets:edit') or wireless.has_permission('tickets:create'));
