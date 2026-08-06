-- prevent_unauthorized_ticket_status_change() lets an assigned technician
-- change status/notes_json/job_type/updated_at on their own ticket, but
-- statusToServiceStage() (the client's status-pipeline mapping) changes
-- service_stage on almost every real transition (intake->diagnosis,
-- diagnosis->approval, repair->pickup, etc.) and updateRepairStatus() always
-- writes status and service_stage together. Since service_stage wasn't in
-- the allowed-keys list, the trigger rejected the update as an unauthorized
-- detail change, silently blocking technicians from advancing most tickets
-- through the normal queue -> in_progress -> ready pipeline.
--
-- completed_at is added for the same reason: a technician can independently
-- close a diagnosis-only ticket (handleCloseDiagnosisOnly), which is about
-- to start stamping completed_at alongside status — without it here that
-- specific transition would hit this same rejection.

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
  allowed_keys text[] := array['status', 'service_stage', 'completed_at', 'notes_json', 'job_type', 'updated_at'];
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
      raise exception 'Technicians can only update a ticket''s progress (status/notes), not its details';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status or new.notes_json is distinct from old.notes_json then
    raise exception 'Only an assigned technician or an admin can update a ticket''s status or notes';
  end if;

  return new;
end;
$$;
