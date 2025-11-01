/*
  # Restore handle_new_user trigger for automatic profile creation

  1. Purpose
    - Automatically creates dealer, driver, or swap_coordinator records when users sign up
    - Creates corresponding profile records with proper foreign key relationships
    - Ensures data consistency across auth.users, profiles, dealers, and drivers tables

  2. New Function
    - `handle_new_user()` - Trigger function that runs after user creation in auth.users
    - Reads user_type from user_metadata to determine what type of account to create
    - Skips automatic creation for staff members (handled by create-staff-member edge function)
    - Creates dealer record + profile for user_type='dealer'
    - Creates driver record + profile for user_type='driver'
    - Creates swap_coordinator record + profile for user_type='swap_coordinator'

  3. New Trigger
    - `on_auth_user_created` - Executes handle_new_user() after INSERT on auth.users

  4. Security
    - Function runs with SECURITY DEFINER to have necessary permissions
    - search_path set to 'public' for security
    - Only creates records for authenticated users with proper metadata
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the trigger function
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
  swap_coordinator_record_id uuid;
  user_full_name text;
  user_company_name text;
  user_phone text;
BEGIN
  -- Get user type from metadata
  user_type_value := NEW.raw_user_meta_data->>'user_type';
  
  -- Skip automatic profile creation for staff members
  -- Staff members will be handled by the create-staff-member edge function
  IF NEW.raw_user_meta_data->>'is_staff_member' = 'true' THEN
    RETURN NEW;
  END IF;

  -- Extract common fields from metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CONCAT_WS(' ', 
      NEW.raw_user_meta_data->>'first_name', 
      NEW.raw_user_meta_data->>'last_name'
    )
  );
  
  user_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'dealership_name',
    NEW.raw_user_meta_data->>'organization'
  );
  
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'contact_phone'
  );

  -- Handle dealer signup
  IF user_type_value = 'dealer' THEN
    -- Create dealer record
    INSERT INTO public.dealers (name, email, store, status)
    VALUES (
      COALESCE(user_full_name, 'Unknown User'),
      NEW.email,
      user_company_name,
      'active'
    )
    RETURNING id INTO dealer_record_id;

    -- Create profile linked to dealer
    INSERT INTO public.profiles (user_id, user_type, dealer_id, full_name)
    VALUES (NEW.id, 'dealer', dealer_record_id, user_full_name);

  -- Handle driver signup
  ELSIF user_type_value = 'driver' THEN
    -- Create driver record
    INSERT INTO public.drivers (name, email, phone, available, checkr_status)
    VALUES (
      COALESCE(user_full_name, 'Unknown Driver'),
      NEW.email,
      user_phone,
      true,
      'pending'
    )
    RETURNING id INTO driver_record_id;

    -- Create profile linked to driver
    INSERT INTO public.profiles (user_id, user_type, driver_id, full_name, phone)
    VALUES (NEW.id, 'driver', driver_record_id, user_full_name, user_phone);

  -- Handle swap coordinator signup
  ELSIF user_type_value = 'swap_coordinator' THEN
    -- Create swap_coordinator record
    INSERT INTO public.swap_coordinators (name, email, phone, status)
    VALUES (
      COALESCE(user_full_name, 'Unknown Coordinator'),
      NEW.email,
      user_phone,
      'active'
    )
    RETURNING id INTO swap_coordinator_record_id;

    -- Create profile linked to swap_coordinator
    INSERT INTO public.profiles (user_id, user_type, swap_coordinator_id, full_name, phone)
    VALUES (NEW.id, 'swap_coordinator', swap_coordinator_record_id, user_full_name, user_phone);

  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;