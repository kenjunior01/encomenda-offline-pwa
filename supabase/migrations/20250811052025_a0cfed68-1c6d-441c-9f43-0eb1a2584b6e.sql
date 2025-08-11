-- Idempotent migration with safe drops for triggers/policies
create extension if not exists pgcrypto;

-- Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('director', 'supervisor', 'seller');
  END IF;
END
$$;

-- Tables (create first)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index if not exists idx_user_roles_user on public.user_roles(user_id);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references public.departments(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_warehouses_department on public.warehouses(department_id);

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

create table if not exists public.rollup_announcements (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  supervisor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_supervisor on public.profiles(supervisor_id);

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

-- Functions
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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

create or replace function public.can_access_order(_order_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.orders o
    left join public.profiles p on p.id = o.created_by
    where o.id = _order_id
      and (
        o.created_by = auth.uid()
        or public.has_role(auth.uid(), 'director')
        or (p.supervisor_id = auth.uid())
      )
  );
$$;

-- Triggers (drop then create to avoid IF NOT EXISTS issue)
DROP TRIGGER IF EXISTS trg_departments_updated ON public.departments;
CREATE TRIGGER trg_departments_updated
BEFORE UPDATE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_warehouses_updated ON public.warehouses;
CREATE TRIGGER trg_warehouses_updated
BEFORE UPDATE ON public.warehouses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated ON public.products;
CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_rollup_announcements_updated ON public.rollup_announcements;
CREATE TRIGGER trg_rollup_announcements_updated
BEFORE UPDATE ON public.rollup_announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_order_items_updated ON public.order_items;
CREATE TRIGGER trg_order_items_updated
BEFORE UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
alter table public.departments enable row level security;
alter table public.warehouses enable row level security;
alter table public.products enable row level security;
alter table public.rollup_announcements enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies (drop then create)
-- Departments
DROP POLICY IF EXISTS "Departments are readable to authenticated" ON public.departments;
CREATE POLICY "Departments are readable to authenticated"
  ON public.departments FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS "Only directors manage departments" ON public.departments;
CREATE POLICY "Only directors manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- Warehouses
DROP POLICY IF EXISTS "Warehouses are readable to authenticated" ON public.warehouses;
CREATE POLICY "Warehouses are readable to authenticated"
  ON public.warehouses FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS "Only directors manage warehouses" ON public.warehouses;
CREATE POLICY "Only directors manage warehouses"
  ON public.warehouses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- Products
DROP POLICY IF EXISTS "Products are readable to authenticated" ON public.products;
CREATE POLICY "Products are readable to authenticated"
  ON public.products FOR SELECT TO authenticated
  USING (active = true or public.has_role(auth.uid(), 'director'));
DROP POLICY IF EXISTS "Only directors manage products" ON public.products;
CREATE POLICY "Only directors manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- Roll-up announcements
DROP POLICY IF EXISTS "Rollups are readable to authenticated" ON public.rollup_announcements;
CREATE POLICY "Rollups are readable to authenticated"
  ON public.rollup_announcements FOR SELECT TO authenticated
  USING (active = true or public.has_role(auth.uid(), 'director'));
DROP POLICY IF EXISTS "Only directors manage rollups" ON public.rollup_announcements;
CREATE POLICY "Only directors manage rollups"
  ON public.rollup_announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
DROP POLICY IF EXISTS "Directors can view all profiles" ON public.profiles;
CREATE POLICY "Directors can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'director'));
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
DROP POLICY IF EXISTS "Directors can manage any profile" ON public.profiles;
CREATE POLICY "Directors can manage any profile"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));

-- User roles
DROP POLICY IF EXISTS "Users can read their roles" ON public.user_roles;
CREATE POLICY "Users can read their roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() or public.has_role(auth.uid(), 'director'));
DROP POLICY IF EXISTS "Directors can manage any role" ON public.user_roles;
CREATE POLICY "Directors can manage any role"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));
DROP POLICY IF EXISTS "Supervisors can grant seller role" ON public.user_roles;
CREATE POLICY "Supervisors can grant seller role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (role = 'seller' AND public.has_role(auth.uid(), 'supervisor'));

-- Orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (created_by = auth.uid());
DROP POLICY IF EXISTS "Directors can view all orders" ON public.orders;
CREATE POLICY "Directors can view all orders"
  ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'director'));
DROP POLICY IF EXISTS "Supervisors can view team orders" ON public.orders;
CREATE POLICY "Supervisors can view team orders"
  ON public.orders FOR SELECT TO authenticated
  USING (exists (
    select 1 from public.profiles p
    where p.id = orders.created_by and p.supervisor_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (created_by = auth.uid());
DROP POLICY IF EXISTS "Directors can manage any order" ON public.orders;
CREATE POLICY "Directors can manage any order"
  ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'director'));
DROP POLICY IF EXISTS "Supervisors can update team orders" ON public.orders;
CREATE POLICY "Supervisors can update team orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (exists (
    select 1 from public.profiles p
    where p.id = orders.created_by and p.supervisor_id = auth.uid()
  ));

-- Order items policies
DROP POLICY IF EXISTS "Order items readable if can access parent order" ON public.order_items;
CREATE POLICY "Order items readable if can access parent order"
  ON public.order_items FOR SELECT TO authenticated
  USING (public.can_access_order(order_id));
DROP POLICY IF EXISTS "Order items insert if can access parent order" ON public.order_items;
CREATE POLICY "Order items insert if can access parent order"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (public.can_access_order(order_id));
DROP POLICY IF EXISTS "Order items update if can access parent order" ON public.order_items;
CREATE POLICY "Order items update if can access parent order"
  ON public.order_items FOR UPDATE TO authenticated
  USING (public.can_access_order(order_id))
  WITH CHECK (public.can_access_order(order_id));
DROP POLICY IF EXISTS "Order items delete if can access parent order" ON public.order_items;
CREATE POLICY "Order items delete if can access parent order"
  ON public.order_items FOR DELETE TO authenticated
  USING (public.can_access_order(order_id));

-- Seed initial departments
insert into public.departments (slug, name)
values
  ('produtos', 'Produtos'),
  ('eletrodomesticos', 'Eletrodomésticos'),
  ('cosmeticos', 'Cosméticos'),
  ('alimentares', 'Alimentares')
on conflict (slug) do nothing;
