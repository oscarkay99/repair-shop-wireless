-- Technicians could previously see every ticket (and every ticket's
-- photos/comments/parts) regardless of who it was assigned to. Scope
-- technicians to only their own assigned tickets, matched by the real
-- technician_id FK rather than the free-text technician_name string the
-- app currently assigns by (technician_id has never been populated by the
-- app — see comment on wireless.tickets.technician_name).
--
-- This migration:
--   1. Links the one existing technician login (Ama Owusu) to a
--      wireless.technicians roster row via profile_id, creating one if
--      no matching roster row exists yet.
--   2. Backfills technician_id on existing tickets from technician_name,
--      matched case-insensitively against the technicians roster.
--   3. Adds wireless.my_technician_id(), resolving the calling user's own
--      roster id (or null if they have none / aren't a technician).
--   4. Replaces the read policies on tickets, ticket_media, ticket_comments,
--      and ticket_parts so a technician only sees rows tied to their own
--      technician_id — deliberately NOT including unassigned tickets, per
--      the decision that technicians should see only work explicitly
--      assigned to them. All other roles (admin, receptionist,
--      sales_manager, inventory_manager) keep full visibility, unchanged.

-- 1. Link existing technician logins to a roster row -----------------------

insert into wireless.technicians (name, email, profile_id, status)
select p.name, p.email, p.id, 'available'
from wireless.profiles p
where p.role = 'technician'
  and not exists (select 1 from wireless.technicians t where t.profile_id = p.id)
  and not exists (select 1 from wireless.technicians t where lower(t.name) = lower(p.name));

update wireless.technicians t
set profile_id = p.id
from wireless.profiles p
where t.profile_id is null
  and p.role = 'technician'
  and lower(t.name) = lower(p.name);

-- 2. Backfill technician_id on existing tickets from technician_name -------

update wireless.tickets t
set technician_id = m.id
from wireless.technicians m
where t.technician_id is null
  and t.technician_name is not null
  and t.technician_name <> ''
  and lower(m.name) = lower(t.technician_name);

-- 3. Helper: resolve the calling user's own technician roster id -----------

create or replace function wireless.my_technician_id()
returns uuid
language sql stable security definer
set search_path = wireless
as $$
  select id from wireless.technicians where profile_id = auth.uid() limit 1;
$$;

-- 4. Scope technician reads to their own technician_id ----------------------

drop policy if exists tickets_read on wireless.tickets;
create policy tickets_read on wireless.tickets for select to authenticated using (
  wireless.has_any_role(array['admin','receptionist','sales_manager','inventory_manager'])
  or (
    wireless.current_user_role() = 'technician'
    and technician_id is not null
    and technician_id = wireless.my_technician_id()
  )
);

drop policy if exists ticket_media_read on wireless.ticket_media;
create policy ticket_media_read on wireless.ticket_media for select to authenticated using (
  wireless.has_any_role(array['admin','receptionist','sales_manager','inventory_manager'])
  or (
    wireless.current_user_role() = 'technician'
    and exists (
      select 1 from wireless.tickets t
      where t.ticket_number = ticket_media.ticket_number
        and t.technician_id is not null
        and t.technician_id = wireless.my_technician_id()
    )
  )
);

drop policy if exists ticket_comments_read on wireless.ticket_comments;
create policy ticket_comments_read on wireless.ticket_comments for select to authenticated using (
  wireless.has_any_role(array['admin','receptionist','sales_manager','inventory_manager'])
  or (
    wireless.current_user_role() = 'technician'
    and exists (
      select 1 from wireless.tickets t
      where t.id = ticket_comments.ticket_id
        and t.technician_id is not null
        and t.technician_id = wireless.my_technician_id()
    )
  )
);

drop policy if exists ticket_parts_read on wireless.ticket_parts;
create policy ticket_parts_read on wireless.ticket_parts for select to authenticated using (
  wireless.has_any_role(array['admin','receptionist','sales_manager','inventory_manager'])
  or (
    wireless.current_user_role() = 'technician'
    and exists (
      select 1 from wireless.tickets t
      where t.id = ticket_parts.ticket_id
        and t.technician_id is not null
        and t.technician_id = wireless.my_technician_id()
    )
  )
);
