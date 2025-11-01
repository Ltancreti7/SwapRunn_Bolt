-- Add last_seen_jobs_at timestamp to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS last_seen_jobs_at timestamp with time zone DEFAULT now();

-- Update RLS policy to allow authenticated drivers to see open jobs
DROP POLICY IF EXISTS "Open jobs viewable by all drivers" ON public.jobs;
CREATE POLICY "Open jobs viewable by all drivers" 
ON public.jobs 
FOR SELECT 
USING (
  status = 'open' AND 
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM get_user_profile() p 
    WHERE p.user_type = 'driver'
  )
);