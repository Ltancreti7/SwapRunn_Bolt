-- Add staff and admin enum values first (separate transaction)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'staff' AND enumtypid = 'public.user_type'::regtype) THEN
    ALTER TYPE public.user_type ADD VALUE 'staff';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = 'public.user_type'::regtype) THEN
    ALTER TYPE public.user_type ADD VALUE 'admin';
  END IF;
END $$;
