-- Create a view for drivers that only shows essential job information
-- This limits driver access to only what they need to complete the job
CREATE OR REPLACE VIEW public.driver_job_view AS
SELECT 
  j.id,
  j.type,
  j.status,
  j.make,
  j.model,
  j.year,
  j.vin,
  j.pickup_address,
  j.delivery_address,
  j.distance_miles,
  j.requires_two,
  j.notes,
  j.track_token,
  j.created_at,
  -- Only show customer address for delivery purposes, not customer name/phone
  j.customer_address
FROM public.jobs j
WHERE EXISTS (
  SELECT 1 
  FROM public.assignments a
  JOIN public.get_user_profile() p ON (a.driver_id = p.driver_id)
  WHERE a.job_id = j.id
);

-- Enable RLS on the driver view
ALTER VIEW public.driver_job_view SET (security_invoker = on);

-- Create a security definer function to check if user is a dealer
CREATE OR REPLACE FUNCTION public.is_dealer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  );
$$;

-- Update the jobs RLS policy to be more restrictive for drivers
-- Dealers get full access, drivers get limited access through the view
DROP POLICY IF EXISTS "Jobs viewable by owning dealer or assigned drivers" ON public.jobs;

CREATE POLICY "Jobs viewable by dealers only" 
ON public.jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.get_user_profile() p
    WHERE p.user_type = 'dealer' AND p.dealer_id = jobs.dealer_id
  )
);

-- Create RLS policy for the driver view
CREATE POLICY "Driver job view accessible by assigned drivers" 
ON public.driver_job_view 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.assignments a
    JOIN public.get_user_profile() p ON (a.driver_id = p.driver_id)
    WHERE a.job_id = driver_job_view.id
  )
);

-- Ensure the view has RLS enabled
ALTER VIEW public.driver_job_view ENABLE ROW LEVEL SECURITY;