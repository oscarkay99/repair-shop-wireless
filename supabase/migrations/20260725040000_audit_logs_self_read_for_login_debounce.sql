-- logAuthEvent() needs to check a user's own most recent security row before
-- inserting a new one, to collapse duplicate SIGNED_IN firings (Supabase
-- syncs auth state across every open tab, and can re-fire SIGNED_IN in tabs
-- that didn't initiate the actual login) into a single logged entry. But
-- audit_logs_read only allows admin/sales_manager to SELECT at all — a
-- receptionist or technician's own debounce check would silently return no
-- rows under RLS, so the check would never fire for them and duplicates
-- would keep happening. Widening read access to also allow anyone to see
-- their own rows (not everyone else's) fixes this without loosening the
-- existing admin/sales_manager full-table read.

drop policy if exists "audit_logs_read" on wireless.audit_logs;
create policy "audit_logs_read" on wireless.audit_logs for select to authenticated
  using (
    wireless.has_any_role(array['admin','sales_manager'])
    or actor_id = auth.uid()
  );
