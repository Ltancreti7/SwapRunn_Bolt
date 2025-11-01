-- Create swap_coordinators table
CREATE TABLE public.swap_coordinators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name text NOT NULL,
  email text,
  phone text,
  profile_photo_url text,
  status text DEFAULT 'active'
);

-- Add swap_coordinator_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS swap_coordinator_id uuid REFERENCES public.swap_coordinators(id);

-- Drop and recreate get_user_profile function with CASCADE
DROP FUNCTION IF EXISTS public.get_user_profile() CASCADE;

CREATE FUNCTION public.get_user_profile()
RETURNS TABLE(user_type text, dealer_id uuid, driver_id uuid, swap_coordinator_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.user_type, p.dealer_id, p.driver_id, p.swap_coordinator_id
  FROM public.profiles p 
  WHERE p.user_id = auth.uid();
$$;

-- Enable RLS
ALTER TABLE public.swap_coordinators ENABLE ROW LEVEL SECURITY;

-- Swap coordinators can view their own data
CREATE POLICY "Swap coordinators can view own data"
ON public.swap_coordinators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.user_type = 'swap_coordinator' 
      AND p.swap_coordinator_id = swap_coordinators.id
  )
);

-- Swap coordinators can update their own data
CREATE POLICY "Swap coordinators can update own data"
ON public.swap_coordinators
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.user_type = 'swap_coordinator' 
      AND p.swap_coordinator_id = swap_coordinators.id
  )
);

-- Update handle_new_user function to support swap_coordinator
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
BEGIN
  user_type_value := NEW.raw_user_meta_data->>'user_type';
  
  IF NEW.raw_user_meta_data->>'is_staff_member' = 'true' THEN
    RETURN NEW;
  END IF;
  
  IF user_type_value IS NULL OR user_type_value = '' THEN
    RAISE LOG 'Skipping profile creation for user % - no user_type in metadata', NEW.id;
    RETURN NEW;
  END IF;
  
  IF user_type_value = 'dealer' THEN
    INSERT INTO public.dealers (name, email, status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown Person'),
      NEW.email,
      'active'
    )
    RETURNING id INTO dealer_record_id;
    
    INSERT INTO public.profiles (user_id, user_type, dealer_id)
    VALUES (NEW.id, 'dealer', dealer_record_id);
    
  ELSIF user_type_value = 'driver' THEN
    INSERT INTO public.drivers (name, email, phone, available, checkr_status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown Driver'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      true,
      'pending'
    )
    RETURNING id INTO driver_record_id;
    
    INSERT INTO public.profiles (user_id, user_type, driver_id)
    VALUES (NEW.id, 'driver', driver_record_id);
    
  ELSIF user_type_value = 'swap_coordinator' THEN
    INSERT INTO public.swap_coordinators (name, email, phone, status)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown Coordinator'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      'active'
    )
    RETURNING id INTO swap_coordinator_record_id;
    
    INSERT INTO public.profiles (user_id, user_type, swap_coordinator_id)
    VALUES (NEW.id, 'swap_coordinator', swap_coordinator_record_id);
  ELSE
    RAISE LOG 'Invalid user_type provided: %. Skipping profile creation for user %', user_type_value, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate swaps table RLS policies
CREATE POLICY "Swap coordinators and dealers can view swaps"
ON public.swaps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.user_type IN ('dealer', 'swap_coordinator')
  )
);

CREATE POLICY "Swap coordinators and dealers can insert swaps"
ON public.swaps
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.user_type IN ('dealer', 'swap_coordinator')
  )
);

CREATE POLICY "Swap coordinators and dealers can update swaps"
ON public.swaps
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.user_type IN ('dealer', 'swap_coordinator')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_swap_coordinators_updated_at
BEFORE UPDATE ON public.swap_coordinators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();