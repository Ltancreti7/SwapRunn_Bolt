-- Bootstrap supporting function required by early RLS policies
SET check_function_bodies = false;

-- Minimal get_user_profile used by early policies
CREATE OR REPLACE FUNCTION public.get_user_profile()
-- Shape this to match the later canonical signature in 20251105044806_remote_schema.sql
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_type TEXT,
  full_name TEXT,
  phone TEXT,
  dealer_id UUID,
  status TEXT,
  avatar_url TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.user_type,
    p.full_name,
    p.phone,
    p.dealer_id,
    p.status,
    p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
$$;

-- Optional: allow authenticated users to execute
DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;
EXCEPTION WHEN undefined_object THEN
  -- If role doesn't exist in shadow context, ignore
  NULL;
END $$;
