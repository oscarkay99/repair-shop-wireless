-- Manager could see Inventory (parts:view, granted alongside the rest of
-- receptionist's permission set in 20260826020000) but couldn't add new
-- products — the Inventory page's "Add Product" button and modal are
-- gated specifically on parts:create (see canCreatePart in
-- src/pages/inventory/page.tsx).
update wireless.roles
set permissions = array_append(permissions, 'parts:create')
where id = 'manager'
  and not ('parts:create' = any(permissions));
