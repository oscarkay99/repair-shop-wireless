-- Every field on Settings > Operations except Tax/VAT/Levy was purely
-- decorative — hardcoded defaultValue, no onChange, nothing saved anywhere.
alter table wireless.settings
  add column if not exists warranty_new_label       text not null default '12 Months',
  add column if not exists warranty_used_label       text not null default '3 Months',
  add column if not exists quote_validity_days       integer not null default 7,
  add column if not exists low_stock_threshold       integer not null default 2,
  add column if not exists repair_turnaround_target  text not null default 'Same Day',
  add column if not exists default_delivery_fee      numeric not null default 50,
  add column if not exists business_hours_mon_fri    text not null default '8:00 AM – 8:00 PM',
  add column if not exists business_hours_saturday   text not null default '9:00 AM – 7:00 PM',
  add column if not exists business_hours_sunday     text not null default '10:00 AM – 6:00 PM';
