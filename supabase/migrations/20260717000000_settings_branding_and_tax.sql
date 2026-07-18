-- Branding (primary_color) and tax toggle were only ever saved to a local
-- in-memory mock — the real wireless.settings table never had columns for
-- them, so Branding/Operations edits looked like they saved but reverted on
-- every reload.
alter table wireless.settings add column if not exists primary_color text not null default '#DC1F1F';
alter table wireless.settings add column if not exists tax_enabled boolean not null default true;
