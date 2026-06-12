alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'sales_manager', 'sales_rep', 'technician', 'inventory_manager', 'customer'));

alter table public.profiles
  alter column role set default 'customer';

alter table public.repairs
  add column if not exists preferred_date date;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_role text;
  v_avatar text;
  v_phone text;
  v_existing_customer_id text;
begin
  v_full_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name'),
    split_part(coalesce(new.email, 'User'), '@', 1)
  );
  v_role := case
    when coalesce(new.raw_user_meta_data ->> 'role', '') in ('admin', 'sales_manager', 'sales_rep', 'technician', 'inventory_manager')
      then new.raw_user_meta_data ->> 'role'
    else 'customer'
  end;
  v_avatar := upper(left(coalesce(v_full_name, coalesce(new.email, 'U')), 1));
  v_phone := coalesce(new.raw_user_meta_data ->> 'phone', '');

  insert into public.profiles (id, email, name, role, avatar, last_login)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(v_full_name), ''), split_part(coalesce(new.email, 'User'), '@', 1)),
    v_role,
    v_avatar,
    to_char(now(), 'Mon DD, YYYY')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    avatar = excluded.avatar,
    last_login = excluded.last_login;

  if v_role = 'customer' then
    select c.id
    into v_existing_customer_id
    from public.customers c
    where (
      lower(c.email) = lower(coalesce(new.email, ''))
      or (
        v_phone <> ''
        and regexp_replace(c.phone, '[^0-9]', '', 'g') = regexp_replace(v_phone, '[^0-9]', '', 'g')
      )
    )
    order by c.created_at asc
    limit 1;

    if v_existing_customer_id is not null then
      update public.customers
      set
        name = coalesce(nullif(trim(v_full_name), ''), name),
        email = coalesce(nullif(new.email, ''), email),
        phone = case when v_phone <> '' then v_phone else phone end,
        website_auth_user_id = new.id,
        has_website_account = true,
        source = case when source = 'imported' then 'imported' else 'website' end
      where id = v_existing_customer_id;
    else
      insert into public.customers (
        id,
        name,
        phone,
        email,
        website_auth_user_id,
        has_website_account,
        source,
        segment,
        ltv,
        orders,
        last_order,
        avg_order,
        warranties,
        repairs,
        since
      )
      values (
        'WEB-' || upper(replace(new.id::text, '-', '')),
        coalesce(nullif(trim(v_full_name), ''), split_part(coalesce(new.email, 'Customer'), '@', 1)),
        v_phone,
        coalesce(new.email, ''),
        new.id,
        true,
        'website',
        'New',
        'GHS 0',
        0,
        '—',
        'GHS 0',
        0,
        0,
        to_char(now(), 'Mon YYYY')
      )
      on conflict (website_auth_user_id) do update
      set
        name = excluded.name,
        email = excluded.email,
        phone = excluded.phone,
        has_website_account = true,
        source = 'website';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.is_staff_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = any(array['admin', 'sales_manager', 'sales_rep', 'technician', 'inventory_manager']), false)
$$;

drop policy if exists "customers_read_authenticated" on public.customers;
drop policy if exists "customers_manage_limited_roles" on public.customers;
drop policy if exists "authenticated_manage_customers" on public.customers;

create policy "customers_select_staff_or_owner"
on public.customers
for select
to authenticated
using (
  public.is_staff_user()
  or website_auth_user_id = auth.uid()
);

create policy "customers_insert_staff_or_owner"
on public.customers
for insert
to authenticated
with check (
  public.is_staff_user()
  or website_auth_user_id = auth.uid()
);

create policy "customers_update_staff_or_owner"
on public.customers
for update
to authenticated
using (
  public.is_staff_user()
  or website_auth_user_id = auth.uid()
)
with check (
  public.is_staff_user()
  or website_auth_user_id = auth.uid()
);

create policy "customers_delete_staff_only"
on public.customers
for delete
to authenticated
using (public.is_staff_user());

drop policy if exists "repairs_read_authenticated" on public.repairs;
drop policy if exists "repairs_manage_limited_roles" on public.repairs;
drop policy if exists "authenticated_manage_repairs" on public.repairs;

create policy "repairs_select_staff_or_owner"
on public.repairs
for select
to authenticated
using (
  public.is_staff_user()
  or website_auth_user_id = auth.uid()
  or (
    customer_id is not null
    and exists (
      select 1
      from public.customers c
      where c.id = repairs.customer_id
        and c.website_auth_user_id = auth.uid()
    )
  )
);

create policy "repairs_insert_staff"
on public.repairs
for insert
to authenticated
with check (
  public.is_staff_user()
);

create policy "repairs_insert_customer_booking"
on public.repairs
for insert
to authenticated
with check (
  website_auth_user_id = auth.uid()
  and status = 'received'
  and service_stage = 'intake'
  and quote_status = 'not_sent'
  and diagnosis_paid_at is null
  and (
    payments is null
    or (jsonb_typeof(payments) = 'array' and jsonb_array_length(payments) = 0)
  )
  and (
    customer_id is null
    or exists (
      select 1
      from public.customers c
      where c.id = repairs.customer_id
        and c.website_auth_user_id = auth.uid()
    )
  )
);

create policy "repairs_update_staff_only"
on public.repairs
for update
to authenticated
using (public.is_staff_user())
with check (public.is_staff_user());

create policy "repairs_delete_staff_only"
on public.repairs
for delete
to authenticated
using (public.is_staff_user());

drop policy if exists "repair_media_read_authenticated" on public.repair_media;
drop policy if exists "repair_media_manage_limited_roles" on public.repair_media;

create policy "repair_media_select_staff_or_owner"
on public.repair_media
for select
to authenticated
using (
  public.is_staff_user()
  or exists (
    select 1
    from public.repairs r
    where r.id = repair_media.repair_id
      and (
        r.website_auth_user_id = auth.uid()
        or (
          r.customer_id is not null
          and exists (
            select 1
            from public.customers c
            where c.id = r.customer_id
              and c.website_auth_user_id = auth.uid()
          )
        )
      )
  )
);

create policy "repair_media_manage_staff_only"
on public.repair_media
for all
to authenticated
using (public.has_any_role(array['admin', 'technician']))
with check (public.has_any_role(array['admin', 'technician']));

drop policy if exists "repair_media_bucket_read_authenticated" on storage.objects;
drop policy if exists "repair_media_bucket_insert_limited_roles" on storage.objects;
drop policy if exists "repair_media_bucket_update_limited_roles" on storage.objects;
drop policy if exists "repair_media_bucket_delete_limited_roles" on storage.objects;

create policy "repair_media_bucket_read_staff_or_owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'repair-media'
  and (
    public.is_staff_user()
    or exists (
      select 1
      from public.repair_media rm
      join public.repairs r on r.id = rm.repair_id
      where rm.file_path = storage.objects.name
        and (
          r.website_auth_user_id = auth.uid()
          or (
            r.customer_id is not null
            and exists (
              select 1
              from public.customers c
              where c.id = r.customer_id
                and c.website_auth_user_id = auth.uid()
            )
          )
        )
    )
  )
);

create policy "repair_media_bucket_insert_staff_only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'repair-media'
  and public.has_any_role(array['admin', 'technician'])
);

create policy "repair_media_bucket_update_staff_only"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'repair-media'
  and public.has_any_role(array['admin', 'technician'])
)
with check (
  bucket_id = 'repair-media'
  and public.has_any_role(array['admin', 'technician'])
);

create policy "repair_media_bucket_delete_staff_only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'repair-media'
  and public.has_any_role(array['admin', 'technician'])
);
