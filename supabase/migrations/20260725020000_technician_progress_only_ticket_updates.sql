-- Technicians can update a ticket's progress (status, notes, and the
-- diagnosis-only-vs-repair job_type flip that happens alongside a status
-- change at the awaiting_approval decision point) but must never edit its
-- details (device, issue, customer, cost, ETA, technician assignment, etc.)
-- — that's reserved for admin/receptionist. tickets_update's WITH CHECK only
-- required `current_user_role() = 'technician'`, with no column restriction,
-- so a technician could otherwise PATCH any field on their own assigned
-- ticket via a raw API call. Deletion is unaffected — tickets_delete has
-- always been admin-only.

create or replace function wireless.prevent_unauthorized_ticket_status_change()
returns trigger language plpgsql security definer
set search_path = wireless as $$
declare
  is_own_ticket boolean;
  old_j jsonb;
  new_j jsonb;
  allowed_keys text[] := array['status', 'notes_json', 'job_type', 'updated_at'];
  k text;
begin
  if wireless.is_admin() then
    return new;
  end if;

  is_own_ticket := wireless.current_user_role() = 'technician'
    and old.technician_id = (select id from wireless.technicians where profile_id = auth.uid() limit 1);

  if is_own_ticket then
    -- Strip the progress-only columns from both sides and diff what's left —
    -- fail-closed against any ticket-detail field, present or future, rather
    -- than trying to maintain an exhaustive list of forbidden columns.
    old_j := to_jsonb(old);
    new_j := to_jsonb(new);
    foreach k in array allowed_keys loop
      old_j := old_j - k;
      new_j := new_j - k;
    end loop;
    if old_j is distinct from new_j then
      raise exception 'Technicians can only update a ticket''s progress (status/notes), not its details';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status or new.notes_json is distinct from old.notes_json then
    raise exception 'Only the assigned technician or an admin can update a ticket''s status or notes';
  end if;

  return new;
end;
$$;
