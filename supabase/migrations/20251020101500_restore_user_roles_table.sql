-- Restore user_roles table with RLS policies and sync trigger
-- Addresses Supabase dashboard warning about disabled RLS on public.user_roles

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'app_role'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    EXECUTE 'CREATE TYPE public.app_role AS ENUM (
      ''admin'',
      ''manager'',
      ''staff'',
      ''driver'',
      ''dealer'',
      ''swap_coordinator''
    )';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name = 'role'
      AND data_type IN ('text', 'character varying')
  ) THEN
    UPDATE public.user_roles
    SET role = 'staff'
    WHERE role NOT IN ('admin','manager','staff','driver','dealer','swap_coordinator');

    ALTER TABLE public.user_roles
    ALTER COLUMN role TYPE public.app_role
    USING role::text::public.app_role;
  END IF;
END $$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Users can view own roles'
  ) THEN
    CREATE POLICY "Users can view own roles"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.has_role(uuid, text);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, (user_type::text)::public.app_role
FROM public.profiles
WHERE user_type IS NOT NULL
  AND user_type::text = ANY (ARRAY['admin','manager','staff','driver','dealer','swap_coordinator'])
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.user_type::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    DELETE FROM public.user_roles
    WHERE user_id = NEW.user_id
      AND role <> NEW.user_type::public.app_role;
  END IF;

  IF NEW.user_type IS NULL THEN
    DELETE FROM public.user_roles
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'sync_user_role_on_profile_insert'
      AND tgrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'DROP TRIGGER sync_user_role_on_profile_insert ON public.profiles';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'sync_user_role_on_profile_update'
      AND tgrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'DROP TRIGGER sync_user_role_on_profile_update ON public.profiles';
  END IF;

  EXECUTE 'CREATE TRIGGER sync_user_role_on_profile_insert
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_role()';

  EXECUTE 'CREATE TRIGGER sync_user_role_on_profile_update
    AFTER UPDATE OF user_type ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_role()';
END $$;
