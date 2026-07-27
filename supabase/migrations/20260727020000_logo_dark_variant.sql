-- Sidebar swaps logo by theme (light/dark) — a single logo_url can't cover
-- both when a business wants a differently-colored mark for dark mode.
alter table wireless.settings add column logo_url_dark text;
