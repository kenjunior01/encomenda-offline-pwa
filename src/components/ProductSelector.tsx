import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db, Product } from '@/lib/database';
import { DepartmentType } from '@/utils/departmentThemes';
import { Search, Plus, Minus } from 'lucide-react';

interface ProductSelectorProps {
  department: DepartmentType;
  onProductsChange: (products: { productId: number; productName: string; quantity: number }[]) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  department,
  onProductsChange
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Map<number, number>>(new Map());

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

  const updateProductQuantity = (productId: number, productName: string, change: number) => {
    const newSelected = new Map(selectedProducts);
    const currentQuantity = newSelected.get(productId) || 0;
    const newQuantity = Math.max(0, currentQuantity + change);

    if (newQuantity === 0) {
      newSelected.delete(productId);
    } else {
      newSelected.set(productId, newQuantity);
    }

    setSelectedProducts(newSelected);

    // Converter para array e enviar para o componente pai
    const productsArray = Array.from(newSelected.entries()).map(([productId, quantity]) => ({
      productId,
      productName: products.find(p => p.id === productId)?.name || productName,
      quantity
    }));

    onProductsChange(productsArray);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Selecionar Produtos
        </CardTitle>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto space-y-3">
        {filteredProducts.map((product) => {
          const quantity = selectedProducts.get(product.id!) || 0;
          return (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium">{product.name}</h4>
                {product.code && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {product.code}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateProductQuantity(product.id!, product.name, -1)}
                  disabled={quantity === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateProductQuantity(product.id!, product.name, 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};