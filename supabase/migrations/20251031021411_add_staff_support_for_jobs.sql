/*
  # Staff Support for Job Creation
  
  1. Changes
    - Update dealer_create_job RPC to allow staff members
    - Add RLS policies for staff to view and create jobs
    - Ensure dealership_staff table has proper structure
    
  2. Security
    - Staff can only create jobs for their assigned dealership
    - Staff can only view jobs from their dealership
    - Maintains all existing security for dealers
*/

-- Ensure dealership_staff table exists with proper columns
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dealership_staff' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.dealership_staff
      ADD COLUMN role TEXT DEFAULT 'staff' NOT NULL;
    
    COMMENT ON COLUMN public.dealership_staff.role IS 'Staff role: owner, manager, or staff';
  END IF;
END $$;

-- Drop and recreate the dealer_create_job function to support staff
DROP FUNCTION IF EXISTS public.dealer_create_job(
  text, text, text, integer, text, text, text, text, text, text, text, boolean, numeric, integer, text, text, text, text
);

-- Create improved RPC function that supports both dealers and staff
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
  v_dealer_id uuid;
  v_job_id uuid;
  v_track_token text;
  v_created_job json;
BEGIN
  RAISE LOG 'dealer_create_job: Starting job creation for user %', auth.uid();
  
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING HINT = 'You must be logged in to create a job';
  END IF;
  
  -- Get user profile
  SELECT * INTO v_user_profile
  FROM public.get_user_profile()
  LIMIT 1;
  
  IF v_user_profile IS NULL THEN
    RAISE EXCEPTION 'Profile not found'
      USING HINT = 'Your profile could not be found. Please contact support.';
  END IF;
  
  -- Determine dealer_id: either from profile or from staff relationship
  IF v_user_profile.user_type = 'dealer' THEN
    v_dealer_id := v_user_profile.dealer_id;
    
    IF v_dealer_id IS NULL THEN
      RAISE EXCEPTION 'Dealer ID not found'
        USING HINT = 'Your dealer account is not properly configured. Please contact support.';
    END IF;
  ELSE
    -- Check if user is a staff member of a dealership
    SELECT dealer_id INTO v_dealer_id
    FROM public.dealership_staff
    WHERE user_id = auth.uid()
      AND is_active = true
    LIMIT 1;
    
    IF v_dealer_id IS NULL THEN
      RAISE EXCEPTION 'Unauthorized'
        USING HINT = 'Only dealers and their staff can create jobs';
    END IF;
  END IF;
  
  RAISE LOG 'dealer_create_job: User authorized for dealer %', v_dealer_id;
  
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
  
  RAISE LOG 'dealer_create_job: Creating job with track_token % for dealer %', v_track_token, v_dealer_id;
  
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
    v_dealer_id,
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
  
  RAISE LOG 'dealer_create_job: Successfully created job % for dealer %', v_job_id, v_dealer_id;
  
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

-- RLS Policies for staff access to jobs

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Staff can view dealership jobs" ON public.jobs;
DROP POLICY IF EXISTS "Staff can create jobs for their dealership" ON public.jobs;

-- Allow staff to view jobs from their dealership
CREATE POLICY "Staff can view dealership jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dealership_staff ds
      WHERE ds.user_id = auth.uid()
        AND ds.dealer_id = jobs.dealer_id
        AND ds.is_active = true
    )
  );

-- Allow staff to view assignments for their dealership's jobs
CREATE POLICY "Staff can view assignments for dealership jobs" ON public.assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.dealership_staff ds ON ds.dealer_id = j.dealer_id
      WHERE j.id = assignments.job_id
        AND ds.user_id = auth.uid()
        AND ds.is_active = true
    )
  );

COMMENT ON FUNCTION public.dealer_create_job IS 'Securely creates a new job. Works for both dealers and their staff members. Validates permissions and generates tracking token.';
