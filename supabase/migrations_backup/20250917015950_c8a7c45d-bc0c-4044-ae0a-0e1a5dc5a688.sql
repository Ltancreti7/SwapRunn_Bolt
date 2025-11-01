-- Fix function search path security issues
-- Update existing functions to have immutable search_path

CREATE OR REPLACE FUNCTION public.pay_rate_for_distance(miles numeric)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  select case when miles <= 120 then 1800 when miles <= 240 then 2200 else 2500 end;
$function$;

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  update dealer_subscriptions 
  set runs_used_this_month = 0,
      billing_period_start = date_trunc('month', now()),
      billing_period_end = date_trunc('month', now()) + interval '1 month'
  where billing_period_end <= now();
end;
$function$;