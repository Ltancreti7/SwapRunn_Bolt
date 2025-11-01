-- Create dealer_subscriptions table for billing tiers
create table if not exists dealer_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid references dealers(id) on delete cascade,
  plan_name text not null check (plan_name in ('starter', 'growth', 'enterprise')),
  monthly_runs_limit int not null,
  price_cents int not null,
  stripe_subscription_id text,
  status text default 'active' check (status in ('active', 'cancelled', 'paused')),
  runs_used_this_month int default 0,
  billing_period_start timestamptz default date_trunc('month', now()),
  billing_period_end timestamptz default (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Function to reset monthly usage at start of each billing period
create or replace function reset_monthly_usage()
returns void as $$
begin
  update dealer_subscriptions 
  set runs_used_this_month = 0,
      billing_period_start = date_trunc('month', now()),
      billing_period_end = date_trunc('month', now()) + interval '1 month'
  where billing_period_end <= now();
end;
$$ language plpgsql;

-- Create profiles table linked to auth users (using Supabase auth.users)
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  user_type text not null check (user_type in ('dealer', 'driver')),
  dealer_id uuid references dealers(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Policy: Users can only see their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = user_id);

-- Seed data for demo dealer subscription
insert into dealer_subscriptions (dealer_id, plan_name, monthly_runs_limit, price_cents, status)
select d.id, 'growth', 100, 49900, 'active'
from dealers d 
where d.name = 'Demo Dealer'
and not exists (
  select 1 from dealer_subscriptions ds where ds.dealer_id = d.id
);

-- Add email to dealers table for auth
alter table dealers add column if not exists email text;
update dealers set email = 'demo@dealer.com' where name = 'Demo Dealer' and email is null;

-- Add email to drivers table for auth  
alter table drivers add column if not exists email text;
update drivers set email = name || '@driver.com' where email is null;