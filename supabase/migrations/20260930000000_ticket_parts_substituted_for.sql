-- In-house note on a Parts Used row: the part actually fitted differs from
-- the one the customer was quoted/booked for (e.g. a compatible MacBook
-- screen). Optional, never printed on tickets or invoices — stock is
-- deducted for the part_id on the row, which is the part actually used.
alter table wireless.ticket_parts add column if not exists substituted_for text;
