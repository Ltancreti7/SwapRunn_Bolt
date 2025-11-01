CREATE OR REPLACE FUNCTION public.accept_staff_invitation(p_invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  invitation_record public.staff_invitations%ROWTYPE;
  current_user_email TEXT;
  profile_record public.profiles%ROWTYPE;
BEGIN
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();

  IF current_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  SELECT * INTO invitation_record
  FROM public.staff_invitations
  WHERE invite_token = p_invite_token
    AND email = current_user_email
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  SELECT * INTO profile_record
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF FOUND THEN
    IF profile_record.user_type IS NOT NULL AND profile_record.user_type <> 'dealer' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Account is registered as %s and cannot accept staff invitations', profile_record.user_type)
      );
    END IF;

    IF profile_record.dealer_id IS NOT NULL AND profile_record.dealer_id <> invitation_record.dealer_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'This account is already linked to a different dealership'
      );
    END IF;

    UPDATE public.profiles
    SET dealer_id = invitation_record.dealer_id,
        user_type = 'dealer',
        updated_at = now()
    WHERE id = profile_record.id;
  ELSE
    INSERT INTO public.profiles (user_id, user_type, dealer_id, created_at, updated_at)
    VALUES (auth.uid(), 'dealer', invitation_record.dealer_id, now(), now());
  END IF;

  INSERT INTO public.dealership_staff (user_id, dealer_id, role, invited_by, joined_at, is_active, updated_at)
  VALUES (
    auth.uid(),
    invitation_record.dealer_id,
    invitation_record.role,
    invitation_record.invited_by,
    now(),
    true,
    now()
  )
  ON CONFLICT (user_id, dealer_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    is_active = true,
    updated_at = now(),
    joined_at = COALESCE(dealership_staff.joined_at, EXCLUDED.joined_at);

  UPDATE public.staff_invitations
  SET accepted_at = now()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object('success', true, 'dealer_id', invitation_record.dealer_id);
END;
$function$;
