-- Enable realtime for jobs table
ALTER TABLE public.jobs REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.jobs;