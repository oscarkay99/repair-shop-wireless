-- CRITICAL SECURITY FIX: wireless.current_user_role() never checked
-- profiles.status, so a 'pending' (unapproved) signup's self-reported role
-- (accepted verbatim from signup metadata by handle_new_user()) was fully
-- live everywhere is_admin()/has_any_role() were used — and profiles_update
-- let any authenticated user flip their OWN status to 'active' (or role to
-- 'admin') with a single direct REST call, since the policy only checked
-- `id = auth.uid()`, not which columns changed. Combined: sign up with
-- {data:{role:'admin'}}, then `PATCH /profiles?id=eq.<self>` to set
-- status='active' — instant, self-granted admin, no approval needed.
-- Separately, a dozen *_read policies were bare `USING (true)` for the
-- `authenticated` role, so even without escalating, any pending/unapproved
-- signup could already read every customer, ticket, invoice, and technician
-- row immediately after signing up.

-- 1. Make every role-check helper status-aware. is_admin()/has_any_role()
--    both call current_user_role(), so this one change closes the
--    escalation path everywhere those helpers gate a write/delete policy.
create or replace function wireless.current_user_role()
returns text language sql stable security definer
set search_path = wireless as $$
  select role from wireless.profiles where id = auth.uid() and status = 'active'
$$;

-- 2. New helper for the plain USING(true) read policies, so an
--    unapproved/pending signup can't read real data at all.
create or replace function wireless.is_active_user()
returns boolean language sql stable security definer
set search_path = wireless as $$
  select exists(select 1 from wireless.profiles where id = auth.uid() and status = 'active')
$$;

drop policy if exists accessory_sales_read on wireless.accessory_sales;
create policy accessory_sales_read on wireless.accessory_sales for select to authenticated using (wireless.is_active_user());

drop policy if exists customers_read on wireless.customers;
create policy customers_read on wireless.customers for select to authenticated using (wireless.is_active_user());

drop policy if exists invoice_items_read on wireless.invoice_items;
create policy invoice_items_read on wireless.invoice_items for select to authenticated using (wireless.is_active_user());

drop policy if exists invoices_read on wireless.invoices;
create policy invoices_read on wireless.invoices for select to authenticated using (wireless.is_active_user());

drop policy if exists parts_read on wireless.parts;
create policy parts_read on wireless.parts for select to authenticated using (wireless.is_active_user());

drop policy if exists sale_items_read on wireless.sale_items;
create policy sale_items_read on wireless.sale_items for select to authenticated using (wireless.is_active_user());

drop policy if exists settings_read on wireless.settings;
create policy settings_read on wireless.settings for select to authenticated using (wireless.is_active_user());

drop policy if exists technicians_read on wireless.technicians;
create policy technicians_read on wireless.technicians for select to authenticated using (wireless.is_active_user());

drop policy if exists ticket_comments_read on wireless.ticket_comments;
create policy ticket_comments_read on wireless.ticket_comments for select to authenticated using (wireless.is_active_user());

drop policy if exists ticket_media_read on wireless.ticket_media;
create policy ticket_media_read on wireless.ticket_media for select to authenticated using (wireless.is_active_user());

drop policy if exists ticket_parts_read on wireless.ticket_parts;
create policy ticket_parts_read on wireless.ticket_parts for select to authenticated using (wireless.is_active_user());

drop policy if exists tickets_read on wireless.tickets;
create policy tickets_read on wireless.tickets for select to authenticated using (wireless.is_active_user());

-- 3. Close the actual escalation vector: a non-admin may still update their
--    OWN row (name, phone, bio, birthday, avatar — all fine), but may never
--    change their own role or status. Only an admin (acting on someone
--    else's row) may change those columns.
create or replace function wireless.prevent_self_privilege_escalation()
returns trigger language plpgsql security definer
set search_path = wireless as $$
begin
  if not wireless.is_admin() then
    if new.role is distinct from old.role or new.status is distinct from old.status then
      raise exception 'Only an admin can change role or status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_privilege_escalation on wireless.profiles;
create trigger trg_prevent_self_privilege_escalation
  before update on wireless.profiles
  for each row
  execute function wireless.prevent_self_privilege_escalation();
