-- Create trigger to sync user_type from profiles to user_roles table
-- This ensures that when a dealer signs up, they automatically get the 'dealer' role in user_roles

CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF user_type ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role();