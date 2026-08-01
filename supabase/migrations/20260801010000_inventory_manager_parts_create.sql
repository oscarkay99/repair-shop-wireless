-- Companion to the frontend fix making the inventory portal's manage
-- controls permission-based (parts:edit) instead of gated on the literal
-- 'stock_manager' role id.
--
-- 'inventory_manager' still wasn't equivalent to 'stock_manager' even
-- after that: parts_insert on wireless.parts is its own RLS policy keyed
-- on a separate 'parts:create' permission (distinct from 'parts:edit',
-- which only covers UPDATE/DELETE — see 20260729020000), and
-- 'inventory_manager' never had it. Grants parity with 'stock_manager'.
update wireless.roles
set permissions = array_append(permissions, 'parts:create')
where id = 'inventory_manager'
  and not ('parts:create' = any(permissions));
