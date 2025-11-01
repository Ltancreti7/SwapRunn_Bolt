-- Create a secure function to create dealer/driver + profile for current user
CREATE OR REPLACE FUNCTION public.create_profile_for_current_user(
  _user_type text,
  _name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _company_name text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing_profile public.profiles%ROWTYPE;
  dealer_record_id uuid;
  driver_record_id uuid;
  user_email text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- If profile already exists, return it
  SELECT * INTO existing_profile FROM public.profiles WHERE user_id = uid;
  IF FOUND THEN
    RETURN existing_profile;
  END IF;

  -- Fetch email from auth.users to avoid trusting client input
  SELECT email INTO user_email FROM auth.users WHERE id = uid;

  IF _user_type = 'dealer' THEN
    -- Create dealer record
    INSERT INTO public.dealers (name, email, status)
    VALUES (
      COALESCE(_company_name, _name, 'Unknown Company'),
      user_email,
      'active'
    )
    RETURNING id INTO dealer_record_id;

    -- Create profile
    INSERT INTO public.profiles (user_id, user_type, dealer_id)
    VALUES (uid, 'dealer', dealer_record_id)
    RETURNING * INTO existing_profile;

    RETURN existing_profile;

  ELSIF _user_type = 'driver' THEN
    -- Create driver record
    INSERT INTO public.drivers (name, email, phone, available, checkr_status)
    VALUES (
      COALESCE(_name, 'Unknown Driver'),
      user_email,
      _phone,
      true,
      'pending'
    )
    RETURNING id INTO driver_record_id;

    -- Create profile
    INSERT INTO public.profiles (user_id, user_type, driver_id)
    VALUES (uid, 'driver', driver_record_id)
    RETURNING * INTO existing_profile;

    RETURN existing_profile;
  ELSE
    RAISE EXCEPTION 'invalid user_type: %', _user_type;
  END IF;
END;
$$;

-- Grant execute to authenticated users
REVOKE ALL ON FUNCTION public.create_profile_for_current_user(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_profile_for_current_user(text, text, text, text) TO authenticated;
