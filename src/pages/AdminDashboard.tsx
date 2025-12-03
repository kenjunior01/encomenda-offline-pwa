import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { queries, Product, User, Warehouse, Order } from '@/lib/supabase-queries';
import { departmentThemes } from '@/utils/departmentThemes';
import { LogOut, Package, BarChart, Users, Building, Shield } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useNavigate } from 'react-router-dom';
import { ProductImporter } from '@/components/ProductImporter';

export const AdminDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';
  const department = profile?.department;
  const theme = department ? departmentThemes[department] : null;

  useEffect(() => {
    loadData();
  }, [department, isAdmin]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (isAdmin) {
        // Admin vê tudo
        const [allProducts, allOrders, allUsers, allWarehouses] = await Promise.all([
          queries.getProducts(),
          queries.getOrders(),
          queries.getAllUsers(),
          queries.getWarehouses()
        ]);
        
        setProducts(allProducts);
        setOrders(allOrders);
        setUsers(allUsers);
        setWarehouses(allWarehouses);
      } else if (department) {
        // Supervisor vê apenas do seu departamento
        const [departmentProducts, allOrders, allUsers, departmentWarehouses] = await Promise.all([
          queries.getProductsByDepartment(department),
          queries.getOrders(),
          queries.getAllUsers(),
          queries.getWarehousesByDepartment(department)
        ]);
        
        setProducts(departmentProducts);
        setOrders(allOrders);
        setUsers(allUsers);
        setWarehouses(departmentWarehouses);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do sistema",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportOrdersCSV = () => {
    if (orders.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhuma encomenda para exportar",
      });
      return;
    }

    const csvContent = [
      'Data,Cliente,Departamento,Status,Total',
      ...orders.map(order => {
        const date = new Date(order.created_at).toLocaleDateString('pt-BR');
        return `${date},"${order.customer?.name || 'Cliente não informado'}",${order.department},${order.status},${order.total}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `encomendas_${department || 'todas'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <SEO 
        title={`${isAdmin ? 'Admin Geral' : `Admin - ${theme?.name}`} | Encomendas PWA`} 
        description="Gerencie produtos, usuários e relatórios do sistema." 
      />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`${theme?.gradient || 'bg-gradient-to-r from-primary to-primary/80'} ${theme?.shadow || 'shadow-lg'} rounded-lg p-6 mb-6 animate-fade-in`}>
          <div className="flex justify-between items-center text-white">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {theme?.icon || '⚙️'} {isAdmin ? 'Admin Geral' : `Admin - ${theme?.name}`}
              </h1>
              <p className="opacity-90">
                {isAdmin ? 'Gerencie todo o sistema' : 'Gerencie produtos, usuários e relatórios'}
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button variant="secondary" onClick={() => navigate('/permissoes')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Permissões
                </Button>
              )}
              <Button variant="secondary" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{products.length}</div>
                  <div className="text-sm text-muted-foreground">Produtos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{users.length}</div>
                  <div className="text-sm text-muted-foreground">Usuários</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Building className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{warehouses.length}</div>
                  <div className="text-sm text-muted-foreground">Armazéns</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <div className="text-sm text-muted-foreground">Encomendas</div>
                </CardContent>
              </Card>
            </div>

            {/* Últimas Encomendas */}
            <Card>
              <CardHeader>
                <CardTitle>Últimas Encomendas</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {orders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">#{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{order.department}</Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            R$ {order.total.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant={
                          order.status === 'pendente' ? 'secondary' :
                          order.status === 'aprovado' ? 'default' : 
                          order.status === 'concluido' ? 'default' : 'destructive'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma encomenda registrada ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lista de Produtos */}
          <TabsContent value="products" className="space-y-6">
            {isAdmin && <ProductImporter />}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos Cadastrados ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.id} className="flex justify-between items-start p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{product.name}</h4>
                            <Badge variant="outline">{product.department}</Badge>
                            {!product.active && <Badge variant="destructive">Inativo</Badge>}
                          </div>
                          {product.description && (
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          )}
                          {product.price > 0 && (
                            <p className="text-sm font-medium">R$ {product.price.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">Nenhum produto cadastrado</h3>
                    <p className="text-sm">
                      Os produtos aparecerão aqui quando forem adicionados ao sistema.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lista de Usuários */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários Cadastrados ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex justify-between items-start p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{user.name}</h4>
                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'supervisor' ? 'secondary' : 'outline'}>
                              {user.role}
                            </Badge>
                            {user.department && <Badge variant="outline">{user.department}</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Email: {user.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">Nenhum usuário cadastrado</h3>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Relatórios de Encomendas
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportOrdersCSV}>
                    <BarChart className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold">{orders.length}</div>
                          <div className="text-sm text-muted-foreground">Total de Encomendas</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold">
                            {orders.filter(o => o.status === 'pendente').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Pendentes</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold">
                            R$ {orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Vendas</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {orders.map((order) => (
                        <div key={order.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">
                                Encomenda #{order.id.slice(0, 8)}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">{order.department}</Badge>
                              <Badge variant={
                                order.status === 'pendente' ? 'secondary' :
                                order.status === 'aprovado' ? 'default' : 
                                order.status === 'concluido' ? 'default' : 'destructive'
                              }>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm">
                            <strong>Cliente:</strong> {order.customer?.name || 'Não informado'}
                          </div>
                          <div className="text-sm">
                            <strong>Total:</strong> R$ {order.total.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">Nenhuma encomenda registrada</h3>
                    <p className="text-sm">
                      As encomendas aparecerão aqui quando os vendedores começarem a usar o sistema.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};