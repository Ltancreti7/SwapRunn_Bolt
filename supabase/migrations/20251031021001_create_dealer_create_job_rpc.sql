/*
  # Secure Job Creation RPC Function
  
  1. Purpose
    - Provides secure endpoint for dealers to create jobs
    - Bypasses RLS restrictions while maintaining security
    - Validates dealer permissions before creating job
    - Generates unique tracking token
    - Triggers driver notifications automatically
    
  2. Parameters
    - All job fields as function parameters
    - Returns created job with tracking token
    
  3. Security
    - SECURITY DEFINER to bypass RLS
    - Validates user is dealer with proper dealer_id
    - Only creates jobs for authenticated dealer's dealership
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.dealer_create_job(
  p_type text,
  p_pickup_address text,
  p_delivery_address text,
  p_year integer,
  p_make text,
  p_model text,
  p_vin text,
  p_customer_name text,
  p_customer_phone text,
  p_timeframe text,
  p_notes text,
  p_requires_two boolean,
  p_distance_miles numeric,
  p_trade_year integer,
  p_trade_make text,
  p_trade_model text,
  p_trade_vin text,
  p_trade_transmission text
);

-- Create the RPC function
CREATE OR REPLACE FUNCTION public.dealer_create_job(
  p_type text,
  p_pickup_address text,
  p_delivery_address text,
  p_year integer DEFAULT NULL,
  p_make text DEFAULT NULL,
  p_model text DEFAULT NULL,
  p_vin text DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_timeframe text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_requires_two boolean DEFAULT false,
  p_distance_miles numeric DEFAULT NULL,
  p_trade_year integer DEFAULT NULL,
  p_trade_make text DEFAULT NULL,
  p_trade_model text DEFAULT NULL,
  p_trade_vin text DEFAULT NULL,
  p_trade_transmission text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_profile RECORD;
  v_job_id uuid;
  v_track_token text;
  v_created_job json;
BEGIN
  -- Log the attempt
  RAISE LOG 'dealer_create_job: Starting job creation for user %', auth.uid();
  
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING HINT = 'You must be logged in to create a job';
  END IF;
  
  -- Get user profile and validate they are a dealer
  SELECT * INTO v_user_profile
  FROM public.get_user_profile()
  LIMIT 1;
  
  IF v_user_profile IS NULL THEN
    RAISE EXCEPTION 'Profile not found'
      USING HINT = 'Your dealer profile could not be found. Please contact support.';
  END IF;
  
  IF v_user_profile.user_type != 'dealer' THEN
    RAISE EXCEPTION 'Unauthorized'
      USING HINT = 'Only dealers can create jobs';
  END IF;
  
  IF v_user_profile.dealer_id IS NULL THEN
    RAISE EXCEPTION 'Dealer ID not found'
      USING HINT = 'Your dealer account is not properly configured. Please contact support.';
  END IF;
  
  -- Validate required fields
  IF p_type IS NULL OR p_type NOT IN ('delivery', 'swap', 'parts', 'service') THEN
    RAISE EXCEPTION 'Invalid job type'
      USING HINT = 'Job type must be delivery, swap, parts, or service';
  END IF;
  
  IF p_pickup_address IS NULL OR TRIM(p_pickup_address) = '' THEN
    RAISE EXCEPTION 'Pickup address is required';
  END IF;
  
  IF p_delivery_address IS NULL OR TRIM(p_delivery_address) = '' THEN
    RAISE EXCEPTION 'Delivery address is required';
  END IF;
  
  -- Generate unique tracking token
  v_track_token := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  
  RAISE LOG 'dealer_create_job: Creating job with track_token % for dealer %', v_track_token, v_user_profile.dealer_id;
  
  -- Create the job
  INSERT INTO public.jobs (
    dealer_id,
    type,
    status,
    created_by,
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
    requires_two,
    distance_miles,
    track_token,
    trade_year,
    trade_make,
    trade_model,
    trade_vin,
    trade_transmission,
    created_at,
    updated_at
  )
  VALUES (
    v_user_profile.dealer_id,
    p_type::job_type,
    'open',
    auth.uid(),
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
    p_requires_two,
    p_distance_miles,
    v_track_token,
    p_trade_year,
    p_trade_make,
    p_trade_model,
    p_trade_vin,
    p_trade_transmission,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_job_id;
  
  RAISE LOG 'dealer_create_job: Successfully created job % for dealer %', v_job_id, v_user_profile.dealer_id;
  
  -- Fetch the created job to return
  SELECT json_build_object(
    'id', j.id,
    'dealer_id', j.dealer_id,
    'type', j.type,
    'status', j.status,
    'created_by', j.created_by,
    'pickup_address', j.pickup_address,
    'delivery_address', j.delivery_address,
    'year', j.year,
    'make', j.make,
    'model', j.model,
    'vin', j.vin,
    'customer_name', j.customer_name,
    'customer_phone', j.customer_phone,
    'timeframe', j.timeframe,
    'notes', j.notes,
    'requires_two', j.requires_two,
    'distance_miles', j.distance_miles,
    'track_token', j.track_token,
    'trade_year', j.trade_year,
    'trade_make', j.trade_make,
    'trade_model', j.trade_model,
    'trade_vin', j.trade_vin,
    'trade_transmission', j.trade_transmission,
    'created_at', j.created_at,
    'updated_at', j.updated_at
  )
  INTO v_created_job
  FROM public.jobs j
  WHERE j.id = v_job_id;
  
  -- Note: Driver notifications are handled by the notify-drivers-new-job edge function
  -- which listens for INSERT events on the jobs table
  
  RETURN v_created_job;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'dealer_create_job: Error creating job for user %: %', auth.uid(), SQLERRM;
  RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.dealer_create_job(
  text, text, text, integer, text, text, text, text, text, text, text, boolean, numeric, integer, text, text, text, text
) TO authenticated;

COMMENT ON FUNCTION public.dealer_create_job IS 'Securely creates a new job for the authenticated dealer. Validates permissions and generates tracking token.';
