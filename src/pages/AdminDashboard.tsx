import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db, Product, Order } from '@/lib/database';
import { departmentThemes } from '@/utils/departmentThemes';
import { importProductsFromFile, validateProductsData } from '@/utils/excelImport';
import { Upload, LogOut, Package, BarChart, Download } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Estados para cadastro manual
  const [manualProduct, setManualProduct] = useState({
    name: '',
    code: '',
    category: '',
    quantity: '',
    price: '',
    unidadesPorCaixa: '',
    embalagensPorCaixa: '',
  });
  const [isSavingManual, setIsSavingManual] = useState(false);

  const department = user?.department!;
  const theme = departmentThemes[department];

  useEffect(() => {
    loadData();
  }, [department]);

  const loadData = async () => {
    // Carregar produtos do departamento
    const departmentProducts = await db.products
      .where('department')
      .equals(department)
      .toArray();
    setProducts(departmentProducts);

    // Carregar encomendas do departamento
    const departmentOrders = await db.orders
      .where('department')
      .equals(department)
      .reverse()
      .toArray();
    setOrders(departmentOrders);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Erro",
        description: "Arquivo deve ser .csv, .xlsx ou .xls",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const newProducts = await importProductsFromFile(file, department);
      const errors = validateProductsData(newProducts);

      if (errors.length > 0) {
        toast({
          title: "Erro na validação",
          description: errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // Remover produtos existentes do departamento
      await db.products.where('department').equals(department).delete();

      // Adicionar novos produtos
      await db.products.bulkAdd(newProducts);

      await loadData();

      toast({
        title: "Sucesso!",
        description: `${newProducts.length} produtos importados`,
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Limpar input
      event.target.value = '';
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
      'Data,Vendedor,Cliente,Produtos,Status',
      ...orders.map(order => 
        `${order.createdAt.toLocaleDateString('pt-BR')},${order.vendorName},"Cliente ID: ${order.customerId}","${order.products.map(p => `${p.productName} (${p.quantity})`).join('; ')}",${order.status}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `encomendas_${department}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProduct.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do produto é obrigatório.',
        variant: 'destructive',
      });
      return;
    }
    setIsSavingManual(true);
    try {
      const newProduct: Product = {
        name: manualProduct.name.trim(),
        code: manualProduct.code || undefined,
        category: manualProduct.category || undefined,
        quantity: manualProduct.quantity ? Number(manualProduct.quantity) : undefined,
        price: manualProduct.price ? Number(manualProduct.price) : undefined,
        unidadesPorCaixa: manualProduct.unidadesPorCaixa ? Number(manualProduct.unidadesPorCaixa) : undefined,
        embalagensPorCaixa: manualProduct.embalagensPorCaixa ? Number(manualProduct.embalagensPorCaixa) : undefined,
        department,
        createdAt: new Date(),
      };
      await db.products.add(newProduct);
      setManualProduct({ name: '', code: '', category: '', quantity: '', price: '', unidadesPorCaixa: '', embalagensPorCaixa: '' });
      await loadData();
      toast({
        title: 'Produto cadastrado',
        description: `Produto "${newProduct.name}" adicionado com sucesso!`,
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar o produto.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`${theme.gradient} ${theme.shadow} rounded-lg p-6 mb-6`}>
          <div className="flex justify-between items-center text-white">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {theme.icon} Admin - {theme.name}
              </h1>
              <p className="opacity-90">
                Gerencie produtos e visualize relatórios
              </p>
            </div>
            <Button variant="secondary" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Gerenciamento de Produtos */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cadastro manual de produto */}
                <form onSubmit={handleManualSubmit} className="mb-6 border rounded-lg p-4 flex flex-col md:flex-row md:items-end gap-4 bg-muted/30">
                  <Input
                    name="name"
                    placeholder="Nome do produto *"
                    value={manualProduct.name}
                    onChange={handleManualInput}
                    required
                    className="md:w-1/5"
                  />
                  <Input
                    name="code"
                    placeholder="Código"
                    value={manualProduct.code}
                    onChange={handleManualInput}
                    className="md:w-1/6"
                  />
                  <Input
                    name="category"
                    placeholder="Categoria"
                    value={manualProduct.category}
                    onChange={handleManualInput}
                    className="md:w-1/6"
                  />
                  <Input
                    name="quantity"
                    placeholder="Quantidade"
                    type="number"
                    min="0"
                    value={manualProduct.quantity}
                    onChange={handleManualInput}
                    className="md:w-1/6"
                  />
                  <Input
                    name="price"
                    placeholder="Preço"
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualProduct.price}
                    onChange={handleManualInput}
                    className="md:w-1/6"
                  />
                  <Input
                    name="unidadesPorCaixa"
                    placeholder="Unidades por caixa"
                    type="number"
                    min="0"
                    value={manualProduct.unidadesPorCaixa}
                    onChange={handleManualInput}
                    className="md:w-1/6"
                  />
                  <Input
                    name="embalagensPorCaixa"
                    placeholder="Embalagens por caixa"
                    type="number"
                    min="0"
                    value={manualProduct.embalagensPorCaixa}
                    onChange={handleManualInput}
                    className="md:w-1/6"
                  />
                  <Button type="submit" disabled={isSavingManual} className="md:w-1/6">
                    {isSavingManual ? 'Salvando...' : 'Adicionar'}
                  </Button>
                </form>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Upload de Produtos</h3>
                  <p className="text-muted-foreground mb-4">
                    Faça upload de um arquivo .csv ou .xlsx com os produtos
                  </p>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="max-w-xs mx-auto"
                  />
                  {isUploading && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Processando arquivo...
                    </p>
                  )}
                </div>

                {/* Lista de Produtos */}
                <div className="max-h-96 overflow-y-auto">
                  {products.length > 0 ? (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <div key={product.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            {product.code && (
                              <span className="text-sm text-muted-foreground">
                                Código: {product.code}
                              </span>
                            )}
                          </div>
                          {product.quantity && (
                            <span className="text-sm bg-muted px-2 py-1 rounded">
                              Qtd: {product.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum produto cadastrado. Faça upload de um arquivo.
                    </div>
                  )}
                </div>
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
                    <Download className="h-4 w-4 mr-2" />
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
                            {new Set(orders.map(o => o.vendorId)).size}
                          </div>
                          <div className="text-sm text-muted-foreground">Vendedores Ativos</div>
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
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {orders.map((order) => (
                        <div key={order.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">
                                Encomenda #{order.id}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {order.createdAt.toLocaleDateString('pt-BR')} - {order.vendorName}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-sm">
                            <strong>Produtos:</strong> {order.products.map(p => 
                              `${p.productName} (${p.quantity})`
                            ).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma encomenda registrada ainda.
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