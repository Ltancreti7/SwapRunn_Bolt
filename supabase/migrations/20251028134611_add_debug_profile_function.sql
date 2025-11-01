/*
  # Add Debug and Repair Functions for Profiles

  1. New Functions
    - `debug_current_user_profile()` - Shows current user's profile and dealer info
    - `auto_repair_dealer_profile()` - Automatically fixes missing dealer associations

  2. Purpose
    - Help diagnose profile and dealer_id issues
    - Automatically create dealer records when missing
    - Link profiles to dealers correctly
*/

-- Function to debug current user's profile
CREATE OR REPLACE FUNCTION public.debug_current_user_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT jsonb_build_object(
    'user_id', current_user_id,
    'email', u.email,
    'profile_exists', CASE WHEN p.id IS NOT NULL THEN true ELSE false END,
    'profile', jsonb_build_object(
      'id', p.id,
      'user_type', p.user_type,
      'dealer_id', p.dealer_id,
      'full_name', p.full_name,
      'first_name', p.first_name,
      'last_name', p.last_name
    ),
    'dealer', jsonb_build_object(
      'id', d.id,
      'name', d.name,
      'dealership_code', d.dealership_code,
      'email', d.email
    ),
    'can_insert_jobs', EXISTS (
      SELECT 1
      FROM public.profiles p2
      WHERE p2.user_id = current_user_id
        AND p2.user_type = 'dealer'
        AND p2.dealer_id IS NOT NULL
    )
  ) INTO result
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.dealers d ON d.id = p.dealer_id
  WHERE u.id = current_user_id;

  RETURN result;
END;
$$;

-- Function to auto-repair dealer profiles
CREATE OR REPLACE FUNCTION public.auto_repair_dealer_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_profile record;
  dealer_record record;
  user_email text;
  result jsonb;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Get current user profile
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE user_id = current_user_id;
  
  -- If no profile exists, create one
  IF NOT FOUND THEN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    
    -- Create a dealer record first
    INSERT INTO public.dealers (name, email, created_at, updated_at)
    VALUES (
      COALESCE(user_email, 'Dealer'),
      user_email,
      NOW(),
      NOW()
    )
    RETURNING * INTO dealer_record;
    
    -- Create the profile
    INSERT INTO public.profiles (user_id, user_type, dealer_id, created_at, updated_at)
    VALUES (
      current_user_id,
      'dealer',
      dealer_record.id,
      NOW(),
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'created_profile_and_dealer',
      'dealer_id', dealer_record.id
    );
  END IF;
  
  -- If profile exists but user_type is not dealer, update it
  IF user_profile.user_type != 'dealer' THEN
    UPDATE public.profiles
    SET user_type = 'dealer',
        updated_at = NOW()
    WHERE user_id = current_user_id;
  END IF;
  
  -- If dealer_id is null, try to find or create a dealer record
  IF user_profile.dealer_id IS NULL THEN
    -- Get user email for dealer lookup/creation
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = current_user_id;
    
    -- Try to find an existing dealer record for this user
    SELECT * INTO dealer_record
    FROM public.dealers
    WHERE email = user_email
    LIMIT 1;
    
    -- If not found, create a new dealer record
    IF NOT FOUND THEN
      INSERT INTO public.dealers (name, email, created_at, updated_at)
      VALUES (
        COALESCE(user_profile.full_name, user_email, 'Dealer'),
        user_email,
        NOW(),
        NOW()
      )
      RETURNING * INTO dealer_record;
    END IF;
    
    -- Link the dealer to the profile
    UPDATE public.profiles
    SET dealer_id = dealer_record.id,
        updated_at = NOW()
    WHERE user_id = current_user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'linked_dealer',
      'dealer_id', dealer_record.id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'no_repair_needed',
    'dealer_id', user_profile.dealer_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.debug_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_repair_dealer_profile() TO authenticated;