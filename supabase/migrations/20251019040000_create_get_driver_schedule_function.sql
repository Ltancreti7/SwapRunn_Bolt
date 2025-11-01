create or replace function public.get_driver_schedule(_user_id uuid)
returns table (
  job_id uuid,
  assignment_id uuid,
  driver_id uuid,
  driver_name text,
  driver_phone text,
  pickup_address text,
  delivery_address text,
  specific_date text,
  specific_time text,
  job_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_dealer uuid;
begin
  if _user_id is null then
    raise exception 'User id is required';
  end if;

  if auth.uid() is distinct from _user_id then
    raise exception 'Permission denied for driver schedule lookup';
  end if;

  select dealer_id
    into target_dealer
  from public.dealership_staff
  where user_id = _user_id
    and coalesce(is_active, true) = true
  order by joined_at desc nulls last
  limit 1;

  if target_dealer is null then
    select dealer_id
      into target_dealer
    from public.profiles
    where user_id = _user_id
    limit 1;
  end if;

  if target_dealer is null then
    return;
  end if;

  return query
  select
    j.id as job_id,
    a.id as assignment_id,
    a.driver_id,
    coalesce(dr.name, 'Unassigned') as driver_name,
    dr.phone as driver_phone,
    j.pickup_address,
    j.delivery_address,
    j.specific_date,
    j.specific_time,
    coalesce(j.status, 'pending') as job_status,
    j.created_at
  from public.jobs j
  left join public.assignments a on a.job_id = j.id
  left join public.drivers dr on dr.id = a.driver_id
  where j.dealer_id = target_dealer
    and (j.status is null or j.status not in ('cancelled', 'archived'))
  order by
    coalesce(j.specific_date, to_char(j.created_at, 'YYYY-MM-DD')) asc,
    j.specific_time nulls last,
    j.created_at asc;
end;
$$;

revoke all on function public.get_driver_schedule(uuid) from public;
grant execute on function public.get_driver_schedule(uuid) to authenticated;
