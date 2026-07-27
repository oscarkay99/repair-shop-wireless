-- Real custom roles (Tier 1: module/data-level access).
-- Replaces the fixed 4-value role set with a `wireless.roles` table, a
-- `resource:action` permission taxonomy, and a `has_permission()` check that
-- every previously role-name-pinned RLS policy now goes through instead.
-- Byte-for-byte behavioral parity for the 4 existing roles is the goal —
-- every seeded permission below was derived directly from the live
-- pg_policies output for each policy being replaced.

-- ── 1. Roles table ──────────────────────────────────────────────────────
create table wireless.roles (
  id text primary key,
  name text not null,
  color text not null default '#64748b',
  permissions text[] not null default '{}',
  scope_tickets_to_technician boolean not null default false,
  dashboard_variant text not null default 'admin',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table wireless.roles enable row level security;

create policy roles_read on wireless.roles for select to authenticated
  using (wireless.is_active_user());

create policy roles_write on wireless.roles for all to authenticated
  using (wireless.is_admin()) with check (wireless.is_admin());

create trigger set_updated_at before update on wireless.roles
  for each row execute function wireless.set_updated_at();

-- Admin is the safety net: even if its permissions array ever drifts, and
-- even bypassing the app entirely via direct SQL/API, it can never be
-- edited or deleted through normal writes.
create or replace function wireless.prevent_system_role_mutation()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $$
begin
  if TG_OP = 'DELETE' then
    if old.is_system then
      raise exception 'The % role is a protected system role and cannot be deleted', old.id;
    end if;
    return old;
  end if;
  if old.is_system then
    raise exception 'The % role is a protected system role and cannot be edited', old.id;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_system_role_mutation
  before update or delete on wireless.roles
  for each row execute function wireless.prevent_system_role_mutation();

-- ── 2. Seed the 4 existing roles ────────────────────────────────────────
-- Permission arrays reconstructed from the live RLS report — each string
-- maps 1:1 to a role's membership in the has_any_role(...) array of the
-- policy it replaces. See migration PR notes for the full derivation.
insert into wireless.roles (id, name, color, permissions, scope_tickets_to_technician, dashboard_variant, is_system) values
(
  'admin', 'Admin', '#EC0118',
  array[
    'tickets:view','tickets:create','tickets:edit','tickets:delete',
    'ticket_media:view','ticket_media:create','ticket_media:delete',
    'ticket_comments:view','ticket_comments:delete',
    'ticket_parts:view','ticket_parts:create',
    'customers:create','customers:edit','customers:delete',
    'invoices:create','invoices:edit','invoices:delete','invoices:items_edit',
    'technicians:edit',
    'parts:edit',
    'sales:create',
    'payments:create',
    'expenses:view','expenses:edit',
    'settings:edit',
    'team:view','team:edit','team:delete',
    'audit_logs:view'
  ],
  false, 'admin', true
),
(
  'sales_manager', 'Sales Manager', '#F59E0B',
  array[
    'tickets:view','tickets:edit',
    'ticket_media:view',
    'ticket_comments:view',
    'ticket_parts:view','ticket_parts:create',
    'customers:create','customers:edit','customers:delete',
    'invoices:create','invoices:edit','invoices:delete','invoices:items_edit',
    'technicians:edit',
    'parts:edit',
    'sales:create',
    'payments:create',
    'team:view',
    'audit_logs:view'
  ],
  false, 'sales_manager', false
),
(
  'technician', 'Technician', '#06B6D4',
  array['ticket_parts:create'],
  true, 'technician', false
),
(
  'receptionist', 'Receptionist', '#8B5CF6',
  array[
    'tickets:view','tickets:create','tickets:edit',
    'ticket_media:view',
    'ticket_comments:view',
    'ticket_parts:view',
    'customers:create','customers:edit',
    'invoices:create','invoices:edit',
    'payments:create'
  ],
  false, 'receptionist', false
);

-- ── 3. Permission helpers ───────────────────────────────────────────────
-- Admin always passes regardless of its seeded array — the real safety net.
create or replace function wireless.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path to 'wireless'
as $$
  select wireless.is_admin() or exists (
    select 1 from wireless.roles
    where id = wireless.current_user_role() and perm = any(permissions)
  )
$$;

-- Generalizes the old `current_user_role() = 'technician'` row-scoping
-- literal into an opt-in flag any role can carry.
create or replace function wireless.current_role_scopes_tickets()
returns boolean
language sql
stable
security definer
set search_path to 'wireless'
as $$
  select coalesce(
    (select scope_tickets_to_technician from wireless.roles where id = wireless.current_user_role()),
    false
  )
$$;

-- ── 4. profiles.role: CHECK constraint → FK ─────────────────────────────
-- FK also gives us "can't delete a role with assigned staff" for free
-- (ON DELETE defaults to RESTRICT).
alter table wireless.profiles drop constraint profiles_role_check;
alter table wireless.profiles add constraint profiles_role_fkey
  foreign key (role) references wireless.roles(id);

-- ── 5. Rewrite role-checked policies to use has_permission() ────────────

drop policy accessory_sales_write on wireless.accessory_sales;
create policy accessory_sales_write on wireless.accessory_sales for all to authenticated
  using (wireless.has_permission('sales:create'))
  with check (wireless.has_permission('sales:create'));

drop policy audit_logs_read on wireless.audit_logs;
create policy audit_logs_read on wireless.audit_logs for select to authenticated
  using (wireless.has_permission('audit_logs:view') or (actor_id = auth.uid()));

drop policy customers_delete on wireless.customers;
create policy customers_delete on wireless.customers for delete to authenticated
  using (wireless.has_permission('customers:delete'));

drop policy customers_insert on wireless.customers;
create policy customers_insert on wireless.customers for insert to authenticated
  with check (wireless.has_permission('customers:create'));

drop policy customers_update on wireless.customers;
create policy customers_update on wireless.customers for update to authenticated
  using (wireless.has_permission('customers:edit'))
  with check (wireless.has_permission('customers:edit'));

drop policy expenses_read on wireless.expenses;
create policy expenses_read on wireless.expenses for select to authenticated
  using (wireless.has_permission('expenses:view'));

drop policy expenses_write on wireless.expenses;
create policy expenses_write on wireless.expenses for all to authenticated
  using (wireless.has_permission('expenses:edit'))
  with check (wireless.has_permission('expenses:edit'));

drop policy invoice_items_write on wireless.invoice_items;
create policy invoice_items_write on wireless.invoice_items for all to authenticated
  using (wireless.has_permission('invoices:items_edit'))
  with check (wireless.has_permission('invoices:items_edit'));

drop policy invoices_delete on wireless.invoices;
create policy invoices_delete on wireless.invoices for delete to authenticated
  using (wireless.has_permission('invoices:delete'));

drop policy invoices_insert on wireless.invoices;
create policy invoices_insert on wireless.invoices for insert to authenticated
  with check (wireless.has_permission('invoices:create'));

drop policy invoices_update on wireless.invoices;
create policy invoices_update on wireless.invoices for update to authenticated
  using (wireless.has_permission('invoices:edit'))
  with check (wireless.has_permission('invoices:edit'));

-- Preserves the original (unusual) `to public` grant — qual still requires
-- auth.uid() to resolve a role, so an anonymous caller still gets false.
drop policy parts_write on wireless.parts;
create policy parts_write on wireless.parts for all to public
  using (wireless.has_permission('parts:edit'))
  with check (wireless.has_permission('parts:edit'));

drop policy payments_write on wireless.payments;
create policy payments_write on wireless.payments for insert to authenticated
  with check (wireless.has_permission('payments:create'));

drop policy profiles_delete on wireless.profiles;
create policy profiles_delete on wireless.profiles for delete to authenticated
  using (wireless.has_permission('team:delete'));

drop policy profiles_read on wireless.profiles;
create policy profiles_read on wireless.profiles for select to authenticated
  using ((id = auth.uid()) or wireless.has_permission('team:view'));

drop policy profiles_update on wireless.profiles;
create policy profiles_update on wireless.profiles for update to authenticated
  using ((id = auth.uid()) or wireless.has_permission('team:edit'))
  with check ((id = auth.uid()) or wireless.has_permission('team:edit'));

drop policy sale_items_write on wireless.sale_items;
create policy sale_items_write on wireless.sale_items for all to authenticated
  using (wireless.has_permission('sales:create'))
  with check (wireless.has_permission('sales:create'));

drop policy settings_write on wireless.settings;
create policy settings_write on wireless.settings for all to authenticated
  using (wireless.has_permission('settings:edit'))
  with check (wireless.has_permission('settings:edit'));

drop policy technicians_write on wireless.technicians;
create policy technicians_write on wireless.technicians for all to authenticated
  using (wireless.has_permission('technicians:edit'))
  with check (wireless.has_permission('technicians:edit'));

drop policy ticket_comments_delete on wireless.ticket_comments;
create policy ticket_comments_delete on wireless.ticket_comments for delete to authenticated
  using ((author_id = auth.uid()) or wireless.has_permission('ticket_comments:delete'));

drop policy ticket_comments_read on wireless.ticket_comments;
create policy ticket_comments_read on wireless.ticket_comments for select to authenticated
  using (
    wireless.has_permission('ticket_comments:view')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.tickets t
        where t.id = ticket_comments.ticket_id
          and t.technician_id is not null
          and t.technician_id = wireless.my_technician_id()
      )
    )
  );

