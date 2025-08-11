import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db, Product, Order } from '@/lib/database';
import { departmentThemes } from '@/utils/departmentThemes';
import { importProductsFromFile, validateProductsData, downloadCSVTemplate } from '@/utils/excelImport';
import { Upload, LogOut, Package, BarChart, Download, Plus, Trash2, Info } from 'lucide-react';
import { SEO } from '@/components/SEO';

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
    try {
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
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do sistema",
        variant: "destructive",
      });
    }
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
        code: manualProduct.code.trim() || undefined,
        category: manualProduct.category.trim() || undefined,
        quantity: manualProduct.quantity ? Number(manualProduct.quantity) : undefined,
        price: manualProduct.price ? Number(manualProduct.price) : undefined,
        unidadesPorCaixa: manualProduct.unidadesPorCaixa ? Number(manualProduct.unidadesPorCaixa) : undefined,
        embalagensPorCaixa: manualProduct.embalagensPorCaixa ? Number(manualProduct.embalagensPorCaixa) : undefined,
        department,
        createdAt: new Date(),
      };

      await db.products.add(newProduct);
      
      // Limpar formulário
      setManualProduct({ 
        name: '', 
        code: '', 
        category: '', 
        quantity: '', 
        price: '', 
        unidadesPorCaixa: '', 
        embalagensPorCaixa: '' 
      });
      
      await loadData();
      
      toast({
        title: 'Produto cadastrado',
        description: `Produto "${newProduct.name}" adicionado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar o produto.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingManual(false);
    }
  };

  const deleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${productName}"?`)) {
      return;
    }

    try {
      await db.products.delete(productId);
      await loadData();
      toast({
        title: "Produto excluído",
        description: `"${productName}" foi removido com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <SEO title={`Admin - ${theme.name} | Encomendas PWA`} description="Gerencie produtos e relatórios do departamento." />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`${theme.gradient} ${theme.shadow} rounded-lg p-6 mb-6 animate-fade-in`}>
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
          <TabsContent value="products" className="space-y-6">
            {/* Instruções */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Como adicionar produtos:</strong>
                <br />
                1. <strong>Cadastro Manual:</strong> Preencha o formulário abaixo e clique em "Adicionar Produto"
                <br />
                2. <strong>Upload de Arquivo:</strong> Baixe o template, preencha com seus produtos e faça upload
                <br />
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={downloadCSVTemplate}
                  className="p-0 h-auto text-primary underline"
                >
                  📥 Baixar Template CSV
                </Button>
              </AlertDescription>
            </Alert>

            {/* Cadastro Manual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Cadastro Manual de Produto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Geladeira Frost Free 400L"
                        value={manualProduct.name}
                        onChange={handleManualInput}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="code">Código</Label>
                      <Input
                        id="code"
                        name="code"
                        placeholder="Ex: EL001"
                        value={manualProduct.code}
                        onChange={handleManualInput}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Input
                        id="category"
                        name="category"
                        placeholder="Ex: Refrigeração"
                        value={manualProduct.category}
                        onChange={handleManualInput}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade em Estoque</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="0"
                        placeholder="Ex: 50"
                        value={manualProduct.quantity}
                        onChange={handleManualInput}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 1299.99"
                        value={manualProduct.price}
                        onChange={handleManualInput}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unidadesPorCaixa">Unidades por Caixa</Label>
                      <Input
                        id="unidadesPorCaixa"
                        name="unidadesPorCaixa"
                        type="number"
                        min="0"
                        placeholder="Ex: 12"
                        value={manualProduct.unidadesPorCaixa}
                        onChange={handleManualInput}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="embalagensPorCaixa">Embalagens por Caixa</Label>
                      <Input
                        id="embalagensPorCaixa"
                        name="embalagensPorCaixa"
                        type="number"
                        min="0"
                        placeholder="Ex: 6"
                        value={manualProduct.embalagensPorCaixa}
                        onChange={handleManualInput}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSavingManual} className="min-w-[150px]">
                      <Plus className="h-4 w-4 mr-2" />
                      {isSavingManual ? 'Salvando...' : 'Adicionar Produto'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Upload de Arquivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload de Produtos em Lote
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">📋 Formato do Arquivo:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Seu arquivo deve conter as seguintes colunas (em qualquer ordem):
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>name</strong> ou <strong>Nome</strong> - Nome do produto (obrigatório)</li>
                    <li>• <strong>code</strong> ou <strong>Codigo</strong> - Código do produto (opcional)</li>
                    <li>• <strong>category</strong> ou <strong>Categoria</strong> - Categoria (opcional)</li>
                    <li>• <strong>quantity</strong> ou <strong>Quantidade</strong> - Estoque (opcional)</li>
                    <li>• <strong>price</strong> ou <strong>Preco</strong> - Preço (opcional)</li>
                    <li>• <strong>unidadesPorCaixa</strong> - Unidades por caixa (opcional)</li>
                    <li>• <strong>embalagensPorCaixa</strong> - Embalagens por caixa (opcional)</li>
                  </ul>
                  <div className="mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadCSVTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Template
                    </Button>
                  </div>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Upload de Produtos</h3>
                  <p className="text-muted-foreground mb-4">
                    Selecione um arquivo .csv ou .xlsx com seus produtos
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
              </CardContent>
            </Card>

            {/* Lista de Produtos */}
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
                          <h4 className="font-medium text-lg">{product.name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-muted-foreground">
                            {product.code && (
                              <span><strong>Código:</strong> {product.code}</span>
                            )}
                            {product.category && (
                              <span><strong>Categoria:</strong> {product.category}</span>
                            )}
                            {product.quantity !== undefined && (
                              <span><strong>Estoque:</strong> {product.quantity}</span>
                            )}
                            {product.price !== undefined && (
                              <span><strong>Preço:</strong> R$ {product.price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product.id!, product.name)}
                          className="text-destructive hover:text-destructive ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">Nenhum produto cadastrado</h3>
                    <p className="text-sm">
                      Use o formulário acima ou faça upload de um arquivo para adicionar produtos.
                    </p>
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