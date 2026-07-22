-- Retire inventory_manager as a distinct role — it folds into sales_manager.
-- Zero production users currently hold inventory_manager (verified directly
-- against the live DB before writing this), so this is a clean cutover: no
-- backfill risk, just removing the role everywhere it's checked.

-- 1. Defensive no-op today, but must run before the constraint tightens so
--    this migration can never fail against a row it doesn't expect.
update wireless.profiles set role = 'sales_manager' where role = 'inventory_manager';

-- 2. Role whitelist no longer includes inventory_manager.
alter table wireless.profiles drop constraint if exists profiles_role_check;
alter table wireless.profiles add constraint profiles_role_check
  check (role in ('admin','sales_manager','technician','receptionist'));

-- 3. Self-signup whitelist — an unrecognized role already falls through to
--    'receptionist' by default, same as it would for any other unknown value.
create or replace function wireless.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into wireless.profiles (id, email, name, role, avatar, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,'user'),'@',1)),
    case
      when coalesce(new.raw_user_meta_data->>'role','') in ('admin','sales_manager','technician','receptionist')
        then new.raw_user_meta_data->>'role'
      else 'receptionist'
    end,
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.email,'U')),1)),
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 4. wireless.audit_logs read access.
drop policy if exists "audit_logs_read" on wireless.audit_logs;
create policy "audit_logs_read" on wireless.audit_logs for select to authenticated
  using (wireless.has_any_role(array['admin','sales_manager']));

-- 5. wireless.parts write access — sales_manager was already listed, this
--    just drops the now-redundant inventory_manager name, no permission change.
drop policy if exists parts_write on wireless.parts;
create policy parts_write on wireless.parts
  for all
  using (wireless.has_any_role(array['admin', 'sales_manager']))
  with check (wireless.has_any_role(array['admin', 'sales_manager']));
