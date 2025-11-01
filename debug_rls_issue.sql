-- Temporary debug script to check RLS policy issue
-- Run this in Supabase SQL editor to debug the current user profile

-- Check if user has a profile and what it contains
SELECT 'Current user profile:' as debug_step;
SELECT * FROM public.get_user_profile();

-- Check raw profiles table for current user
SELECT 'Raw profile data:' as debug_step;
SELECT * FROM public.profiles WHERE user_id = auth.uid();

-- Check if dealers table has any entries
SELECT 'Available dealers:' as debug_step;
SELECT id, name FROM public.dealers LIMIT 5;

-- Test the RLS policy logic manually
SELECT 'RLS policy test:' as debug_step;
SELECT 
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p 
    WHERE p.user_type = 'dealer'
  ) as has_dealer_type,
  EXISTS (
    SELECT 1 FROM public.get_user_profile() p 
    WHERE p.dealer_id IS NOT NULL
  ) as has_dealer_id;