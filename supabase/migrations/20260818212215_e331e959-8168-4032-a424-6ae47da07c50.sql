CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Members: hashed PIN + academic year
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS academic_year text NOT NULL DEFAULT to_char(now(), 'YYYY');

UPDATE public.schools SET pin_hash = extensions.crypt(member_pin, extensions.gen_salt('bf')) WHERE pin_hash IS NULL;
ALTER TABLE public.schools DROP COLUMN IF EXISTS member_pin;

-- 2. Generic product catalogue
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_type text NOT NULL DEFAULT 'other',
  description text,
  price numeric NOT NULL DEFAULT 0,
  pricing_mode text NOT NULL DEFAULT 'flat',
  academic_year text,
  subject text,
  file_path text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_type_check CHECK (product_type IN ('mock','prediction','provision','training','other')),
  CONSTRAINT products_pricing_mode_check CHECK (pricing_mode IN ('flat','per_candidate'))
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active products catalogue" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admins manage products catalogue" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_catalogue_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GHS',
  transaction_reference text UNIQUE,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_channel text,
  purchased_at timestamptz,
  access_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchases_status_check CHECK (payment_status IN ('pending','successful','failed','cancelled'))
);
CREATE INDEX IF NOT EXISTS purchases_member_idx ON public.purchases(member_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage purchases" ON public.purchases FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "school reads own purchases" ON public.purchases FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = purchases.member_id AND s.user_id = auth.uid()));
CREATE TRIGGER purchases_updated BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Login attempt log (rate limiting)
CREATE TABLE IF NOT EXISTS public.member_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id text NOT NULL,
  succeeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS member_login_attempts_idx ON public.member_login_attempts(membership_id, created_at DESC);
GRANT ALL ON public.member_login_attempts TO service_role;
ALTER TABLE public.member_login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read login attempts" ON public.member_login_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 5. Credential verification + PIN setting helpers (service role only)
CREATE OR REPLACE FUNCTION public.verify_member_credentials(_membership_id text, _pin text)
RETURNS TABLE (id uuid, school_name text, membership_id text, membership_status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT s.id, s.school_name, s.membership_id, s.membership_status
  FROM public.schools s
  WHERE upper(s.membership_id) = upper(trim(_membership_id))
    AND s.pin_hash IS NOT NULL
    AND s.pin_hash = extensions.crypt(_pin, s.pin_hash)
$$;
REVOKE ALL ON FUNCTION public.verify_member_credentials(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_member_credentials(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.set_member_pin(_member_id uuid, _pin text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  UPDATE public.schools SET pin_hash = extensions.crypt(_pin, extensions.gen_salt('bf')) WHERE id = _member_id;
$$;
REVOKE ALL ON FUNCTION public.set_member_pin(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_pin(uuid, text) TO service_role;

-- 6. Seed catalogue from existing prediction packages + starter provisions
INSERT INTO public.products (name, product_type, description, price, pricing_mode, academic_year, file_path, sort_order)
SELECT p.name,
       CASE WHEN p.name ILIKE '%mock%' THEN 'mock' ELSE 'prediction' END,
       p.description,
       p.price_per_candidate,
       p.pricing_mode,
       to_char(now(),'YYYY'),
       p.pdf_path,
       p.sort_order
FROM public.prediction_products p
WHERE p.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.products x WHERE x.name = p.name);

INSERT INTO public.products (name, product_type, description, price, academic_year, subject, sort_order)
SELECT * FROM (VALUES
  ('BECE Examination Provision Pack','provision','Printed examination provisions and stationery pack for BECE candidates.',350::numeric, to_char(now(),'YYYY'), 'General', 10),
  ('Invigilators Training Material','training','Training manual and guidelines for mock examination invigilators.',150::numeric, to_char(now(),'YYYY'), 'General', 20)
) AS v(name, product_type, description, price, academic_year, subject, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.products x WHERE x.name = v.name);