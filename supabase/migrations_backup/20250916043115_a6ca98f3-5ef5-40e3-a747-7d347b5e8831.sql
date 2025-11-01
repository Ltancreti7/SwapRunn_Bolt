-- SwapRunn Database Schema
create extension if not exists "uuid-ossp";

-- Create job_type enum
do $$ begin
  if not exists (select 1 from pg_type where typname = 'job_type') then
    create type job_type as enum ('delivery','swap');
  end if;
end $$;

-- Create dealers table
create table if not exists dealers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Create drivers table
create table if not exists drivers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  rating_avg numeric default 5.0,
  rating_count int default 0,
  city_ok boolean default true,
  max_miles int default 50,
  available boolean default true,
  created_at timestamptz default now()
);

-- Create jobs table
create table if not exists jobs (
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
  status text check (status in ('open','assigned','in_progress','completed','cancelled')) default 'open',
  track_token text unique default upper(substring(md5(random()::text) from 1 for 12)),
  notes text,
  created_at timestamptz default now()
);

-- Create assignments table
create table if not exists assignments (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete cascade,
  driver_id uuid references drivers(id) on delete set null,
  accepted_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Create ratings table
create table if not exists ratings (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid references assignments(id) on delete cascade,
  stars int check (stars between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Insert seed data
insert into dealers (name) values ('Demo Dealer') on conflict do nothing;

insert into drivers (name, phone, rating_avg, rating_count, city_ok, max_miles, available) values
('John Smith', '(555) 123-4567', 4.9, 22, true, 60, true),
('Sarah Johnson', '(555) 987-6543', 4.8, 19, false, 45, true),
('Mike Wilson', '(555) 456-7890', 4.7, 10, true, 30, true)
on conflict do nothing;

-- Disable RLS for MVP demo (enable + author rules later)
alter table dealers disable row level security;
alter table drivers disable row level security;
alter table jobs disable row level security;
alter table assignments disable row level security;
alter table ratings disable row level security;