-- CLEAN SLATE: Rebuild from scratch
-- Run this in Supabase SQL Editor after you've deleted everything

-- 1. Create profiles table
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('dealer', 'driver', 'staff', 'admin', 'swap_coordinator')),
  dealer_id UUID,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create dealership_profiles table
CREATE TABLE public.dealership_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,
  position TEXT,
  store TEXT,
  dealership_code TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create dealers view
CREATE VIEW public.dealers AS
SELECT * FROM public.dealership_profiles;

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create WIDE OPEN policies for testing (we'll fix security later)
CREATE POLICY "allow_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.dealership_profiles FOR ALL USING (true) WITH CHECK (true);

-- 6. Create trigger function to auto-create profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_dealer_id UUID;
BEGIN
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'driver');
  
  IF v_user_type = 'dealer' THEN
    INSERT INTO public.dealership_profiles (user_id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
    RETURNING id INTO v_dealer_id;
  END IF;
  
  INSERT INTO public.profiles (user_id, user_type, dealer_id, full_name)
  VALUES (NEW.id, v_user_type, v_dealer_id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create get_user_profile function
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE (
  user_id UUID,
  user_type TEXT,
  dealer_id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.user_type, p.dealer_id, p.full_name, p.phone, u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done!
SELECT '✅ Database ready. Go to http://localhost:8081/dealer/register and test!' AS status;
