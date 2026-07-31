-- Reception portal's Inventory tab gained Add/Edit/Delete/Adjust-stock
-- actions on wireless.parts — but the receptionist role's permission array
-- never included 'parts:edit', so parts_write RLS would reject every one
-- of those writes for that role. Grant it, matching the same access
-- stock_manager/sales_manager/admin already have on parts.
update wireless.roles
set permissions = array_append(permissions, 'parts:edit')
where id = 'receptionist'
  and not ('parts:edit' = any(permissions));
