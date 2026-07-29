-- Reception had no way to check part/stock availability at all — the
-- /inventory route (and the underlying parts_write RLS policy) both gate on
-- has_permission('parts:edit'), which receptionist never had. They need to
-- answer "do we have this in stock" without walking over to ask the stock
-- manager every time. Frontend restricts what this actually unlocks for
-- receptionist (and stock_manager) beyond that: can view/edit existing
-- parts' stock and selling price, but not unit cost/supplier (admin-only),
-- and can't create a brand-new part type (admin-only) — this migration only
-- grants the RLS-level permission the page/write path already keys off.

update wireless.roles
set permissions = array_append(permissions, 'parts:edit')
where id = 'receptionist'
  and not ('parts:edit' = any(permissions));
