/*
  # Fix Jobs Insert RLS Policy

  1. Changes
    - Drop the ambiguous "Dealers can insert jobs" policy
    - Create a new policy with explicit table qualification to avoid ambiguity
    - Ensures dealers can only insert jobs for their own dealership

  2. Security
    - Validates that the authenticated user is a dealer
    - Validates that the user's dealer_id matches the job's dealer_id
    - Prevents dealers from creating jobs for other dealerships
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Dealers can insert jobs" ON public.jobs;

-- Create a new, properly scoped INSERT policy with explicit table qualification
CREATE POLICY "Dealers can insert jobs"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type = 'dealer'
        AND p.dealer_id IS NOT NULL
        AND p.dealer_id = public.jobs.dealer_id  -- Explicitly qualify the jobs table
    )
  );

-- Grant necessary permissions
GRANT INSERT ON public.jobs TO authenticated;