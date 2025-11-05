-- Migration: allow_admins_only_inserts
-- Purpose: Restrict inserts on drivers and staff tables to admin users only.

BEGIN;

-- Ensure row level security is enabled for drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers FORCE ROW LEVEL SECURITY;

-- Drop any existing INSERT policies on public.drivers to avoid conflicts
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'drivers'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.drivers', policy_record.policyname);
  END LOOP;
END $$;

-- Allow only admin users to insert new driver records
CREATE POLICY "Admins can insert drivers" ON public.drivers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.user_type::text = 'admin'
    )
  );

-- Ensure the authenticated role has insert privileges (enforced by policy)
GRANT INSERT ON public.drivers TO authenticated;

-- Apply the same restriction for the staff table when it exists
DO $$
DECLARE
  policy_record record;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'staff'
  ) THEN
    EXECUTE 'ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.staff FORCE ROW LEVEL SECURITY';

    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'staff'
        AND cmd = 'INSERT'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.staff', policy_record.policyname);
    END LOOP;

    EXECUTE $policy$
      CREATE POLICY "Admins can insert staff" ON public.staff
        FOR INSERT TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.user_id = auth.uid()
              AND p.user_type::text = 'admin'
          )
        )
    $policy$;

    EXECUTE 'GRANT INSERT ON public.staff TO authenticated';
  END IF;
END $$;

COMMIT;
