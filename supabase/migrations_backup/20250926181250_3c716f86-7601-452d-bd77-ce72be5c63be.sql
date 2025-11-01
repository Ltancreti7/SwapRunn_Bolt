-- Add INSERT policy for drivers table to allow dealers to create new drivers
CREATE POLICY "Dealers can insert drivers" 
ON public.drivers 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM get_user_profile() p 
    WHERE p.user_type = 'dealer'
  )
);