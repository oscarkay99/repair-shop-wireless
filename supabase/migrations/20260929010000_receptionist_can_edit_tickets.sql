-- Receptionist can edit a ticket's details, but never delete one.
--
-- Prod's Receptionist role has tickets:view/create/collect but not
-- tickets:edit, so tickets_update (RLS) matched zero rows for any edit
-- reception made to a ticket. Granting tickets:edit fixes that; tickets:delete
-- is deliberately NOT granted, so tickets_delete keeps refusing her.
--
-- Status and notes stay protected: prevent_unauthorized_ticket_status_change()
-- still raises for a non-admin, non-assigned-technician changing them, apart
-- from the ready -> completed collect step (tickets:collect).

begin;

alter table wireless.roles disable trigger trg_prevent_system_role_mutation;
alter table wireless.roles disable trigger trg_lock_builtin_roles;

update wireless.roles
set permissions = array_append(permissions, 'tickets:edit'),
    updated_at = now()
where id = 'receptionist'
  and not ('tickets:edit' = any(permissions));

alter table wireless.roles enable trigger trg_lock_builtin_roles;
alter table wireless.roles enable trigger trg_prevent_system_role_mutation;

commit;
