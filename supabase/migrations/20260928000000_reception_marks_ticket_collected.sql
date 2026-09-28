-- Reception, not the technician, confirms a device left the shop.
--
-- Every repair-progress step (received → … → ready) stays technician/admin
-- only via prevent_unauthorized_ticket_status_change(): the technician
-- actually did that work. But the final ready → completed step is the
-- pickup handoff — the customer paying and walking out with the device —
-- and reception is the one standing at the counter for that, not the
-- technician. Split it into its own permission so it's independent of
-- current_role_scopes_tickets() and any role can be granted it in
-- Settings > Roles, the same as every other resource:action permission.

begin;

-- Built-in roles are immutable through both PostgREST and ordinary SQL.
-- Temporarily suspend the two lock triggers only for this tracked migration
-- (same idiom as 20260918030000_separate_manager_hr_access.sql).
alter table wireless.roles disable trigger trg_prevent_system_role_mutation;
alter table wireless.roles disable trigger trg_lock_builtin_roles;

update wireless.roles
set permissions = array_append(permissions, 'tickets:collect'),
    updated_at = now()
where id = 'receptionist'
  and not ('tickets:collect' = any(permissions));

alter table wireless.roles enable trigger trg_lock_builtin_roles;
alter table wireless.roles enable trigger trg_prevent_system_role_mutation;

-- prevent_unauthorized_ticket_status_change() gains a branch checked before
-- the technician's is_own_ticket branch: a ready → completed update always
-- goes through the tickets:collect gate, technician-assigned or not, and
-- may only touch status/service_stage/completed_at/updated_at — nothing
-- else about the ticket. Every other transition (including a technician's
-- own ready → completed attempt, since technicians hold no tickets:collect
-- permission) falls through unchanged to the existing branches below.
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
  collect_keys text[] := array['status', 'service_stage', 'completed_at', 'updated_at'];
  k text;
begin
  if wireless.is_admin() then
    return new;
  end if;

  if old.status = 'ready' and new.status = 'completed' then
    if not wireless.has_permission('tickets:collect') then
      raise exception 'Only reception or an admin can mark a ticket collected';
    end if;
    old_j := to_jsonb(old);
    new_j := to_jsonb(new);
    foreach k in array collect_keys loop
      old_j := old_j - k;
      new_j := new_j - k;
    end loop;
    if old_j is distinct from new_j then
      raise exception 'Marking a ticket collected cannot change anything else on it';
    end if;
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

commit;
