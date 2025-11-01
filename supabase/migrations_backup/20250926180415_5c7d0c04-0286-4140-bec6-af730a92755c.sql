-- Comprehensive cleanup of all demo data
-- Delete in order to respect foreign key constraints

-- Delete staff invitations
DELETE FROM public.staff_invitations;

-- Delete dealership staff records  
DELETE FROM public.dealership_staff;

-- Delete job-related data
DELETE FROM public.job_messages;
DELETE FROM public.ratings;
DELETE FROM public.payouts;
DELETE FROM public.timesheets;
DELETE FROM public.assignments;

-- Delete jobs
DELETE FROM public.jobs;

-- Delete notifications
DELETE FROM public.notifications;

-- Delete dealer subscriptions
DELETE FROM public.dealer_subscriptions;

-- Delete profiles (this will cascade delete dealers and drivers due to foreign keys)
DELETE FROM public.profiles;

-- Clean up dealers and drivers tables explicitly (in case any orphaned records exist)
DELETE FROM public.dealers;
DELETE FROM public.drivers;

-- Reset any sequences if needed
-- (Most tables use uuid_generate_v4() so no sequences to reset)

-- Note: Auth users will need to be cleaned up via Supabase Dashboard
-- as the auth schema is managed by Supabase and not directly accessible via SQL