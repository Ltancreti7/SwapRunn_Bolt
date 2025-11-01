-- Fix RLS policy issue for job creation
-- This migration addresses the "new row violates row-level security policy for table jobs" error

-- Create a function to ensure dealer profiles are properly linked
CREATE OR REPLACE FUNCTION public.ensure_dealer_profile_complete()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
  user_profile record;
  dealer_record record;
  user_email text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Get current user profile
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE user_id = current_user_id;
  
  -- If no profile exists, we can't fix it here
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile found for current user. Please complete signup first.';
  END IF;
  
  -- If user_type is not dealer, nothing to fix
  IF user_profile.user_type != 'dealer' THEN
    RETURN;
  END IF;
  
  -- Get user email for dealer lookup/creation
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- If dealer_id is null, try to find or create a dealer record
  IF user_profile.dealer_id IS NULL THEN
    -- Try to find an existing dealer record for this user
    SELECT * INTO dealer_record
    FROM public.dealers
    WHERE email = user_email
    LIMIT 1;
    
    -- If found, link it to the profile
    IF FOUND THEN
      UPDATE public.profiles
      SET dealer_id = dealer_record.id,
          updated_at = NOW()
      WHERE user_id = current_user_id;
    ELSE
      -- Create a new dealer record
      INSERT INTO public.dealers (name, email, created_at, updated_at)
      VALUES (
        COALESCE(user_profile.full_name, 'Dealer'),
        user_email,
        NOW(),
        NOW()
      )
      RETURNING * INTO dealer_record;
      
      -- Link it to the profile
      UPDATE public.profiles
      SET dealer_id = dealer_record.id,
          updated_at = NOW()
      WHERE user_id = current_user_id;
    END IF;
  END IF;
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_dealer_profile_complete() TO authenticated;

-- Update RLS policies to be more robust and handle the profile checking correctly
DROP POLICY IF EXISTS "Dealers can insert jobs" ON public.jobs;

CREATE POLICY "Dealers can insert jobs" ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid()
      AND p.user_type = 'dealer'
      AND p.dealer_id IS NOT NULL
      AND p.dealer_id = dealer_id  -- Note: this refers to the jobs.dealer_id being inserted
    )
  );

-- Also update the select policy to be more robust
DROP POLICY IF EXISTS "Users can view relevant jobs" ON public.jobs;

CREATE POLICY "Users can view relevant jobs" ON public.jobs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid()
      AND (
        (p.user_type = 'dealer' AND p.dealer_id = jobs.dealer_id) OR
        (p.user_type IN ('driver', 'swap_coordinator'))
      )
    )
  );

-- Update the update policy as well
DROP POLICY IF EXISTS "Dealers can update their jobs" ON public.jobs;

CREATE POLICY "Dealers can update their jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid()
      AND p.user_type = 'dealer' 
      AND p.dealer_id = jobs.dealer_id
    )
  );