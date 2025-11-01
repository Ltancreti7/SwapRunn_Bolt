-- Add profile photo URL column to dealers table
ALTER TABLE public.dealers 
ADD COLUMN profile_photo_url TEXT;

-- Create dealer-photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dealer-photos', 'dealer-photos', true);

-- Create storage policies for dealer photos
CREATE POLICY "Dealer photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'dealer-photos');

CREATE POLICY "Dealers can upload their own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'dealer-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Dealers can update their own photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'dealer-photos' AND auth.uid()::text = (storage.foldername(name))[1]);