-- 1) Add dealer_id to jobs to bind each job to its owning dealer
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS dealer_id uuid;

-- 2) Trigger function to automatically set dealer_id on insert from current user's profile
CREATE OR REPLACE FUNCTION public.set_jobs_dealer_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prof RECORD;
BEGIN
  SELECT * INTO prof FROM public.get_user_profile();
  -- If the inserting user is a dealer, ensure dealer_id is set to their dealer_id
  IF prof.user_type = 'dealer' AND prof.dealer_id IS NOT NULL THEN
    NEW.dealer_id := COALESCE(NEW.dealer_id, prof.dealer_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Attach trigger to jobs
DROP TRIGGER IF EXISTS trg_set_jobs_dealer_id ON public.jobs;
CREATE TRIGGER trg_set_jobs_dealer_id
BEFORE INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_jobs_dealer_id();

-- 4) Helpful index for policy lookups
CREATE INDEX IF NOT EXISTS idx_jobs_dealer_id ON public.jobs(dealer_id);

-- 5) Replace existing RLS policies to scope access strictly to owning dealer or assigned drivers
DROP POLICY IF EXISTS "Jobs insertable by dealers only" ON public.jobs;
DROP POLICY IF EXISTS "Jobs updatable by dealers and assigned drivers" ON public.jobs;
DROP POLICY IF EXISTS "Jobs viewable by dealers and assigned drivers" ON public.jobs;

-- Insert: dealers can insert only rows owned by their dealer_id (trigger will set it)
CREATE POLICY "Jobs insertable by owning dealer"
ON public.jobs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.get_user_profile() p(user_type, dealer_id, driver_id)
    WHERE p.user_type = 'dealer' AND p.dealer_id IS NOT NULL AND p.dealer_id = jobs.dealer_id
  )
);

-- Update: only the owning dealer or the assigned driver can update
CREATE POLICY "Jobs updatable by owning dealer or assigned drivers"
ON public.jobs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p(user_type, dealer_id, driver_id)
    WHERE p.user_type = 'dealer' AND p.dealer_id = jobs.dealer_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.get_user_profile() p(user_type, dealer_id, driver_id) ON a.driver_id = p.driver_id
    WHERE a.job_id = jobs.id
  )
);

-- Select: only the owning dealer or the assigned driver can read
CREATE POLICY "Jobs viewable by owning dealer or assigned drivers"
ON public.jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p(user_type, dealer_id, driver_id)
    WHERE p.user_type = 'dealer' AND p.dealer_id = jobs.dealer_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.get_user_profile() p(user_type, dealer_id, driver_id) ON a.driver_id = p.driver_id
    WHERE a.job_id = jobs.id
  )
);

-- Note: Existing rows without dealer_id will not be visible to any dealer by design.
-- New jobs will be correctly attributed via the trigger to avoid broken functionality.