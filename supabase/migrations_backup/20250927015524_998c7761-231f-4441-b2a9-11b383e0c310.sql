-- Create tables for enhanced communication and notifications

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on push subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
FOR ALL USING (auth.uid() = user_id);

-- Notification logs table for analytics
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  user_id UUID,
  user_type TEXT,
  type TEXT NOT NULL CHECK (type IN ('push', 'email', 'sms')),
  sent_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notification logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view notification logs
CREATE POLICY "Only admins can view notification logs" ON public.notification_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM get_user_profile() p 
    WHERE p.user_type = 'dealer'
  )
);

-- Update job_messages table to support file attachments and read receipts
ALTER TABLE public.job_messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_messages_read_status ON job_messages(job_id, assignment_id, read_at);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id, created_at DESC);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;

-- Set replica identity for proper realtime updates
ALTER TABLE public.push_subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.notification_logs REPLICA IDENTITY FULL;