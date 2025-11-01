-- Disable role switching function to enforce account separation
DROP FUNCTION IF EXISTS public.switch_profile_user_type(text, text, text, text);

-- Clean up existing data - ensure each user has only one account type
-- Remove any dual associations where users have both dealer_id and driver_id
UPDATE public.profiles 
SET driver_id = NULL 
WHERE user_type = 'dealer' AND dealer_id IS NOT NULL AND driver_id IS NOT NULL;

UPDATE public.profiles 
SET dealer_id = NULL 
WHERE user_type = 'driver' AND driver_id IS NOT NULL AND dealer_id IS NOT NULL;

-- Add constraint to prevent dual account types
ALTER TABLE public.profiles 
ADD CONSTRAINT check_single_account_type 
CHECK (
  (user_type = 'dealer' AND dealer_id IS NOT NULL AND driver_id IS NULL) OR
  (user_type = 'driver' AND driver_id IS NOT NULL AND dealer_id IS NULL)
);