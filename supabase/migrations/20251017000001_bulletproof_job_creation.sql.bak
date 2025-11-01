-- PERMANENT FIX: Create bulletproof job creation function
-- This function runs with SECURITY DEFINER privileges to bypass RLS issues

CREATE OR REPLACE FUNCTION public.create_job_request(
  p_type job_type,
  p_pickup_address text,
  p_delivery_address text,
  p_year integer,
  p_make text,
  p_model text,
  p_vin text DEFAULT NULL,
  p_customer_name text,
  p_customer_phone text,
  p_timeframe text,
  p_notes text DEFAULT NULL,
  p_requires_two boolean DEFAULT false,
  p_distance_miles numeric DEFAULT 25,
  p_trade_year integer DEFAULT NULL,
  p_trade_make text DEFAULT NULL,
  p_trade_model text DEFAULT NULL,
  p_trade_vin text DEFAULT NULL,
  p_trade_transmission text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  created_at timestamp with time zone,
  dealer_id uuid,
  tracking_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_dealer_id uuid;
  v_user_profile record;
  v_job_id uuid;
  v_tracking_token text;
BEGIN
  -- Get the current user's profile
  SELECT * INTO v_user_profile FROM public.get_user_profile();
  
  -- Verify the user is a dealer
  IF v_user_profile.user_type != 'dealer' THEN
    RAISE EXCEPTION 'Only dealers can create job requests';
  END IF;
  
  -- Get dealer_id
  v_dealer_id := v_user_profile.dealer_id;
  
  IF v_dealer_id IS NULL THEN
    RAISE EXCEPTION 'Dealer account not properly configured';
  END IF;
  
  -- Generate tracking token
  v_tracking_token := 'SR-' || upper(substring(md5(random()::text) from 1 for 8));
  
  -- Insert the job with full privileges
  INSERT INTO public.jobs (
    type,
    pickup_address,
    delivery_address,
    year,
    make,
    model,
    vin,
    customer_name,
    customer_phone,
    timeframe,
    notes,
    status,
    requires_two,
    distance_miles,
    dealer_id,
    created_by,
    track_token,
    trade_year,
    trade_make,
    trade_model,
    trade_vin,
    trade_transmission
  ) VALUES (
    p_type,
    p_pickup_address,
    p_delivery_address,
    p_year,
    p_make,
    p_model,
    p_vin,
    p_customer_name,
    p_customer_phone,
    p_timeframe,
    p_notes,
    'open',
    p_requires_two,
    p_distance_miles,
    v_dealer_id,
    auth.uid(),
    v_tracking_token,
    p_trade_year,
    p_trade_make,
    p_trade_model,
    p_trade_vin,
    p_trade_transmission
  ) RETURNING jobs.id, jobs.created_at INTO v_job_id, created_at;
  
  -- Return the created job info
  RETURN QUERY SELECT 
    v_job_id as id,
    created_at,
    v_dealer_id as dealer_id,
    v_tracking_token as tracking_token;
    
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_job_request TO authenticated;