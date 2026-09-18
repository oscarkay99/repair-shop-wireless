-- Hard-lock built-in role topology.
--
-- Portal/dashboard routing is keyed to these exact role IDs in the client.
-- Marking them all as protected system roles means an admin cannot change a
-- built-in role's permissions, ticket scoping, or dashboard metadata through
-- Settings (or directly through PostgREST). Custom roles remain possible but
-- always receive the restricted landing and cannot enter a built-in portal.

update wireless.roles
set is_system = true
where id in (
  'sales_manager',
  'technician',
  'receptionist',
  'manager',
  'finance',
  'hr',
  'stock_manager',
  'inventory_manager'
)
and not is_system;

-- Defense in depth: protect the IDs even if is_system is ever accidentally
-- cleared by a privileged maintenance operation.
create or replace function wireless.prevent_builtin_role_mutation()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $$
begin
  if old.id in (
    'admin',
    'sales_manager',
    'technician',
    'receptionist',
    'manager',
    'finance',
    'hr',
    'stock_manager',
    'inventory_manager'
  ) then
    raise exception 'The % role is built in and cannot be modified', old.id;
  end if;
  return case when TG_OP = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_lock_builtin_roles on wireless.roles;
create trigger trg_lock_builtin_roles
  before update or delete on wireless.roles
  for each row execute function wireless.prevent_builtin_role_mutation();

