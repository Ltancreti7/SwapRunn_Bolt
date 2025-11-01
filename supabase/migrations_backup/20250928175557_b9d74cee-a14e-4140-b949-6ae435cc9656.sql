-- Update Stephen's profile with his actual name from auth.users metadata
UPDATE public.profiles 
SET 
  first_name = 'Stephen',
  last_name = 'Zullo', 
  full_name = 'Stephen Zullo'
WHERE user_id = 'c4898adb-37f8-4cdc-830d-625232edc5bb';

-- Update Luke's profile with his actual name from auth.users metadata  
UPDATE public.profiles
SET
  first_name = 'Luke',
  last_name = 'Tancreti',
  full_name = 'Luke Tancreti'
WHERE user_id = 'b217677e-f9d1-4c4b-b96a-6efb7cd78a80';

-- Update the dealers table to show personal names instead of company names
UPDATE public.dealers 
SET name = 'Stephen Zullo'
WHERE id = (SELECT dealer_id FROM profiles WHERE user_id = 'c4898adb-37f8-4cdc-830d-625232edc5bb');

UPDATE public.dealers
SET name = 'Luke Tancreti' 
WHERE id = (SELECT dealer_id FROM profiles WHERE user_id = 'b217677e-f9d1-4c4b-b96a-6efb7cd78a80');