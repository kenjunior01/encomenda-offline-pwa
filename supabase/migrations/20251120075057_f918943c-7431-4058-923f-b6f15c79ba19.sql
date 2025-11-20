-- Create permissions system for granular access control

-- Create enum for permission types
CREATE TYPE public.permission_type AS ENUM (
  'view_orders',
  'create_orders',
  'edit_orders',
  'delete_orders',
  'approve_orders',
  'reject_orders',
  'view_products',
  'create_products',
  'edit_products',
  'delete_products',
  'view_customers',
  'create_customers',
  'edit_customers',
  'delete_customers',
  'view_users',
  'create_users',
  'edit_users',
  'delete_users',
  'view_warehouses',
  'create_warehouses',
  'edit_warehouses',
  'delete_warehouses',
  'view_reports',
  'export_data',
  'manage_permissions'
);

-- Create user_permissions table
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission permission_type NOT NULL,
  department TEXT, -- null means all departments
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id),
  UNIQUE(user_id, permission, department)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id UUID,
  _permission permission_type,
  _department TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions up
    JOIN public.users u ON u.id = up.user_id
    WHERE up.user_id = _user_id
      AND up.permission = _permission
      AND (up.department IS NULL OR up.department = _department OR u.role = 'admin')
  ) OR EXISTS (
    SELECT 1 FROM public.users WHERE id = _user_id AND role = 'admin'
  )
$$;

-- RLS Policies for user_permissions
CREATE POLICY "Admins can manage all permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- Insert default permissions for existing users
-- Admin gets all permissions
INSERT INTO public.user_permissions (user_id, permission, department)
SELECT u.id, p.permission, NULL
FROM public.users u
CROSS JOIN (
  SELECT unnest(enum_range(NULL::permission_type)) as permission
) p
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;

-- Supervisors get management permissions for their department
INSERT INTO public.user_permissions (user_id, permission, department)
SELECT u.id, p.permission, u.department
FROM public.users u
CROSS JOIN (
  VALUES 
    ('view_orders'::permission_type),
    ('create_orders'::permission_type),
    ('edit_orders'::permission_type),
    ('approve_orders'::permission_type),
    ('reject_orders'::permission_type),
    ('view_products'::permission_type),
    ('edit_products'::permission_type),
    ('view_customers'::permission_type),
    ('create_customers'::permission_type),
    ('view_reports'::permission_type),
    ('export_data'::permission_type)
) p(permission)
WHERE u.role = 'supervisor'
ON CONFLICT DO NOTHING;

-- Sellers get basic permissions for their department
INSERT INTO public.user_permissions (user_id, permission, department)
SELECT u.id, p.permission, u.department
FROM public.users u
CROSS JOIN (
  VALUES 
    ('view_orders'::permission_type),
    ('create_orders'::permission_type),
    ('view_products'::permission_type),
    ('view_customers'::permission_type),
    ('create_customers'::permission_type)
) p(permission)
WHERE u.role = 'vendedor'
ON CONFLICT DO NOTHING;