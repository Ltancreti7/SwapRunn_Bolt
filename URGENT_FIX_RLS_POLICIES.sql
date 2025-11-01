-- CRITICAL FIX: Add RLS policy for dealers to insert jobs
-- This allows dealers to create job requests

-- First, let's check if the policy exists and drop it if needed
DROP POLICY IF EXISTS "Dealers can insert jobs" ON public.jobs;

-- Create the policy that allows dealers to insert jobs
CREATE POLICY "Dealers can insert jobs" ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p 
      WHERE p.user_type = 'dealer'
      AND p.dealer_id = dealer_id
    )
  );

-- Also ensure dealers can view their own jobs
DROP POLICY IF EXISTS "Dealers can view their jobs" ON public.jobs;

CREATE POLICY "Dealers can view their jobs" ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p 
      WHERE (
        (p.user_type = 'dealer' AND p.dealer_id = dealer_id) OR
        (p.user_type = 'driver')
      )
    )
  );

-- Ensure dealers can update their own jobs
DROP POLICY IF EXISTS "Dealers can update their jobs" ON public.jobs;

CREATE POLICY "Dealers can update their jobs" ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p 
      WHERE p.user_type = 'dealer'
      AND p.dealer_id = dealer_id
    )
  );