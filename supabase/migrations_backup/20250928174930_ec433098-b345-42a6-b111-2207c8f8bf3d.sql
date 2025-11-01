-- Update Stephen Zullo's role from salesperson to sales
UPDATE public.dealership_staff 
SET role = 'sales', updated_at = now()
WHERE user_id = 'c4898adb-37f8-4cdc-830d-625232edc5bb';

-- Update Luke Tancreti's role from salesperson to sales  
UPDATE public.dealership_staff
SET role = 'sales', updated_at = now()
WHERE user_id = 'ce883001-cab5-4c6a-9d13-35ae9aa76fce';