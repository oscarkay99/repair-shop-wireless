-- Reverting 20260725050000's separate price_list table — it duplicated what
-- Inventory (wireless.parts) already tracks. The ticket form's cost
-- auto-suggest now matches against parts.name + selling_price directly
-- instead of maintaining a second, parallel price catalog.
drop table if exists wireless.price_list;
