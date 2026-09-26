-- Wireless database health checks. Raises an exception (so the caller's
-- transaction aborts) if anything is broken. Run inside a transaction; it
-- makes no lasting changes when the caller rolls back to a savepoint taken
-- before it (apply-migration.sh and monitor.sh both do).
--
-- 1. Static check of every wireless PL/pgSQL function with plpgsql_check.
--    This finds errors without running anything, e.g. the bare `id` in
--    get_my_notifications() that broke the notification bell for every
--    non-admin from 2026-09-10 to 2026-09-26.
-- 2. Role smoke test: for one real active user of each role, as that user
--    (role authenticated + their JWT claims, so RLS applies), call the
--    read-only RPCs the app uses and read every table it reads. A policy
--    or function that errors for a role fails here.
--
-- Maintenance: when the app starts calling a new read-only RPC or reading
-- a new table, add it to the arrays below. Never add RPCs that write
-- (record_payment, adjust_part_stock, ...): sequence numbers still advance
-- even when the transaction rolls back.

create extension if not exists plpgsql_check;

do $checks$
declare
  f record;
  c record;
  u record;
  t text;
  failures text[] := '{}';
  app_tables text[] := array[
    'accessory_sales', 'attendance', 'audit_logs', 'customers', 'expenses', 'fixed_assets',
    'invoice_items', 'invoices', 'leave_balances', 'leave_requests', 'leave_types', 'parts',
    'payments', 'profiles', 'roles', 'sale_items', 'settings', 'staff_documents', 'staff_queries',
    'staff_query_messages', 'technicians', 'ticket_comments', 'ticket_media', 'ticket_parts',
    'ticket_technicians', 'tickets'
  ];
  app_rpcs text[] := array[
    'select count(*) from wireless.get_my_notifications(30)',
    'select count(*) from wireless.get_upcoming_birthdays()'
  ];
begin
  -- 1. Static checks. Trigger functions need the table they're attached
  -- to; ones attached to nothing are dead code and skipped.
  for f in
    select p.oid, p.proname,
           (select tg.tgrelid from pg_trigger tg where tg.tgfoid = p.oid and not tg.tgisinternal limit 1) as relid,
           p.prorettype = 'trigger'::regtype as is_trigger
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language l on l.oid = p.prolang
    where n.nspname = 'wireless' and l.lanname = 'plpgsql'
  loop
    continue when f.is_trigger and f.relid is null;
    for c in
      select * from plpgsql_check_function_tb(f.oid, coalesce(f.relid, 0),
        fatal_errors => false, other_warnings => false, extra_warnings => false, performance_warnings => false)
      where level = 'error'
    loop
      failures := failures || format('function %s: %s', f.proname, c.message);
    end loop;
  end loop;

  -- 2. Role smoke test.
  for u in
    select distinct on (role) id, role
    from wireless.profiles
    where status = 'active'
    order by role, created_at
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', u.id, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', u.id::text, true);
    execute 'set local role authenticated';
    foreach t in array app_rpcs loop
      begin
        execute t;
      exception when others then
        failures := failures || format('as %s: %s -> %s', u.role, t, sqlerrm);
      end;
    end loop;
    foreach t in array app_tables loop
      begin
        execute format('select 1 from wireless.%I limit 1', t);
      exception when others then
        failures := failures || format('as %s: reading %s -> %s', u.role, t, sqlerrm);
      end;
    end loop;
    execute 'reset role';
  end loop;

  if array_length(failures, 1) > 0 then
    raise exception 'Wireless DB checks failed (% problem(s)): %', array_length(failures, 1), array_to_string(failures, ' || ');
  end if;
  raise notice 'Wireless DB checks passed';
end
$checks$;
