-- Give reception genuine read access to Inventory: the 'Inventory' module
-- was gated purely on parts:edit/parts:create, so after 20260801020000
-- revoked parts:edit from receptionist they lost the page entirely instead
-- of landing on a read-only view as intended. parts:view is a read-only
-- grant — it's checked as an OR alongside parts:edit/parts:create for module
-- access (src/utils/access.ts) and never satisfies the parts_update/
-- parts_delete RLS policies, which still require parts:edit.

update wireless.roles
set permissions = array_append(permissions, 'parts:view')
where id = 'receptionist'
  and not ('parts:view' = any(permissions));
