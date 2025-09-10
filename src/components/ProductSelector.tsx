import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { queries } from '@/lib/supabase-queries';
import { DepartmentType } from '@/utils/departmentThemes';
import { Search, Plus, Trash2, Package, Box } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NewOrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  department: string;
  warehouse_id?: string;
  active: boolean;
}

interface ProductSelectorProps {
  department: DepartmentType;
  onItemsChange: (items: NewOrderItem[]) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  department,
  onItemsChange
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<NewOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    loadProducts();
  }, [department]);

  // Real-time product updates
  useEffect(() => {
    const channel = supabase
      .channel('product-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `department=eq.${department}`
        },
        () => {
          loadProducts(); // Reload products when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department]);

  const loadProducts = async () => {
    try {
      const departmentProducts = await queries.getProductsByDepartment(department);
      setProducts(departmentProducts.filter(p => p.active));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const addToOrder = () => {
    if (!selectedProductId || !parseInt(quantity)) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity) || 0;
    if (qty <= 0) return;

    const existingItemIndex = orderItems.findIndex(item => item.product_id === selectedProductId);
    
    let newOrderItems: NewOrderItem[];
    
    if (existingItemIndex >= 0) {
      // Update existing item
      newOrderItems = orderItems.map((item, index) => 
        index === existingItemIndex 
          ? { 
              ...item, 
              quantity: item.quantity + qty
            }
          : item
      );
    } else {
      // Add new item
      newOrderItems = [
        ...orderItems,
        {
          product_id: selectedProductId,
          quantity: qty,
          price: product.price
        }
      ];
    }

    setOrderItems(newOrderItems);
    onItemsChange(newOrderItems);
    
    // Clear selection
    setSelectedProductId(null);
    setQuantity('1');
    setSearchTerm('');
  };

  const removeFromOrder = (productId: string) => {
    const newOrderItems = orderItems.filter(item => item.product_id !== productId);
    setOrderItems(newOrderItems);
    onItemsChange(newOrderItems);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(productId);
      return;
    }

    const newOrderItems = orderItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity: Math.max(1, newQuantity) }
        : item
    );
    setOrderItems(newOrderItems);
    onItemsChange(newOrderItems);
  };

  // Calculations
  const totalItems = orderItems.reduce((total, item) => total + item.quantity, 0);
  const totalValue = orderItems.reduce((total, item) => total + (item.quantity * item.price), 0);

  return (
    <div className="space-y-6">
      {/* Product Search and Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Adicionar Produto à Encomenda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            {/* Product search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-base"
              />
            </div>
            
            {/* Filtered products list */}
            {searchTerm && filteredProducts.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 cursor-pointer hover:bg-accent transition-colors border-b last:border-b-0 ${
                      selectedProductId === product.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => {
                      setSelectedProductId(product.id);
                      setSearchTerm(product.name);
                    }}
                  >
                    <div className="font-medium text-base">{product.name}</div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Preço: {product.price.toFixed(2)} MT</span>
                      {product.description && <span>{product.description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Selected product info */}
            {selectedProduct && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium">{selectedProduct.name}</h4>
                <div className="text-sm text-muted-foreground">
                  <span>Preço: {selectedProduct.price.toFixed(2)} MT</span>
                  {selectedProduct.description && <span> • {selectedProduct.description}</span>}
                </div>
              </div>
            )}
            
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="text-base text-center font-medium"
              />
            </div>
            
            <Button 
              onClick={addToOrder} 
              disabled={!selectedProductId || !parseInt(quantity)}
              className="w-full text-base font-medium"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar à Encomenda
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Itens da Encomenda ({orderItems.length})
            </CardTitle>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Box className="h-3 w-3" />
                {totalItems} itens
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Package className="h-3 w-3" />
                {totalValue.toFixed(2)} MT
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orderItems.length > 0 ? (
            <div className="space-y-3">
              {/* Mobile Version - Cards */}
              <div className="block md:hidden space-y-3">
                {orderItems.map((item, index) => {
                  const product = products.find(p => p.id === item.product_id);
                  return (
                    <div key={item.product_id} className="border rounded-lg p-4 bg-card">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                          </div>
                          <h4 className="font-medium text-base leading-tight">{product?.name}</h4>
                          <p className="text-sm text-muted-foreground">{(item.quantity * item.price).toFixed(2)} MT</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromOrder(item.product_id)}
                          className="text-destructive hover:text-destructive ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-sm">Quantidade</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                          min="1"
                          className="text-center text-base font-medium"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Version - Table */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-24 text-center">Qtd</TableHead>
                      <TableHead className="w-24 text-center">Preço Un.</TableHead>
                      <TableHead className="w-24 text-center">Total</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, index) => {
                      const product = products.find(p => p.id === item.product_id);
                      return (
                        <TableRow key={item.product_id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {product?.name}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                              min="1"
                              className="w-20 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {item.price.toFixed(2)} MT
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {(item.quantity * item.price).toFixed(2)} MT
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromOrder(item.product_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Nenhum item adicionado</h3>
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