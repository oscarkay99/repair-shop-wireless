-- Receptionist can view a ticket's notes and photos but not add either —
-- both document repair progress, same category as status. Extends the
-- status-change guard from 20260725000000 to also cover notes_json, and
-- locks down wireless.ticket_media inserts/deletes the same way (it had no
-- role check at all: `with check (auth.uid() is not null)` let anyone
-- authenticated upload).

create or replace function wireless.prevent_unauthorized_ticket_status_change()
returns trigger language plpgsql security definer
set search_path = wireless as $$
begin
  if new.status is distinct from old.status or new.notes_json is distinct from old.notes_json then
    if not (
      wireless.is_admin()
      or (
        wireless.current_user_role() = 'technician'
        and old.technician_id = (select id from wireless.technicians where profile_id = auth.uid() limit 1)
      )
    ) then
      raise exception 'Only the assigned technician or an admin can update a ticket''s status or notes';
    end if;
  end if;
  return new;
end;
$$;

drop policy if exists "ticket_media_insert" on wireless.ticket_media;
create policy "ticket_media_insert" on wireless.ticket_media for insert to authenticated
  with check (
    wireless.is_admin()
    or (
      wireless.current_user_role() = 'technician'
      and ticket_number in (
        select t.ticket_number from wireless.tickets t
        join wireless.technicians tech on tech.id = t.technician_id
        where tech.profile_id = auth.uid()
      )
    )
  );

drop policy if exists "ticket_media_delete" on wireless.ticket_media;
create policy "ticket_media_delete" on wireless.ticket_media for delete to authenticated
  using (
    uploaded_by_id = auth.uid()
    or wireless.is_admin()
    or (
      wireless.current_user_role() = 'technician'
      and ticket_number in (
        select t.ticket_number from wireless.tickets t
        join wireless.technicians tech on tech.id = t.technician_id
        where tech.profile_id = auth.uid()
      )
    )
  );
