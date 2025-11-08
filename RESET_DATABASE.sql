-- Supabase-safe: only resets the public schema (auth, storage, extensions remain)
-- WARNING: This drops everything in schema public

BEGIN;

-- Drop and recreate public schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION postgres;
COMMENT ON SCHEMA public IS 'standard public schema';

-- Minimal, safe grants for Supabase roles
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Prevent overly broad create privileges
REVOKE CREATE ON SCHEMA public FROM PUBLIC;       -- the PUBLIC role
GRANT CREATE ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO service_role;     -- optional: allow service role to create objects

-- Ensure search_path mirrors typical Supabase defaults
ALTER DATABASE postgres SET search_path = public, extensions;

-- Helpful defaults for future objects created by migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

COMMIT;

-- Reset is complete - now you can apply migrations fresh
SELECT 'Database wiped clean - ready for fresh migrations' AS status;
