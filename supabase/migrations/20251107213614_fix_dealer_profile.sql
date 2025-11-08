-- Get your user email to find the right profile
DO $$
DECLARE
  user_email text;
  dealer_id_val uuid;
  user_id_val uuid;
BEGIN
  -- Find the user with Tancreti in the name
  SELECT user_id INTO user_id_val
  FROM profiles
  WHERE full_name ILIKE '%tancreti%'
  LIMIT 1;

  IF user_id_val IS NULL THEN
    RAISE NOTICE 'No user found with Tancreti in name';
    RETURN;
  END IF;

  -- Get the user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id_val;

  RAISE NOTICE 'Found user: % with email: %', user_id_val, user_email;

  -- Check if dealer already exists
  SELECT id INTO dealer_id_val
  FROM dealers
  WHERE email = user_email;

  IF dealer_id_val IS NULL THEN
    -- Create the dealer
    INSERT INTO dealers (name, email, store)
    VALUES ('Tancreti Motors', user_email, 'Tancreti Motors')
    RETURNING id INTO dealer_id_val;
    
    RAISE NOTICE 'Created dealer with id: %', dealer_id_val;
  ELSE
    RAISE NOTICE 'Dealer already exists with id: %', dealer_id_val;
  END IF;

  -- Update the profile
  UPDATE profiles
  SET dealer_id = dealer_id_val
  WHERE user_id = user_id_val;

  RAISE NOTICE 'Updated profile to link to dealer';
END $$;

-- Verify the result
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
