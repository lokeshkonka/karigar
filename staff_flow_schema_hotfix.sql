-- ==========================================================
-- GarageOS Staff Flow Hotfix (Non-destructive)
-- Run this on existing Supabase projects to align DB with app code.
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Align work_orders columns used by staff and portal flows.
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS issue_description TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- 2) Add parts_tickets table used by staff dashboard + admin parts page.
CREATE TABLE IF NOT EXISTS public.parts_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3) Useful indexes for common filters and joins.
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_mechanic ON public.work_orders(assigned_mechanic_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON public.work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer ON public.work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_work_order ON public.appointments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_parts_tickets_status ON public.parts_tickets(status);
CREATE INDEX IF NOT EXISTS idx_parts_tickets_requested_by ON public.parts_tickets(requested_by);

-- 4) Normalize identity fields to reduce add-flow errors.
CREATE OR REPLACE FUNCTION public.normalize_identity_fields()
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

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_customers_identity_fields ON public.customers;
CREATE TRIGGER normalize_customers_identity_fields
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.normalize_identity_fields();

DROP TRIGGER IF EXISTS normalize_staff_profiles_identity_fields ON public.staff_profiles;
CREATE TRIGGER normalize_staff_profiles_identity_fields
BEFORE INSERT OR UPDATE ON public.staff_profiles
FOR EACH ROW
EXECUTE FUNCTION public.normalize_identity_fields();

DROP TRIGGER IF EXISTS set_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER set_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_parts_tickets_updated_at ON public.parts_tickets;
CREATE TRIGGER set_parts_tickets_updated_at
BEFORE UPDATE ON public.parts_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 5) Access grants for API roles.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.parts_tickets TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- 6) Keep local/testing behavior consistent with current app usage.
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_tickets DISABLE ROW LEVEL SECURITY;

-- 7) Safety net policies in case RLS is enabled later in Supabase UI.
DROP POLICY IF EXISTS allow_all_customers ON public.customers;
CREATE POLICY allow_all_customers ON public.customers
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_staff_profiles ON public.staff_profiles;
CREATE POLICY allow_all_staff_profiles ON public.staff_profiles
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_vehicles ON public.vehicles;
CREATE POLICY allow_all_vehicles ON public.vehicles
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_work_orders ON public.work_orders;
CREATE POLICY allow_all_work_orders ON public.work_orders
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_inventory ON public.inventory;
CREATE POLICY allow_all_inventory ON public.inventory
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_parts_tickets ON public.parts_tickets;
CREATE POLICY allow_all_parts_tickets ON public.parts_tickets
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_reviews ON public.reviews;
CREATE POLICY allow_all_reviews ON public.reviews
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_payouts ON public.payouts;
CREATE POLICY allow_all_payouts ON public.payouts
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_invoices ON public.invoices;
CREATE POLICY allow_all_invoices ON public.invoices
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS allow_all_appointments ON public.appointments;
CREATE POLICY allow_all_appointments ON public.appointments
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);
