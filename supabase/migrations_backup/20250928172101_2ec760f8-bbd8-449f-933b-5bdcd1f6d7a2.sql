-- Add dealership code to dealers table
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS dealership_code TEXT UNIQUE;

-- Generate codes for existing dealers  
UPDATE public.dealers 
SET dealership_code = UPPER(SUBSTRING(REPLACE(name, ' ', '-') FROM 1 FOR 12) || '-' || SUBSTRING(md5(random()::text) FROM 1 FOR 3))
WHERE dealership_code IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dealers_dealership_code ON public.dealers(dealership_code);

-- Update dealership_staff role enum to include the positions requested
-- Note: We need to check if the enum already has these values
DO $$
BEGIN
    -- Check if the enum type needs updating
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'dealership_role'::regtype 
        AND enumlabel IN ('sales', 'sales_manager', 'swap_manager', 'parts_manager', 'service_manager')
    ) THEN
        -- Add new enum values if they don't exist
        ALTER TYPE dealership_role ADD VALUE IF NOT EXISTS 'sales';
        ALTER TYPE dealership_role ADD VALUE IF NOT EXISTS 'sales_manager';  
        ALTER TYPE dealership_role ADD VALUE IF NOT EXISTS 'swap_manager';
        ALTER TYPE dealership_role ADD VALUE IF NOT EXISTS 'parts_manager';
        ALTER TYPE dealership_role ADD VALUE IF NOT EXISTS 'service_manager';
    END IF;
END $$;