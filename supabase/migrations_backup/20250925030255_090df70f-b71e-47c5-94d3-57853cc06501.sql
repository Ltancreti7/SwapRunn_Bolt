-- Drop and recreate the get_open_jobs_for_drivers function with enhanced return data
DROP FUNCTION IF EXISTS public.get_open_jobs_for_drivers();

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
   customer_phone text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
    j.customer_phone
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
    );
$function$