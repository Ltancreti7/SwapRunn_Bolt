-- Add missing columns to jobs table for Phase 1
ALTER TABLE public.jobs ADD COLUMN timeframe TEXT;
ALTER TABLE public.jobs ADD COLUMN transmission TEXT;
ALTER TABLE public.jobs ADD COLUMN specific_time TEXT;
ALTER TABLE public.jobs ADD COLUMN specific_date TEXT;