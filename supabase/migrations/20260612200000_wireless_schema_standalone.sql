-- ============================================================
-- WIRELESS schema — fully self-contained (no public.* deps)
-- Works on a fresh Supabase instance with only auth.* tables.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS wireless;

-- LANGUAGE sql functions are validated eagerly at CREATE time, but several
-- helper functions below (current_user_role, is_admin, has_any_role) are
-- defined before the tables they reference (profiles) exist yet in this
-- file. Same fix pg_dump itself applies for forward references.
SET check_function_bodies = false;

-- ── Grant PostgREST / anon / authenticated access ───────────
GRANT USAGE ON SCHEMA wireless TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA wireless
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA wireless
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA wireless
  GRANT ALL ON ROUTINES  TO anon, authenticated, service_role;

-- ── Drop any partial tables from a previous failed run ──────
DROP TABLE IF EXISTS wireless.invoice_items    CASCADE;
DROP TABLE IF EXISTS wireless.invoices         CASCADE;
DROP TABLE IF EXISTS wireless.sale_items       CASCADE;
DROP TABLE IF EXISTS wireless.accessory_sales  CASCADE;
DROP TABLE IF EXISTS wireless.ticket_parts     CASCADE;
DROP TABLE IF EXISTS wireless.ticket_comments  CASCADE;
DROP TABLE IF EXISTS wireless.tickets          CASCADE;
DROP TABLE IF EXISTS wireless.parts            CASCADE;
DROP TABLE IF EXISTS wireless.technicians      CASCADE;
DROP TABLE IF EXISTS wireless.customers        CASCADE;
DROP TABLE IF EXISTS wireless.profiles         CASCADE;
DROP TABLE IF EXISTS wireless.audit_logs       CASCADE;
DROP TABLE IF EXISTS wireless.settings         CASCADE;

-- ── Sequences for human-readable IDs ────────────────────────
DROP SEQUENCE IF EXISTS wireless.ticket_number_seq;
DROP SEQUENCE IF EXISTS wireless.invoice_number_seq;
DROP SEQUENCE IF EXISTS wireless.sale_number_seq;

CREATE SEQUENCE wireless.ticket_number_seq  START 1;
CREATE SEQUENCE wireless.invoice_number_seq START 1;
CREATE SEQUENCE wireless.sale_number_seq    START 1;

-- ============================================================
-- HELPER FUNCTIONS (self-contained in wireless schema)
-- ============================================================

CREATE OR REPLACE FUNCTION wireless.current_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = wireless AS $$
  SELECT role FROM wireless.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION wireless.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = wireless AS $$
  SELECT coalesce(wireless.current_user_role() = 'admin', false)
$$;

