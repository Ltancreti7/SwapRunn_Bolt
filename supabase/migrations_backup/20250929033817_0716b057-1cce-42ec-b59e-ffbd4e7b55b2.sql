-- Create vehicle_inspections table for storing pre-drive photos
CREATE TABLE public.vehicle_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  inspection_type TEXT NOT NULL DEFAULT 'pre_drive',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle inspections
CREATE POLICY "Inspections viewable by dealers and related drivers" 
ON public.vehicle_inspections 
FOR SELECT 
USING (
  (EXISTS (
    SELECT 1 FROM get_user_profile() p
    WHERE p.user_type = 'dealer'
  )) OR 
  (EXISTS (
    SELECT 1 FROM assignments a
    JOIN get_user_profile() p ON (a.driver_id = p.driver_id)
    WHERE a.id = vehicle_inspections.assignment_id
  ))
);

CREATE POLICY "Inspections insertable by dealers and assigned drivers" 
ON public.vehicle_inspections 
FOR INSERT 
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM get_user_profile() p
    WHERE p.user_type = 'dealer'
  )) OR 
  (EXISTS (
    SELECT 1 FROM assignments a
    JOIN get_user_profile() p ON (a.driver_id = p.driver_id)
    WHERE a.id = vehicle_inspections.assignment_id
  ))
);

-- Create storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-photos', 'vehicle-photos', true);

-- Create storage policies for vehicle photos
CREATE POLICY "Vehicle photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Users can upload vehicle photos for their assignments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'vehicle-photos' AND 
  (
    (EXISTS (
      SELECT 1 FROM get_user_profile() p
      WHERE p.user_type = 'dealer'
    )) OR 
    (EXISTS (
      SELECT 1 FROM assignments a
      JOIN get_user_profile() p ON (a.driver_id = p.driver_id)
      WHERE (storage.foldername(name))[2] = a.id::text
    ))
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vehicle_inspections_updated_at
BEFORE UPDATE ON public.vehicle_inspections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();