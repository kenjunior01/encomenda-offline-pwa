import * as XLSX from 'xlsx';
import { Product } from '@/lib/database';

export interface ImportedProduct {
  name: string;
  code?: string;
  category?: string;
  quantity?: number;
  price?: number;
  unidadesPorCaixa?: number;
  embalagensPorCaixa?: number;
}

export const importProductsFromFile = (
  file: File,
  department: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos'
): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let workbook;
        
        if (file.name.endsWith('.csv')) {
          // Para CSV, usar como texto
          const csvData = e.target?.result as string;
          workbook = XLSX.read(csvData, { type: 'string' });
        } else {
          // Para xlsx/xls, usar ArrayBuffer
          const data = e.target?.result as ArrayBuffer;
          workbook = XLSX.read(data, { type: 'array' });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON com headers em minúsculo para facilitar o mapeamento
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          defval: ''
        });

        console.log('Dados importados:', jsonData);

        const products: Product[] = jsonData
          .map((item, index) => {
            // Mapear diferentes possíveis nomes de colunas
            const name = item.name || item.Nome || item.produto || item.Produto || item.PRODUTO || '';
            const code = item.code || item.codigo || item.Codigo || item.CODIGO || item.Code || '';
            const category = item.category || item.categoria || item.Categoria || item.CATEGORIA || '';
            const quantity = item.quantity || item.quantidade || item.Quantidade || item.QUANTIDADE || item.estoque || item.Estoque || '';
            const price = item.price || item.preco || item.Preco || item.PRECO || item.valor || item.Valor || '';
            const unidadesPorCaixa = item.unidadesPorCaixa || item.unidades_por_caixa || item.unidadesCaixa || '';
            const embalagensPorCaixa = item.embalagensPorCaixa || item.embalagens_por_caixa || item.embalagensCaixa || '';

            if (!name || name.toString().trim() === '') {
              console.warn(`Linha ${index + 2}: Nome do produto vazio ou inválido`);
              return null;
            }

            const product: Product = {
              name: name.toString().trim(),
              code: code ? code.toString().trim() : undefined,
              category: category ? category.toString().trim() : undefined,
              quantity: quantity && !isNaN(Number(quantity)) ? Number(quantity) : undefined,
              price: price && !isNaN(Number(price)) ? Number(price) : undefined,
              unidadesPorCaixa: unidadesPorCaixa && !isNaN(Number(unidadesPorCaixa)) ? Number(unidadesPorCaixa) : undefined,
              embalagensPorCaixa: embalagensPorCaixa && !isNaN(Number(embalagensPorCaixa)) ? Number(embalagensPorCaixa) : undefined,
              department,
              createdAt: new Date()
            };

            return product;
          })
          .filter((product): product is Product => product !== null);

        console.log('Produtos processados:', products);

        if (products.length === 0) {
          reject(new Error('Nenhum produto válido encontrado no arquivo. Verifique se a coluna "name" ou "Nome" existe e contém dados.'));
          return;
        }

        resolve(products);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        reject(new Error('Erro ao processar arquivo: ' + (error instanceof Error ? error.message : String(error))));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

export const validateProductsData = (products: Product[]): string[] => {
  const errors: string[] = [];
  
  products.forEach((product, index) => {
    if (!product.name || product.name.trim() === '') {
      errors.push(`Linha ${index + 1}: Nome do produto é obrigatório`);
    }
    
    if (product.quantity !== undefined && product.quantity < 0) {
      errors.push(`Linha ${index + 1}: Quantidade não pode ser negativa`);
    }
    
    if (product.price !== undefined && product.price < 0) {
      errors.push(`Linha ${index + 1}: Preço não pode ser negativo`);
    }
  });
  
  return errors;
};

// Função para gerar template CSV
export const generateCSVTemplate = (): string => {
  const headers = [
    'name',
    'code', 
    'category',
    'quantity',
    'price',
    'unidadesPorCaixa',
    'embalagensPorCaixa'
  ];
  
  const exampleData = [
    'Geladeira Frost Free 400L',
    'EL001',
    'Refrigeração',
    '50',
    '1299.99',
    '1',
    '1'
  ];
  
  return [headers.join(','), exampleData.join(',')].join('\n');
};

// Função para baixar template
export const downloadCSVTemplate = () => {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'template_produtos.csv';
  link.click();
};