-- Fix the overly permissive jobs tracking policy
-- Remove the dangerous policy that exposes all customer data

-- Drop the problematic policy
DROP POLICY IF EXISTS "Jobs viewable by tracking token" ON public.jobs;

-- Create a proper tracking function that only exposes limited data for valid tracking tokens
CREATE OR REPLACE FUNCTION public.get_job_by_tracking_token(token text)
RETURNS TABLE(
  id uuid,
  type job_type,
  status text,
  created_at timestamp with time zone,
  pickup_address text,
  delivery_address text,
  track_token text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    j.id,
    j.type,
    j.status,
    j.created_at,
    j.pickup_address,
    j.delivery_address,
    j.track_token
  FROM public.jobs j
  WHERE j.track_token = token;
$$;

-- Create a safe public tracking policy that only allows access with valid token
-- This replaces the dangerous "USING (true)" policy
CREATE POLICY "Jobs tracking by valid token only"
ON public.jobs FOR SELECT
USING (
  -- Only allow unauthenticated access if someone specifically requests this job by its tracking token
  -- This will be used by the tracking function, not direct table access
  false  -- No direct public access to the jobs table
);