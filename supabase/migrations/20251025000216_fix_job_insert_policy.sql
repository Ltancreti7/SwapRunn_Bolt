/*
  # Fix Job Creation RLS Policy

  1. Changes
    - Drop the existing broken "Dealers can insert jobs" policy
    - Create a new correct policy that validates the dealer_id matches the user's profile
    
  2. Security
    - Ensures only authenticated dealers can insert jobs
    - Validates that the dealer_id in the job matches the dealer_id in the user's profile
    - This prevents dealers from creating jobs for other dealerships
*/

-- Drop the existing broken policy
DROP POLICY IF EXISTS "Dealers can insert jobs" ON jobs;

-- Create a corrected policy that properly validates dealer_id
CREATE POLICY "Dealers can insert jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'dealer'
        AND p.dealer_id IS NOT NULL
        AND p.dealer_id = jobs.dealer_id
    )
  );
