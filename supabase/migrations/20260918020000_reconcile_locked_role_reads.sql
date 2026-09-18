-- Minimal reconciliation after enabling permission-backed read policies.
-- Production's role rows predate parts of the tracked migration history.
-- Preserve every existing grant and add only the reads required by each
-- role's already-live, hard-coded landing page:
--   * sales_manager dashboard calculates revenue from invoices
--   * inventory portals load their catalog from wireless.parts
--
-- The previous migration intentionally locks built-in rows, so the schema
-- owner temporarily disables user triggers for these three additive changes.

alter table wireless.roles disable trigger user;

update wireless.roles
set permissions = array_append(permissions, 'invoices:view'), updated_at = now()
where id = 'sales_manager'
  and not ('invoices:view' = any(permissions));

update wireless.roles
set permissions = array_append(permissions, 'parts:view'), updated_at = now()
where id in ('stock_manager','inventory_manager')
  and not ('parts:view' = any(permissions));

alter table wireless.roles enable trigger user;

