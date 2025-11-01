-- Reinstate the driver job feed RPC expected by DriverRequests.tsx and related hooks
--
-- The function exposes the same shape that the generated Supabase types use,
-- restoring the behaviour removed in the simplified schema migration.

CREATE OR REPLACE FUNCTION public.get_open_jobs_for_drivers()
RETURNS TABLE(
  id UUID,
  type job_type,
  status TEXT,
  created_at TIMESTAMPTZ,
  pickup_address TEXT,
  delivery_address TEXT,
  distance_miles NUMERIC,
  requires_two BOOLEAN,
  notes TEXT,
  vin TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  track_token TEXT,
  dealer_name TEXT,
  dealer_store TEXT,
  estimated_pay_cents INTEGER,
  customer_name TEXT,
  customer_phone TEXT,
  salesperson_name TEXT,
  salesperson_phone TEXT,
  timeframe TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    j.id,
    j.type,
    j.status,
    j.created_at,
    j.pickup_address,
    j.delivery_address,
    j.distance_miles,
    j.requires_two,
    j.notes,
    j.vin,
    j.year,
    j.make,
    j.model,
    j.track_token,
    d.name AS dealer_name,
    d.store AS dealer_store,
  public.pay_rate_for_distance(COALESCE(j.distance_miles, 0)) AS estimated_pay_cents,
  NULL::text AS customer_name,
  NULL::text AS customer_phone,
    COALESCE(
      (
        SELECT ds.role::text || ' - ' || COALESCE(u.raw_user_meta_data->>'full_name', u.email)
        FROM public.dealership_staff ds
        JOIN auth.users u ON ds.user_id = u.id
        WHERE ds.user_id = j.created_by
          AND ds.dealer_id = j.dealer_id
          AND ds.is_active = true
        LIMIT 1
      ),
      d.name || ' Team'
    ) AS salesperson_name,
    (
      SELECT u.raw_user_meta_data->>'phone'
      FROM auth.users u
      WHERE u.id = j.created_by
      LIMIT 1
    ) AS salesperson_phone,
    j.timeframe
  FROM public.jobs j
  LEFT JOIN public.dealers d ON j.dealer_id = d.id
  WHERE j.status = 'open'
    AND NOT EXISTS (
      SELECT 1
      FROM public.assignments a
      WHERE a.job_id = j.id
    )
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.get_user_profile() p
      WHERE p.user_type = 'driver'
    )
  ORDER BY j.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_open_jobs_for_drivers() TO authenticated;