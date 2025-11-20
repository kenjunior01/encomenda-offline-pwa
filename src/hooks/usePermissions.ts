import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export type Permission = 
  | 'view_orders'
  | 'create_orders'
  | 'edit_orders'
  | 'delete_orders'
  | 'approve_orders'
  | 'reject_orders'
  | 'view_products'
  | 'create_products'
  | 'edit_products'
  | 'delete_products'
  | 'view_customers'
  | 'create_customers'
  | 'edit_customers'
  | 'delete_customers'
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'view_warehouses'
  | 'create_warehouses'
  | 'edit_warehouses'
  | 'delete_warehouses'
  | 'view_reports'
  | 'export_data'
  | 'manage_permissions';

export interface UserPermission {
  id: string;
  user_id: string;
  permission: Permission;
  department: string | null;
  created_at: string;
}

export const usePermissions = () => {
  const { profile } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['user-permissions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', profile.id);

      if (error) throw error;
      return data as UserPermission[];
    },
    enabled: !!profile?.id,
  });

  const hasPermission = (permission: Permission, department?: string): boolean => {
    // Admin sempre tem todas as permissões
    if (profile?.role === 'admin') return true;

    return permissions.some(p => 
      p.permission === permission && 
      (!department || !p.department || p.department === department)
    );
  };

  return {
    permissions,
    hasPermission,
    isLoading,
    isAdmin: profile?.role === 'admin',
  };
};
