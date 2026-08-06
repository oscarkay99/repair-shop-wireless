-- A technician's "Request Reassignment" previously just wrote a plain
-- ticket_comments row ("Reassignment requested: ...") with nothing to
-- distinguish it from any other internal note, no way to list open
-- requests across tickets, and nobody was ever actually notified — Admin
-- and Reception could only find it by opening that exact ticket. Adds
-- structured tracking so it can be surfaced as an actionable list instead
-- of something staff have to stumble on.

alter table wireless.ticket_comments
  add column if not exists request_type text,
  add column if not exists resolved boolean not null default false,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references wireless.profiles(id) on delete set null;

create index if not exists ticket_comments_pending_requests_idx
  on wireless.ticket_comments (request_type, resolved)
  where request_type is not null and resolved = false;

-- No UPDATE policy existed at all before this (comments were write-once).
-- Anyone who can already see internal comments can resolve one — this is
-- an internal staff coordination channel, not customer/financial data.
create policy ticket_comments_update on wireless.ticket_comments for update to authenticated
  using (wireless.has_permission('ticket_comments:view'))
  with check (wireless.has_permission('ticket_comments:view'));
