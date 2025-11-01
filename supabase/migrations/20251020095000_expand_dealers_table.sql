-- Expand dealers table to match application expectations
--
-- The React flows (DealershipRegistration, DealerDashboard, staff invites)
-- read/write several columns that were trimmed from the temporary schema.
-- This migration restores them so that onboarding and profile management work.

ALTER TABLE public.dealers
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS plan TEXT,
  ADD COLUMN IF NOT EXISTS dealership_type TEXT,
  ADD COLUMN IF NOT EXISTS dealership_code TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Give dealership_code a uniqueness guard to prevent duplicates when generating codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'dealers'
      AND indexname = 'dealers_dealership_code_key'
  ) THEN
    ALTER TABLE public.dealers
      ADD CONSTRAINT dealers_dealership_code_key UNIQUE (dealership_code);
  END IF;
END $$;
