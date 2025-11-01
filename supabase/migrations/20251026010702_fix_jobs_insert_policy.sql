/*
  # Fix Jobs INSERT Policy

  This migration fixes the RLS policy that prevents dealers from creating jobs.
  
  ## Changes
  - Drop the existing restrictive INSERT policy
  - Create a new INSERT policy that properly validates dealer_id
  - The new policy checks if the authenticated user is a dealer and allows them to insert jobs with their dealer_id
  
  ## Security
  - Dealers can only insert jobs with their own dealer_id
  - Non-dealers cannot insert jobs
  - Maintains data integrity while allowing proper job creation
*/

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Dealers can insert jobs" ON jobs;

-- Create a new, properly functioning INSERT policy
CREATE POLICY "Dealers can insert jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check that the user is a dealer with a dealer_id
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'dealer'
        AND p.dealer_id IS NOT NULL
        AND p.dealer_id = jobs.dealer_id
    )
  );
