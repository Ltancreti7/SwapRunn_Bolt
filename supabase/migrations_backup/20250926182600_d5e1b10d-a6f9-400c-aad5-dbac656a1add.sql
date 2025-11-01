-- Update the handle_new_user trigger to handle staff members properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  IF user_type_value = 'dealer' THEN
    -- Create dealer record and get the ID
    INSERT INTO public.dealers (name, email, status)
    VALUES (
      NEW.raw_user_meta_data->>'company_name',
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
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      true,
      'pending'
    )
    RETURNING id INTO driver_record_id;
    
    -- Create profile record linking to driver
    INSERT INTO public.profiles (user_id, user_type, driver_id)
    VALUES (NEW.id, 'driver', driver_record_id);
  END IF;
  
  RETURN NEW;
END;
$function$;