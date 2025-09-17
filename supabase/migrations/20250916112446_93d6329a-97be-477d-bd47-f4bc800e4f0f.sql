-- Create core extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Helper function for updating timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Shop configurations table
create table if not exists public.shop_configurations (
  id uuid primary key default gen_random_uuid(),
  shop_domain text not null unique,
  settings jsonb not null default '{}'::jsonb,
  subscription_status text default 'trial',
  subscription_plan text default 'starter',
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add trigger for shop_configurations (drop first if exists)
drop trigger if exists trg_shop_configurations_updated on public.shop_configurations;
create trigger trg_shop_configurations_updated
before update on public.shop_configurations
for each row execute function public.update_updated_at_column();

-- Upsell products table
create table if not exists public.upsell_products (
  id uuid primary key default gen_random_uuid(),
  shop_domain text not null,
  product_id text,
  product_title text,
  product_handle text,
  product_price numeric(12,2) default 0,
  product_image_url text,
  target_products text[] default '{}',
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_upsell_products_shop on public.upsell_products(shop_domain);
create index if not exists idx_upsell_products_active on public.upsell_products(shop_domain, is_active);

-- Analytics events table
create table if not exists public.cart_analytics (
  id uuid primary key default gen_random_uuid(),
  shop_domain text not null,
  event_type text not null,
  session_id text,
  cart_total numeric(12,2),
  item_count int,
  product_id text,
  variant_id text,
  event_data jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_cart_analytics_shop_time on public.cart_analytics(shop_domain, created_at desc);

-- Monthly subscription usage table (aggregates)
create table if not exists public.subscription_usage (
  id uuid primary key default gen_random_uuid(),
  shop_domain text not null,
  month date not null,
  cart_opens int not null default 0,
  conversions int not null default 0,
  orders_processed int not null default 0,
  revenue_generated numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (shop_domain, month)
);
create index if not exists idx_subscription_usage_shop_month on public.subscription_usage(shop_domain, month);

-- Function to increment usage counters (used by analytics function)
create or replace function public.increment_usage_stats(
  p_shop_domain text,
  p_month date,
  p_cart_opens int,
  p_conversions int,
  p_orders_processed int,
  p_revenue_generated numeric
) returns void as $$
begin
  insert into public.subscription_usage (shop_domain, month, cart_opens, conversions, orders_processed, revenue_generated)
  values (p_shop_domain, p_month, p_cart_opens, p_conversions, p_orders_processed, p_revenue_generated)
  on conflict (shop_domain, month)
  do update set
    cart_opens = public.subscription_usage.cart_opens + excluded.cart_opens,
    conversions = public.subscription_usage.conversions + excluded.conversions,
    orders_processed = public.subscription_usage.orders_processed + excluded.orders_processed,
    revenue_generated = public.subscription_usage.revenue_generated + excluded.revenue_generated;
end;
$$ language plpgsql security definer set search_path = public;

-- Enable RLS (service role bypasses RLS)
alter table public.shop_configurations enable row level security;
alter table public.upsell_products enable row level security;
alter table public.cart_analytics enable row level security;
alter table public.subscription_usage enable row level security;

-- Basic policies to prevent lockout
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'shop_configurations' and policyname = 'Allow all operations on shop_configurations') then
    create policy "Allow all operations on shop_configurations" on public.shop_configurations using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'upsell_products' and policyname = 'Allow all operations on upsell_products') then
    create policy "Allow all operations on upsell_products" on public.upsell_products using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'cart_analytics' and policyname = 'Allow all operations on cart_analytics') then
    create policy "Allow all operations on cart_analytics" on public.cart_analytics using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'subscription_usage' and policyname = 'Allow all operations on subscription_usage') then
    create policy "Allow all operations on subscription_usage" on public.subscription_usage using (true);
  end if;
end
$$;
