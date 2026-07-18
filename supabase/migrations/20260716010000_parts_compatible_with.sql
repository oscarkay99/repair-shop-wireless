-- Adds a compatible_with column to wireless.parts so the same catalog table can
-- serve both repair parts (screens, batteries) and sellable accessories (cases,
-- chargers) -- accessory_sales/sale_items already reference wireless.parts(id),
-- confirming this table is the intended single product catalog for both.

alter table wireless.parts
  add column if not exists compatible_with text not null default '';
