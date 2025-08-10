-- Fix migration order: create user_roles first, then has_role
create extension if not exists pgcrypto;

-- Create enum app_role if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('director', 'supervisor', 'seller');
  END IF;
END
$$;

-- Tables needed before functions that depend on them
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index if not exists idx_user_roles_user on public.user_roles(user_id);

-- Helper functions
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Reference tables
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger if not exists trg_departments_updated
before update on public.departments
for each row execute function public.update_updated_at_column();

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references public.departments(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_warehouses_department on public.warehouses(department_id);
create trigger if not exists trg_warehouses_updated
before update on public.warehouses
for each row execute function public.update_updated_at_column();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  sku text unique,
  pieces_per_box integer,
  made_to_order boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_department on public.products(department_id);
create trigger if not exists trg_products_updated
before update on public.products
for each row execute function public.update_updated_at_column();

create table if not exists public.rollup_announcements (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger if not exists trg_rollup_announcements_updated
before update on public.rollup_announcements
for each row execute function public.update_updated_at_column();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  supervisor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_supervisor on public.profiles(supervisor_id);
create trigger if not exists trg_profiles_updated
before update on public.profiles
for each row execute function public.update_updated_at_column();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  order_date date not null default (now() at time zone 'utc')::date,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_created_by on public.orders(created_by);
create index if not exists idx_orders_department on public.orders(department_id);
create index if not exists idx_orders_warehouse on public.orders(warehouse_id);
create trigger if not exists trg_orders_updated
before update on public.orders
for each row execute function public.update_updated_at_column();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  boxes integer not null default 0,
  pieces integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_non_negative_qty check (boxes >= 0 and pieces >= 0)
);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_product on public.order_items(product_id);
create trigger if not exists trg_order_items_updated
before update on public.order_items
for each row execute function public.update_updated_at_column();

-- Enable RLS
alter table public.departments enable row level security;
alter table public.warehouses enable row level security;
alter table public.products enable row level security;
alter table public.rollup_announcements enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies
-- Departments
create policy if not exists "Departments are readable to authenticated"
  on public.departments for select to authenticated
  using (true);
create policy if not exists "Only directors manage departments"
  on public.departments for all to authenticated
  using (public.has_role(auth.uid(), 'director'))
  with check (public.has_role(auth.uid(), 'director'));

-- Warehouses
create policy if not exists "Warehouses are readable to authenticated"
  on public.warehouses for select to authenticated
  using (true);
create policy if not exists "Only directors manage warehouses"
  on public.warehouses for all to authenticated
  using (public.has_role(auth.uid(), 'director'))
  with check (public.has_role(auth.uid(), 'director'));

-- Products
create policy if not exists "Products are readable to authenticated"
  on public.products for select to authenticated
  using (active = true or public.has_role(auth.uid(), 'director'));
create policy if not exists "Only directors manage products"
  on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'director'))
  with check (public.has_role(auth.uid(), 'director'));

-- Roll-up announcements
create policy if not exists "Rollups are readable to authenticated"
  on public.rollup_announcements for select to authenticated
  using (active = true or public.has_role(auth.uid(), 'director'));
create policy if not exists "Only directors manage rollups"
  on public.rollup_announcements for all to authenticated
  using (public.has_role(auth.uid(), 'director'))
  with check (public.has_role(auth.uid(), 'director'));

-- Profiles
create policy if not exists "Users can view their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());
create policy if not exists "Directors can view all profiles"
  on public.profiles for select to authenticated
  using (public.has_role(auth.uid(), 'director'));
create policy if not exists "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy if not exists "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid());
create policy if not exists "Directors can manage any profile"
  on public.profiles for all to authenticated
  using (public.has_role(auth.uid(), 'director'))
  with check (public.has_role(auth.uid(), 'director'));

-- User roles
create policy if not exists "Users can read their roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'director'));
create policy if not exists "Directors can manage any role"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'director'))
  with check (public.has_role(auth.uid(), 'director'));
create policy if not exists "Supervisors can grant seller role"
  on public.user_roles for insert to authenticated
  with check (role = 'seller' and public.has_role(auth.uid(), 'supervisor'));

-- Access helper
create or replace function public.can_access_order(_order_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.orders o
    left join public.profiles p on p.id = o.created_by
    where o.id = _order_id
      and (
        o.created_by = auth.uid()
        or public.has_role(auth.uid(), 'director')
        or (p.supervisor_id = auth.uid())
      )
  );
$$;

-- Orders policies
create policy if not exists "Users can view their own orders"
  on public.orders for select to authenticated
  using (created_by = auth.uid());
create policy if not exists "Directors can view all orders"
  on public.orders for select to authenticated
  using (public.has_role(auth.uid(), 'director'));
create policy if not exists "Supervisors can view team orders"
  on public.orders for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = orders.created_by and p.supervisor_id = auth.uid()
  ));
create policy if not exists "Users can create their own orders"
  on public.orders for insert to authenticated
  with check (created_by = auth.uid());
create policy if not exists "Users can update their own orders"
  on public.orders for update to authenticated
  using (created_by = auth.uid());
create policy if not exists "Directors can manage any order"
  on public.orders for all to authenticated
  using (public.has_role(auth.uid(), 'director'))
  with check (public.has_role(auth.uid(), 'director'));
create policy if not exists "Supervisors can update team orders"
  on public.orders for update to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = orders.created_by and p.supervisor_id = auth.uid()
  ));

-- Order items policies
create policy if not exists "Order items readable if can access parent order"
  on public.order_items for select to authenticated
  using (public.can_access_order(order_id));
create policy if not exists "Order items insert if can access parent order"
  on public.order_items for insert to authenticated
  with check (public.can_access_order(order_id));
create policy if not exists "Order items update if can access parent order"
  on public.order_items for update to authenticated
  using (public.can_access_order(order_id))
  with check (public.can_access_order(order_id));
create policy if not exists "Order items delete if can access parent order"
  on public.order_items for delete to authenticated
  using (public.can_access_order(order_id));

-- Seed initial departments
insert into public.departments (slug, name)
values
  ('produtos', 'Produtos'),
  ('eletrodomesticos', 'Eletrodomésticos'),
  ('cosmeticos', 'Cosméticos'),
  ('alimentares', 'Alimentares')
on conflict (slug) do nothing;
