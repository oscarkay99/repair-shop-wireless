-- adjustStock() in the frontend computed the new stock value from its own
-- client-side cache and wrote it back as an absolute number — a classic
-- lost-update race: two staff members adjusting the same part around the
-- same time (e.g. one in Inventory, one in Inventory Portal) can silently
-- overwrite each other's decrement. This does the +/- as a single atomic
-- UPDATE instead, run as the caller (no `security definer`) so the existing
-- parts_update RLS policy (parts:edit) still applies unchanged.

create or replace function wireless.adjust_part_stock(p_part_id uuid, p_delta integer)
returns integer
language sql
as $$
  update wireless.parts
  set stock = greatest(0, stock + p_delta)
  where id = p_part_id
  returning stock;
$$;

grant execute on function wireless.adjust_part_stock(uuid, integer) to authenticated;
