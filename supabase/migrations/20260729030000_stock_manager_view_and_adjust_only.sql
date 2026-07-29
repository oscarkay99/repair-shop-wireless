-- Scaling stock_manager back down: view the catalog and adjust stock
-- quantity, nothing else. No creating new parts/accessories, no full edit
-- (name/category/price/min_stock), no delete — those regressed to
-- "anyone with parts:edit" territory over the last two migrations, wider
-- than intended.
--
-- `parts:edit` (full edit + delete, still held by admin/sales_manager/
-- receptionist) is replaced for stock_manager with a narrower
-- `parts:adjust_stock` permission, enforced at the DB level by a trigger
-- that rejects any UPDATE touching a column other than `stock` unless the
-- actor also has `parts:edit`. `parts:create` is dropped from
-- stock_manager entirely, so INSERT (parts_insert policy) falls back to
-- admin-only automatically.

update wireless.roles
  set permissions = array_remove(array_remove(permissions, 'parts:create'), 'parts:edit') || array['parts:adjust_stock']::text[]
  where id = 'stock_manager';

drop policy parts_update on wireless.parts;
create policy parts_update on wireless.parts for update to public
  using (wireless.has_permission('parts:edit') or wireless.has_permission('parts:adjust_stock'))
  with check (wireless.has_permission('parts:edit') or wireless.has_permission('parts:adjust_stock'));

create or replace function wireless.enforce_parts_stock_only_update()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $$
begin
  if wireless.is_admin() or wireless.has_permission('parts:edit') then
    return new;
  end if;

  -- Reached only via parts:adjust_stock (parts_update's RLS check requires
  -- one of the two permissions) — every column except stock must be
  -- unchanged.
  if new.name is distinct from old.name
     or new.sku is distinct from old.sku
     or new.category is distinct from old.category
     or new.selling_price is distinct from old.selling_price
     or new.min_stock is distinct from old.min_stock
     or new.unit_cost is distinct from old.unit_cost
     or new.supplier is distinct from old.supplier
     or new.compatible_with is distinct from old.compatible_with
     or new.notes is distinct from old.notes then
    raise exception 'This role can only adjust stock quantity, not edit other part fields';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_parts_stock_only_update on wireless.parts;
create trigger trg_enforce_parts_stock_only_update
  before update on wireless.parts
  for each row execute function wireless.enforce_parts_stock_only_update();
