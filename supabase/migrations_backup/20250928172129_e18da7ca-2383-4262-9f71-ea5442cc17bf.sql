-- Fix security definer functions by setting search_path
CREATE OR REPLACE FUNCTION public.get_user_dealership_role(p_user_id uuid, p_dealer_id uuid)
 RETURNS dealership_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role 
  FROM public.dealership_staff 
  WHERE user_id = p_user_id 
    AND dealer_id = p_dealer_id 
    AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.user_has_dealership_permission(p_user_id uuid, p_dealer_id uuid, p_min_role dealership_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN p_min_role = 'staff' THEN 
      EXISTS (SELECT 1 FROM public.dealership_staff WHERE user_id = p_user_id AND dealer_id = p_dealer_id AND is_active = true)
    WHEN p_min_role = 'salesperson' THEN 
      EXISTS (SELECT 1 FROM public.dealership_staff WHERE user_id = p_user_id AND dealer_id = p_dealer_id AND is_active = true AND role IN ('salesperson', 'manager', 'owner'))
    WHEN p_min_role = 'manager' THEN 
      EXISTS (SELECT 1 FROM public.dealership_staff WHERE user_id = p_user_id AND dealer_id = p_dealer_id AND is_active = true AND role IN ('manager', 'owner'))
    WHEN p_min_role = 'owner' THEN 
      EXISTS (SELECT 1 FROM public.dealership_staff WHERE user_id = p_user_id AND dealer_id = p_dealer_id AND is_active = true AND role = 'owner')
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile()
 RETURNS TABLE(user_type text, dealer_id uuid, driver_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT p.user_type, p.dealer_id, p.driver_id 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_open_jobs_for_drivers()
 RETURNS TABLE(id uuid, type job_type, status text, created_at timestamp with time zone, pickup_address text, delivery_address text, distance_miles numeric, requires_two boolean, notes text, vin text, year integer, make text, model text, track_token text, dealer_name text, dealer_store text, estimated_pay_cents integer, customer_name text, customer_phone text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
    )
  ORDER BY j.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_job_by_tracking_token(token text)
 RETURNS TABLE(id uuid, type job_type, status text, created_at timestamp with time zone, pickup_address text, delivery_address text, track_token text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
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