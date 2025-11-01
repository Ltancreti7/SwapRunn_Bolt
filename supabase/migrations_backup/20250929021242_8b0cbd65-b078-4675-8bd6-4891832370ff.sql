-- Add created_by field to jobs table to track which salesperson created the job
ALTER TABLE public.jobs 
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Update the set_jobs_dealer_id trigger function to also set created_by
CREATE OR REPLACE FUNCTION public.set_jobs_dealer_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  prof RECORD;
BEGIN
  SELECT * INTO prof FROM public.get_user_profile();
  -- If the inserting user is a dealer, ensure dealer_id is set to their dealer_id
  IF prof.user_type = 'dealer' AND prof.dealer_id IS NOT NULL THEN
    NEW.dealer_id := COALESCE(NEW.dealer_id, prof.dealer_id);
    -- Also set created_by to the current user
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop the existing function to change return type
DROP FUNCTION public.get_open_jobs_for_drivers();

-- Create a function to get job details with salesperson information for drivers
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
  track_token text, 
  dealer_name text, 
  dealer_store text, 
  estimated_pay_cents integer, 
  customer_name text, 
  customer_phone text,
  salesperson_name text,
  salesperson_phone text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
    j.track_token,
    d.name as dealer_name,
    d.store as dealer_store,
    public.pay_rate_for_distance(j.distance_miles) as estimated_pay_cents,
    j.customer_name,
    j.customer_phone,
    COALESCE(
      (SELECT ds.role::text || ' - ' || COALESCE(u.raw_user_meta_data->>'full_name', u.email)
       FROM dealership_staff ds
       JOIN auth.users u ON ds.user_id = u.id
       WHERE ds.user_id = j.created_by AND ds.dealer_id = j.dealer_id AND ds.is_active = true
       LIMIT 1),
      'Unknown'
    ) as salesperson_name,
    (SELECT u.raw_user_meta_data->>'phone'
     FROM auth.users u
     WHERE u.id = j.created_by
     LIMIT 1) as salesperson_phone
  FROM public.jobs j
  LEFT JOIN public.dealers d ON j.dealer_id = d.id
  WHERE j.status = 'open'
    AND NOT EXISTS (
      SELECT 1 FROM public.assignments a 
      WHERE a.job_id = j.id
    )
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.get_user_profile() p 
      WHERE p.user_type = 'driver'
    )
  ORDER BY j.created_at DESC;
$function$;