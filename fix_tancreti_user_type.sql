-- Fix Tancreti Motors account to have dealer user_type
-- This should have been set during signup but something went wrong

-- Update the profile to set user_type = 'dealer' for the Tancreti Motors account
UPDATE profiles
SET user_type = 'dealer'
WHERE full_name ILIKE '%tancreti%';

-- Verify the update
SELECT 
  user_id,
  full_name,
  user_type,
  dealer_id,
  created_at
FROM profiles
WHERE full_name ILIKE '%tancreti%';