drop policy ticket_media_delete on wireless.ticket_media;
create policy ticket_media_delete on wireless.ticket_media for delete to authenticated
  using (
    (uploaded_by_id = auth.uid())
    or wireless.has_permission('ticket_media:delete')
    or (
      wireless.current_role_scopes_tickets()
      and ticket_number in (
        select t.ticket_number from wireless.tickets t
        join wireless.technicians tech on tech.id = t.technician_id
        where tech.profile_id = auth.uid()
      )
    )
  );

drop policy ticket_media_insert on wireless.ticket_media;
create policy ticket_media_insert on wireless.ticket_media for insert to authenticated
  with check (
    wireless.has_permission('ticket_media:create')
    or (
      wireless.current_role_scopes_tickets()
      and ticket_number in (
        select t.ticket_number from wireless.tickets t
        join wireless.technicians tech on tech.id = t.technician_id
        where tech.profile_id = auth.uid()
      )
    )
  );

drop policy ticket_media_read on wireless.ticket_media;
create policy ticket_media_read on wireless.ticket_media for select to authenticated
  using (
    wireless.has_permission('ticket_media:view')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.tickets t
        where t.ticket_number = ticket_media.ticket_number
          and t.technician_id is not null
          and t.technician_id = wireless.my_technician_id()
      )
    )
  );

