-- Remove confusing deny-all policy on jobs to follow least surprise and rely on default deny
DROP POLICY IF EXISTS "Jobs tracking by valid token only" ON public.jobs;