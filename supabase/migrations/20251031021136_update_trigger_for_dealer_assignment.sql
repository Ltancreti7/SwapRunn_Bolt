/*
  # Update Trigger to Handle Dealer Assignment
  
  1. Changes
    - Extract dealer_id from user metadata during driver signup
    - Set driver status to 'pending_approval' for new drivers
    - Link driver to selected dealership automatically
    
  2. Notes
    - Drivers will need manager approval before receiving jobs
    - dealer_id comes from the dealership dropdown during signup
*/

-- Drop and recreate the trigger function with dealer_id support
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_type_value text;
  dealer_record_id uuid;
  driver_record_id uuid;
  swap_coordinator_record_id uuid;
  user_full_name text;
  user_company_name text;
  user_phone text;
  user_dealer_id text;
  error_context text;
BEGIN
  -- Log the attempt
  RAISE LOG 'handle_new_user: Starting profile creation for user %', NEW.id;
  
  -- Get user type from metadata
  user_type_value := NEW.raw_user_meta_data->>'user_type';
  
  -- Validate user_type exists
  IF user_type_value IS NULL THEN
    RAISE LOG 'handle_new_user: No user_type in metadata for user %, skipping auto-creation', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Skip automatic profile creation for staff members
  IF NEW.raw_user_meta_data->>'is_staff_member' = 'true' THEN
    RAISE LOG 'handle_new_user: User % is staff member, skipping auto-creation', NEW.id;
    RETURN NEW;
  END IF;

  -- Extract and clean metadata fields
  BEGIN
    user_full_name := TRIM(COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      CONCAT_WS(' ', 
        NEW.raw_user_meta_data->>'first_name', 
        NEW.raw_user_meta_data->>'last_name'
      ),
      'Unknown User'
    ));
    
    user_company_name := TRIM(COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      NEW.raw_user_meta_data->>'dealership_name',
      NEW.raw_user_meta_data->>'organization',
      NEW.raw_user_meta_data->>'store'
    ));
    
    user_phone := TRIM(COALESCE(
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'phone_number',
      NEW.raw_user_meta_data->>'contact_phone'
    ));
    
    user_dealer_id := NEW.raw_user_meta_data->>'dealer_id';
    
    RAISE LOG 'handle_new_user: Extracted metadata - name: %, company: %, phone: %, dealer_id: %', 
      user_full_name, user_company_name, user_phone, user_dealer_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: Error extracting metadata for user %: %', NEW.id, SQLERRM;
    user_full_name := 'Unknown User';
    user_company_name := NULL;
    user_phone := NULL;
    user_dealer_id := NULL;
  END;

  -- Handle dealer signup
  IF user_type_value = 'dealer' THEN
    BEGIN
      RAISE LOG 'handle_new_user: Creating dealer record for user %', NEW.id;
      
      -- Create dealer record
      INSERT INTO public.dealers (name, email, store, status)
      VALUES (
        user_full_name,
        NEW.email,
        user_company_name,
        'active'
      )
      RETURNING id INTO dealer_record_id;
      
      RAISE LOG 'handle_new_user: Created dealer record % for user %', dealer_record_id, NEW.id;

      -- Create profile linked to dealer
      INSERT INTO public.profiles (user_id, user_type, dealer_id, full_name)
      VALUES (NEW.id, 'dealer', dealer_record_id, user_full_name);
      
      RAISE LOG 'handle_new_user: Created dealer profile for user %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      error_context := SQLERRM;
      RAISE WARNING 'handle_new_user: Failed to create dealer records for user %: %', NEW.id, error_context;
    END;

  -- Handle driver signup
  ELSIF user_type_value = 'driver' THEN
    BEGIN
      RAISE LOG 'handle_new_user: Creating driver record for user % with dealer_id %', NEW.id, user_dealer_id;
      
      -- Create driver record with pending approval status and linked to dealership
      INSERT INTO public.drivers (
        name,
        email,
        phone,
        dealer_id,
        available,
        approval_status,
        checkr_status
      )
      VALUES (
        user_full_name,
        NEW.email,
        user_phone,
        NULLIF(user_dealer_id, '')::uuid,  -- Convert to UUID, handle empty string
        true,
        'pending_approval',
        'pending'
      )
      RETURNING id INTO driver_record_id;
      
      RAISE LOG 'handle_new_user: Created driver record % for user % with approval status pending_approval', driver_record_id, NEW.id;

      -- Create profile linked to driver
      INSERT INTO public.profiles (user_id, user_type, driver_id, full_name, phone)
      VALUES (NEW.id, 'driver', driver_record_id, user_full_name, user_phone);
      
      RAISE LOG 'handle_new_user: Created driver profile for user %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      error_context := SQLERRM;
      RAISE WARNING 'handle_new_user: Failed to create driver records for user %: %', NEW.id, error_context;
    END;

  -- Handle swap coordinator signup
  ELSIF user_type_value = 'swap_coordinator' THEN
    BEGIN
      RAISE LOG 'handle_new_user: Creating swap_coordinator record for user %', NEW.id;
      
      -- Create swap_coordinator record
      INSERT INTO public.swap_coordinators (name, email, phone, status)
      VALUES (
        user_full_name,
        NEW.email,
        user_phone,
        'active'
      )
      RETURNING id INTO swap_coordinator_record_id;
      
      RAISE LOG 'handle_new_user: Created swap_coordinator record % for user %', swap_coordinator_record_id, NEW.id;

      -- Create profile linked to swap_coordinator
      INSERT INTO public.profiles (user_id, user_type, swap_coordinator_id, full_name, phone)
      VALUES (NEW.id, 'swap_coordinator', swap_coordinator_record_id, user_full_name, user_phone);
      
      RAISE LOG 'handle_new_user: Created swap_coordinator profile for user %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      error_context := SQLERRM;
      RAISE WARNING 'handle_new_user: Failed to create swap_coordinator records for user %: %', NEW.id, error_context;
    END;
    
  ELSE
    RAISE LOG 'handle_new_user: Unknown user_type "%" for user %, skipping', user_type_value, NEW.id;
  END IF;

  RAISE LOG 'handle_new_user: Completed processing for user %', NEW.id;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the auth signup
  RAISE WARNING 'handle_new_user: Unexpected error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates dealer, driver, or swap_coordinator records when users sign up. Drivers are created with pending_approval status and linked to their selected dealership.';
