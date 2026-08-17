CREATE TYPE public.app_role AS ENUM ('admin', 'school');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE SEQUENCE public.membership_seq START 1;

CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id text NOT NULL UNIQUE DEFAULT ('HEB-JHS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.membership_seq')::text, 4, '0')),
  school_name text NOT NULL,
  school_type text NOT NULL DEFAULT 'Private JHS',
  region text NOT NULL,
  district text NOT NULL,
  school_address text,
  school_phone text NOT NULL,
  school_email text NOT NULL,
  whatsapp_number text,
  contact_person text,
  head_teacher_name text,
  coordinator_name text,
  coordinator_phone text,
  coordinator_whatsapp text,
  coordinator_email text,
  total_jhs_students integer NOT NULL DEFAULT 0 CHECK (total_jhs_students >= 0),
  mock_candidates integer NOT NULL DEFAULT 0 CHECK (mock_candidates >= 0),
  membership_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (mock_candidates <= total_jhs_students)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER schools_updated BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "school reads own" ON public.schools FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "school inserts own" ON public.schools FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "school updates own" ON public.schools FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins manage schools" ON public.schools FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.mock_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_types TO authenticated;
GRANT ALL ON public.mock_types TO service_role;
ALTER TABLE public.mock_types ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER mock_types_updated BEFORE UPDATE ON public.mock_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "public reads active mock types" ON public.mock_types FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admins manage mock types" ON public.mock_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.prediction_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_type_id uuid REFERENCES public.mock_types(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  subjects text[] NOT NULL DEFAULT '{}',
  price_per_candidate numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_per_candidate >= 0),
  min_candidates integer NOT NULL DEFAULT 1,
  max_candidates integer,
  validity_days integer NOT NULL DEFAULT 90,
  pdf_path text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prediction_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prediction_products TO authenticated;
GRANT ALL ON public.prediction_products TO service_role;
ALTER TABLE public.prediction_products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER products_updated BEFORE UPDATE ON public.prediction_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "public reads active products" ON public.prediction_products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admins manage products" ON public.prediction_products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE SEQUENCE public.order_seq START 1;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('HEB-ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_seq')::text, 5, '0')),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.prediction_products(id) ON DELETE RESTRICT,
  mock_type_id uuid REFERENCES public.mock_types(id) ON DELETE SET NULL,
  candidate_count integer NOT NULL CHECK (candidate_count > 0),
  unit_price numeric(10,2) NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GHS',
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "school reads own orders" ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = orders.school_id AND s.user_id = auth.uid()));
CREATE POLICY "admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  paystack_reference text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GHS',
  status text NOT NULL DEFAULT 'pending',
  channel text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "school reads own payments" ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = payments.school_id AND s.user_id = auth.uid()));
CREATE POLICY "admins manage payments" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.prediction_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.prediction_products(id) ON DELETE CASCADE,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prediction_access TO authenticated;
GRANT ALL ON public.prediction_access TO service_role;
ALTER TABLE public.prediction_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school reads own access" ON public.prediction_access FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = prediction_access.school_id AND s.user_id = auth.uid()));
CREATE POLICY "admins manage access" ON public.prediction_access FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.mock_types (name, description, sort_order) VALUES
  ('BECE Mock Examination', 'Full BECE-standard mock examination', 1),
  ('JHS School Mock Examination', 'Internal school mock examination', 2),
  ('Other Mock Examination', 'Custom mock examination', 3);

INSERT INTO public.prediction_products (mock_type_id, name, description, subjects, price_per_candidate, sort_order)
SELECT mt.id, 'FULL BECE PREDICTION', 'All core and elective BECE subjects',
  ARRAY['English Language','Mathematics','Integrated Science','Social Studies','Computing','RME','French','Ghanaian Language'],
  10.00, 1
FROM public.mock_types mt WHERE mt.name = 'BECE Mock Examination';

INSERT INTO public.prediction_products (mock_type_id, name, description, subjects, price_per_candidate, sort_order)
SELECT mt.id, 'CORE SUBJECTS PREDICTION', 'The four core BECE subjects',
  ARRAY['English Language','Mathematics','Integrated Science','Social Studies'], 6.00, 2
FROM public.mock_types mt WHERE mt.name = 'BECE Mock Examination';

INSERT INTO public.prediction_products (mock_type_id, name, description, subjects, price_per_candidate, sort_order)
SELECT mt.id, 'SCHOOL MOCK PREDICTION', 'Prediction pack for internal school mocks',
  ARRAY['English Language','Mathematics','Integrated Science','Social Studies','Computing','RME'], 7.00, 1
FROM public.mock_types mt WHERE mt.name = 'JHS School Mock Examination';

CREATE POLICY "admins manage prediction files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'predictions' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'predictions' AND public.has_role(auth.uid(), 'admin'));