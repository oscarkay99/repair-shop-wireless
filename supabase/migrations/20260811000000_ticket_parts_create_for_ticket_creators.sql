-- AddRepairModal lets whoever is creating a ticket also attach a part from
-- inventory in the same step (src/pages/repairs/components/AddRepairModal.tsx,
-- the "Quoted Repair Cost · FROM INVENTORY" field) — but receptionist and
-- manager, both of whom hold tickets:create and see that field, were never
-- granted ticket_parts:create. The ticket insert succeeds; the follow-up
-- ticket_parts insert is silently rejected by RLS, surfacing in the UI as
-- "Ticket created, but failed to attach <part>. Add it manually from the
-- ticket." every single time either role uses it. Same shape as the
-- receptionist sales:create gap fixed in 20260806070000 — grants what the
-- UI has always promised, rather than hiding a fully-built feature.

update wireless.roles
set permissions = array_append(permissions, 'ticket_parts:create')
where 'tickets:create' = any(permissions)
  and not ('ticket_parts:create' = any(permissions))
  and not is_system;
