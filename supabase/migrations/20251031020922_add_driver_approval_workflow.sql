/*
  # Driver Approval Workflow
  
  1. New Columns
    - `approval_status` - pending_approval, approved, rejected
    - `approved_by` - ID of manager who approved/rejected
    - `approved_at` - timestamp of approval/rejection
    - `rejection_reason` - optional reason for rejection
    - Ensure `dealer_id` exists (may already be created)
  
  2. Changes
    - New drivers start with 'pending_approval' status
    - Only 'approved' drivers receive job notifications
    - Managers can view pending drivers and approve/reject them
    
  3. Security
    - RLS policies allow dealers to view drivers pending approval for their dealership
    - Only managers can update driver approval status
*/

-- Create enum for approval status
DO $$ BEGIN
  CREATE TYPE driver_approval_status AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure dealer_id exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'dealer_id'
  ) THEN
    ALTER TABLE public.drivers
      ADD COLUMN dealer_id UUID REFERENCES public.dealers(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_drivers_dealer_id ON public.drivers(dealer_id);
    
    COMMENT ON COLUMN public.drivers.dealer_id IS 'Dealership this driver is associated with';
  END IF;
END $$;

-- Add approval workflow columns
DO $$
BEGIN
  -- Add approval_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE public.drivers
      ADD COLUMN approval_status TEXT DEFAULT 'pending_approval' NOT NULL;
    
    COMMENT ON COLUMN public.drivers.approval_status IS 'Approval status: pending_approval, approved, or rejected';
  END IF;

  -- Add approved_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public.drivers
      ADD COLUMN approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.drivers.approved_by IS 'Manager who approved or rejected this driver';
  END IF;

  -- Add approved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public.drivers
      ADD COLUMN approved_at TIMESTAMPTZ;
    
    COMMENT ON COLUMN public.drivers.approved_at IS 'When the driver was approved or rejected';
  END IF;

  -- Add rejection_reason column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.drivers
      ADD COLUMN rejection_reason TEXT;
    
    COMMENT ON COLUMN public.drivers.rejection_reason IS 'Optional reason provided when rejecting a driver';
  END IF;
END $$;

-- Create index for filtering by approval status
CREATE INDEX IF NOT EXISTS idx_drivers_approval_status ON public.drivers(approval_status);
CREATE INDEX IF NOT EXISTS idx_drivers_dealer_approval ON public.drivers(dealer_id, approval_status);

-- Update existing drivers to be 'approved' by default (legacy data)
UPDATE public.drivers
SET approval_status = 'approved'
WHERE approval_status IS NULL OR approval_status = 'pending_approval';

-- RLS Policies for driver approval management

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Dealers can view pending drivers for approval" ON public.drivers;
DROP POLICY IF EXISTS "Dealers can approve drivers" ON public.drivers;

-- Allow dealers to view all drivers from their dealership (including pending)
CREATE POLICY "Dealers can view all drivers from their dealership" ON public.drivers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.user_type = 'dealer'
      AND p.dealer_id = drivers.dealer_id
    )
  );

-- Allow dealers to view all drivers (for dropdown selection during signup)
CREATE POLICY "Authenticated users can view all dealerships" ON public.dealers
  FOR SELECT TO authenticated
  USING (true);

-- Allow dealers to update driver approval status
CREATE POLICY "Dealers can approve or reject drivers" ON public.drivers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.user_type = 'dealer'
      AND p.dealer_id = drivers.dealer_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.user_type = 'dealer'
      AND p.dealer_id = drivers.dealer_id
    )
  );

-- Grant necessary permissions
GRANT SELECT ON public.dealers TO authenticated;
GRANT SELECT, UPDATE ON public.drivers TO authenticated;
