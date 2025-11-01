-- Add missing fields to dealers table
ALTER TABLE public.dealers 
ADD COLUMN IF NOT EXISTS store text,
ADD COLUMN IF NOT EXISTS position text;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_name text NOT NULL,
  store text,
  position text,
  alert_sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications - dealers can insert and view their own
CREATE POLICY "Dealers can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true); -- Allow any authenticated user to insert

CREATE POLICY "Everyone can view notifications" 
ON public.notifications 
FOR SELECT 
USING (true); -- Allow viewing for demo purposes