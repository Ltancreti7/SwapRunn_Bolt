-- Restore driver/swap coordinator support and align profiles with application expectations
--
-- This migration adds the missing tables and columns required by the
-- authentication + dashboard flows (see useAuth.tsx, DriverDashboard.tsx).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  profile_photo_url TEXT,
  available BOOLEAN DEFAULT true,
  background_check_verified BOOLEAN,
  checkr_candidate_id TEXT,
  checkr_status TEXT,
  city_ok BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  day_off TEXT,
  email_verified BOOLEAN,
  last_seen_jobs_at TIMESTAMPTZ,
  max_miles INTEGER,
  phone_verified BOOLEAN,
  profile_completion_percentage INTEGER,
  rating_avg NUMERIC,
  rating_count INTEGER,
  stripe_connect_id TEXT,
  trust_score NUMERIC,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.swap_coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  profile_photo_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES public.dealers(id),
  ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.drivers(id),
  ADD COLUMN IF NOT EXISTS swap_coordinator_id UUID REFERENCES public.swap_coordinators(id);

DROP POLICY IF EXISTS "Dealers can update their info" ON public.dealers;
DROP POLICY IF EXISTS "Dealers can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view relevant jobs" ON public.jobs;
DROP POLICY IF EXISTS "Dealers can update their jobs" ON public.jobs;
DROP POLICY IF EXISTS "Dealers can view assignments for their jobs" ON public.assignments;
DROP POLICY IF EXISTS "Dealers can view their staff" ON public.dealership_staff;
DROP POLICY IF EXISTS "Dealers can manage staff" ON public.dealership_staff;
DROP POLICY IF EXISTS "Dealers can manage invitations" ON public.staff_invitations;
DROP POLICY IF EXISTS "Dealers can view their usage" ON public.swap_usage_records;

-- DROP FUNCTION IF EXISTS public.get_user_profile();

-- Disabled duplicate get_user_profile
-- CREATE OR REPLACE FUNCTION public.get_user_profile()
-- RETURNS TABLE(
--   id UUID,
--   user_id UUID,
--   user_type public.user_type,
--   full_name TEXT,
--   first_name TEXT,
--   last_name TEXT,
--   phone TEXT,
--   dealer_id UUID,
--   driver_id UUID,
--   swap_coordinator_id UUID,
--   status TEXT,
--   avatar_url TEXT
-- )
-- LANGUAGE sql
-- STABLE
-- SECURITY DEFINER
-- SET search_path = 'public'
-- AS $$
--   SELECT
--     p.id,
--     p.user_id,
--     p.user_type,
--     p.full_name,
--     p.first_name,
--     p.last_name,
--     p.phone,
--     p.dealer_id,
--     p.driver_id,
--     p.swap_coordinator_id,
--     p.status,
--     p.avatar_url
--   FROM public.profiles p
--   WHERE p.user_id = auth.uid();
-- $$;

GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;

CREATE POLICY "Dealers can update their info" ON public.dealers
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type = 'dealer' AND p.dealer_id = public.dealers.id
    )
  );

CREATE POLICY "Dealers can insert jobs" ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type = 'dealer' AND p.dealer_id = public.jobs.dealer_id
    )
  );

CREATE POLICY "Users can view relevant jobs" ON public.jobs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE (
        (p.user_type = 'dealer' AND p.dealer_id = public.jobs.dealer_id) OR
        (p.user_type = 'driver') OR
        (p.user_type = 'swap_coordinator')
      )
    )
  );

CREATE POLICY "Dealers can update their jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type = 'dealer' AND p.dealer_id = public.jobs.dealer_id
    )
  );

CREATE POLICY "Dealers can view assignments for their jobs" ON public.assignments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.get_user_profile() p ON p.dealer_id = j.dealer_id
      WHERE j.id = public.assignments.job_id AND p.user_type = 'dealer'
    )
  );

CREATE POLICY "Dealers can view their staff" ON public.dealership_staff
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type = 'dealer' AND p.dealer_id = public.dealership_staff.dealer_id
    )
  );

CREATE POLICY "Dealers can manage staff" ON public.dealership_staff
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type = 'dealer' AND p.dealer_id = public.dealership_staff.dealer_id
    )
  );

CREATE POLICY "Dealers can manage invitations" ON public.staff_invitations
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type = 'dealer' AND p.dealer_id = public.staff_invitations.dealer_id
    )
  );

CREATE POLICY "Dealers can view their usage" ON public.swap_usage_records
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type = 'dealer' AND p.dealer_id = public.swap_usage_records.dealer_id
    )
  );
