-- Repair parts like MacBook/MacBook Pro/MacBook Air screens come in multiple
-- colors, sizes, and model years — the catalog previously had no way to
-- distinguish those as separate trackable variants, only whatever ended up
-- in the free-text name/SKU. Add real columns so each variant is its own
-- searchable, reportable part row. `device` is a separate classification
-- from `category` (the kind of part) — which Apple product line the part
-- belongs to (MacBook Air, iPhone, Apple Pencil, ...).

alter table wireless.parts
  add column if not exists color text not null default '',
  add column if not exists size text not null default '',
  add column if not exists model_year text not null default '',
  add column if not exists device text not null default '';
