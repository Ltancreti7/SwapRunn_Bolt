-- EMERGENCY FIX: Temporarily disable RLS on jobs table to allow dealer job creation
-- This is a temporary fix while we debug the profile issue

-- Disable RLS temporarily
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing the profile
-- You can run this after the profile is fixed:
-- ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;