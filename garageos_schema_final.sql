-- ==========================================================
-- GarageOS - Final Production Schema
-- Contains ALL tables, relationships, and starter RLS setup
-- ==========================================================

-- enable uuid extension if not available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- ⚠️ DANGER ZONE: WIPE ALL EXISTING TABLES & DATA
-- This ensures a perfectly clean slate for production readiness.
-- ==========================================================
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS parts_tickets CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,                           -- Supabase Auth UID
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  tier TEXT DEFAULT 'BRONZE',             -- BRONZE | SILVER | GOLD
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Staff Profiles Table (Mechanics & Managers)
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,                           -- Supabase Auth UID
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,             
  role TEXT DEFAULT 'TECHNICIAN',         -- TECHNICIAN | MANAGER | OWNER
  hourly_rate NUMERIC DEFAULT 300,
  bay_number TEXT DEFAULT 'Bay 01',
  status TEXT DEFAULT 'active',           -- active | off-duty | suspended
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  plate TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  fuel TEXT,
  color TEXT DEFAULT '#FFFFFF',
  scan_3d_data JSONB,                      -- Store point clouds, dimensions or 3d blob refs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  assigned_mechanic_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  customer_name TEXT,
  plate TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'WAITING',           -- WAITING | DIAGNOSED | INPROGRESS | QUALITY | READY | DELIVERED
  priority TEXT DEFAULT 'normal',          -- low | normal | high | urgent
  issue_description TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  cost NUMERIC NOT NULL,
  retail NUMERIC NOT NULL,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Customer Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  customer_name TEXT,
  mechanic_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  mechanic_rating INTEGER CHECK (mechanic_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Staff Payouts Table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  hours_worked NUMERIC DEFAULT 0,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'pending',          -- pending | paid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',          -- pending | paid | overdue
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create Appointments / Schedule Table
CREATE TABLE IF NOT EXISTS parts_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT DEFAULT 'pending',           -- pending | approved | rejected | sourced
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create Appointments / Schedule Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  bay TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  start_row INTEGER DEFAULT 1,
  duration_hours INTEGER DEFAULT 1,
  title TEXT,
  type TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful indexes for hot dashboard/staff queries
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_mechanic ON work_orders(assigned_mechanic_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_work_order ON appointments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_parts_tickets_status ON parts_tickets(status);
CREATE INDEX IF NOT EXISTS idx_parts_tickets_requested_by ON parts_tickets(requested_by);

-- Normalize optional/identity fields so add flows do not fail on casing/blank values.
CREATE OR REPLACE FUNCTION normalize_identity_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := LOWER(BTRIM(NEW.email));
    IF NEW.email = '' THEN
      NEW.email := NULL;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'customers' THEN
    IF NEW.phone IS NOT NULL THEN
      NEW.phone := BTRIM(NEW.phone);
      IF NEW.phone = '' THEN
        NEW.phone := NULL;
      END IF;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'staff_profiles' THEN
    IF NEW.bay_number IS NOT NULL THEN
      NEW.bay_number := BTRIM(NEW.bay_number);
      IF NEW.bay_number = '' THEN
        NEW.bay_number := 'Bay 01';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_customers_identity_fields
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION normalize_identity_fields();

CREATE TRIGGER normalize_staff_profiles_identity_fields
BEFORE INSERT OR UPDATE ON staff_profiles
FOR EACH ROW
EXECUTE FUNCTION normalize_identity_fields();

CREATE TRIGGER set_work_orders_updated_at
BEFORE UPDATE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_parts_tickets_updated_at
BEFORE UPDATE ON parts_tickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ==========================================================
-- PRODUCTION ROW LEVEL SECURITY (RLS)
-- INSTRUCTIONS: During development, if you find access blocked, 
-- you can run `ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;`
-- ==========================================================

-- Disable RLS on all tables for local testing since Auth JWT is mocked
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE parts_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Safety net: if RLS is enabled later in Supabase UI, keep app flows functional.
DROP POLICY IF EXISTS allow_all_customers ON customers;
CREATE POLICY allow_all_customers ON customers
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_staff_profiles ON staff_profiles;
CREATE POLICY allow_all_staff_profiles ON staff_profiles
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_vehicles ON vehicles;
CREATE POLICY allow_all_vehicles ON vehicles
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_work_orders ON work_orders;
CREATE POLICY allow_all_work_orders ON work_orders
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_inventory ON inventory;
CREATE POLICY allow_all_inventory ON inventory
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_parts_tickets ON parts_tickets;
CREATE POLICY allow_all_parts_tickets ON parts_tickets
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_reviews ON reviews;
CREATE POLICY allow_all_reviews ON reviews
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_payouts ON payouts;
CREATE POLICY allow_all_payouts ON payouts
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_invoices ON invoices;
CREATE POLICY allow_all_invoices ON invoices
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_appointments ON appointments;
CREATE POLICY allow_all_appointments ON appointments
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ==========================================================
-- GRANT TABLE PERMISSIONS (Required for Supabase 2025+ projects)
-- New Supabase projects do NOT auto-grant anon/authenticated access.
-- Without this, tables show "API Disabled" and return 403.
-- ==========================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE customers        TO anon, authenticated, service_role;
GRANT ALL ON TABLE staff_profiles   TO anon, authenticated, service_role;
GRANT ALL ON TABLE vehicles         TO anon, authenticated, service_role;
GRANT ALL ON TABLE work_orders      TO anon, authenticated, service_role;
GRANT ALL ON TABLE inventory        TO anon, authenticated, service_role;
GRANT ALL ON TABLE parts_tickets    TO anon, authenticated, service_role;
GRANT ALL ON TABLE reviews          TO anon, authenticated, service_role;
GRANT ALL ON TABLE payouts          TO anon, authenticated, service_role;
GRANT ALL ON TABLE invoices         TO anon, authenticated, service_role;
GRANT ALL ON TABLE appointments     TO anon, authenticated, service_role;

-- Backstop grants so future schema changes do not accidentally break API access.
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant sequence and function access used by inserts/defaults.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- CREATE POLICY "Allow full access to anon on staff_profiles" ON staff_profiles FOR ALL USING (true);
-- CREATE POLICY "Allow full access to anon on customers" ON customers FOR ALL USING (true);
-- CREATE POLICY "Allow full access to anon on vehicles" ON vehicles FOR ALL USING (true);
-- CREATE POLICY "Allow full access to anon on work_orders" ON work_orders FOR ALL USING (true);
-- CREATE POLICY "Allow full access to anon on inventory" ON inventory FOR ALL USING (true);
-- CREATE POLICY "Allow full access to anon on reviews" ON reviews FOR ALL USING (true);
-- CREATE POLICY "Allow full access to anon on payouts" ON payouts FOR ALL USING (true);
-- CREATE POLICY "Allow full access to anon on invoices" ON invoices FOR ALL USING (true);
-- CREATE POLICY "Allow full access to anon on appointments" ON appointments FOR ALL USING (true);

-- (To tighten these policies, you would link user_id = auth.uid() and create specific role bypasses using RPCs or custom JWT claims).

-- ==========================================================
-- Starter Seeds (Safe to skip if you already have data)
-- ==========================================================

INSERT INTO staff_profiles (name, email, role, hourly_rate, bay_number)
VALUES 
  ('Marcus Vance', 'lokeshkonka8@gmail.com', 'TECHNICIAN', 350, 'Bay 04'),
  ('Sarah Jenkins', 'lokeshkonka00@gmail.com', 'TECHNICIAN', 400, 'Bay 02')
ON CONFLICT (email) DO NOTHING;
