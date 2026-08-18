ALTER TABLE public.orders ADD COLUMN registration_fee numeric NOT NULL DEFAULT 0;

UPDATE public.prediction_products
SET price_per_candidate = 1000, min_candidates = 1, max_candidates = NULL;

COMMENT ON COLUMN public.orders.registration_fee IS 'One-time membership registration fee charged on a school first order (GHS 200). Flat prediction price is stored in unit_price.';