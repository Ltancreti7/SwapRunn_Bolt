/*
  # Align core SwapRunn tables and RLS policies with product requirements

  This migration performs the following operations:
    - Ensures the user_type enum includes dealer, staff, driver, and admin variants
    - Renames legacy tables (dealers → dealership_profiles, dealership_staff → staff)
      while keeping backward-compatible views for existing code paths
    - Re-enables RLS on the renamed tables
    - Repairs profile user_type assignments for staff members
    - Replaces critical RLS policies for drivers, staff, and jobs to match the
      authoritative requirements (including auth.uid() performance best practices)
*/

-- 1. Align the user_type enum with required values
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'admin';

-- 2. Rename public.dealers → public.dealership_profiles (once) and recreate a compatibility view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    WHERE c.relname = 'dealers'
      AND c.relkind = 'r'
      AND c.relnamespace = 'public'::regnamespace
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
    WHERE c.relname = 'dealership_profiles'
      AND c.relkind = 'r'
      AND c.relnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE 'ALTER TABLE public.dealers RENAME TO dealership_profiles';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    WHERE c.relname = 'dealership_profiles'
      AND c.relkind = 'r'
      AND c.relnamespace = 'public'::regnamespace
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public' AND table_name = 'dealers'
    ) THEN
      EXECUTE 'DROP VIEW public.dealers';
    END IF;

    EXECUTE 'CREATE VIEW public.dealers AS SELECT * FROM public.dealership_profiles';
  END IF;
END
$$;

-- 3. Rename public.dealership_staff → public.staff and recreate compatibility view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    WHERE c.relname = 'dealership_staff'
      AND c.relkind = 'r'
      AND c.relnamespace = 'public'::regnamespace
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
    WHERE c.relname = 'staff'
      AND c.relkind = 'r'
      AND c.relnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE 'ALTER TABLE public.dealership_staff RENAME TO staff';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    WHERE c.relname = 'staff'
      AND c.relkind = 'r'
      AND c.relnamespace = 'public'::regnamespace
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public' AND table_name = 'dealership_staff'
    ) THEN
      EXECUTE 'DROP VIEW public.dealership_staff';
    END IF;

    EXECUTE 'CREATE VIEW public.dealership_staff AS SELECT * FROM public.staff';
  END IF;
END
$$;

-- 4. Ensure RLS is enabled on the renamed tables (no-ops if already enabled)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'dealership_profiles'
  ) THEN
    EXECUTE 'ALTER TABLE public.dealership_profiles ENABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'staff'
  ) THEN
    EXECUTE 'ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

-- 5. Repair staff profile records that were mistakenly set to "dealer"
UPDATE public.profiles p
SET user_type = 'staff'
FROM public.staff s
WHERE s.user_id = p.user_id
  AND COALESCE(s.role, '') <> 'owner'
  AND p.user_type IS DISTINCT FROM 'staff';

-- 6. Replace the critical RLS policies with the authoritative versions

-- Drivers table
DROP POLICY IF EXISTS "Allow dealers, staff, or admins to add drivers" ON public.drivers;
CREATE POLICY "Allow dealers, staff, or admins to add drivers"
ON public.drivers
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = (select auth.uid())
      AND profiles.user_type IN ('dealer','staff','admin')
  )
);

-- Staff table
DROP POLICY IF EXISTS "Allow dealers or admins to add staff" ON public.staff;
CREATE POLICY "Allow dealers or admins to add staff"
ON public.staff
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = (select auth.uid())
      AND profiles.user_type IN ('dealer','admin')
  )
);

-- Jobs table (creation and driver updates)
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS assigned_driver UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_jobs_assigned_driver ON public.jobs(assigned_driver);

-- Backfill assigned_driver from existing assignments where possible
WITH latest_assignment AS (
  SELECT DISTINCT ON (job_id)
    job_id,
    driver_id,
    accepted_at
  FROM public.assignments
  WHERE driver_id IS NOT NULL
  ORDER BY job_id, accepted_at DESC NULLS LAST
)
UPDATE public.jobs j
SET assigned_driver = la.driver_id
FROM latest_assignment la
WHERE la.job_id = j.id
  AND j.assigned_driver IS DISTINCT FROM la.driver_id;

DROP POLICY IF EXISTS "Allow authorized users to create jobs" ON public.jobs;
CREATE POLICY "Allow authorized users to create jobs"
ON public.jobs
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = (select auth.uid())
      AND profiles.user_type IN ('dealer','staff','admin')
  )
);

DROP POLICY IF EXISTS "Drivers can update their own jobs" ON public.jobs;
CREATE POLICY "Drivers can update their own jobs"
ON public.jobs
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (assigned_driver = (select auth.uid()))
WITH CHECK (assigned_driver = (select auth.uid()));

