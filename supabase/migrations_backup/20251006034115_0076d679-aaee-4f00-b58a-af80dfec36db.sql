-- Add usage tracking and add-ons to dealer_subscriptions
ALTER TABLE dealer_subscriptions
ADD COLUMN IF NOT EXISTS base_price_cents INTEGER DEFAULT 9900,
ADD COLUMN IF NOT EXISTS per_swap_price_cents INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS swaps_this_period INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_metered_price_id TEXT,
ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_billing_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS add_ons JSONB DEFAULT '{"gps_tracking": false, "signature_capture": false}'::jsonb;

-- Create swap_usage_records table to track each completed swap
CREATE TABLE IF NOT EXISTS swap_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stripe_usage_record_id TEXT,
  billed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on swap_usage_records
ALTER TABLE swap_usage_records ENABLE ROW LEVEL SECURITY;

-- Policy: Dealers can view their own usage records
CREATE POLICY "Dealers can view own swap usage"
ON swap_usage_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM get_user_profile() p
    WHERE p.dealer_id = swap_usage_records.dealer_id
  )
);

-- Policy: System can insert usage records (for triggers/functions)
CREATE POLICY "System can insert swap usage"
ON swap_usage_records
FOR INSERT
WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_swap_usage_dealer_date 
ON swap_usage_records(dealer_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_swap_usage_billed 
ON swap_usage_records(dealer_id, billed) 
WHERE billed = false;

-- Function to record swap usage when job is completed
CREATE OR REPLACE FUNCTION record_swap_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Insert usage record
    INSERT INTO swap_usage_records (dealer_id, job_id, assignment_id, completed_at)
    SELECT 
      NEW.dealer_id,
      NEW.id,
      a.id,
      now()
    FROM assignments a
    WHERE a.job_id = NEW.id
    LIMIT 1;
    
    -- Increment swap counter for current billing period
    UPDATE dealer_subscriptions
    SET swaps_this_period = swaps_this_period + 1
    WHERE dealer_id = NEW.dealer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-record usage
CREATE TRIGGER on_job_completed
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION record_swap_usage();

-- Function to reset monthly usage counters
CREATE OR REPLACE FUNCTION reset_billing_period()
RETURNS void AS $$
BEGIN
  UPDATE dealer_subscriptions
  SET 
    swaps_this_period = 0,
    last_billing_date = now(),
    billing_period_start = date_trunc('month', now()),
    billing_period_end = date_trunc('month', now()) + interval '1 month'
  WHERE billing_period_end <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;