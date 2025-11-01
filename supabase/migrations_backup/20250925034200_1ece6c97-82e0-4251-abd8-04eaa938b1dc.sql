-- Create dealership role enum
CREATE TYPE public.dealership_role AS ENUM ('owner', 'manager', 'salesperson', 'staff');

-- Create dealership_staff table to link users to dealerships with roles
CREATE TABLE public.dealership_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE NOT NULL,
  role public.dealership_role NOT NULL DEFAULT 'staff',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, dealer_id)
);

-- Create staff invitations table
CREATE TABLE public.staff_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role public.dealership_role NOT NULL DEFAULT 'staff',
  invite_token TEXT NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 16)),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dealer_id, email)
);

-- Enable RLS on new tables
ALTER TABLE public.dealership_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Create function to check user's role in dealership
CREATE OR REPLACE FUNCTION public.get_user_dealership_role(p_user_id UUID, p_dealer_id UUID)
RETURNS public.dealership_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.dealership_staff 
  WHERE user_id = p_user_id 
    AND dealer_id = p_dealer_id 
    AND is_active = true;
$$;

-- Create function to check if user has minimum role in dealership
CREATE OR REPLACE FUNCTION public.user_has_dealership_permission(p_user_id UUID, p_dealer_id UUID, p_min_role public.dealership_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN p_min_role = 'staff' THEN 
      EXISTS (SELECT 1 FROM public.dealership_staff WHERE user_id = p_user_id AND dealer_id = p_dealer_id AND is_active = true)
    WHEN p_min_role = 'salesperson' THEN 
      EXISTS (SELECT 1 FROM public.dealership_staff WHERE user_id = p_user_id AND dealer_id = p_dealer_id AND is_active = true AND role IN ('salesperson', 'manager', 'owner'))
    WHEN p_min_role = 'manager' THEN 
      EXISTS (SELECT 1 FROM public.dealership_staff WHERE user_id = p_user_id AND dealer_id = p_dealer_id AND is_active = true AND role IN ('manager', 'owner'))
    WHEN p_min_role = 'owner' THEN 
      EXISTS (SELECT 1 FROM public.dealership_staff WHERE user_id = p_user_id AND dealer_id = p_dealer_id AND is_active = true AND role = 'owner')
    ELSE false
  END;
$$;

-- RLS policies for dealership_staff
CREATE POLICY "Staff can view own dealership staff" 
ON public.dealership_staff FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p 
    WHERE p.dealer_id = dealership_staff.dealer_id
  )
);

CREATE POLICY "Managers can insert staff" 
ON public.dealership_staff FOR INSERT 
WITH CHECK (
  public.user_has_dealership_permission(auth.uid(), dealer_id, 'manager')
);

CREATE POLICY "Managers can update staff" 
ON public.dealership_staff FOR UPDATE 
USING (
  public.user_has_dealership_permission(auth.uid(), dealer_id, 'manager')
  OR user_id = auth.uid() -- Users can update their own record
);

-- RLS policies for staff_invitations
CREATE POLICY "Staff can view dealership invitations" 
ON public.staff_invitations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p 
    WHERE p.dealer_id = staff_invitations.dealer_id
  )
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Managers can manage invitations" 
ON public.staff_invitations FOR ALL 
USING (
  public.user_has_dealership_permission(auth.uid(), dealer_id, 'manager')
);

-- Function to accept staff invitation
CREATE OR REPLACE FUNCTION public.accept_staff_invitation(p_invite_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record public.staff_invitations%ROWTYPE;
  current_user_email TEXT;
  result jsonb;
BEGIN
  -- Get current user email
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  
  IF current_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get invitation
  SELECT * INTO invitation_record 
  FROM public.staff_invitations 
  WHERE invite_token = p_invite_token 
    AND email = current_user_email
    AND accepted_at IS NULL
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Create or update staff record
  INSERT INTO public.dealership_staff (user_id, dealer_id, role, invited_by, joined_at)
  VALUES (auth.uid(), invitation_record.dealer_id, invitation_record.role, invitation_record.invited_by, now())
  ON CONFLICT (user_id, dealer_id) 
  DO UPDATE SET 
    role = invitation_record.role,
    is_active = true,
    joined_at = now(),
    updated_at = now();

  -- Mark invitation as accepted
  UPDATE public.staff_invitations 
  SET accepted_at = now() 
  WHERE id = invitation_record.id;

  -- Update user profile to point to this dealership if they don't have one
  UPDATE public.profiles 
  SET dealer_id = invitation_record.dealer_id, user_type = 'dealer'
  WHERE user_id = auth.uid() AND dealer_id IS NULL;

  RETURN jsonb_build_object('success', true, 'dealer_id', invitation_record.dealer_id);
END;
$$;

-- Trigger to automatically create dealership_staff record for new dealers
CREATE OR REPLACE FUNCTION public.create_dealership_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new profile is created with dealer_id, make them owner of that dealership
  IF NEW.dealer_id IS NOT NULL AND NEW.user_type = 'dealer' THEN
    INSERT INTO public.dealership_staff (user_id, dealer_id, role, joined_at)
    VALUES (NEW.user_id, NEW.dealer_id, 'owner', now())
    ON CONFLICT (user_id, dealer_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_make_owner
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_dealership_owner();