-- 7. Refresh handle_new_user trigger to support admin profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_type_value text;
  dealer_record_id uuid;
  driver_record_id uuid;
  swap_coordinator_record_id uuid;
  user_full_name text;
  user_company_name text;
  user_phone text;
  user_dealer_id text;
  error_context text;
BEGIN
  RAISE LOG 'handle_new_user: Starting profile creation for user %', NEW.id;

  user_type_value := NEW.raw_user_meta_data->>'user_type';

  IF user_type_value IS NULL THEN
    RAISE LOG 'handle_new_user: No user_type in metadata for user %, skipping auto-creation', NEW.id;
    RETURN NEW;
  END IF;

  IF NEW.raw_user_meta_data->>'is_staff_member' = 'true' THEN
    RAISE LOG 'handle_new_user: User % is staff member, skipping auto-creation', NEW.id;
    RETURN NEW;
  END IF;

  BEGIN
    user_full_name := TRIM(COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      CONCAT_WS(' ', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name'),
      'Unknown User'
    ));

    user_company_name := TRIM(COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      NEW.raw_user_meta_data->>'dealership_name',
      NEW.raw_user_meta_data->>'organization',
      NEW.raw_user_meta_data->>'store'
    ));

    user_phone := TRIM(COALESCE(
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'phone_number',
      NEW.raw_user_meta_data->>'contact_phone'
    ));

    user_dealer_id := NEW.raw_user_meta_data->>'dealer_id';

    RAISE LOG 'handle_new_user: Extracted metadata - name: %, company: %, phone: %, dealer_id: %',
      user_full_name, user_company_name, user_phone, user_dealer_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: Error extracting metadata for user %: %', NEW.id, SQLERRM;
    user_full_name := 'Unknown User';
    user_company_name := NULL;
    user_phone := NULL;
    user_dealer_id := NULL;
  END;

  IF user_type_value = 'dealer' THEN
    BEGIN
      INSERT INTO public.dealers (name, email, store, status)
      VALUES (user_full_name, NEW.email, user_company_name, 'active')
      RETURNING id INTO dealer_record_id;

      INSERT INTO public.profiles (user_id, user_type, dealer_id, full_name)
      VALUES (NEW.id, 'dealer', dealer_record_id, user_full_name);

      RAISE LOG 'handle_new_user: Created dealer profile for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
      error_context := SQLERRM;
      RAISE WARNING 'handle_new_user: Failed to create dealer records for user %: %', NEW.id, error_context;
    END;

  ELSIF user_type_value = 'driver' THEN
    BEGIN
      INSERT INTO public.drivers (
        name,
        email,
        phone,
        dealer_id,
        available,
        approval_status,
        checkr_status
      )
      VALUES (
        user_full_name,
        NEW.email,
        user_phone,
        NULLIF(user_dealer_id, '')::uuid,
        true,
        'pending_approval',
        'pending'
      )
      RETURNING id INTO driver_record_id;

      INSERT INTO public.profiles (user_id, user_type, driver_id, full_name, phone)
      VALUES (NEW.id, 'driver', driver_record_id, user_full_name, user_phone);

      RAISE LOG 'handle_new_user: Created driver profile for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
      error_context := SQLERRM;
      RAISE WARNING 'handle_new_user: Failed to create driver records for user %: %', NEW.id, error_context;
    END;

  ELSIF user_type_value = 'swap_coordinator' THEN
    BEGIN
      INSERT INTO public.swap_coordinators (name, email, phone, status)
      VALUES (user_full_name, NEW.email, user_phone, 'active')
      RETURNING id INTO swap_coordinator_record_id;

      INSERT INTO public.profiles (user_id, user_type, swap_coordinator_id, full_name, phone)
      VALUES (NEW.id, 'swap_coordinator', swap_coordinator_record_id, user_full_name, user_phone);

      RAISE LOG 'handle_new_user: Created swap_coordinator profile for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
      error_context := SQLERRM;
      RAISE WARNING 'handle_new_user: Failed to create swap_coordinator records for user %: %', NEW.id, error_context;
    END;

  ELSIF user_type_value = 'admin' THEN
    BEGIN
      INSERT INTO public.profiles (user_id, user_type, full_name, phone)
      VALUES (NEW.id, 'admin', user_full_name, user_phone);
      RAISE LOG 'handle_new_user: Created admin profile for user %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
      error_context := SQLERRM;
      RAISE WARNING 'handle_new_user: Failed to create admin profile for user %: %', NEW.id, error_context;
    END;

  ELSE
    RAISE LOG 'handle_new_user: Unknown user_type "%" for user %, skipping', user_type_value, NEW.id;
  END IF;

  RAISE LOG 'handle_new_user: Completed processing for user %', NEW.id;
  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user: Unexpected error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates dealer, driver, admin, or swap_coordinator records when users sign up. Drivers are created with pending_approval status and linked to their selected dealership.';
