-- Create storage policies for existing driver-photos bucket
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