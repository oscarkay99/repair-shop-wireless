-- Companion to the frontend fix making Portal-module access and the
-- inventory-portal redirect generic (keyed off dashboard_variant) instead
-- of hardcoded to the literal 'stock_manager' role id. Any custom role
-- built for the same job now needs dashboard_variant = 'inventory_portal'
-- to actually reach it.
--
-- Fixes two concrete rows:
-- - 'inventory_manager': a custom role created via the app's role UI with
--   dashboard_variant left at 'receptionist' (the closest available option
--   at the time — there was no inventory-portal choice), which routed its
--   users into /reception and then denied them entry since their role id
--   wasn't in the old hardcoded Portal allowlist. Both currently-logged-in
--   accounts on this role were locked out immediately post-login.
-- - 'stock_manager': the pre-existing role this whole mechanism was
--   modeled on. It already worked (via the now-removed hardcoded role-id
--   check), but had dashboard_variant = 'sales_manager', which was never
--   actually read for this role — aligning it here so the generic
--   variant-based check is the only mechanism going forward.
update wireless.roles set dashboard_variant = 'inventory_portal' where id = 'inventory_manager';
update wireless.roles set dashboard_variant = 'inventory_portal' where id = 'stock_manager';
