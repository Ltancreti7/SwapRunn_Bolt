-- SwapRunn Seed Data
-- Test driver requests (profiles will be created when users sign up)

-- Insert test driver requests for demonstration
insert into driver_requests (type, pickup, dropoff, status, notes)
values
('delivery', 'SwapRunn HQ', 'Customer Address', 'pending', 'New vehicle delivery to customer'),
('swap', 'Dealer A', 'Dealer B', 'pending', 'Vehicle swap between dealerships'),
('parts', 'Parts Warehouse', 'Service Center', 'pending', 'Urgent brake pad delivery'),
('service', 'Customer Location', 'Service Center', 'pending', 'Pickup for scheduled maintenance'),
('delivery', 'Downtown Dealership', '123 Main St', 'pending', 'Priority delivery for VIP customer'),
('swap', 'North Branch', 'South Branch', 'pending', 'End of month inventory swap');