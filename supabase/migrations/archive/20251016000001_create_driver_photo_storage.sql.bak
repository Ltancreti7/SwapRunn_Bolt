-- Create storage bucket for driver photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-photos', 
  'driver-photos', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for dealer photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dealer-photos', 
  'dealer-photos', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own driver photos
CREATE POLICY "Users can upload their own driver photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'driver-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own driver photos
CREATE POLICY "Users can update their own driver photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'driver-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own driver photos
CREATE POLICY "Users can delete their own driver photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'driver-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view driver photos (they're public)
CREATE POLICY "Anyone can view driver photos" ON storage.objects
FOR SELECT USING (bucket_id = 'driver-photos');

-- Dealer photo policies
-- Policy: Users can upload their own dealer photos
CREATE POLICY "Users can upload their own dealer photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dealer-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own dealer photos
CREATE POLICY "Users can update their own dealer photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dealer-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own dealer photos
CREATE POLICY "Users can delete their own dealer photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dealer-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view dealer photos (they're public)
CREATE POLICY "Anyone can view dealer photos" ON storage.objects
FOR SELECT USING (bucket_id = 'dealer-photos');