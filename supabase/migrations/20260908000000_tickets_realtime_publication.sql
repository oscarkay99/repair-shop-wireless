-- The staff app never pushed a ticket change to an already-open tab —
-- everything was fetch-once-per-session (useRepairs.ts), so a technician
-- assigned to a job on reception's screen only ever saw it after their own
-- tab happened to refetch (a manual refresh, or a mutation of their own).
-- Adds wireless.tickets and wireless.ticket_technicians to the realtime
-- publication so the frontend's new postgres_changes subscription
-- (useRepairs.ts startRealtimeSync) actually receives anything.
--
-- Safe to leave broadly subscribed: Realtime's postgres_changes evaluates
-- each row against the subscriber's own RLS (tickets_read /
-- ticket_technicians_read), so a technician's subscription only ever
-- receives events for tickets/assignments they could already SELECT.

alter publication supabase_realtime add table wireless.tickets;
alter publication supabase_realtime add table wireless.ticket_technicians;
