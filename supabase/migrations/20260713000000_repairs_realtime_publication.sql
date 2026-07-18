-- Enable realtime updates for public.repairs so the customer portal
-- (rewired off Tickets onto Repairs) receives live status changes.
alter publication supabase_realtime add table public.repairs;
