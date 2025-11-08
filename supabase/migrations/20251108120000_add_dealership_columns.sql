-- Add missing columns to dealership_profiles table
-- These columns are needed for the full dealership registration form

ALTER TABLE public.dealership_profiles 
  ADD COLUMN IF NOT EXISTS dealership_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add index for dealership_code lookups
CREATE INDEX IF NOT EXISTS idx_dealership_profiles_code ON public.dealership_profiles(dealership_code);

-- Since dealers is a view, these columns will automatically be available through it
COMMENT ON COLUMN public.dealership_profiles.dealership_code IS 'Unique 6-character code for staff/driver signup';
COMMENT ON COLUMN public.dealership_profiles.position IS 'Job title of the person who registered the dealership';
COMMENT ON COLUMN public.dealership_profiles.status IS 'Dealership status: active, inactive, suspended';
