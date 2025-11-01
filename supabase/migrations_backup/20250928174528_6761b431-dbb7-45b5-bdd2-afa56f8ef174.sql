-- Add name fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN full_name TEXT;

-- Update existing profiles with name data from user metadata where possible
-- This will be populated by the create-staff-member function going forward