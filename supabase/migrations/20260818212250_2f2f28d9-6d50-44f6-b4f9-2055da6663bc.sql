ALTER TABLE public.schools ALTER COLUMN user_id DROP NOT NULL;
UPDATE public.schools SET membership_status = 'active' WHERE membership_status NOT IN ('active','suspended','expired');
ALTER TABLE public.schools ADD CONSTRAINT schools_membership_status_check CHECK (membership_status IN ('active','suspended','expired'));