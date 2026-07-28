-- receptionist has invoices:create/invoices:edit but not invoices:items_edit,
-- which invoice_items_write actually requires. createInvoice() always inserts
-- both the invoice row and its line items in the same call — for a
-- receptionist, the row would insert fine and the items insert would then
-- fail under RLS, leaving an invoice with no line items and throwing an
-- error the caller sees as "invoice creation failed." Admin is unaffected
-- (is_admin() bypasses has_permission() checks entirely), which is why this
-- didn't surface during admin-only testing.

update wireless.roles
set permissions = array_append(permissions, 'invoices:items_edit')
where id = 'receptionist'
  and not ('invoices:items_edit' = any(permissions));
