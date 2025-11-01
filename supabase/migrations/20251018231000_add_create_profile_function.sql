-- Restore helper used by auth flows to create profiles after signup
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
  ELSE
    RAISE EXCEPTION 'invalid user_type: %', _user_type;
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_profile_for_current_user(text, text, text, text) TO authenticated;
