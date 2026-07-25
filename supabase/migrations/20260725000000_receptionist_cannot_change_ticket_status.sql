-- Receptionist can create, edit, and assign tickets (tickets_insert/update
-- already allow this), but should never be able to advance a ticket's
-- status themselves — that's reserved for the assigned technician and
-- admin. The frontend now hides those controls for receptionist, but
-- tickets_update's RLS still lets them PATCH status directly via a raw API
-- call, same class of gap fixed for profiles.role/status in
-- 20260719000000_fix_pending_status_privilege_escalation.sql — so this
-- closes it at the database layer too, not just in the UI.

create or replace function wireless.prevent_unauthorized_ticket_status_change()
returns trigger language plpgsql security definer
set search_path = wireless as $$
begin
  if new.status is distinct from old.status then
    if not (
      wireless.is_admin()
      or (
        wireless.current_user_role() = 'technician'
        and old.technician_id = (select id from wireless.technicians where profile_id = auth.uid() limit 1)
      )
    ) then
      raise exception 'Only the assigned technician or an admin can change a ticket''s status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_unauthorized_ticket_status_change on wireless.tickets;
create trigger trg_prevent_unauthorized_ticket_status_change
  before update on wireless.tickets
  for each row
  execute function wireless.prevent_unauthorized_ticket_status_change();
