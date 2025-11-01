/*
  # Add dealer_id to drivers table

  1. Changes
    - Add `dealer_id` column to `drivers` table to link drivers with specific dealerships
    - Create index on dealer_id for query performance
    - Update RLS policies to ensure drivers can only see jobs from their dealership

  2. Notes
    - dealer_id is nullable to support legacy drivers without dealership associations
    - New drivers should be required to have a dealer_id in application logic
*/

-- Add dealer_id column to drivers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'dealer_id'
  ) THEN
    ALTER TABLE public.drivers
      ADD COLUMN dealer_id UUID REFERENCES public.dealers(id) ON DELETE SET NULL;

    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_drivers_dealer_id ON public.drivers(dealer_id);

    -- Add comment for documentation
    COMMENT ON COLUMN public.drivers.dealer_id IS 'Links driver to their primary dealership';
  END IF;
END $$;

-- Update the drivers table RLS policies to be more specific
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.drivers;
DROP POLICY IF EXISTS "Dealers can view drivers from their dealership" ON public.drivers;

-- Allow drivers to view their own profile
CREATE POLICY "Drivers can view their own profile" ON public.drivers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.driver_id = drivers.id
    )
  );

-- Allow drivers to update their own profile
CREATE POLICY "Drivers can update their own profile" ON public.drivers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.driver_id = drivers.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.driver_id = drivers.id
    )
  );

-- Allow dealers to view drivers from their dealership
CREATE POLICY "Dealers can view drivers from their dealership" ON public.drivers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.user_type = 'dealer'
      AND p.dealer_id = drivers.dealer_id
    )
  );

-- Allow dealers to view all available drivers (for potential hiring/assignment)
CREATE POLICY "Dealers can view all available drivers" ON public.drivers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.user_type = 'dealer'
    )
  );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.drivers TO authenticated;