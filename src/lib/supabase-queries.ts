import { supabase } from '@/integrations/supabase/client';

// Types based on database schema
export interface User {
  id: string;
  auth_user_id: string;
  username: string;
  name: string;
  role: 'admin' | 'supervisor' | 'vendedor';
  department: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  department: string;
  warehouse_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  department: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id?: string;
  user_id: string;
  department: string;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'entregue';
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  created_by?: string;
  created_at: string;
  expires_at?: string;
}

// Query functions
export const queries = {
  // Users
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    return data;
  },

  async getAllUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    return data || [];
  },

  // Products
  async getProducts() {
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        warehouse:warehouses(*)
      `)
      .eq('active', true)
      .order('name');
    
    return data || [];
  },

  async getProductsByDepartment(department: string) {
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        warehouse:warehouses(*)
      `)
      .eq('department', department)
      .eq('active', true)
      .order('name');
    
    return data || [];
  },

  // Warehouses
  async getWarehouses() {
    const { data } = await supabase
      .from('warehouses')
      .select('*')
      .order('name');
    
    return data || [];
  },

  async getWarehousesByDepartment(department: string) {
    const { data } = await supabase
      .from('warehouses')
      .select('*')
      .eq('department', department)
      .order('name');
    
    return data || [];
  },

  // Customers
  async getCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    return data || [];
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>) {
    const { data } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
    
    return data;
  },

  // Orders
  async getOrders() {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_items(
          *,
          product:products(*)
        )
      `)
      .order('created_at', { ascending: false });
    
    return data || [];
  },

  async createOrder(order: {
    customer_id?: string;
    department: string;
    total: number;
    notes?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      price: number;
    }>;
  }) {
    const currentUser = await queries.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: order.customer_id,
        user_id: currentUser.id,
        department: order.department,
        total: order.total,
        notes: order.notes
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = order.items.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: Order['status']) {
    const { data } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    
    return data;
  },

  // Announcements
  async getAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false });
    
    return data || [];
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at' | 'created_by'>) {
    const currentUser = await queries.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const { data } = await supabase
      .from('announcements')
      .insert([{
        ...announcement,
        created_by: currentUser.id
      }])
      .select()
      .single();
    
    return data;
  }
};