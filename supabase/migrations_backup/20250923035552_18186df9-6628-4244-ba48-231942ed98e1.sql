-- Add profile photo field to drivers table
ALTER TABLE public.drivers 
ADD COLUMN profile_photo_url TEXT;