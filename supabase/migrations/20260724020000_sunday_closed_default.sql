-- The business doesn't open Sundays — fix the default, and correct the
-- store row if the previous migration already applied the wrong default.
alter table wireless.settings alter column business_hours_sunday set default 'Closed';
update wireless.settings set business_hours_sunday = 'Closed'
  where id = 'store' and business_hours_sunday = '10:00 AM – 6:00 PM';
