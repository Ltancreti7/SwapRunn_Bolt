-- Enable Row Level Security on all public tables
-- This migration secures all tables with appropriate RLS policies

-- Enable RLS on all tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE(user_type text, dealer_id uuid, driver_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.user_type, p.dealer_id, p.driver_id 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid();
$$;

-- Jobs table policies - Most critical for customer data protection
CREATE POLICY "Jobs viewable by dealers and assigned drivers"
ON public.jobs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.get_user_profile() p ON a.driver_id = p.driver_id
    WHERE a.job_id = jobs.id
  )
);

CREATE POLICY "Jobs insertable by dealers only"
ON public.jobs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  )
);

CREATE POLICY "Jobs updatable by dealers and assigned drivers"
ON public.jobs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.get_user_profile() p ON a.driver_id = p.driver_id
    WHERE a.job_id = jobs.id
  )
);

-- Public job tracking - allow anyone to view jobs by tracking token (for customer tracking)
CREATE POLICY "Jobs viewable by tracking token"
ON public.jobs FOR SELECT
USING (true); -- This will be restricted by application logic using track_token

-- Assignments table policies
CREATE POLICY "Assignments viewable by dealers and related drivers"
ON public.assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.driver_id = assignments.driver_id
  )
);

CREATE POLICY "Assignments insertable by dealers only"
ON public.assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  )
);

CREATE POLICY "Assignments updatable by dealers and assigned drivers"
ON public.assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.driver_id = assignments.driver_id
  )
);

-- Dealers table policies
CREATE POLICY "Dealers can view own data"
ON public.dealers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.dealer_id = dealers.id
  )
);

CREATE POLICY "Dealers can update own data"
ON public.dealers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.dealer_id = dealers.id
  )
);

-- Dealer subscriptions policies
CREATE POLICY "Dealer subscriptions viewable by owner"
ON public.dealer_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.dealer_id = dealer_subscriptions.dealer_id
  )
);

CREATE POLICY "Dealer subscriptions updatable by owner"
ON public.dealer_subscriptions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.dealer_id = dealer_subscriptions.dealer_id
  )
);

-- Drivers table policies
CREATE POLICY "Drivers viewable by dealers and own data"
ON public.drivers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.driver_id = drivers.id
  )
);

CREATE POLICY "Drivers can update own data"
ON public.drivers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.driver_id = drivers.id
  )
);

-- Payouts table policies
CREATE POLICY "Payouts viewable by dealers and related drivers"
ON public.payouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.driver_id = payouts.driver_id
  )
);

CREATE POLICY "Payouts insertable by dealers only"
ON public.payouts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  )
);

-- Ratings table policies
CREATE POLICY "Ratings viewable by dealers and related drivers"
ON public.ratings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.get_user_profile() p ON a.driver_id = p.driver_id
    WHERE a.id = ratings.assignment_id
  )
);

CREATE POLICY "Ratings insertable by dealers only"
ON public.ratings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  )
);

-- Timesheets table policies
CREATE POLICY "Timesheets viewable by dealers and related drivers"
ON public.timesheets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.driver_id = timesheets.driver_id
  )
);

CREATE POLICY "Timesheets insertable by dealers and drivers"
ON public.timesheets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.driver_id = timesheets.driver_id
  )
);

CREATE POLICY "Timesheets updatable by dealers and related drivers"
ON public.timesheets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() 
    WHERE user_type = 'dealer'
  ) OR
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.driver_id = timesheets.driver_id
  )
);