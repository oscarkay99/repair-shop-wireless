-- Reception Portal's Sales tab has always been rendered unconditionally for
-- receptionists (src/pages/reception/page.tsx), but the receptionist role
-- was never granted sales:create — every accessory-sale submission was
-- silently rejected by RLS/record_accessory_sale. Grants what the UI has
-- always promised, rather than hiding a fully-built feature.

update wireless.roles
set permissions = array_append(permissions, 'sales:create')
where id = 'receptionist'
  and not ('sales:create' = any(permissions));
