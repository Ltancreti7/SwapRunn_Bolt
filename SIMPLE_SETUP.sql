-- Complete SwapRunn Database Setup
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it once

-- Create user_type enum
CREATE TYPE user_type AS ENUM ('dealer', 'driver', 'staff', 'admin', 'swap_coordinator');

-- Create dealers table (will be renamed to dealership_profiles later)
CREATE TABLE public.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  store TEXT,
  address TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  position TEXT,
  dealership_code TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE,
  user_type user_type,
  full_name TEXT,
  phone TEXT,
  dealer_id UUID REFERENCES public.dealers(id),
  driver_id UUID,
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dealer_id UUID REFERENCES public.dealers(id),
  available BOOLEAN DEFAULT true,
  approval_status TEXT DEFAULT 'pending_approval',
  checkr_status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  dealer_id UUID REFERENCES public.dealers(id) NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dealer_id)
);

-- Create staff_invitations table
CREATE TABLE public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES public.dealers(id) NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES public.dealers(id) NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_by UUID REFERENCES auth.users(id),
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  distance_miles NUMERIC,
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  trade_in_year INTEGER,
  trade_in_make TEXT,
  trade_in_model TEXT,
  assigned_driver UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) NOT NULL,
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'assigned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create get_user_profile function
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_type TEXT,
  full_name TEXT,
  phone TEXT,
  dealer_id UUID,
  driver_id UUID,
  status TEXT,
  avatar_url TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    p.id,
    p.user_id,
    p.user_type::text,
    p.full_name,
    p.phone,
    p.dealer_id,
    p.driver_id,
    p.status,
    p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
$$;

-- Create handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_type_value text;
  dealer_record_id uuid;
  driver_record_id uuid;
  user_full_name text;
  user_company_name text;
  user_phone text;
  user_dealer_id text;
BEGIN
  user_type_value := NEW.raw_user_meta_data->>'user_type';
  
  IF user_type_value IS NULL THEN
    RETURN NEW;
  END IF;

  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'Unknown User'
  );

  user_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'dealership_name'
  );

  user_phone := NEW.raw_user_meta_data->>'phone';
  user_dealer_id := NEW.raw_user_meta_data->>'dealer_id';

  IF user_type_value = 'dealer' THEN
    INSERT INTO public.dealers (name, email, store, status)
    VALUES (user_full_name, NEW.email, user_company_name, 'active')
    RETURNING id INTO dealer_record_id;

    INSERT INTO public.profiles (user_id, user_type, dealer_id, full_name)
    VALUES (NEW.id, 'dealer', dealer_record_id, user_full_name);

  ELSIF user_type_value = 'driver' THEN
    INSERT INTO public.drivers (
      name,
      email,
      phone,
      dealer_id,
      available,
      approval_status,
      checkr_status
    )
    VALUES (
      user_full_name,
      NEW.email,
      user_phone,
      NULLIF(user_dealer_id, '')::uuid,
      true,
      'pending_approval',
      'pending'
    )
    RETURNING id INTO driver_record_id;

    INSERT INTO public.profiles (user_id, user_type, driver_id, full_name, phone)
    VALUES (NEW.id, 'driver', driver_record_id, user_full_name, user_phone);

  ELSIF user_type_value = 'admin' THEN
    INSERT INTO public.profiles (user_id, user_type, full_name, phone)
    VALUES (NEW.id, 'admin', user_full_name, user_phone);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Dealers can view their dealership" ON public.dealers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.dealer_id = dealers.id
    )
  );

CREATE POLICY "Dealers can update their dealership" ON public.dealers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.dealer_id = dealers.id
      AND profiles.user_type = 'dealer'
    )
  );

SELECT 'Database setup complete!' as status;
