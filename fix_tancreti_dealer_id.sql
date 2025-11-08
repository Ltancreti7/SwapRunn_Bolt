-- Create Tancreti Motors dealership and link profile
-- Step 1: Create the dealership in dealers table (which is a view on dealership_profiles)
INSERT INTO dealers (name, email, store)
VALUES ('Tancreti Motors', (SELECT auth.email FROM auth.users WHERE auth.email ILIKE '%tancreti%' LIMIT 1), 'Tancreti Motors')
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Step 2: Get the dealer_id we just created (or that already exists)
WITH dealer_lookup AS (
  SELECT id as dealer_id
  FROM dealers
  WHERE email ILIKE '%tancreti%'
  LIMIT 1
)
-- Step 3: Update the profile to link to this dealership
UPDATE profiles
SET dealer_id = (SELECT dealer_id FROM dealer_lookup)
WHERE full_name ILIKE '%tancreti%';

-- Step 4: Verify the fix
SELECT 
  p.user_id,
  p.full_name,
  p.user_type,
  p.dealer_id,
  d.name as dealership_name,
  d.store as dealership_store
FROM profiles p
LEFT JOIN dealers d ON d.id = p.dealer_id
WHERE p.full_name ILIKE '%tancreti%';
