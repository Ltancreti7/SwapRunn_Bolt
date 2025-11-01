-- Fix remaining functions with proper search paths
CREATE OR REPLACE FUNCTION public.create_profile_for_current_user(_user_type text, _name text DEFAULT NULL::text, _phone text DEFAULT NULL::text, _company_name text DEFAULT NULL::text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.create_dealership_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- When a new profile is created with dealer_id, make them owner of that dealership
  IF NEW.dealer_id IS NOT NULL AND NEW.user_type = 'dealer' THEN
    INSERT INTO public.dealership_staff (user_id, dealer_id, role, joined_at)
    VALUES (NEW.user_id, NEW.dealer_id, 'owner', now())
    ON CONFLICT (user_id, dealer_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_staff_invitation(p_invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  invitation_record public.staff_invitations%ROWTYPE;
  current_user_email TEXT;
  result jsonb;
BEGIN
  -- Get current user email
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  
  IF current_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get invitation
  SELECT * INTO invitation_record 
  FROM public.staff_invitations 
  WHERE invite_token = p_invite_token 
    AND email = current_user_email
    AND accepted_at IS NULL
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Create or update staff record
  INSERT INTO public.dealership_staff (user_id, dealer_id, role, invited_by, joined_at)
  VALUES (auth.uid(), invitation_record.dealer_id, invitation_record.role, invitation_record.invited_by, now())
  ON CONFLICT (user_id, dealer_id) 
  DO UPDATE SET 
    role = invitation_record.role,
    is_active = true,
    joined_at = now(),
    updated_at = now();

  -- Mark invitation as accepted
  UPDATE public.staff_invitations 
  SET accepted_at = now() 
  WHERE id = invitation_record.id;

  -- Update user profile to point to this dealership if they don't have one
  UPDATE public.profiles 
  SET dealer_id = invitation_record.dealer_id, user_type = 'dealer'
  WHERE user_id = auth.uid() AND dealer_id IS NULL;

  RETURN jsonb_build_object('success', true, 'dealer_id', invitation_record.dealer_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_type_value text;
  dealer_record_id uuid;
  driver_record_id uuid;
BEGIN
  -- Get user type from metadata
  user_type_value := NEW.raw_user_meta_data->>'user_type';
  
  -- Skip automatic profile creation for staff members
  -- Staff members will be handled by the create-staff-member edge function
  IF NEW.raw_user_meta_data->>'is_staff_member' = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- CRITICAL: Only create profiles if we have a valid user_type
  -- This prevents accidental driver account creation
  IF user_type_value IS NULL OR user_type_value = '' THEN
    RAISE LOG 'Skipping profile creation for user % - no user_type in metadata', NEW.id;
    RETURN NEW;
  END IF;
  
  IF user_type_value = 'dealer' THEN
    -- Create dealer record and get the ID
    INSERT INTO public.dealers (name, email, status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'full_name', 'Unknown Company'),
      NEW.email,
      'active'
    )
    RETURNING id INTO dealer_record_id;
    
    -- Create profile record linking to dealer
    INSERT INTO public.profiles (user_id, user_type, dealer_id)
    VALUES (NEW.id, 'dealer', dealer_record_id);
    
  ELSIF user_type_value = 'driver' THEN
    -- Create driver record and get the ID
    INSERT INTO public.drivers (name, email, phone, available, checkr_status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown Driver'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      true,
      'pending'
    )
    RETURNING id INTO driver_record_id;
    
    -- Create profile record linking to driver
    INSERT INTO public.profiles (user_id, user_type, driver_id)
    VALUES (NEW.id, 'driver', driver_record_id);
  ELSE
    RAISE LOG 'Invalid user_type provided: %. Skipping profile creation for user %', user_type_value, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_driver_safely(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
begin
  -- Create table if it doesn't exist
  if not exists (
    select from information_schema.tables
    where table_name = 'drivers'
  ) then
    execute $create$
      create table drivers (
        id uuid default gen_random_uuid() primary key,
        full_name text not null,
        phone text not null,
        email text not null,
        license_number text not null,
        license_photo_url text not null,
        insurance_url text not null,
        government_id_url text not null,
        created_at timestamp with time zone default timezone('utc'::text, now())
      )
    $create$;
  end if;

  -- Insert the payload into the drivers table
  execute format($insert$
    insert into drivers (
      full_name, phone, email, license_number,
      license_photo_url, insurance_url, government_id_url
    ) values (
      %L, %L, %L, %L, %L, %L, %L
    )
  $insert$,
    payload->>'full_name',
    payload->>'phone',
    payload->>'email',
    payload->>'license_number',
    payload->>'license_photo_url',
    payload->>'insurance_url',
    payload->>'government_id_url'
  );

end;
$function$;