CREATE OR REPLACE FUNCTION wireless.has_any_role(allowed_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = wireless AS $$
  SELECT coalesce(wireless.current_user_role() = ANY(allowed_roles), false)
$$;

-- ============================================================
-- TABLES
-- ============================================================

-- ── settings ─────────────────────────────────────────────────
CREATE TABLE wireless.settings (
  id              text PRIMARY KEY DEFAULT 'store',
  business_name   text NOT NULL DEFAULT 'WIRELESS',
  tagline         text NOT NULL DEFAULT 'Repair & Service',
  phone           text NOT NULL DEFAULT '',
  whatsapp        text NOT NULL DEFAULT '',
  address         text NOT NULL DEFAULT '',
  monthly_target  numeric NOT NULL DEFAULT 10000,
  vat_rate        numeric NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'GH₵',
  warranty_days   integer NOT NULL DEFAULT 30,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO wireless.settings DEFAULT VALUES ON CONFLICT DO NOTHING;

-- ── profiles (staff — mirrors auth.users) ────────────────────
CREATE TABLE wireless.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL DEFAULT '',
  name        text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'sales_rep'
                CHECK (role IN ('admin','sales_manager','sales_rep','technician','inventory_manager')),
  avatar      text NOT NULL DEFAULT 'U',
  phone       text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','inactive','suspended')),
  last_login  text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile when a new auth user signs up
CREATE OR REPLACE FUNCTION wireless.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = wireless AS $$
BEGIN
  INSERT INTO wireless.profiles (id, email, name, role, avatar)
  VALUES (
    NEW.id,
    coalesce(NEW.email, ''),
    coalesce(NEW.raw_user_meta_data->>'full_name', split_part(coalesce(NEW.email,'user'),'@',1)),
    CASE
      WHEN coalesce(NEW.raw_user_meta_data->>'role','') IN
           ('admin','sales_manager','sales_rep','technician','inventory_manager')
        THEN NEW.raw_user_meta_data->>'role'
      ELSE 'sales_rep'
    END,
    upper(left(coalesce(NEW.raw_user_meta_data->>'full_name', coalesce(NEW.email,'U')),1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION wireless.handle_new_user();

-- ── customers ────────────────────────────────────────────────
CREATE TABLE wireless.customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  phone         text NOT NULL,
  email         text NOT NULL DEFAULT '',
  address       text NOT NULL DEFAULT '',
  notes         text,
  ticket_count  integer NOT NULL DEFAULT 0,
  total_spent   numeric NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customers_phone_idx ON wireless.customers (phone);
CREATE INDEX customers_name_idx  ON wireless.customers (lower(name));

-- ── technicians ──────────────────────────────────────────────
CREATE TABLE wireless.technicians (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid REFERENCES wireless.profiles(id) ON DELETE SET NULL,
  name              text NOT NULL,
  phone             text NOT NULL DEFAULT '',
  email             text NOT NULL DEFAULT '',
  specialty         text NOT NULL DEFAULT '',
  status            text NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available','busy','off_duty')),
  rating            numeric NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_completed   integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── parts (inventory) ────────────────────────────────────────
CREATE TABLE wireless.parts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  sku             text NOT NULL UNIQUE,
  category        text NOT NULL DEFAULT 'other',
  unit_cost       numeric NOT NULL DEFAULT 0,
  selling_price   numeric NOT NULL DEFAULT 0,
  stock           integer NOT NULL DEFAULT 0,
  min_stock       integer NOT NULL DEFAULT 5,
  supplier        text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX parts_sku_idx  ON wireless.parts (sku);
CREATE INDEX parts_name_idx ON wireless.parts (lower(name));

-- ── tickets ──────────────────────────────────────────────────
CREATE TABLE wireless.tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number   text NOT NULL UNIQUE
                    DEFAULT ('TK-' || lpad(nextval('wireless.ticket_number_seq')::text, 4, '0')),
  customer_id     uuid NOT NULL REFERENCES wireless.customers(id) ON DELETE RESTRICT,
  device          text NOT NULL,
  brand           text NOT NULL DEFAULT '',
  model           text NOT NULL DEFAULT '',
  serial_imei     text,
  color           text,
  issue           text NOT NULL,
  diagnosis       text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','waiting_parts','ready','completed','cancelled')),
  priority        text NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low','normal','high','urgent')),
  technician_id   uuid REFERENCES wireless.technicians(id) ON DELETE SET NULL,
  estimated_cost  numeric,
  final_cost      numeric,
  deposit_paid    numeric NOT NULL DEFAULT 0,
  warranty_days   integer NOT NULL DEFAULT 30,
  received_at     timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  created_by      uuid REFERENCES wireless.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tickets_customer_idx   ON wireless.tickets (customer_id);
CREATE INDEX tickets_technician_idx ON wireless.tickets (technician_id);
CREATE INDEX tickets_status_idx     ON wireless.tickets (status);
CREATE INDEX tickets_created_at_idx ON wireless.tickets (created_at DESC);

-- ── ticket_comments ──────────────────────────────────────────
CREATE TABLE wireless.ticket_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid NOT NULL REFERENCES wireless.tickets(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES wireless.profiles(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  body        text NOT NULL,
  is_internal boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ticket_comments_ticket_idx ON wireless.ticket_comments (ticket_id);

-- ── ticket_parts ─────────────────────────────────────────────
CREATE TABLE wireless.ticket_parts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid NOT NULL REFERENCES wireless.tickets(id) ON DELETE CASCADE,
  part_id     uuid REFERENCES wireless.parts(id) ON DELETE SET NULL,
  part_name   text NOT NULL,
  quantity    integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost   numeric NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ticket_parts_ticket_idx ON wireless.ticket_parts (ticket_id);

-- ── accessory_sales ──────────────────────────────────────────
CREATE TABLE wireless.accessory_sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number     text NOT NULL UNIQUE
                    DEFAULT ('SAL-' || lpad(nextval('wireless.sale_number_seq')::text, 4, '0')),
  customer_id     uuid REFERENCES wireless.customers(id) ON DELETE SET NULL,
  customer_name   text NOT NULL DEFAULT '',
  subtotal        numeric NOT NULL DEFAULT 0,
  discount        numeric NOT NULL DEFAULT 0,
  tax             numeric NOT NULL DEFAULT 0,
  total           numeric NOT NULL DEFAULT 0,
  payment_method  text NOT NULL DEFAULT 'cash',
  payment_status  text NOT NULL DEFAULT 'paid'
                    CHECK (payment_status IN ('paid','partial','unpaid')),
  amount_paid     numeric NOT NULL DEFAULT 0,
  notes           text,
  sold_by         uuid REFERENCES wireless.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX accessory_sales_created_at_idx ON wireless.accessory_sales (created_at DESC);

-- ── sale_items ───────────────────────────────────────────────
CREATE TABLE wireless.sale_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     uuid NOT NULL REFERENCES wireless.accessory_sales(id) ON DELETE CASCADE,
  part_id     uuid REFERENCES wireless.parts(id) ON DELETE SET NULL,
  item_name   text NOT NULL,
  quantity    integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0
);

CREATE INDEX sale_items_sale_idx ON wireless.sale_items (sale_id);

-- ── invoices ─────────────────────────────────────────────────
CREATE TABLE wireless.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  text NOT NULL UNIQUE
                    DEFAULT ('INV-' || to_char(now(),'YYYY') || '-' ||
                             lpad(nextval('wireless.invoice_number_seq')::text, 4, '0')),
  ticket_id       uuid REFERENCES wireless.tickets(id) ON DELETE SET NULL,
  customer_id     uuid NOT NULL REFERENCES wireless.customers(id) ON DELETE RESTRICT,
  subtotal        numeric NOT NULL DEFAULT 0,
  tax             numeric NOT NULL DEFAULT 0,
  discount        numeric NOT NULL DEFAULT 0,
  total           numeric NOT NULL DEFAULT 0,
  amount_paid     numeric NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'unpaid'
                    CHECK (status IN ('unpaid','partial','paid','overdue','cancelled')),
  due_date        date,
  notes           text,
  created_by      uuid REFERENCES wireless.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invoices_customer_idx   ON wireless.invoices (customer_id);
CREATE INDEX invoices_ticket_idx     ON wireless.invoices (ticket_id);
CREATE INDEX invoices_status_idx     ON wireless.invoices (status);
CREATE INDEX invoices_created_at_idx ON wireless.invoices (created_at DESC);

-- ── invoice_items ────────────────────────────────────────────
CREATE TABLE wireless.invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES wireless.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity    integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0
);

CREATE INDEX invoice_items_invoice_idx ON wireless.invoice_items (invoice_id);

-- ── audit_logs ───────────────────────────────────────────────
CREATE TABLE wireless.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action      text NOT NULL,
  table_name  text NOT NULL,
  entity_id   text,
  actor_id    uuid,
  actor_name  text,
  before_data jsonb,
  after_data  jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_created_at_idx ON wireless.audit_logs (created_at DESC);
CREATE INDEX audit_logs_table_idx      ON wireless.audit_logs (table_name, entity_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION wireless.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['customers','technicians','parts','tickets','invoices'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON wireless.%I;
       CREATE TRIGGER set_updated_at BEFORE UPDATE ON wireless.%I
         FOR EACH ROW EXECUTE FUNCTION wireless.set_updated_at();', tbl, tbl);
  END LOOP;
END $$;

-- Touch parent ticket when child rows change
CREATE OR REPLACE FUNCTION wireless.touch_ticket()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wireless.tickets SET updated_at = now()
    WHERE id = COALESCE(NEW.ticket_id, OLD.ticket_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['ticket_comments','ticket_parts'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS touch_ticket ON wireless.%I;
       CREATE TRIGGER touch_ticket AFTER INSERT OR UPDATE OR DELETE ON wireless.%I
         FOR EACH ROW EXECUTE FUNCTION wireless.touch_ticket();', tbl, tbl);
  END LOOP;
END $$;

-- Deduct part stock when added to a ticket
CREATE OR REPLACE FUNCTION wireless.deduct_part_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wireless.parts
    SET stock = GREATEST(0, stock - NEW.quantity), updated_at = now()
    WHERE id = NEW.part_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deduct_part_stock ON wireless.ticket_parts;
CREATE TRIGGER deduct_part_stock
  AFTER INSERT ON wireless.ticket_parts
  FOR EACH ROW WHEN (NEW.part_id IS NOT NULL)
  EXECUTE FUNCTION wireless.deduct_part_stock();

-- Increment customer ticket count
CREATE OR REPLACE FUNCTION wireless.increment_customer_ticket_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wireless.customers
    SET ticket_count = ticket_count + 1, updated_at = now()
    WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS increment_customer_ticket_count ON wireless.tickets;
CREATE TRIGGER increment_customer_ticket_count
  AFTER INSERT ON wireless.tickets
  FOR EACH ROW EXECUTE FUNCTION wireless.increment_customer_ticket_count();

-- Audit logging trigger (self-contained)
CREATE OR REPLACE FUNCTION wireless.capture_audit_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = wireless AS $$
DECLARE
  actor_id   uuid := auth.uid();
  actor_name text;
  entity_id  text;
  old_row    jsonb := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END;
  new_row    jsonb := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END;
BEGIN
  IF TG_TABLE_NAME = 'audit_logs' THEN RETURN COALESCE(NEW, OLD); END IF;

  entity_id  := (COALESCE(new_row, old_row)->>'id');
  IF actor_id IS NOT NULL THEN
    SELECT name INTO actor_name FROM wireless.profiles WHERE id = actor_id;
  END IF;

  INSERT INTO wireless.audit_logs (action, table_name, entity_id, actor_id, actor_name, before_data, after_data)
  VALUES (lower(TG_OP), TG_TABLE_NAME, entity_id, actor_id, actor_name, old_row, new_row);

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN others THEN
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'customers','technicians','parts','tickets','ticket_comments',
    'ticket_parts','accessory_sales','sale_items','invoices','invoice_items','settings'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS audit_%I_changes ON wireless.%I;
       CREATE TRIGGER audit_%I_changes AFTER INSERT OR UPDATE OR DELETE ON wireless.%I
         FOR EACH ROW EXECUTE FUNCTION wireless.capture_audit_log();', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE wireless.settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.technicians     ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.parts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.ticket_parts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.accessory_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.sale_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.invoice_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wireless.audit_logs      ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_read"   ON wireless.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR wireless.has_any_role(ARRAY['admin','sales_manager']));
CREATE POLICY "profiles_insert" ON wireless.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON wireless.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR wireless.is_admin())
  WITH CHECK (id = auth.uid() OR wireless.is_admin());
CREATE POLICY "profiles_delete" ON wireless.profiles FOR DELETE TO authenticated
  USING (wireless.is_admin());

-- settings
CREATE POLICY "settings_read"  ON wireless.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_write" ON wireless.settings FOR ALL    TO authenticated
  USING (wireless.is_admin()) WITH CHECK (wireless.is_admin());

-- customers
CREATE POLICY "customers_read"  ON wireless.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_write" ON wireless.customers FOR ALL   TO authenticated
  USING  (wireless.has_any_role(ARRAY['admin','sales_manager','sales_rep']))
  WITH CHECK (wireless.has_any_role(ARRAY['admin','sales_manager','sales_rep']));

-- technicians
CREATE POLICY "technicians_read"  ON wireless.technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "technicians_write" ON wireless.technicians FOR ALL   TO authenticated
  USING  (wireless.has_any_role(ARRAY['admin','sales_manager']))
  WITH CHECK (wireless.has_any_role(ARRAY['admin','sales_manager']));

-- parts
CREATE POLICY "parts_read"  ON wireless.parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "parts_write" ON wireless.parts FOR ALL   TO authenticated
  USING  (wireless.has_any_role(ARRAY['admin','inventory_manager']))
  WITH CHECK (wireless.has_any_role(ARRAY['admin','inventory_manager']));

-- tickets
CREATE POLICY "tickets_read"   ON wireless.tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "tickets_insert" ON wireless.tickets FOR INSERT TO authenticated
  WITH CHECK (wireless.has_any_role(ARRAY['admin','sales_manager','sales_rep','technician']));
CREATE POLICY "tickets_update" ON wireless.tickets FOR UPDATE TO authenticated
  USING (
    wireless.has_any_role(ARRAY['admin','sales_manager','sales_rep'])
    OR (wireless.current_user_role() = 'technician'
        AND technician_id = (SELECT id FROM wireless.technicians WHERE profile_id = auth.uid() LIMIT 1))
  )
  WITH CHECK (wireless.has_any_role(ARRAY['admin','sales_manager','sales_rep','technician']));
CREATE POLICY "tickets_delete" ON wireless.tickets FOR DELETE TO authenticated
  USING (wireless.is_admin());

-- ticket_comments
CREATE POLICY "ticket_comments_read"   ON wireless.ticket_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "ticket_comments_insert" ON wireless.ticket_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ticket_comments_delete" ON wireless.ticket_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR wireless.is_admin());

-- ticket_parts
CREATE POLICY "ticket_parts_read"  ON wireless.ticket_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "ticket_parts_write" ON wireless.ticket_parts FOR ALL   TO authenticated
  USING  (wireless.has_any_role(ARRAY['admin','technician','sales_manager']))
  WITH CHECK (wireless.has_any_role(ARRAY['admin','technician','sales_manager']));

-- accessory_sales
CREATE POLICY "accessory_sales_read"  ON wireless.accessory_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "accessory_sales_write" ON wireless.accessory_sales FOR ALL   TO authenticated
  USING  (wireless.has_any_role(ARRAY['admin','sales_manager','sales_rep']))
  WITH CHECK (wireless.has_any_role(ARRAY['admin','sales_manager','sales_rep']));

-- sale_items
CREATE POLICY "sale_items_read"  ON wireless.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "sale_items_write" ON wireless.sale_items FOR ALL   TO authenticated
  USING  (wireless.has_any_role(ARRAY['admin','sales_manager','sales_rep']))
  WITH CHECK (wireless.has_any_role(ARRAY['admin','sales_manager','sales_rep']));

-- invoices
CREATE POLICY "invoices_read"  ON wireless.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoices_write" ON wireless.invoices FOR ALL   TO authenticated
  USING  (wireless.has_any_role(ARRAY['admin','sales_manager']))
  WITH CHECK (wireless.has_any_role(ARRAY['admin','sales_manager']));

-- invoice_items
CREATE POLICY "invoice_items_read"  ON wireless.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoice_items_write" ON wireless.invoice_items FOR ALL   TO authenticated
  USING  (wireless.has_any_role(ARRAY['admin','sales_manager']))
  WITH CHECK (wireless.has_any_role(ARRAY['admin','sales_manager']));

-- audit_logs
CREATE POLICY "audit_logs_read"   ON wireless.audit_logs FOR SELECT TO authenticated
  USING (wireless.has_any_role(ARRAY['admin','sales_manager','inventory_manager']));
CREATE POLICY "audit_logs_insert" ON wireless.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());
CREATE POLICY "audit_logs_service" ON wireless.audit_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── Final explicit grants ────────────────────────────────────
GRANT ALL ON ALL TABLES    IN SCHEMA wireless TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA wireless TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA wireless TO anon, authenticated, service_role;
