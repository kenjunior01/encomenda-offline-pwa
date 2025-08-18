import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { db, Product, OrderItem } from '@/lib/database';
import { DepartmentType } from '@/utils/departmentThemes';
import { Search, Plus, Trash2, Package, Box } from 'lucide-react';

interface ProductSelectorProps {
  department: DepartmentType;
  onItemsChange: (items: OrderItem[]) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  department,
  onItemsChange
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [boxes, setBoxes] = useState('0');
  const [pieces, setPieces] = useState('0');

  useEffect(() => {
    loadProducts();
  }, [department]);

  const loadProducts = async () => {
    const departmentProducts = await db.products
      .where('department')
      .equals(department)
      .and(product => product.active)
      .toArray();
    setProducts(departmentProducts);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const addToOrder = () => {
    if (!selectedProductId || (!parseInt(boxes) && !parseInt(pieces))) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const boxesNum = parseInt(boxes) || 0;
    const piecesNum = parseInt(pieces) || 0;

    const existingItemIndex = orderItems.findIndex(item => item.productId === selectedProductId);
    
    let newOrderItems: OrderItem[];
    
    if (existingItemIndex >= 0) {
      // Atualizar item existente
      newOrderItems = orderItems.map((item, index) => 
        index === existingItemIndex 
          ? { 
              ...item, 
              boxes: item.boxes + boxesNum,
              pieces: item.pieces + piecesNum
            }
          : item
      );
    } else {
      // Adicionar novo item
      newOrderItems = [
        ...orderItems,
        {
          productId: selectedProductId,
          productName: product.name,
          boxes: boxesNum,
          pieces: piecesNum
        }
      ];
    }

    setOrderItems(newOrderItems);
    onItemsChange(newOrderItems);
    
    // Limpar seleção
    setSelectedProductId(null);
    setBoxes('0');
    setPieces('0');
    setSearchTerm('');
  };

  const removeFromOrder = (productId: number) => {
    const newOrderItems = orderItems.filter(item => item.productId !== productId);
    setOrderItems(newOrderItems);
    onItemsChange(newOrderItems);
  };

  const updateQuantity = (productId: number, newBoxes: number, newPieces: number) => {
    if (newBoxes <= 0 && newPieces <= 0) {
      removeFromOrder(productId);
      return;
    }

    const newOrderItems = orderItems.map(item =>
      item.productId === productId
        ? { ...item, boxes: Math.max(0, newBoxes), pieces: Math.max(0, newPieces) }
        : item
    );
    setOrderItems(newOrderItems);
    onItemsChange(newOrderItems);
  };

  // Cálculos de totais
  const totalBoxes = orderItems.reduce((total, item) => total + item.boxes, 0);
  const totalPieces = orderItems.reduce((total, item) => total + item.pieces, 0);
  const totalItems = orderItems.length;

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
                className="pl-10 text-base"
              />
            </div>
            
            {/* Lista de produtos filtrados */}
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
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {product.code && <span>Código: {product.code}</span>}
                      {product.piecesPerBox && (
                        <span>Peças por caixa: {product.piecesPerBox}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Informações do produto selecionado */}
            {selectedProduct && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium">{selectedProduct.name}</h4>
                <div className="text-sm text-muted-foreground">
                  {selectedProduct.code && <span>Código: {selectedProduct.code} • </span>}
                  {selectedProduct.piecesPerBox && (
                    <span>Peças por caixa: {selectedProduct.piecesPerBox}</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Quantidade - Caixas e Peças */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="boxes">Caixas</Label>
                <Input
                  id="boxes"
                  type="number"
                  placeholder="0"
                  value={boxes}
                  onChange={(e) => setBoxes(e.target.value)}
                  min="0"
                  className="text-base text-center font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pieces">Peças</Label>
                <Input
                  id="pieces"
                  type="number"
                  placeholder="0"
                  value={pieces}
                  onChange={(e) => setPieces(e.target.value)}
                  min="0"
                  className="text-base text-center font-medium"
                />
              </div>
            </div>
            
            <Button 
              onClick={addToOrder} 
              disabled={!selectedProductId || (!parseInt(boxes) && !parseInt(pieces))}
              className="w-full text-base font-medium"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar à Encomenda
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Encomenda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Itens da Encomenda ({totalItems})
            </CardTitle>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Box className="h-3 w-3" />
                {totalBoxes} caixas
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Package className="h-3 w-3" />
                {totalPieces} peças
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orderItems.length > 0 ? (
            <div className="space-y-3">
              {/* Versão Mobile - Cards */}
              <div className="block md:hidden space-y-3">
                {orderItems.map((item, index) => (
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Caixas</Label>
                        <Input
                          type="number"
                          value={item.boxes}
                          onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0, item.pieces)}
                          min="0"
                          className="text-center text-base font-medium"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Peças</Label>
                        <Input
                          type="number"
                          value={item.pieces}
                          onChange={(e) => updateQuantity(item.productId, item.boxes, parseInt(e.target.value) || 0)}
                          min="0"
                          className="text-center text-base font-medium"
                        />
                      </div>
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
                      <TableHead className="w-24 text-center">Caixas</TableHead>
                      <TableHead className="w-24 text-center">Peças</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, index) => (
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
                            value={item.boxes}
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0, item.pieces)}
                            min="0"
                            className="w-20 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.pieces}
                            onChange={(e) => updateQuantity(item.productId, item.boxes, parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-20 text-center mx-auto"
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