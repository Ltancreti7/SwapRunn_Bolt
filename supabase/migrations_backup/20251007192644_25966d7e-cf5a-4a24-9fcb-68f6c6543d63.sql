-- Update the handle_new_user trigger to correctly map dealer name
-- The dealer's name field should contain the person's name, not the company name

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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
  
  -- CRITICAL: Only create profiles if we have a valid user_type
  -- This prevents accidental driver account creation
  IF user_type_value IS NULL OR user_type_value = '' THEN
    RAISE LOG 'Skipping profile creation for user % - no user_type in metadata', NEW.id;
    RETURN NEW;
  END IF;
  
  IF user_type_value = 'dealer' THEN
    -- Create dealer record with person's name (not company name)
    -- The company name goes in the 'store' field (updated later in registration)
    INSERT INTO public.dealers (name, email, status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown Person'),
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();