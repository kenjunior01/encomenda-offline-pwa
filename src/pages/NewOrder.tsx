import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ProductSelector } from '@/components/ProductSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db, Customer, Order } from '@/lib/database';
import { DepartmentType, departmentThemes } from '@/utils/departmentThemes';
import { downloadOrderPDF } from '@/utils/pdfGenerator';
import { ArrowLeft, User, Phone, MapPin, Download } from 'lucide-react';
import { SEO } from '@/components/SEO';

export const NewOrder: React.FC = () => {
  const { department } = useParams<{ department: DepartmentType }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    location: ''
  });

  const [selectedProducts, setSelectedProducts] = useState<
    { productId: number; productName: string; quantity: number }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!department || !departmentThemes[department]) {
    navigate('/');
    return null;
  }

  const theme = departmentThemes[department];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um produto",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar ou encontrar cliente
      let customer = await db.customers
        .where('phone')
        .equals(customerData.phone)
        .first();

      if (!customer) {
        const customerId = await db.customers.add({
          name: customerData.name,
          phone: customerData.phone,
          location: customerData.location
        });
        customer = await db.customers.get(customerId);
      } else {
        // Atualizar dados do cliente se necessário
        await db.customers.update(customer.id!, {
          name: customerData.name,
          location: customerData.location
        });
        customer = { ...customer, name: customerData.name, location: customerData.location };
      }

      // Criar encomenda
      const orderId = await db.orders.add({
        customerId: customer.id!,
        vendorId: user!.id!,
        vendorName: user!.username,
        department,
        products: selectedProducts,
        status: 'pendente',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const order = await db.orders.get(orderId);
      
      // Buscar produtos para o PDF
      const products = await db.products
        .where('id')
        .anyOf(selectedProducts.map(p => p.productId))
        .toArray();

      // Gerar PDF
      if (order && customer) {
        await downloadOrderPDF(order, customer, products);
      }

      toast({
        title: "Encomenda criada!",
        description: "PDF gerado com sucesso",
      });

      // Voltar para o dashboard
      navigate('/');

    } catch (error) {
      console.error('Erro ao criar encomenda:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar encomenda",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <SEO title={`Nova Encomenda - ${theme.name} | Encomendas PWA`} description="Crie uma nova encomenda e gere o PDF automaticamente." />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`${theme.gradient} ${theme.shadow} rounded-lg p-6 mb-6`}>
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="text-white">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {theme.icon} Nova Encomenda - {theme.name}
              </h1>
              <p className="opacity-90">
                Preencha os dados do cliente e selecione os produtos
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome do cliente"
                    className="text-base min-h-[44px]"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-medium">Telefone *</Label>
                  <div className="relative">
                    <Phone className="h-5 w-5 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="pl-12 text-base min-h-[44px]"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-base font-medium">Localização *</Label>
                  <div className="relative">
                    <MapPin className="h-5 w-5 absolute left-3 top-3 text-muted-foreground" />
                    <Textarea
                      id="location"
                      value={customerData.location}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Endereço completo ou ponto de referência"
                      className="pl-12 text-base min-h-[88px] resize-none"
                      required
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Produtos - Livro de Encomendas */}
          <ProductSelector
            department={department}
            onProductsChange={setSelectedProducts}
          />

          {/* Botões de Ação - Mobile Otimizado */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedProducts.length === 0}
              className="flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2 min-h-[44px] text-base font-medium"
              size="lg"
              variant="premium"
            >
              <Download className="h-5 w-5" />
              {isSubmitting ? 'Criando...' : 'Criar Encomenda & Gerar PDF'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};