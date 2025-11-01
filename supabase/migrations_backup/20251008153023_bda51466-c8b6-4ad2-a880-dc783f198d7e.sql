-- Create vehicle_masters table for make/model data
CREATE TABLE IF NOT EXISTS public.vehicle_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(make, model)
);

-- Enable RLS
ALTER TABLE public.vehicle_masters ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read vehicle masters (public reference data)
CREATE POLICY "Anyone can view vehicle masters"
  ON public.vehicle_masters
  FOR SELECT
  USING (true);

-- Only admins/coordinators can insert/update
CREATE POLICY "Coordinators can manage vehicle masters"
  ON public.vehicle_masters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_profile() p
      WHERE p.user_type IN ('swap_coordinator', 'dealer')
    )
  );

-- Insert common makes and models
INSERT INTO public.vehicle_masters (make, model) VALUES
  ('Toyota', 'Camry'), ('Toyota', 'Corolla'), ('Toyota', 'RAV4'), ('Toyota', 'Highlander'), ('Toyota', 'Tacoma'), ('Toyota', 'Tundra'),
  ('Honda', 'Civic'), ('Honda', 'Accord'), ('Honda', 'CR-V'), ('Honda', 'Pilot'), ('Honda', 'Odyssey'),
  ('Ford', 'F-150'), ('Ford', 'Mustang'), ('Ford', 'Explorer'), ('Ford', 'Escape'), ('Ford', 'Edge'),
  ('Chevrolet', 'Silverado'), ('Chevrolet', 'Equinox'), ('Chevrolet', 'Malibu'), ('Chevrolet', 'Traverse'),
  ('Nissan', 'Altima'), ('Nissan', 'Sentra'), ('Nissan', 'Rogue'), ('Nissan', 'Pathfinder'),
  ('BMW', '3 Series'), ('BMW', '5 Series'), ('BMW', 'X3'), ('BMW', 'X5'),
  ('Mercedes-Benz', 'C-Class'), ('Mercedes-Benz', 'E-Class'), ('Mercedes-Benz', 'GLE'), ('Mercedes-Benz', 'GLC'),
  ('Audi', 'A4'), ('Audi', 'A6'), ('Audi', 'Q5'), ('Audi', 'Q7'),
  ('Lexus', 'ES'), ('Lexus', 'RX'), ('Lexus', 'NX'), ('Lexus', 'GX'),
  ('Hyundai', 'Elantra'), ('Hyundai', 'Sonata'), ('Hyundai', 'Tucson'), ('Hyundai', 'Santa Fe'),
  ('Kia', 'Forte'), ('Kia', 'Optima'), ('Kia', 'Sportage'), ('Kia', 'Sorento'),
  ('Ram', '1500'), ('Ram', '2500'), ('Ram', '3500'),
  ('GMC', 'Sierra'), ('GMC', 'Terrain'), ('GMC', 'Acadia'),
  ('Jeep', 'Wrangler'), ('Jeep', 'Grand Cherokee'), ('Jeep', 'Cherokee'), ('Jeep', 'Compass'),
  ('Subaru', 'Outback'), ('Subaru', 'Forester'), ('Subaru', 'Crosstrek'), ('Subaru', 'Impreza'),
  ('Mazda', 'CX-5'), ('Mazda', 'CX-9'), ('Mazda', 'Mazda3'), ('Mazda', 'Mazda6'),
  ('Volkswagen', 'Jetta'), ('Volkswagen', 'Passat'), ('Volkswagen', 'Tiguan'), ('Volkswagen', 'Atlas'),
  ('Tesla', 'Model 3'), ('Tesla', 'Model Y'), ('Tesla', 'Model S'), ('Tesla', 'Model X'),
  ('Dodge', 'Charger'), ('Dodge', 'Challenger'), ('Dodge', 'Durango'),
  ('Acura', 'TLX'), ('Acura', 'MDX'), ('Acura', 'RDX')
ON CONFLICT (make, model) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX idx_vehicle_masters_make ON public.vehicle_masters(make);