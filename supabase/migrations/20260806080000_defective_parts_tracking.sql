-- Staff requested tracking returned/defective parts separately from normal
-- sellable/usable stock, so a bad unit on the shelf can't get mistaken for
-- one that's fine to use on the next repair. Same atomic-adjust pattern as
-- adjust_part_stock (20260806050000) — a lost-update race here would be
-- just as real.

alter table wireless.parts add column if not exists defective_stock integer not null default 0;

create or replace function wireless.adjust_part_defective_stock(p_part_id uuid, p_delta integer)
returns integer
language sql
as $$
  update wireless.parts
  set defective_stock = greatest(0, defective_stock + p_delta)
  where id = p_part_id
  returning defective_stock;
$$;

grant execute on function wireless.adjust_part_defective_stock(uuid, integer) to authenticated;
