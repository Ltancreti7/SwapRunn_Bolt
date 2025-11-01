-- Production schema for SwapRunn MVP
create extension if not exists "uuid-ossp";

-- Create custom types
do $$ begin
  if not exists (select 1 from pg_type where typname = 'job_type') then
    create type job_type as enum ('delivery','swap');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type job_status as enum ('open','assigned','in_progress','completed','cancelled');
  end if;
end $$;

-- Dealers table
create table if not exists dealers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'standard',
  status text default 'active',
  created_at timestamptz default now()
);

-- Drivers table (enhanced)
drop table if exists drivers cascade;
create table drivers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  rating_avg numeric default 5.0,
  rating_count int default 0,
  city_ok boolean default true,
  max_miles int default 50,
  available boolean default true,
  checkr_status text default 'pending',
  checkr_candidate_id text,
  stripe_connect_id text,
  created_at timestamptz default now()
);

-- Jobs table (enhanced)
drop table if exists jobs cascade;
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  type job_type not null default 'delivery',
  vin text,
  year int,
  make text,
  model text,
  customer_name text,
  customer_phone text,
  customer_address text,
  pickup_address text,
  delivery_address text,
  distance_miles numeric default 25,
  requires_two boolean default false,
  status job_status default 'open',
  track_token text unique default upper(substring(md5(random()::text) from 1 for 12)),
  notes text,
  created_at timestamptz default now()
);

-- Assignments table
drop table if exists assignments cascade;
create table assignments (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete cascade,
  driver_id uuid references drivers(id) on delete set null,
  accepted_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Ratings table
drop table if exists ratings cascade;
create table ratings (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid references assignments(id) on delete cascade,
  stars int check (stars between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Timesheets table
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

-- Payouts table
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

-- Seed data
insert into dealers (name, status) values ('Demo Dealer','active') on conflict do nothing;

insert into drivers (name, phone, rating_avg, rating_count, city_ok, max_miles, available, checkr_status) values
('Marcus Johnson', '+1555-0101', 4.9, 22, true, 60, true, 'clear'),
('Sarah Williams', '+1555-0102', 4.8, 19, false, 45, true, 'pending'),
('David Chen', '+1555-0103', 4.7, 10, true, 30, true, 'clear')
on conflict do nothing;

-- Create demo job
insert into jobs (
  type, vin, year, make, model, customer_name, customer_phone, 
  customer_address, pickup_address, delivery_address, distance_miles, 
  requires_two, status, notes
) values (
  'delivery', 'TESTVIN123', 2024, 'Toyota', 'Camry', 'John Customer', '+1555-0199',
  '123 Main St, Boston, MA', '456 Dealer Ave, Boston, MA', '123 Main St, Boston, MA', 
  25, false, 'open', 'Demo delivery job for investor presentation'
) on conflict do nothing;

-- Disable RLS for demo (enable later for production)
alter table dealers disable row level security;
alter table drivers disable row level security;
alter table jobs disable row level security;
alter table assignments disable row level security;
alter table ratings disable row level security;
alter table timesheets disable row level security;
alter table payouts disable row level security;