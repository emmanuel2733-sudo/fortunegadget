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

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects
for select
using (bucket_id = 'product-images');

drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Authenticated users can upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');

drop policy if exists "Authenticated users can update product images" on storage.objects;
create policy "Authenticated users can update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

drop policy if exists "Authenticated users can delete product images" on storage.objects;
create policy "Authenticated users can delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');

-- The backend writes products, orders, and reviews with the service role key,
-- so no insert/update/delete policy is required for these public tables.
