import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db, Product } from '@/lib/database';
import { DepartmentType } from '@/utils/departmentThemes';
import { Search, Plus, Trash2, Package, Box } from 'lucide-react';

interface ProductSelectorProps {
  department: DepartmentType;
  onProductsChange: (products: { productId: number; productName: string; quantity: number }[]) => void;
}

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  department,
  onProductsChange
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderList, setOrderList] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    loadProducts();
  }, [department]);

  const loadProducts = async () => {
    const departmentProducts = await db.products
      .where('department')
      .equals(department)
      .toArray();
    setProducts(departmentProducts);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const addToOrder = () => {
    if (!selectedProductId || !quantity || parseInt(quantity) <= 0) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const existingItemIndex = orderList.findIndex(item => item.productId === selectedProductId);
    
    let newOrderList: OrderItem[];
    
    if (existingItemIndex >= 0) {
      // Atualizar item existente
      newOrderList = orderList.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + parseInt(quantity) }
          : item
      );
    } else {
      // Adicionar novo item
      newOrderList = [
        ...orderList,
        {
          productId: selectedProductId,
          productName: product.name,
          quantity: parseInt(quantity)
        }
      ];
    }

    setOrderList(newOrderList);
    onProductsChange(newOrderList);
    
    // Limpar seleção
    setSelectedProductId(null);
    setQuantity('1');
    setSearchTerm('');
  };

  const removeFromOrder = (productId: number) => {
    const newOrderList = orderList.filter(item => item.productId !== productId);
    setOrderList(newOrderList);
    onProductsChange(newOrderList);
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(productId);
      return;
    }

    const newOrderList = orderList.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setOrderList(newOrderList);
    onProductsChange(newOrderList);
  };

  // Cálculos de totais
  const totalItems = orderList.reduce((total, item) => total + item.quantity, 0);
  const totalCaixas = Math.ceil(totalItems / 12); // Assumindo 12 itens por caixa
  const totalEmbalagens = Math.ceil(totalItems / 6); // Assumindo 6 itens por embalagem

  return (
    <div className="space-y-6">
      {/* Busca e Seleção de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Adicionar Produto à Encomenda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            {/* Busca de produtos */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-base" // text-base para melhor legibilidade no mobile
              />
            </div>
            
            {/* Lista de produtos filtrados - Mobile friendly */}
            {searchTerm && filteredProducts.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 cursor-pointer hover:bg-accent transition-colors border-b last:border-b-0 ${
                      selectedProductId === product.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => {
                      setSelectedProductId(product.id!);
                      setSearchTerm(product.name);
                    }}
                  >
                    <div className="font-medium text-base">{product.name}</div>
                    {product.code && (
                      <div className="text-sm text-muted-foreground">{product.code}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Quantidade e botão adicionar - Mobile otimizado */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Quantidade"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="text-base text-center font-medium"
                />
              </div>
              <Button 
                onClick={addToOrder} 
                disabled={!selectedProductId || !quantity}
                className="flex-2 min-w-[120px] text-base font-medium"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Encomenda (Livro de Encomendas) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Livro de Encomendas ({orderList.length})
            </CardTitle>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Box className="h-3 w-3" />
                {totalCaixas} caixas
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Package className="h-3 w-3" />
                {totalEmbalagens} embalagens
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {totalItems} itens
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orderList.length > 0 ? (
            <div className="space-y-3">
              {/* Versão Mobile - Cards */}
              <div className="block md:hidden space-y-3">
                {orderList.map((item, index) => (
                  <div key={item.productId} className="border rounded-lg p-4 bg-card">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                        </div>
                        <h4 className="font-medium text-base leading-tight">{item.productName}</h4>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromOrder(item.productId)}
                        className="text-destructive hover:text-destructive ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Quantidade:</span>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        min="1"
                        className="w-20 text-center text-base font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Versão Desktop - Tabela */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-32 text-center">Quantidade</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderList.map((item, index) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-24 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromOrder(item.productId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Livro de encomendas vazio</h3>
              <p className="text-sm">
                Use a busca acima para adicionar produtos à encomenda
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};