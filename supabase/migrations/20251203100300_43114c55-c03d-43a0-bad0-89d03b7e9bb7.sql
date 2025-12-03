-- Fix 1: Order items INSERT policy - restrict to own orders only
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

CREATE POLICY "Users can create items for own orders" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix 2: Restrict users table access
DROP POLICY IF EXISTS "Users are viewable by authenticated" ON users;

CREATE POLICY "Users viewable by admins or self" ON users
  FOR SELECT USING (
    auth.uid() = auth_user_id 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'supervisor'::app_role)
  );

-- Fix 3: Restrict customers table access to relevant users
DROP POLICY IF EXISTS "Customers viewable by authenticated" ON customers;

CREATE POLICY "Customers viewable by relevant users" ON customers
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'supervisor'::app_role)
    OR id IN (
      SELECT customer_id FROM orders 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );