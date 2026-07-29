-- Stock manager's whole job is keeping the parts catalog current, so being
-- unable to add a brand-new part (only edit existing ones) was a gap —
-- restricted to admin-only in the previous migration before this role's
-- actual responsibilities were fully worked out.
--
-- New `parts:create` permission (separate from `parts:edit`, which already
-- covers updating stock/selling price on existing parts) granted to
-- stock_manager. Admin isn't given the permission explicitly — the admin
-- role's permissions array is a protected system role and can't be edited
-- (trg_prevent_system_role_mutation), and it doesn't need to be: has_permission()
-- always passes for admin via wireless.is_admin() regardless of its array.
-- The unit_cost/supplier trigger is extended to also fire on INSERT so a
-- non-admin creating a part still can't set a nonzero cost or supplier via
-- a direct API call — same defense-in-depth as the existing UPDATE guard.

update wireless.roles set permissions = permissions || array['parts:create']::text[]
  where id = 'stock_manager' and not ('parts:create' = any(permissions));

drop policy parts_insert on wireless.parts;
create policy parts_insert on wireless.parts for insert to public
  with check (wireless.has_permission('parts:create'));

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

  if TG_OP = 'INSERT' then
    if new.unit_cost is distinct from 0 or coalesce(new.supplier, '') <> '' then
      raise exception 'Only an admin can set a part''s unit cost or supplier';
    end if;
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
  before insert or update on wireless.parts
  for each row execute function wireless.prevent_unauthorized_parts_cost_change();
