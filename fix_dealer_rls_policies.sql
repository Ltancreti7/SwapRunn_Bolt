-- Fix RLS policy issue for job creation
-- This ensures that dealer profiles are properly linked and RLS policies work correctly

-- First, let's create a function to check and fix dealer profiles
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
BEGIN
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
  
  -- If dealer_id is null, try to find or create a dealer record
  IF user_profile.dealer_id IS NULL THEN
    -- Try to find an existing dealer record for this user
    SELECT * INTO dealer_record
    FROM public.dealers
    WHERE email = (SELECT email FROM auth.users WHERE id = current_user_id)
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
        (SELECT email FROM auth.users WHERE id = current_user_id),
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

-- Create a more robust RLS policy for job insertion that handles edge cases
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
      AND p.dealer_id = jobs.dealer_id
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