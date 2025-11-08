-- Emergency database setup script
-- Run this in Supabase SQL Editor to set up your database from scratch

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_profile() CASCADE;

-- First, let's just try to push with the web UI
-- Navigate to: https://supabase.com/dashboard/project/paqezapusrqabwojhwyx/sql

-- Or, to set up manually:
-- 1. Go to your Supabase dashboard
-- 2. Click "SQL Editor"
-- 3. Click "New Query"
-- 4. Copy and paste all migration files one by one, starting from the oldest
-- 5. Or use the Migration tab to upload the migration files

SELECT 'Database setup ready - use Supabase web UI to run migrations' as message;
