-- Phase 3: Add RLS policies for dealers and drivers tables

-- Dealers table policies
CREATE POLICY "Dealers can view own data"
ON public.dealers
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT dealer_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR
  id IN (
    SELECT dealer_id FROM public.dealership_staff 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Dealers can update own data"
ON public.dealers
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT dealer_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR
  id IN (
    SELECT dealer_id FROM public.dealership_staff 
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  id IN (
    SELECT dealer_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR
  id IN (
    SELECT dealer_id FROM public.dealership_staff 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Drivers table policies
CREATE POLICY "Drivers can view own data"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT driver_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update own data"
ON public.drivers
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT driver_id FROM public.profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT driver_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Phase 4: Create proper role-based security system

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff', 'driver', 'dealer', 'swap_coordinator');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Populate user_roles from existing profiles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, user_type::app_role
FROM public.profiles
WHERE user_type IN ('driver', 'dealer', 'swap_coordinator')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add trigger to auto-create role when profile is created
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.user_type::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_user_role_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role();