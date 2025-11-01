-- Create job_messages table for chat functionality
CREATE TABLE public.job_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('driver', 'dealer')),
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

-- Add policies for message access
CREATE POLICY "Messages viewable by job participants" ON public.job_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM get_user_profile() p, jobs j, assignments a
      WHERE j.id = job_messages.job_id 
      AND a.id = job_messages.assignment_id
      AND (
        (p.user_type = 'dealer' AND p.dealer_id = j.dealer_id) OR
        (p.user_type = 'driver' AND p.driver_id = a.driver_id)
      )
    )
  );

CREATE POLICY "Messages insertable by job participants" ON public.job_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM get_user_profile() p, jobs j, assignments a
      WHERE j.id = job_messages.job_id 
      AND a.id = job_messages.assignment_id
      AND (
        (p.user_type = 'dealer' AND p.dealer_id = j.dealer_id) OR
        (p.user_type = 'driver' AND p.driver_id = a.driver_id)
      )
    )
  );

CREATE POLICY "Messages updatable by sender" ON public.job_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM get_user_profile() p
      WHERE (
        (sender_type = 'dealer' AND p.user_type = 'dealer') OR
        (sender_type = 'driver' AND p.user_type = 'driver')
      )
    )
  );

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE job_messages;
ALTER TABLE job_messages REPLICA IDENTITY FULL;

-- Add indexes for performance
CREATE INDEX idx_job_messages_job_id ON public.job_messages(job_id);
CREATE INDEX idx_job_messages_assignment_id ON public.job_messages(assignment_id);
CREATE INDEX idx_job_messages_created_at ON public.job_messages(created_at DESC);