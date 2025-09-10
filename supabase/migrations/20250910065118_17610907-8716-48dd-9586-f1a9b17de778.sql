-- Create warehouse tables for the three locations
INSERT INTO public.warehouses (name, department) VALUES 
('Nampula WH', 'geral'),
('Maputo WH', 'geral'), 
('Beira WH', 'geral'),
('Nampula WH', 'eletrodomesticos'),
('Maputo WH', 'eletrodomesticos'),
('Beira WH', 'eletrodomesticos'),
('Nampula WH', 'alimentacao'),
('Maputo WH', 'alimentacao'),
('Beira WH', 'alimentacao'),
('Nampula WH', 'cosmeticos'),
('Maputo WH', 'cosmeticos'),
('Beira WH', 'cosmeticos');

-- Insert pre-registered users (password will be set via Supabase Auth)
-- Note: These users need to be created in Supabase Auth separately
-- For now, we'll create placeholder entries that will be updated when they first login

-- Create function to get auth user by email
CREATE OR REPLACE FUNCTION get_auth_user_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;

-- Enable realtime for products table
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;