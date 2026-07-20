-- The privilege-escalation trigger added in
-- 20260719000000_fix_pending_status_privilege_escalation.sql correctly
-- blocks a non-admin USER from changing their own role/status — but it also
-- blocked the wireless-admin backend's own legitimate account-creation
-- upsert, which runs with the SERVICE_ROLE_KEY (no user JWT/auth.uid()
-- context at all), so is_admin() evaluated false for it too. RLS itself
-- already lets service_role bypass policies entirely, but triggers fire
-- regardless of RLS — this was missed. Exempt calls actually authenticated
-- as service_role (verified via auth.role(), not just "no user id", so an
-- anonymous/unauthenticated request still can't sneak through).
create or replace function wireless.prevent_self_privilege_escalation()
returns trigger language plpgsql security definer
set search_path = wireless as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if not wireless.is_admin() then
    if new.role is distinct from old.role or new.status is distinct from old.status then
      raise exception 'Only an admin can change role or status';
    end if;
  end if;
  return new;
end;
$$;
