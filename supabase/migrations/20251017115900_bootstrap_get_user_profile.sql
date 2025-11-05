-- Bootstrap supporting function required by early RLS policies
SET check_function_bodies = false;

-- Minimal get_user_profile used by early policies
CREATE OR REPLACE FUNCTION public.get_user_profile()
-- Shape this to match the later canonical signature in 20251105044806_remote_schema.sql
RETURNS TABLE(
  id UUID,
  user_type TEXT,
  full_name TEXT,
  phone TEXT,
  dealership_name TEXT,
  business_size TEXT,
  selected_plan TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.user_type::text,
    p.full_name,
    p.phone,
    dp.dealership_name,
    dp.business_size,
    dp.selected_plan
  FROM public.profiles p
  LEFT JOIN public.dealership_profiles dp ON p.user_id = dp.user_id
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
