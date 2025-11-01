-- Drop the existing restrictive INSERT policy for assignments
DROP POLICY IF EXISTS "Assignments insertable by dealers only" ON public.assignments;

-- Create new policy allowing both dealers and the driver themselves to insert assignments
CREATE POLICY "Assignments insertable by dealers and drivers" 
ON public.assignments 
FOR INSERT 
WITH CHECK (
  -- Allow dealers to insert assignments
  (EXISTS (
    SELECT 1 FROM get_user_profile() p 
    WHERE p.user_type = 'dealer'
  ))
  OR
  -- Allow drivers to insert assignments for themselves
  (EXISTS (
    SELECT 1 FROM get_user_profile() p 
    WHERE p.user_type = 'driver' AND p.driver_id = assignments.driver_id
  ))
);

-- Add unique constraint to prevent multiple assignments per job
CREATE UNIQUE INDEX IF NOT EXISTS assignments_one_per_job 
ON public.assignments (job_id);