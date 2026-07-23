-- The "NHIL + GETFund (%)" field on Settings > Operations was permanently
-- disabled and hardcoded to 5 in the UI — invoices separately hardcoded
-- 2.5% + 2.5% in code, so the field never actually controlled anything.
-- This makes it a real, editable, persisted rate that invoices read.
alter table wireless.settings add column if not exists nhil_getfund_rate numeric not null default 5;
