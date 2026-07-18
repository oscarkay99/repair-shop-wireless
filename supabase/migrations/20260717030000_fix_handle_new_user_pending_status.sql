-- SECURITY FIX: on_auth_user_created fired for EVERY new auth.users row —
-- public password signup (GOTRUE_DISABLE_SIGNUP=false) or Google OAuth first
-- login — and unconditionally created an ACTIVE wireless.profiles row
-- (defaulting to 'receptionist'), completely bypassing the frontend's
-- "unrecognized email gets rejected" check, since that check only runs after
-- the profile already exists. A real stranger's Google account got real
-- receptionist-level access this way.
--
-- Fix: the trigger now creates new profiles with status = 'pending' instead
-- of 'active'. The frontend now rejects any session whose profile isn't
-- 'active', regardless of whether a row exists. Admin-created accounts (via
-- the wireless-admin service) explicitly set status = 'active' as part of
-- creation, so the normal invite flow is unaffected.
alter table wireless.profiles drop constraint if exists profiles_status_check;
alter table wireless.profiles add constraint profiles_status_check
  check (status = any (array['active', 'inactive', 'suspended', 'pending']));

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
      when coalesce(new.raw_user_meta_data->>'role','') in ('admin','sales_manager','technician','inventory_manager','receptionist')
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
