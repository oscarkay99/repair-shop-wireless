-- Some staff genuinely do two jobs (e.g. Esther: receptionist day-to-day,
-- manager duties too) but a profile carries exactly one active role/
-- dashboard layout at a time, and role changes are otherwise admin-only
-- (trg_prevent_self_privilege_escalation blocks a non-admin from touching
-- their own role/status — see 20260810000000_rbac_audit_fixes.sql). This
-- adds a narrow, admin-provisioned exception: an admin pairs a profile with
-- one alternate role (alt_role), and the profile owner can then swap
-- role<->alt_role themselves, any number of times, via a switcher in the
-- app — but can never set alt_role to anything else, and can never touch
-- role/status any other way. No broader privilege-escalation surface than
-- before: the only two roles reachable are whichever pair an admin
-- explicitly set up.

alter table wireless.profiles add column if not exists alt_role text references wireless.roles(id);

create or replace function wireless.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = wireless
as $$
declare
  is_pure_role_swap boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if wireless.is_admin() then
    return new;
  end if;

  is_pure_role_swap :=
    old.alt_role is not null
    and new.role = old.alt_role
    and new.alt_role = old.role
    and new.status is not distinct from old.status;

  if is_pure_role_swap then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.alt_role is distinct from old.alt_role then
    raise exception 'Only an admin can change role, status, or alternate role';
  end if;

  return new;
end;
$$;

-- Esther: receptionist day-to-day, can self-switch into manager and back.
update wireless.profiles set alt_role = 'manager' where email = 'esther.wirelesscare@gmail.com';
