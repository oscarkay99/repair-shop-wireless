-- Separate Manager operations from the dedicated HR module.
--
-- Manager previously received leave management plus read access to staff
-- documents and formal staff queries. Those permissions made /hr appear in
-- the Manager sidebar and also granted the corresponding rows through RLS.
-- HR retains the full HR permission set; Admin retains its intentional
-- has_permission()/client bypass. Attendance remains a separate Manager/HR
-- module and is deliberately unaffected.

begin;

-- Built-in roles are immutable through both PostgREST and ordinary SQL.
-- Temporarily suspend the two lock triggers only for this tracked migration.
alter table wireless.roles disable trigger trg_prevent_system_role_mutation;
alter table wireless.roles disable trigger trg_lock_builtin_roles;

update wireless.roles
set permissions = array(
      select permission
      from unnest(permissions) as permission
      where permission not in (
        'leave:view',
        'leave:manage',
        'hr_documents:view',
        'hr_documents:manage',
        'hr_queries:view',
        'hr_queries:manage'
      )
    ),
    updated_at = now()
where id = 'manager';

alter table wireless.roles enable trigger trg_lock_builtin_roles;
alter table wireless.roles enable trigger trg_prevent_system_role_mutation;

commit;
