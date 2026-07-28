-- The existing `eta` column is free text ("Today", "Apr 26", "—"), fine for
-- a human-friendly label but useless for computing anything — there's no way
-- to tell whether a ticket has slipped past its projected completion date,
-- or to average turnaround across active tickets. Adds a real date
-- alongside it; `eta` is kept as-is for the display override staff may still
-- want (e.g. "Today"), `eta_date` powers the overdue flag and stats the
-- free-text field can't.

alter table wireless.tickets
  add column if not exists eta_date date;

comment on column wireless.tickets.eta_date is
  'Structured projected-completion date, alongside the free-text eta label. Existing tickets have this null (no reliable way to backfill a real date from free text) — populated going forward as staff set it.';
