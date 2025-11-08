-- Fix Tancreti Motors dealer account
-- Creates dealership_profiles record and links it to profile

DO $$
DECLARE
  v_user_id uuid := '557b0d10-9e77-4017-a0f5-6f9bca10236d';
  v_dealer_id uuid;
  v_user_email text;
  v_user_name text;
BEGIN
  -- Get user info from auth.users
  SELECT email, raw_user_meta_data->>'full_name'
  INTO v_user_email, v_user_name
  FROM auth.users
  WHERE id = v_user_id;

  -- Create dealership_profiles record (table was renamed from dealers)
  INSERT INTO public.dealership_profiles (name, email, store, status)
  VALUES (
    COALESCE(v_user_name, 'Tancreti Motors Admin'),
    v_user_email,
    'Tancreti Motors',
    'active'
  )
  RETURNING id INTO v_dealer_id;

  RAISE NOTICE 'Created dealership_profiles record with ID: %', v_dealer_id;

  -- Update profile to link to dealer
  UPDATE public.profiles
  SET dealer_id = v_dealer_id
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Updated profile for user % with dealer_id %', v_user_id, v_dealer_id;
END $$;
