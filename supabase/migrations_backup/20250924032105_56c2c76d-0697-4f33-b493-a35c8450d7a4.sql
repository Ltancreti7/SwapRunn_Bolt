-- Create a secure function that returns only safe job data for drivers viewing open jobs
CREATE OR REPLACE FUNCTION public.get_open_jobs_for_drivers()
RETURNS TABLE(
  id uuid,
  type job_type,
  status text,
  created_at timestamp with time zone,
  pickup_address text,
  delivery_address text,
  distance_miles numeric,
  requires_two boolean,
  notes text,
  vin text,
  year integer,
  make text,
  model text,
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
    j.distance_miles,
    j.requires_two,
    j.notes,
    j.vin,
    j.year,
    j.make,
    j.model,
    j.track_token
  FROM public.jobs j
  WHERE j.status = 'open'
    AND NOT EXISTS (
      SELECT 1 FROM public.assignments a 
      WHERE a.job_id = j.id
    )
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.get_user_profile() p 
      WHERE p.user_type = 'driver'
    );
$$;