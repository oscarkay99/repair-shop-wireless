-- Reverts 20260729030000: restores stock_manager's ability to create,
-- fully edit, and delete parts/accessories (the v1.7.90 state), removing
-- the stock-only restriction that migration introduced.

update wireless.roles
  set permissions = array_remove(permissions, 'parts:adjust_stock') || array['parts:edit', 'parts:create']::text[]
  where id = 'stock_manager' and not ('parts:edit' = any(permissions));

drop policy parts_update on wireless.parts;
create policy parts_update on wireless.parts for update to public
  using (wireless.has_permission('parts:edit'))
  with check (wireless.has_permission('parts:edit'));

drop trigger if exists trg_enforce_parts_stock_only_update on wireless.parts;
drop function if exists wireless.enforce_parts_stock_only_update();
