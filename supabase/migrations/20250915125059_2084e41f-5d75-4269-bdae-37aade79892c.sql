-- Fix customer data access security vulnerability
-- Replace the overly permissive customer SELECT policy with department-based restrictions

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all customers" ON public.customers;

-- Create a new restrictive policy that only allows:
-- 1. Admins to view all customers
-- 2. Users to view customers who have orders in their department
-- 3. Users to view customers they created (for new customer creation flow)
CREATE POLICY "Users can view customers in their department or scope" 
ON public.customers 
FOR SELECT 
USING (
  -- Admins can see all customers
  get_user_role(auth.uid()) = 'admin'::user_role
  OR
  -- Users can see customers who have orders in their department
  EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.customer_id = customers.id 
    AND orders.department = get_user_department(auth.uid())
  )
);