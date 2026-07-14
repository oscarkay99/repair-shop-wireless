-- Retire the 'sales_rep' role (renamed to "Secretary" in the UI, now removed
-- from the app entirely). Reassign any existing rows before tightening the
-- constraint, and add 'receptionist' — a valid app role that this check
-- constraint never actually allowed.

-- 1. Reassign any profiles still on the retired role.
update wireless.profiles set role = 'receptionist' where role = 'sales_rep';

-- 2. Point the default at a role that will remain valid.
alter table wireless.profiles alter column role set default 'receptionist';

-- 3. Rebuild the check constraint without 'sales_rep'.
alter table wireless.profiles drop constraint if exists profiles_role_check;
alter table wireless.profiles add constraint profiles_role_check
  check (role in ('admin','sales_manager','technician','inventory_manager','receptionist'));

-- 4. Match the new-user trigger to the same role list.
create or replace function wireless.handle_new_user()
returns trigger language plpgsql security definer
set search_path = wireless as $$
begin
  insert into wireless.profiles (id, email, name, role, avatar)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,'user'),'@',1)),
    case
      when coalesce(new.raw_user_meta_data->>'role','') in
           ('admin','sales_manager','technician','inventory_manager','receptionist')
        then new.raw_user_meta_data->>'role'
      else 'receptionist'
    end,
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.email,'U')),1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 5. Drop 'sales_rep' from every RLS policy that referenced it.
drop policy if exists "customers_write" on wireless.customers;
create policy "customers_write" on wireless.customers for all to authenticated
  using  (wireless.has_any_role(array['admin','sales_manager']))
  with check (wireless.has_any_role(array['admin','sales_manager']));

drop policy if exists "tickets_insert" on wireless.tickets;
create policy "tickets_insert" on wireless.tickets for insert to authenticated
  with check (wireless.has_any_role(array['admin','sales_manager','technician']));

drop policy if exists "tickets_update" on wireless.tickets;
create policy "tickets_update" on wireless.tickets for update to authenticated
  using (
    wireless.has_any_role(array['admin','sales_manager'])
    or (wireless.current_user_role() = 'technician'
        and technician_id = (select id from wireless.technicians where profile_id = auth.uid() limit 1))
  )
  with check (wireless.has_any_role(array['admin','sales_manager','technician']));

drop policy if exists "accessory_sales_write" on wireless.accessory_sales;
create policy "accessory_sales_write" on wireless.accessory_sales for all to authenticated
  using  (wireless.has_any_role(array['admin','sales_manager']))
  with check (wireless.has_any_role(array['admin','sales_manager']));

drop policy if exists "sale_items_write" on wireless.sale_items;
create policy "sale_items_write" on wireless.sale_items for all to authenticated
  using  (wireless.has_any_role(array['admin','sales_manager']))
  with check (wireless.has_any_role(array['admin','sales_manager']));