drop policy ticket_parts_read on wireless.ticket_parts;
create policy ticket_parts_read on wireless.ticket_parts for select to authenticated
  using (
    wireless.has_permission('ticket_parts:view')
    or (
      wireless.current_role_scopes_tickets()
      and exists (
        select 1 from wireless.tickets t
        where t.id = ticket_parts.ticket_id
          and t.technician_id is not null
          and t.technician_id = wireless.my_technician_id()
      )
    )
  );

drop policy ticket_parts_write on wireless.ticket_parts;
create policy ticket_parts_write on wireless.ticket_parts for all to authenticated
  using (wireless.has_permission('ticket_parts:create'))
  with check (wireless.has_permission('ticket_parts:create'));

drop policy tickets_delete on wireless.tickets;
create policy tickets_delete on wireless.tickets for delete to authenticated
  using (wireless.has_permission('tickets:delete'));

drop policy tickets_insert on wireless.tickets;
create policy tickets_insert on wireless.tickets for insert to authenticated
  with check (wireless.has_permission('tickets:create'));

drop policy tickets_read on wireless.tickets;
create policy tickets_read on wireless.tickets for select to authenticated
  using (
    wireless.has_permission('tickets:view')
    or (
      wireless.current_role_scopes_tickets()
      and technician_id is not null
      and technician_id = wireless.my_technician_id()
    )
  );

