ALTER TABLE public.prediction_products
  ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'flat'
  CHECK (pricing_mode IN ('flat','per_candidate'));

UPDATE public.prediction_products
SET pricing_mode = 'per_candidate', price_per_candidate = 40
WHERE name ILIKE '%school mock%'
   OR mock_type_id IN (SELECT id FROM public.mock_types WHERE name ILIKE '%school mock%');