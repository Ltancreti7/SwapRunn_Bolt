-- Create driver_requests table for swap management
CREATE TABLE IF NOT EXISTS public.driver_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Outgoing vehicle info
  outgoing_vin TEXT NOT NULL,
  outgoing_year INTEGER,
  outgoing_make TEXT,
  outgoing_model TEXT,
  outgoing_stock_number TEXT,
  
  -- Incoming vehicle info
  incoming_vin TEXT NOT NULL,
  incoming_year INTEGER,
  incoming_make TEXT,
  incoming_model TEXT,
  incoming_stock_number TEXT,
  
  -- Destination dealership
  destination_dealer_name TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  
  -- Driver assignment
  driver_id UUID REFERENCES public.drivers(id),
  driver_name TEXT,
  
  -- Requester info
  requester_id UUID REFERENCES auth.users(id),
  requester_name TEXT,
  
  -- Timestamps
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  departure_time TIMESTAMP WITH TIME ZONE,
  estimated_arrival_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'returned')),
  
  -- Dealership contact
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Additional info
  reason_for_swap TEXT,
  notes TEXT,
  fuel_level TEXT,
  special_instructions TEXT,
  vehicle_condition TEXT,
  
  -- Media
  photo_urls TEXT[],
  
  -- Signature
  signature_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_requests ENABLE ROW LEVEL SECURITY;

-- Allow swap coordinators and dealers to view requests
CREATE POLICY "Swap coordinators and dealers can view requests"
  ON public.driver_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type IN ('swap_coordinator', 'dealer')
    )
  );

-- Allow swap coordinators and dealers to create requests
CREATE POLICY "Swap coordinators and dealers can create requests"
  ON public.driver_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type IN ('swap_coordinator', 'dealer')
    )
  );

-- Allow swap coordinators, dealers, and assigned drivers to update requests
CREATE POLICY "Authorized users can update requests"
  ON public.driver_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type IN ('swap_coordinator', 'dealer')
    )
    OR
    driver_id IN (
      SELECT driver_id FROM public.get_user_profile()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_driver_requests_status ON public.driver_requests(status);
CREATE INDEX idx_driver_requests_driver_id ON public.driver_requests(driver_id);
CREATE INDEX idx_driver_requests_requester_id ON public.driver_requests(requester_id);

-- Add trigger for updated_at
CREATE TRIGGER update_driver_requests_updated_at
  BEFORE UPDATE ON public.driver_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();