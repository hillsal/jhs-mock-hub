ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS member_pin text NOT NULL DEFAULT lpad((floor(random() * 1000000))::int::text, 6, '0');