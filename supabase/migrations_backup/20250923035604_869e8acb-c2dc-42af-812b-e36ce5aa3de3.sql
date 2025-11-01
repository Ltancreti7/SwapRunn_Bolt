-- Create storage bucket for driver profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-photos', 'driver-photos', true);

-- Create storage policies for driver photos
CREATE POLICY "Driver photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'driver-photos');

CREATE POLICY "Drivers can upload their own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'driver-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers can update their own photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'driver-photos' AND auth.uid()::text = (storage.foldername(name))[1]);