drop policy tickets_update on wireless.tickets;
create policy tickets_update on wireless.tickets for update to authenticated
  using (
    wireless.has_permission('tickets:edit')
    or (
      wireless.current_role_scopes_tickets()
      and technician_id = (select id from wireless.technicians where profile_id = auth.uid() limit 1)
    )
  )
  with check (
    wireless.has_permission('tickets:edit')
    or wireless.current_role_scopes_tickets()
  );

-- ── 6. Update SECURITY DEFINER functions with inline role checks ────────

create or replace function wireless.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
begin
  insert into wireless.profiles (id, email, name, role, avatar, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,'user'),'@',1)),
    case
      when exists (select 1 from wireless.roles where id = coalesce(new.raw_user_meta_data->>'role',''))
        then new.raw_user_meta_data->>'role'
      else 'receptionist'
    end,
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.email,'U')),1)),
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

create or replace function wireless.prevent_unauthorized_ticket_status_change()
returns trigger
language plpgsql
security definer
set search_path to 'wireless'
as $function$
declare
  is_own_ticket boolean;
  old_j jsonb;
  new_j jsonb;
  allowed_keys text[] := array['status', 'notes_json', 'job_type', 'updated_at'];
  k text;
begin
  if wireless.is_admin() then
    return new;
  end if;

  is_own_ticket := wireless.current_role_scopes_tickets()
    and old.technician_id = (select id from wireless.technicians where profile_id = auth.uid() limit 1);

  if is_own_ticket then
    old_j := to_jsonb(old);
    new_j := to_jsonb(new);
    foreach k in array allowed_keys loop
      old_j := old_j - k;
      new_j := new_j - k;
    end loop;
    if old_j is distinct from new_j then
      raise exception 'Technicians can only update a ticket''s progress (status/notes), not its details';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status or new.notes_json is distinct from old.notes_json then
    raise exception 'Only the assigned technician or an admin can update a ticket''s status or notes';
  end if;

  return new;
end;
$function$;

create or replace function wireless.record_accessory_sale(p_product_id uuid, p_product_name text, p_quantity integer, p_unit_price numeric, p_total numeric, p_payment_method text, p_customer_id uuid default null::uuid, p_customer_name text default ''::text)
returns table(id uuid, sale_number text, created_at timestamp with time zone)
language plpgsql
security definer
set search_path to 'wireless', 'public'
as $function$
declare
  v_sale_id uuid;
  v_stock integer;
  v_unit_cost numeric;
  v_part_name text;
begin
  if not wireless.has_permission('sales:create') then
    raise exception 'Unauthorized';
  end if;

  if p_product_id is not null then
    select stock, unit_cost, name into v_stock, v_unit_cost, v_part_name
      from wireless.parts where id = p_product_id for update;
    if v_stock is null then
      raise exception 'Product not found';
    end if;
    update wireless.parts set stock = greatest(0, v_stock - p_quantity), updated_at = now()
      where id = p_product_id;
  end if;

  insert into wireless.accessory_sales
    (customer_id, customer_name, subtotal, discount, tax, total, payment_method, payment_status, amount_paid, sold_by)
  values
    (p_customer_id, coalesce(p_customer_name, ''), p_total, 0, 0, p_total, lower(p_payment_method), 'paid', p_total, auth.uid())
  returning wireless.accessory_sales.id into v_sale_id;

  insert into wireless.sale_items (sale_id, part_id, item_name, quantity, unit_price, total_price)
  values (v_sale_id, p_product_id, p_product_name, p_quantity, p_unit_price, p_total);

  if p_product_id is not null and v_unit_cost > 0 then
    insert into wireless.expenses (type, category, description, amount, notes, created_by)
    values (
      'expense',
      'Cost of Goods Sold',
      p_quantity || ' x ' || coalesce(v_part_name, p_product_name) || ' sold',
      p_quantity * v_unit_cost,
      'Auto-logged COGS for accessory sale ' || v_sale_id,
      auth.uid()
    );
  end if;

  return query select s.id, s.sale_number, s.created_at from wireless.accessory_sales s where s.id = v_sale_id;
end;
$function$;
