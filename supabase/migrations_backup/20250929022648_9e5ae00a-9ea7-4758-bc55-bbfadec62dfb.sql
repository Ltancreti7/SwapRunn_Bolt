-- Update all functions to have proper search_path
CREATE OR REPLACE FUNCTION public.user_has_dealership_permission(p_user_id uuid, p_dealer_id uuid, p_min_role dealership_role)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_dealership_role(p_user_id uuid, p_dealer_id uuid)
RETURNS dealership_role
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role 
  FROM public.dealership_staff 
  WHERE user_id = p_user_id 
    AND dealer_id = p_dealer_id 
    AND is_active = true;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE(user_type text, dealer_id uuid, driver_id uuid)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT p.user_type, p.dealer_id, p.driver_id 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_job_by_tracking_token(token text)
RETURNS TABLE(id uuid, type job_type, status text, created_at timestamp with time zone, pickup_address text, delivery_address text, track_token text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.pay_rate_for_distance(miles numeric)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = 'public'
AS $function$
  select case when miles <= 120 then 1800 when miles <= 240 then 2200 else 2500 end;
$function$;

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
begin
  update dealer_subscriptions 
  set runs_used_this_month = 0,
      billing_period_start = date_trunc('month', now()),
      billing_period_end = date_trunc('month', now()) + interval '1 month'
  where billing_period_end <= now();
end;
$function$;