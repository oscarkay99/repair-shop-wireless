-- The previous migration restricted unit_cost/supplier visibility and part
-- creation only in the frontend — anyone with parts:edit (now including
-- stock_manager and receptionist) could still change unit_cost/supplier or
-- insert a brand-new part directly via the REST API, since parts_write was
-- a single blanket policy covering insert/update/delete alike with no way
-- to tell operations or columns apart. This makes both restrictions real:
--
--   - Only admin can INSERT a new part (parts_insert, split out from the
--     old all-in-one parts_write).
--   - A non-admin with parts:edit can still UPDATE an existing part (stock,
--     selling price, name, etc.) but a trigger blocks the update outright
--     if unit_cost or supplier actually changed — RLS alone can't
--     distinguish which columns an UPDATE touches, only a trigger can.
--   - DELETE is untouched (still open to anyone with parts:edit) — not
--     something either restriction covers.
--
-- No legitimate system path updates unit_cost via RPC (confirmed: it's
-- only ever read for COGS calculations), so this can't break anything
-- other than the exact UI action it's meant to block.

drop policy parts_write on wireless.parts;

create policy parts_insert on wireless.parts for insert to public
  with check (wireless.is_admin());

create policy parts_update on wireless.parts for update to public
  using (wireless.has_permission('parts:edit'))
  with check (wireless.has_permission('parts:edit'));

create policy parts_delete on wireless.parts for delete to public
  using (wireless.has_permission('parts:edit'));

create or replace function wireless.prevent_unauthorized_parts_cost_change()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $$
begin
  if wireless.is_admin() then
    return new;
  end if;

  if new.unit_cost is distinct from old.unit_cost or new.supplier is distinct from old.supplier then
    raise exception 'Only an admin can change a part''s unit cost or supplier';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_unauthorized_parts_cost_change on wireless.parts;
create trigger trg_prevent_unauthorized_parts_cost_change
  before update on wireless.parts
  for each row execute function wireless.prevent_unauthorized_parts_cost_change();
