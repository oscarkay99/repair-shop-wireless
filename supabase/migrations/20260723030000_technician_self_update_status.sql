-- wireless.technicians' only write policy required admin/sales_manager —
-- a technician could never update their own row via RLS, which is exactly
-- why every past status/leave update from the Tech Portal (and its
-- predecessors) silently affected zero rows despite the API returning 200.
-- Adds a second, narrower policy so a technician can update only their own
-- linked row (profile_id = auth.uid()); admin/sales_manager keep full access
-- to every row via the existing policy (Postgres RLS policies for the same
-- command are OR'd together).
create policy technicians_self_update on wireless.technicians for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
