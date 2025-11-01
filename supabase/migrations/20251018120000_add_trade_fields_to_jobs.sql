-- Add trade-in metadata columns to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS trade_year integer;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS trade_make text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS trade_model text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS trade_vin text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS trade_transmission text;
