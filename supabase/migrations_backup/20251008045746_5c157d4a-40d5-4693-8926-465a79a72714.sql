-- Create swaps table for dealer-to-dealer inventory swaps
CREATE TABLE IF NOT EXISTS public.swaps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  stock_number text NOT NULL,
  from_dealer text NOT NULL,
  to_dealer text NOT NULL,
  pickup_address text NOT NULL,
  delivery_address text NOT NULL,
  pickup_lat numeric,
  pickup_lng numeric,
  delivery_lat numeric,
  delivery_lng numeric,
  status text DEFAULT 'pending',
  notes text
);

-- Enable RLS
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;

-- All dealers can view swaps
CREATE POLICY "Dealers can view swaps"
ON public.swaps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.user_type = 'dealer'
  )
);

-- Dealers can insert swaps
CREATE POLICY "Dealers can insert swaps"
ON public.swaps
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.user_type = 'dealer'
  )
);

-- Dealers can update swaps
CREATE POLICY "Dealers can update swaps"
ON public.swaps
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p
    WHERE p.user_type = 'dealer'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_swaps_updated_at
BEFORE UPDATE ON public.swaps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();