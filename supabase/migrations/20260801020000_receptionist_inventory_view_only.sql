-- Reversed per explicit follow-up: reception should only ever view
-- inventory, not add/edit/delete parts or adjust stock — that's the
-- inventory-focused roles' job (stock_manager / inventory_manager), not
-- reception's. Revoking parts:edit removes their write access at the RLS
-- layer (parts_update/parts_delete both require it); the Inventory tab's
-- own UI was reverted to read-only in the same change.
update wireless.roles
set permissions = array_remove(permissions, 'parts:edit')
where id = 'receptionist';
