create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  image_path text not null default '',
  price numeric(12, 2) not null check (price > 0),
  category text not null,
  brand text not null,
  desc text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text not null,
  order_date text not null,
  order_time text not null,
  order_amount numeric(12, 2) not null check (order_amount > 0),
  order_status text not null,
  cart_items jsonb not null default '[]'::jsonb,
  shipping_address jsonb not null default '{}'::jsonb,
  payment_gateway text not null default '',
  payment_reference text not null default '',
  payment_status text not null default '',
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text not null,
  product_id uuid not null references public.products (id) on delete cascade,
  rate integer not null check (rate > 0 and rate <= 5),
  review text not null,
  review_date text not null,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
on public.products
for select
using (true);

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
on public.reviews
for select
using (true);

-- The backend writes products, orders, and reviews with the service role key,
-- so no insert/update/delete policy is required for these tables themselves.
--
-- Create a public storage bucket named `product-images`, then add storage policies
-- that fit your admin model. A simple starting point is authenticated-only uploads.
