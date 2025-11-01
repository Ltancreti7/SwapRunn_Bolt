-- Add missing columns to existing tables
alter table dealers add column if not exists stripe_customer_id text;
alter table dealers add column if not exists stripe_subscription_id text;
alter table dealers add column if not exists plan text default 'standard';
alter table dealers add column if not exists status text default 'active';

-- Update existing dealers
update dealers set status = 'active' where status is null;
update dealers set plan = 'standard' where plan is null;

-- Add missing columns to drivers
alter table drivers add column if not exists phone text;
alter table drivers add column if not exists checkr_status text default 'pending';
alter table drivers add column if not exists checkr_candidate_id text;
alter table drivers add column if not exists stripe_connect_id text;

-- Add missing columns to jobs
alter table jobs add column if not exists customer_phone text;
alter table jobs add column if not exists pickup_address text;

-- Create timesheets table
create table if not exists timesheets (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete cascade,
  driver_id uuid references drivers(id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  total_seconds int default 0,
  pay_rate_cents int default 1800,
  created_at timestamptz default now()
);

-- Create payouts table
create table if not exists payouts (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid references assignments(id) on delete cascade,
  driver_id uuid references drivers(id) on delete cascade,
  amount_cents int not null,
  stripe_transfer_id text,
  status text check (status in ('pending','paid','failed')) default 'pending',
  created_at timestamptz default now()
);

-- Helper function for pay rates
create or replace function pay_rate_for_distance(miles numeric) returns int as $$
  select case when miles <= 120 then 1800 when miles <= 240 then 2200 else 2500 end;
$$ language sql immutable;

-- Update existing drivers with new data
update drivers set 
  phone = case 
    when name = 'Driver One' then '+1555-0101'
    when name = 'Driver Two' then '+1555-0102'  
    when name = 'Driver Three' then '+1555-0103'
    else phone
  end,
  checkr_status = 'clear'
where phone is null;

-- Create demo job if not exists
insert into jobs (
  type, vin, year, make, model, customer_name, customer_phone, 
  customer_address, pickup_address, delivery_address, distance_miles, 
  requires_two, status, notes
) 
select 'delivery', 'TESTVIN123', 2024, 'Toyota', 'Camry', 'John Customer', '+1555-0199',
  '123 Main St, Boston, MA', '456 Dealer Ave, Boston, MA', '123 Main St, Boston, MA', 
  25, false, 'open', 'Demo delivery job for investor presentation'
where not exists (select 1 from jobs where vin = 'TESTVIN123');