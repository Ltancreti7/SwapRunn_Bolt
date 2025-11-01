-- Create a separate dealer record for Stephen Zullo
INSERT INTO public.dealers (id, name, email, status, plan, created_at)
VALUES (
  gen_random_uuid(),
  'Stephen Zullo',
  'szullo22@gmail.com', 
  'active',
  'standard',
  now()
) RETURNING id;

-- Update Stephen's profile to point to his own dealer record
UPDATE public.profiles 
SET dealer_id = (
  SELECT id FROM public.dealers WHERE email = 'szullo22@gmail.com'
)
WHERE user_id = 'c4898adb-37f8-4cdc-830d-625232edc5bb';

-- Update dealership_staff table to reflect Stephen's ownership of his own dealership
UPDATE public.dealership_staff 
SET dealer_id = (
  SELECT id FROM public.dealers WHERE email = 'szullo22@gmail.com'
)
WHERE user_id = 'c4898adb-37f8-4cdc-830d-625232edc5bb';