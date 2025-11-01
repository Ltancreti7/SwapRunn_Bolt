-- Ensure profile creation RPC covers all supported account types
CREATE OR REPLACE FUNCTION public.create_profile_for_current_user(
  _user_type text,
  _name text DEFAULT NULL::text,
  _phone text DEFAULT NULL::text,
  _company_name text DEFAULT NULL::text
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  existing_profile public.profiles%ROWTYPE;
  dealer_record_id uuid;
  driver_record_id uuid;
  swap_coordinator_record_id uuid;
  user_email text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE user_id = uid;

  IF FOUND THEN
    RETURN existing_profile;
  END IF;

  SELECT email INTO user_email
  FROM auth.users
  WHERE id = uid;

  IF _user_type = 'dealer' THEN
    INSERT INTO public.dealers (name, email, status)
    VALUES (
      COALESCE(_company_name, _name, 'Unknown Company'),
      user_email,
      'active'
    )
    RETURNING id INTO dealer_record_id;

    INSERT INTO public.profiles (user_id, user_type, dealer_id)
    VALUES (uid, 'dealer', dealer_record_id)
    RETURNING * INTO existing_profile;

    RETURN existing_profile;

  ELSIF _user_type = 'driver' THEN
    INSERT INTO public.drivers (name, email, phone, available, checkr_status)
    VALUES (
      COALESCE(_name, 'Unknown Driver'),
      user_email,
      _phone,
      true,
      'pending'
    )
    RETURNING id INTO driver_record_id;

    INSERT INTO public.profiles (user_id, user_type, driver_id)
    VALUES (uid, 'driver', driver_record_id)
    RETURNING * INTO existing_profile;

    RETURN existing_profile;

  ELSIF _user_type = 'swap_coordinator' THEN
    INSERT INTO public.swap_coordinators (name, email, phone, status)
    VALUES (
      COALESCE(_name, 'Unknown Coordinator'),
      user_email,
      _phone,
      'active'
    )
    RETURNING id INTO swap_coordinator_record_id;

    INSERT INTO public.profiles (user_id, user_type, swap_coordinator_id)
    VALUES (uid, 'swap_coordinator', swap_coordinator_record_id)
    RETURNING * INTO existing_profile;

    RETURN existing_profile;

  ELSE
    RAISE EXCEPTION 'invalid user_type: %', _user_type;
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_profile_for_current_user(text, text, text, text) TO authenticated;
