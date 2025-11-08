-- Remove swap_coordinator functionality (not needed for MVP)
-- This migration cleans up swap_coordinator references

-- Note: We can't remove 'swap_coordinator' from the user_type enum if it's already in use
-- So we'll just leave it there but not use it

-- Drop swap_coordinators table if it exists
DROP TABLE IF EXISTS public.swap_coordinators CASCADE;

-- The enum value 'swap_coordinator' can stay (harmless) since PostgreSQL doesn't allow removing enum values easily
-- We just won't use it in the app

COMMENT ON TYPE public.user_type IS 'User types: dealer (dealership owner), staff (dealership employee), driver (delivery driver), admin (system admin). swap_coordinator is deprecated.';
