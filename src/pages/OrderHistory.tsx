import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { db, Order, Customer } from '@/lib/database';
import { departmentThemes } from '@/utils/departmentThemes';
import { ArrowLeft, History, Calendar, User, Package } from 'lucide-react';
import { SEO } from '@/components/SEO';

export const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Map<number, Customer>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      // Carregar encomendas do vendedor
      const vendorOrders = await db.orders
        .where('vendorId')
        .equals(user.id!)
        .reverse()
        .toArray();

      setOrders(vendorOrders);

      // Carregar dados dos clientes
      const customerIds = [...new Set(vendorOrders.map(o => o.customerId))];
      const customersData = await db.customers
        .where('id')
        .anyOf(customerIds)
        .toArray();

      const customersMap = new Map();
      customersData.forEach(customer => {
        customersMap.set(customer.id!, customer);
      });
      setCustomers(customersMap);

    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <SEO title="Histórico de Encomendas | Encomendas PWA" description="Visualize todas as suas encomendas anteriores." />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <History className="h-6 w-6" />
                  Meu Histórico de Encomendas
                </CardTitle>
                <p className="text-muted-foreground">
                  {orders.length} encomendas registradas
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Lista de Encomendas */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const customer = customers.get(order.customerId);
              const theme = departmentThemes[order.department];
              
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{theme.icon}</span>
                          <h3 className="font-semibold text-lg">
                            Encomenda #{order.id}
                          </h3>
                          <Badge 
                            variant={order.status === 'confirmado' ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {order.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {order.createdAt.toLocaleDateString('pt-BR')} às {' '}
                              {order.createdAt.toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>

                          {customer && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{customer.name} - {customer.phone}</span>
                            </div>
                          )}

                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <div className="font-medium">{theme.name}</div>
                              <div className="text-muted-foreground">
                                {order.products.map(p => 
                                  `${p.productName} (${p.quantity})`
                                ).join(', ')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline">
                          {order.products.reduce((total, p) => total + p.quantity, 0)} itens
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                Nenhuma encomenda registrada
              </h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não fez nenhuma encomenda
              </p>
              <Button onClick={() => navigate('/')}>
                Criar primeira encomenda
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};