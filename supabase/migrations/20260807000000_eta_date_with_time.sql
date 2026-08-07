-- eta_date was a plain date, so ETA could only ever mean "sometime that day"
-- — the client specifically asked for a time too (e.g. "Monday 20th, 4pm"),
-- and it's what the new ETA reminder banner needs to say something more
-- useful than "due today". Existing rows cast cleanly (midnight on that
-- date), so this is a safe widen, not a data-losing change.

alter table wireless.tickets
  alter column eta_date type timestamptz using eta_date::timestamptz;
