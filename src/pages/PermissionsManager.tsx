import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';

interface User {
  id: string;
  name: string;
  username: string;
  role?: string;
  department: string | null;
}

interface Permission {
  id: string;
  user_id: string;
  permission: string;
  department: string | null;
}

const PERMISSION_LABELS: Record<string, string> = {
  view_orders: 'Ver Encomendas',
  create_orders: 'Criar Encomendas',
  edit_orders: 'Editar Encomendas',
  delete_orders: 'Excluir Encomendas',
  approve_orders: 'Aprovar Encomendas',
  reject_orders: 'Rejeitar Encomendas',
  view_products: 'Ver Produtos',
  create_products: 'Criar Produtos',
  edit_products: 'Editar Produtos',
  delete_products: 'Excluir Produtos',
  view_customers: 'Ver Clientes',
  create_customers: 'Criar Clientes',
  edit_customers: 'Editar Clientes',
  delete_customers: 'Excluir Clientes',
  view_users: 'Ver Usuários',
  create_users: 'Criar Usuários',
  edit_users: 'Editar Usuários',
  delete_users: 'Excluir Usuários',
  view_warehouses: 'Ver Armazéns',
  create_warehouses: 'Criar Armazéns',
  edit_warehouses: 'Editar Armazéns',
  delete_warehouses: 'Excluir Armazéns',
  view_reports: 'Ver Relatórios',
  export_data: 'Exportar Dados',
  manage_permissions: 'Gerenciar Permissões',
};

const DEPARTMENTS = ['maputo', 'beira', 'nampula', 'geral'];

export default function PermissionsManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
      if (error) throw error;
      
      // Fetch roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      return usersData.map(user => ({
        ...user,
        role: roleMap.get(user.auth_user_id) || 'vendedor'
      })) as User[];
    },
  });

  const { data: currentPermissions = [] } = useQuery({
    queryKey: ['user-permissions', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', selectedUserId);
      if (error) throw error;
      return data as Permission[];
    },
    enabled: !!selectedUserId,
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error('Selecione um usuário');

      // Delete all current permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUserId);

      // Insert new permissions
      const permissionsToInsert = Array.from(selectedPermissions).map(permission => ({
        user_id: selectedUserId,
        permission: permission as any,
        department: selectedDepartment,
      }));

      if (permissionsToInsert.length > 0) {
        const { error } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Permissões atualizadas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar permissões: ' + error.message);
    },
  });

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    setSelectedDepartment(user?.department || null);
    
    // Load current permissions
    const perms = currentPermissions
      .filter(p => !selectedDepartment || p.department === selectedDepartment)
      .map(p => p.permission);
    setSelectedPermissions(new Set(perms));
  };

  const togglePermission = (permission: string) => {
    const newPerms = new Set(selectedPermissions);
    if (newPerms.has(permission)) {
      newPerms.delete(permission);
    } else {
      newPerms.add(permission);
    }
    setSelectedPermissions(newPerms);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <>
      <SEO 
        title="Gerenciar Permissões - Sistema de Encomendas"
        description="Gerencie permissões granulares de usuários no sistema"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Gerenciar Permissões</h1>
            </div>
          </div>

          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Selecionar Usuário</CardTitle>
              <CardDescription>
                Escolha um usuário para gerenciar suas permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedUserId} onValueChange={handleUserChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        <Badge variant="secondary">{user.role}</Badge>
                        {user.department && (
                          <Badge variant="outline">{user.department}</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedUser && (
            <>
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Departamento</CardTitle>
                  <CardDescription>
                    Defina o escopo das permissões (vazio = todos os departamentos)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={selectedDepartment || 'all'} 
                    onValueChange={(val) => setSelectedDepartment(val === 'all' ? null : val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Departamentos</SelectItem>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept.charAt(0).toUpperCase() + dept.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Permissões</CardTitle>
                  <CardDescription>
                    Selecione as permissões para {selectedUser.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={selectedPermissions.has(key)}
                          onCheckedChange={() => togglePermission(key)}
                        />
                        <label
                          htmlFor={key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={() => savePermissionsMutation.mutate()}
                      disabled={savePermissionsMutation.isPending}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Permissões
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
