-- Ticket creation is meant to be admin + receptionist only. manager
-- currently also holds tickets:create (drifted live via Settings since its
-- 20260801030000 seed, which already included it) — removing it. manager
-- keeps everything else (tickets:view/edit, technicians:edit, invoices,
-- etc.), including the ability to assign/reassign technicians on existing
-- tickets via tickets:edit (unaffected by this — see
-- 20260811020000_ticket_technicians_create_permission.sql).

update wireless.roles
set permissions = array_remove(permissions, 'tickets:create')
where id = 'manager';
