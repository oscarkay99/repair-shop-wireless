-- The "Parts Needed" section of the ticket panel is explicitly a
-- technician's own suggestion/request list (no stock impact — see the
-- comment above it in RepairsBoard.tsx) and its Recommend/Remove buttons
-- are shown to any role that can update ticket progress, technicians
-- included. But the client writes that list to tickets.parts_json, and
-- parts_json was never added to prevent_unauthorized_ticket_status_change()'s
-- allowed-keys list (20260806040000 added service_stage/completed_at for the
-- same reason) — so every technician click on Recommend Part or the remove
-- (x) button has been rejected by this trigger since the feature shipped,
-- surfaced to them only as a generic "Failed to update repair" toast.

create or replace function wireless.prevent_unauthorized_ticket_status_change()
returns trigger
language plpgsql
security definer
set search_path = wireless
as $$
declare
  is_own_ticket boolean;
  old_j jsonb;
  new_j jsonb;
  allowed_keys text[] := array['status', 'service_stage', 'completed_at', 'notes_json', 'job_type', 'updated_at', 'parts_json'];
  k text;
begin
  if wireless.is_admin() then
    return new;
  end if;

  is_own_ticket := wireless.current_role_scopes_tickets()
    and exists (
      select 1 from wireless.ticket_technicians tt
      join wireless.technicians tech on tech.id = tt.technician_id
      where tt.ticket_id = old.id
        and tech.profile_id = auth.uid()
    );

  if is_own_ticket then
    old_j := to_jsonb(old);
    new_j := to_jsonb(new);
    foreach k in array allowed_keys loop
      old_j := old_j - k;
      new_j := new_j - k;
    end loop;
    if old_j is distinct from new_j then
      raise exception 'Technicians can only update a ticket''s progress (status/notes/parts), not its details';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status or new.notes_json is distinct from old.notes_json then
    raise exception 'Only an assigned technician or an admin can update a ticket''s status or notes';
  end if;

  return new;
end;
$$;
