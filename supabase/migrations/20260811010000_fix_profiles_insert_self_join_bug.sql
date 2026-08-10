-- 20260810000000_rbac_audit_fixes.sql's profiles_insert policy has a
-- correlated-subquery bug: it queries wireless.profiles from inside a
-- policy ON wireless.profiles, and referenced the outer (new) row's
-- email/role/id unqualified — inside the subquery, an unqualified name
-- that matches a column on the subquery's own aliased relation (p)
-- resolves to that alias, not the outer row. Confirmed via pg_policies
-- after applying: the live condition read
-- `p.email = p.email AND p.role = p.role AND p.id <> p.id`, which is
-- always false (a row's id never differs from itself), permanently
-- disabling the "already-active user re-provisioning under a new auth
-- identity" branch — not a new security hole (fails closed, not open),
-- but it would incorrectly lock out a real active staffer's first sign-in
-- through a different auth method (e.g. switching to Google). Fixed by
-- qualifying the outer references with the table name, disambiguating
-- them from the subquery's own alias.

drop policy profiles_insert on wireless.profiles;
create policy profiles_insert on wireless.profiles for insert to authenticated
  with check (
    id = auth.uid()
    and (
      exists (
        select 1 from wireless.profiles p
        where p.email = profiles.email
          and p.status = 'active'
          and p.role = profiles.role
          and p.id <> profiles.id
      )
      or (
        status = 'pending'
        and not exists (select 1 from wireless.roles r where r.id = role and r.is_system)
      )
    )
  );
