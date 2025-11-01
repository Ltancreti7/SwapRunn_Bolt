-- Update profiles constraint to support swap coordinators (inventory managers)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (
  (user_type = 'dealer' AND dealer_id IS NOT NULL AND driver_id IS NULL AND swap_coordinator_id IS NULL) OR
  (user_type = 'driver' AND driver_id IS NOT NULL AND dealer_id IS NULL AND swap_coordinator_id IS NULL) OR
  (user_type = 'swap_coordinator' AND swap_coordinator_id IS NOT NULL AND dealer_id IS NULL AND driver_id IS NULL)
);
