import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db, Product, Order, User, Warehouse } from '@/lib/database';
import { departmentThemes } from '@/utils/departmentThemes';
import { importProductsFromFile, validateProductsData, downloadCSVTemplate } from '@/utils/excelImport';
import { Upload, LogOut, Package, BarChart, Download, Plus, Trash2, Info, Users, Building, UserPlus } from 'lucide-react';
import { SEO } from '@/components/SEO';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Estados para cadastro manual de produto
  const [manualProduct, setManualProduct] = useState({
    name: '',
    code: '',
    category: '',
    quantity: '',
    price: '',
    piecesPerBox: '',
  });
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Estados para cadastro de usuário
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'vendedor' as 'vendedor' | 'supervisor',
    department: 'eletrodomesticos' as 'eletrodomesticos' | 'alimentacao' | 'cosmeticos',
    supervisorId: ''
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Estados para cadastro de armazém
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    department: 'eletrodomesticos' as 'eletrodomesticos' | 'alimentacao' | 'cosmeticos',
    address: ''
  });
  const [isSavingWarehouse, setIsSavingWarehouse] = useState(false);

  const isAdmin = user?.role === 'admin';
  const department = user?.department;
  const theme = department ? departmentThemes[department] : null;

  useEffect(() => {
    loadData();
  }, [department, isAdmin]);

  const loadData = async () => {
    try {
      if (isAdmin) {
        // Admin vê tudo
        const allProducts = await db.products.toArray();
        const allOrders = await db.orders.reverse().toArray();
        const allUsers = await db.users.toArray();
        const allWarehouses = await db.warehouses.toArray();
        
        setProducts(allProducts);
        setOrders(allOrders);
        setUsers(allUsers);
        setWarehouses(allWarehouses);
      } else if (department) {
        // Supervisor vê apenas do seu departamento
        const departmentProducts = await db.products
          .where('department')
          .equals(department)
          .toArray();
        const departmentOrders = await db.orders
          .where('department')
          .equals(department)
          .reverse()
          .toArray();
        const departmentUsers = await db.users
          .where('department')
          .equals(department)
          .toArray();
        const departmentWarehouses = await db.warehouses
          .where('department')
          .equals(department)
          .toArray();
        
        setProducts(departmentProducts);
        setOrders(departmentOrders);
        setUsers(departmentUsers);
        setWarehouses(departmentWarehouses);
      }
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

    if (!department && !isAdmin) {
      toast({
        title: "Erro",
        description: "Departamento não definido",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const targetDepartment = department || 'eletrodomesticos';
      const newProducts = await importProductsFromFile(file, targetDepartment);
      const errors = validateProductsData(newProducts);

      if (errors.length > 0) {
        toast({
          title: "Erro na validação",
          description: errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // Se não for admin, remover produtos existentes do departamento
      if (!isAdmin && department) {
        await db.products.where('department').equals(department).delete();
      }

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
      event.target.value = '';
    }
  };

  const handleManualProductSubmit = async (e: React.FormEvent) => {
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
      const targetDepartment = department || 'eletrodomesticos';
      
      const newProduct: Product = {
        name: manualProduct.name.trim(),
        code: manualProduct.code.trim() || undefined,
        category: manualProduct.category.trim() || undefined,
        quantity: manualProduct.quantity ? Number(manualProduct.quantity) : undefined,
        price: manualProduct.price ? Number(manualProduct.price) : undefined,
        piecesPerBox: manualProduct.piecesPerBox ? Number(manualProduct.piecesPerBox) : undefined,
        department: targetDepartment,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.products.add(newProduct);
      
      // Limpar formulário
      setManualProduct({ 
        name: '', 
        code: '', 
        category: '', 
        quantity: '', 
        price: '', 
        piecesPerBox: '' 
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

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username.trim() || !newUser.password.trim()) {
      toast({
        title: 'Erro',
        description: 'Username e senha são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se username já existe
    const existingUser = await db.users.where('username').equals(newUser.username.trim()).first();
    if (existingUser) {
      toast({
        title: 'Erro',
        description: 'Este username já está em uso.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingUser(true);
    
    try {
      const userData: User = {
        username: newUser.username.trim(),
        password: newUser.password,
        role: newUser.role,
        department: newUser.department,
        supervisorId: newUser.supervisorId ? Number(newUser.supervisorId) : undefined,
        createdAt: new Date(),
      };

      await db.users.add(userData);
      
      // Limpar formulário
      setNewUser({
        username: '',
        password: '',
        role: 'vendedor',
        department: 'eletrodomesticos',
        supervisorId: ''
      });
      
      await loadData();
      
      toast({
        title: 'Usuário cadastrado',
        description: `Usuário "${userData.username}" criado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWarehouse.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do armazém é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingWarehouse(true);
    
    try {
      const warehouseData: Warehouse = {
        name: newWarehouse.name.trim(),
        department: newWarehouse.department,
        address: newWarehouse.address.trim() || undefined,
        active: true,
        createdAt: new Date(),
      };

      await db.warehouses.add(warehouseData);
      
      // Limpar formulário
      setNewWarehouse({
        name: '',
        department: 'eletrodomesticos',
        address: ''
      });
      
      await loadData();
      
      toast({
        title: 'Armazém cadastrado',
        description: `Armazém "${warehouseData.name}" criado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao cadastrar armazém:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar o armazém.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingWarehouse(false);
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

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) {
      return;
    }

    try {
      await db.users.delete(userId);
      await loadData();
      toast({
        title: "Usuário excluído",
        description: `"${username}" foi removido com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
        variant: "destructive",
      });
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
      'Data,Vendedor,Cliente,Departamento,Armazem,Caixas,Pecas,Status',
      ...orders.map(order => {
        const totalBoxes = order.items.reduce((sum, item) => sum + item.boxes, 0);
        const totalPieces = order.items.reduce((sum, item) => sum + item.pieces, 0);
        return `${order.orderDate.toLocaleDateString('pt-BR')},${order.vendorName},"Cliente ID: ${order.customerId}",${order.department},${order.warehouseName},${totalBoxes},${totalPieces},${order.status}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `encomendas_${department || 'todas'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const supervisors = users.filter(u => u.role === 'supervisor');

  return (
    <div className="min-h-screen bg-background p-4">
      <SEO title={`${isAdmin ? 'Admin Geral' : `Admin - ${theme?.name}`} | Encomendas PWA`} description="Gerencie produtos, usuários e relatórios do sistema." />
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
            <Button variant="secondary" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="warehouses">Armazéns</TabsTrigger>
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
                1. <strong>Cadastro Manual:</strong> Preencha o formulário abaixo
                <br />
                2. <strong>Upload de Arquivo:</strong> Baixe o template, preencha e faça upload
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
                <form onSubmit={handleManualProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Geladeira Frost Free 400L"
                        value={manualProduct.name}
                        onChange={(e) => setManualProduct(prev => ({ ...prev, name: e.target.value }))}
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
                        onChange={(e) => setManualProduct(prev => ({ ...prev, code: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Input
                        id="category"
                        name="category"
                        placeholder="Ex: Refrigeração"
                        value={manualProduct.category}
                        onChange={(e) => setManualProduct(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="piecesPerBox">Peças por Caixa</Label>
                      <Input
                        id="piecesPerBox"
                        name="piecesPerBox"
                        type="number"
                        min="1"
                        placeholder="Ex: 12"
                        value={manualProduct.piecesPerBox}
                        onChange={(e) => setManualProduct(prev => ({ ...prev, piecesPerBox: e.target.value }))}
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
                        onChange={(e) => setManualProduct(prev => ({ ...prev, quantity: e.target.value }))}
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
                        onChange={(e) => setManualProduct(prev => ({ ...prev, price: e.target.value }))}
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
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{product.name}</h4>
                            <Badge variant="outline">{product.department}</Badge>
                            {!product.active && <Badge variant="destructive">Inativo</Badge>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            {product.code && (
                              <span><strong>Código:</strong> {product.code}</span>
                            )}
                            {product.category && (
                              <span><strong>Categoria:</strong> {product.category}</span>
                            )}
                            {product.piecesPerBox && (
                              <span><strong>Peças/Caixa:</strong> {product.piecesPerBox}</span>
                            )}
                            {product.quantity !== undefined && (
                              <span><strong>Estoque:</strong> {product.quantity}</span>
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

          {/* Gerenciamento de Usuários */}
          <TabsContent value="users" className="space-y-6">
            {/* Cadastro de Usuário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Cadastrar Novo Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Ex: vendedor4"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Senha do usuário"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Função *</Label>
                      <Select value={newUser.role} onValueChange={(value: 'vendedor' | 'supervisor') => setNewUser(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          {isAdmin && <SelectItem value="supervisor">Supervisor</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">Departamento *</Label>
                      <Select value={newUser.department} onValueChange={(value: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos') => setNewUser(prev => ({ ...prev, department: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eletrodomesticos">Eletrodomésticos</SelectItem>
                          <SelectItem value="alimentacao">Alimentação</SelectItem>
                          <SelectItem value="cosmeticos">Cosméticos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newUser.role === 'vendedor' && supervisors.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="supervisor">Supervisor</Label>
                        <Select value={newUser.supervisorId} onValueChange={(value) => setNewUser(prev => ({ ...prev, supervisorId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um supervisor" />
                          </SelectTrigger>
                          <SelectContent>
                            {supervisors
                              .filter(s => s.department === newUser.department)
                              .map((supervisor) => (
                                <SelectItem key={supervisor.id} value={supervisor.id!.toString()}>
                                  {supervisor.username}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSavingUser} className="min-w-[150px]">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isSavingUser ? 'Salvando...' : 'Cadastrar Usuário'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Usuários */}
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
                            <h4 className="font-medium text-lg">{user.username}</h4>
                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'supervisor' ? 'secondary' : 'outline'}>
                              {user.role}
                            </Badge>
                            {user.department && <Badge variant="outline">{user.department}</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Criado em: {user.createdAt.toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        {user.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUser(user.id!, user.username)}
                            className="text-destructive hover:text-destructive ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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

          {/* Gerenciamento de Armazéns */}
          <TabsContent value="warehouses" className="space-y-6">
            {/* Cadastro de Armazém */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Cadastrar Novo Armazém
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="warehouseName">Nome do Armazém *</Label>
                      <Input
                        id="warehouseName"
                        value={newWarehouse.name}
                        onChange={(e) => setNewWarehouse(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Armazém Central Norte"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="warehouseDepartment">Departamento *</Label>
                      <Select value={newWarehouse.department} onValueChange={(value: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos') => setNewWarehouse(prev => ({ ...prev, department: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eletrodomesticos">Eletrodomésticos</SelectItem>
                          <SelectItem value="alimentacao">Alimentação</SelectItem>
                          <SelectItem value="cosmeticos">Cosméticos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="warehouseAddress">Endereço</Label>
                    <Input
                      id="warehouseAddress"
                      value={newWarehouse.address}
                      onChange={(e) => setNewWarehouse(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Endereço completo do armazém"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSavingWarehouse} className="min-w-[150px]">
                      <Building className="h-4 w-4 mr-2" />
                      {isSavingWarehouse ? 'Salvando...' : 'Cadastrar Armazém'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Armazéns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Armazéns Cadastrados ({warehouses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {warehouses.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {warehouses.map((warehouse) => (
                      <div key={warehouse.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">{warehouse.name}</h4>
                          <Badge variant="outline">{warehouse.department}</Badge>
                          {!warehouse.active && <Badge variant="destructive">Inativo</Badge>}
                        </div>
                        {warehouse.address && (
                          <p className="text-sm text-muted-foreground">{warehouse.address}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">Nenhum armazém cadastrado</h3>
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
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
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
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold">
                            {orders.reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.boxes, 0), 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Caixas</div>
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
                                {order.orderDate.toLocaleDateString('pt-BR')} - {order.vendorName}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">{order.department}</Badge>
                              <Badge variant={
                                order.status === 'pendente' ? 'secondary' :
                                order.status === 'confirmado' ? 'default' : 'destructive'
                              }>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm">
                            <strong>Armazém:</strong> {order.warehouseName}
                          </div>
                          <div className="text-sm">
                            <strong>Itens:</strong> {order.items.length} produtos, {' '}
                            {order.items.reduce((sum, item) => sum + item.boxes, 0)} caixas, {' '}
                            {order.items.reduce((sum, item) => sum + item.pieces, 0)} peças
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