-- Add latitude and longitude columns for pickup and delivery addresses
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11, 8);