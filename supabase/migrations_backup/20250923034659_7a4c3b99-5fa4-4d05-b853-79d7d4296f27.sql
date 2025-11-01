-- Create or replace a secure function to switch the current user's profile type
CREATE OR REPLACE FUNCTION public.switch_profile_user_type(
  _new_type text,
  _name text DEFAULT NULL::text,
  _phone text DEFAULT NULL::text,
  _company_name text DEFAULT NULL::text
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  prof public.profiles%ROWTYPE;
  dealer_record_id uuid;
  driver_record_id uuid;
  user_email text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Get existing profile if any
  SELECT * INTO prof FROM public.profiles WHERE user_id = uid;

  -- If no profile exists, delegate to existing creator
  IF NOT FOUND THEN
    RETURN public.create_profile_for_current_user(_new_type, _name, _phone, _company_name);
  END IF;

  -- Get email safely from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = uid;

  IF _new_type = 'driver' THEN
    -- If already a driver, return
    IF prof.user_type = 'driver' AND prof.driver_id IS NOT NULL THEN
      RETURN prof;
    END IF;

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

    -- Update profile to driver
    UPDATE public.profiles
    SET user_type = 'driver', driver_id = driver_record_id, dealer_id = NULL
    WHERE user_id = uid
    RETURNING * INTO prof;

    RETURN prof;

  ELSIF _new_type = 'dealer' THEN
    -- If already a dealer, return
    IF prof.user_type = 'dealer' AND prof.dealer_id IS NOT NULL THEN
      RETURN prof;
    END IF;

    -- Create dealer record
    INSERT INTO public.dealers (name, email, status)
    VALUES (
      COALESCE(_company_name, _name, 'Unknown Company'),
      user_email,
      'active'
    )
    RETURNING id INTO dealer_record_id;

    -- Update profile to dealer
    UPDATE public.profiles
    SET user_type = 'dealer', dealer_id = dealer_record_id, driver_id = NULL
    WHERE user_id = uid
    RETURNING * INTO prof;

    RETURN prof;
  ELSE
    RAISE EXCEPTION 'invalid user_type: %', _new_type;
  END IF;
END;
$$;