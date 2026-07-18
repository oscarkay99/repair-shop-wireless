-- Defense-in-depth: GoTrue already rejects creating a second auth user with an
-- existing email, but nothing stopped wireless.profiles itself from ending up
-- with two rows sharing an email through some other path. Enforce it at the
-- data layer too, not just at account-creation time.
create unique index if not exists profiles_email_unique_idx on wireless.profiles (lower(email)) where email != '';
