-- Add trust and verification fields to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completion_percentage integer DEFAULT 0;

-- Create verification_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE verification_type AS ENUM ('email', 'phone', 'background_check', 'photo_id', 'driver_license');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create driver_verifications table for tracking verification history
CREATE TABLE IF NOT EXISTS public.driver_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  verification_type verification_type NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_at timestamp with time zone,
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create reputation_metrics table for detailed trust tracking
CREATE TABLE IF NOT EXISTS public.reputation_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN ('on_time_delivery', 'customer_satisfaction', 'communication_quality', 'professionalism', 'vehicle_condition')),
  score numeric NOT NULL CHECK (score >= 0 AND score <= 5),
  recorded_at timestamp with time zone DEFAULT now(),
  job_id uuid REFERENCES public.jobs(id),
  notes text
);

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  relationship text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_verifications
CREATE POLICY "Verifications viewable by dealers and related drivers" ON public.driver_verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM get_user_profile() p WHERE p.user_type = 'dealer') OR
    EXISTS (SELECT 1 FROM get_user_profile() p WHERE p.driver_id = driver_verifications.driver_id)
  );

CREATE POLICY "Verifications insertable by dealers" ON public.driver_verifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM get_user_profile() p WHERE p.user_type = 'dealer')
  );

-- RLS policies for reputation_metrics
CREATE POLICY "Reputation metrics viewable by dealers and related drivers" ON public.reputation_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM get_user_profile() p WHERE p.user_type = 'dealer') OR
    EXISTS (SELECT 1 FROM get_user_profile() p WHERE p.driver_id = reputation_metrics.driver_id)
  );

CREATE POLICY "Reputation metrics insertable by dealers" ON public.reputation_metrics
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM get_user_profile() p WHERE p.user_type = 'dealer')
  );

-- RLS policies for emergency_contacts
CREATE POLICY "Emergency contacts viewable by related drivers and dealers" ON public.emergency_contacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM get_user_profile() p WHERE p.driver_id = emergency_contacts.driver_id) OR
    EXISTS (SELECT 1 FROM get_user_profile() p WHERE p.user_type = 'dealer')
  );

CREATE POLICY "Emergency contacts manageable by related drivers" ON public.emergency_contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM get_user_profile() p WHERE p.driver_id = emergency_contacts.driver_id)
  );