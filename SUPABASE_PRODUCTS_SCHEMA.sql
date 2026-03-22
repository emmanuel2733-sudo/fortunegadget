create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'vendor_admin', 'super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text not null default '',
  banner_url text not null default '',
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'disabled', 'suspended')),
  license_status text not null default 'active' check (license_status in ('active', 'expired', 'revoked')),
  currency text not null default 'NGN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_admins (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  unique (vendor_id, user_id),
  unique (user_id)
);

create table if not exists public.vendor_categories (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, slug)
);

create table if not exists public.vendor_paystack_accounts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null unique references public.vendors (id) on delete cascade,
  subaccount_code text not null,
  business_name text not null default '',
  settlement_bank text not null default '',
  account_number_last4 text not null default '',
  percentage_charge numeric(5, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors (id) on delete cascade,
  category_id uuid references public.vendor_categories (id) on delete set null,
  name text not null,
  image_url text not null,
  image_path text not null default '',
  price numeric(12, 2) not null check (price > 0),
  category text not null,
  brand text not null,
  "desc" text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors (id) on delete set null,
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
  vendor_id uuid references public.vendors (id) on delete set null,
  user_id text not null,
  user_name text not null,
  product_id uuid not null references public.products (id) on delete cascade,
  rate integer not null check (rate > 0 and rate <= 5),
  review text not null,
  review_date text not null,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists vendor_id uuid references public.vendors (id) on delete cascade;
alter table public.products add column if not exists category_id uuid references public.vendor_categories (id) on delete set null;

alter table public.orders add column if not exists vendor_id uuid references public.vendors (id) on delete set null;
alter table public.reviews add column if not exists vendor_id uuid references public.vendors (id) on delete set null;

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_vendors_slug on public.vendors (slug);
create index if not exists idx_vendor_admins_user_id on public.vendor_admins (user_id);
create index if not exists idx_vendor_admins_vendor_id on public.vendor_admins (vendor_id);
create index if not exists idx_vendor_categories_vendor_id on public.vendor_categories (vendor_id);
create index if not exists idx_products_vendor_id on public.products (vendor_id);
create index if not exists idx_products_category_id on public.products (category_id);
create index if not exists idx_orders_vendor_id on public.orders (vendor_id);
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_reviews_vendor_id on public.reviews (vendor_id);
create index if not exists idx_reviews_product_id on public.reviews (product_id);

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_admins enable row level security;
alter table public.vendor_categories enable row level security;
alter table public.vendor_paystack_accounts enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Public can read vendors" on public.vendors;
create policy "Public can read vendors"
on public.vendors
for select
using (true);

drop policy if exists "Users can read own vendor memberships" on public.vendor_admins;
create policy "Users can read own vendor memberships"
on public.vendor_admins
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Public can read vendor categories" on public.vendor_categories;
create policy "Public can read vendor categories"
on public.vendor_categories
for select
using (is_active = true);

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

-- Admin-side writes are performed by the backend service role key, so insert/update/delete
-- policies are intentionally omitted for vendor-managed tables here.
