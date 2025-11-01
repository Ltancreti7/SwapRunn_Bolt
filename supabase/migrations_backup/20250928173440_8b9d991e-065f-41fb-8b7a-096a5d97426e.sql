-- Delete driver profiles and associated records
-- First delete assignments related to these drivers
DELETE FROM assignments WHERE driver_id IN ('9b6f62c4-53ca-4b74-984c-6014a713ba1c', '3649364d-b1d5-4a64-ae81-17ea3820ab0a');

-- Delete timesheets related to these drivers
DELETE FROM timesheets WHERE driver_id IN ('9b6f62c4-53ca-4b74-984c-6014a713ba1c', '3649364d-b1d5-4a64-ae81-17ea3820ab0a');

-- Delete payouts related to these drivers
DELETE FROM payouts WHERE driver_id IN ('9b6f62c4-53ca-4b74-984c-6014a713ba1c', '3649364d-b1d5-4a64-ae81-17ea3820ab0a');

-- Delete driver verifications
DELETE FROM driver_verifications WHERE driver_id IN ('9b6f62c4-53ca-4b74-984c-6014a713ba1c', '3649364d-b1d5-4a64-ae81-17ea3820ab0a');

-- Delete emergency contacts
DELETE FROM emergency_contacts WHERE driver_id IN ('9b6f62c4-53ca-4b74-984c-6014a713ba1c', '3649364d-b1d5-4a64-ae81-17ea3820ab0a');

-- Delete reputation metrics
DELETE FROM reputation_metrics WHERE driver_id IN ('9b6f62c4-53ca-4b74-984c-6014a713ba1c', '3649364d-b1d5-4a64-ae81-17ea3820ab0a');

-- Delete profiles that reference these drivers
DELETE FROM profiles WHERE driver_id IN ('9b6f62c4-53ca-4b74-984c-6014a713ba1c', '3649364d-b1d5-4a64-ae81-17ea3820ab0a');

-- Finally delete the driver records
DELETE FROM drivers WHERE id IN ('9b6f62c4-53ca-4b74-984c-6014a713ba1c', '3649364d-b1d5-4a64-ae81-17ea3820ab0a');