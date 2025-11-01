-- Fix check constraint to include swap_coordinator_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_single_account_type;

ALTER TABLE public.profiles ADD CONSTRAINT check_single_account_type 
CHECK (
  (
    (dealer_id IS NOT NULL)::integer + 
    (driver_id IS NOT NULL)::integer + 
    (swap_coordinator_id IS NOT NULL)::integer
  ) = 1
);