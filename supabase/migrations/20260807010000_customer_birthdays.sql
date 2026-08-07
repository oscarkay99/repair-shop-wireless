-- Client explicitly asked for customer birthdays minus the year they were
-- born — month/day only, deliberately not a full date, so the system never
-- collects or implies an actual birth year/age for a customer.

alter table wireless.customers
  add column if not exists birth_month smallint check (birth_month between 1 and 12),
  add column if not exists birth_day smallint check (birth_day between 1 and 31);
