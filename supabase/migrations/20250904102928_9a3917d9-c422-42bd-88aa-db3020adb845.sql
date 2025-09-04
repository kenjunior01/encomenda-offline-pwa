-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'supervisor', 'vendedor');
CREATE TYPE public.order_status AS ENUM ('pendente', 'aprovada', 'rejeitada', 'entregue');

-- Create users table (extends auth with profile info)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'vendedor',
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  department TEXT NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  department TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'pendente',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create security definer functions for role checks
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE auth_user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT department FROM public.users WHERE auth_user_id = user_uuid;
$$;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth_user_id = auth.uid());

-- RLS Policies for warehouses
CREATE POLICY "Users can view warehouses in their department" 
ON public.warehouses FOR SELECT 
USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  department = public.get_user_department(auth.uid())
);

-- RLS Policies for products
CREATE POLICY "Users can view products in their department" 
ON public.products FOR SELECT 
USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  department = public.get_user_department(auth.uid())
);

CREATE POLICY "Admins and supervisors can manage products" 
ON public.products FOR ALL 
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'supervisor')
);

-- RLS Policies for customers
CREATE POLICY "Users can view all customers" 
ON public.customers FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create customers" 
ON public.customers FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for orders
CREATE POLICY "Users can view orders in their department" 
ON public.orders FOR SELECT 
USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  department = public.get_user_department(auth.uid()) OR
  user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can create orders in their department" 
ON public.orders FOR INSERT 
WITH CHECK (
  department = public.get_user_department(auth.uid()) AND
  user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Supervisors and admins can update orders" 
ON public.orders FOR UPDATE 
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'supervisor') AND
  (public.get_user_role(auth.uid()) = 'admin' OR department = public.get_user_department(auth.uid()))
);

-- RLS Policies for order_items
CREATE POLICY "Users can view order items for accessible orders" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (
      public.get_user_role(auth.uid()) = 'admin' OR 
      orders.department = public.get_user_department(auth.uid()) OR
      orders.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can manage order items for their orders" 
ON public.order_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

-- RLS Policies for announcements
CREATE POLICY "All users can view announcements" 
ON public.announcements FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage announcements" 
ON public.announcements FOR ALL 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, username, name, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'vendedor',
    'geral'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial data
INSERT INTO public.warehouses (name, department) VALUES 
  ('Armazém Central', 'geral'),
  ('Armazém TI', 'tecnologia'),
  ('Armazém RH', 'recursos_humanos'),
  ('Armazém Marketing', 'marketing');

INSERT INTO public.products (name, description, price, department, warehouse_id) 
SELECT 
  'Produto Exemplo ' || g.i,
  'Descrição do produto ' || g.i,
  (random() * 1000)::decimal(10,2),
  CASE (g.i % 4)
    WHEN 0 THEN 'geral'
    WHEN 1 THEN 'tecnologia' 
    WHEN 2 THEN 'recursos_humanos'
    ELSE 'marketing'
  END,
  w.id
FROM generate_series(1, 20) g(i)
CROSS JOIN (SELECT id FROM public.warehouses LIMIT 1) w;