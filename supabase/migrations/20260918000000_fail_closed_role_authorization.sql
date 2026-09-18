-- Fail-closed role authorization audit.
--
-- Earlier read policies only required an active account, so every active
-- role could query customers, invoices, sales and inventory directly even
-- when the UI hid those modules. This migration makes the database enforce
-- the same explicit permissions as the application and removes the
-- privileged `admin` default for newly-created role dashboard metadata.

alter table wireless.roles alter column dashboard_variant set default 'restricted';

-- Existing purpose-built roles should land on their own safe modules.
update wireless.roles set dashboard_variant = 'hr' where id = 'hr';
update wireless.roles set dashboard_variant = 'finance' where id = 'finance';

-- Full operational dashboard access is explicit. Admin remains covered by
-- has_permission()/is_admin() and its protected row is intentionally not
-- updated.
update wireless.roles
set permissions = array_append(permissions, 'dashboard:admin')
where id = 'manager'
  and not is_system
  and not ('dashboard:admin' = any(permissions));

-- Introduce read permissions without breaking roles that already held a
-- stronger adjacent mutation permission.
update wireless.roles
set permissions = array_append(permissions, 'customers:view')
where not is_system
  and (('customers:create' = any(permissions)) or ('customers:edit' = any(permissions)) or ('customers:delete' = any(permissions)))
  and not ('customers:view' = any(permissions));

update wireless.roles
set permissions = array_append(permissions, 'invoices:view')
where not is_system
  and (('invoices:create' = any(permissions)) or ('invoices:edit' = any(permissions)) or ('invoices:delete' = any(permissions)) or ('invoices:items_edit' = any(permissions)))
  and not ('invoices:view' = any(permissions));

update wireless.roles
set permissions = array_append(permissions, 'sales:view')
where not is_system
  and ('sales:create' = any(permissions))
  and not ('sales:view' = any(permissions));

update wireless.roles
set permissions = array_append(permissions, 'technicians:view')
where not is_system
  and (
    ('technicians:edit' = any(permissions))
    or ('tickets:create' = any(permissions))
    or ('tickets:edit' = any(permissions))
  )
  and not ('technicians:view' = any(permissions));

-- A technician needs the parts catalog to record inventory consumed on an
-- assigned repair. Row-level ticket scoping still protects which repair the
-- part can be attached to.
update wireless.roles
set permissions = array_append(permissions, 'parts:view')
where id = 'technician'
  and not is_system
  and not ('parts:view' = any(permissions));

-- Role metadata: a user may resolve their active/alternate role; only an
-- admin may enumerate the complete authorization matrix.
drop policy if exists roles_read on wireless.roles;
create policy roles_read on wireless.roles for select to authenticated
using (
  wireless.is_admin()
  or id = wireless.current_user_role()
  or id = (select p.alt_role from wireless.profiles p where p.id = auth.uid())
);

drop policy if exists customers_read on wireless.customers;
create policy customers_read on wireless.customers for select to authenticated
using (wireless.has_permission('customers:view'));

drop policy if exists invoices_read on wireless.invoices;
create policy invoices_read on wireless.invoices for select to authenticated
using (wireless.has_permission('invoices:view'));

drop policy if exists invoice_items_read on wireless.invoice_items;
create policy invoice_items_read on wireless.invoice_items for select to authenticated
using (wireless.has_permission('invoices:view'));

drop policy if exists accessory_sales_read on wireless.accessory_sales;
create policy accessory_sales_read on wireless.accessory_sales for select to authenticated
using (wireless.has_permission('sales:view'));

drop policy if exists sale_items_read on wireless.sale_items;
create policy sale_items_read on wireless.sale_items for select to authenticated
using (wireless.has_permission('sales:view'));

drop policy if exists parts_read on wireless.parts;
create policy parts_read on wireless.parts for select to authenticated
using (wireless.has_permission('parts:view'));

drop policy if exists technicians_read on wireless.technicians;
create policy technicians_read on wireless.technicians for select to authenticated
using (
  profile_id = auth.uid()
  or wireless.has_permission('technicians:view')
);

