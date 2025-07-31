import * as XLSX from 'xlsx';
import { Product } from '@/lib/database';

export interface ImportedProduct {
  name: string;
  code?: string;
  category?: string;
  quantity?: number;
  price?: number;
}

export const importProductsFromFile = (
  file: File,
  department: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos'
): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData: ImportedProduct[] = XLSX.utils.sheet_to_json(worksheet);
        
        const products: Product[] = jsonData.map(item => ({
          name: item.name || '',
          code: item.code,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
          department,
          createdAt: new Date()
        })).filter(product => product.name.trim() !== '');
        
        resolve(products);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: ' + error));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
};

export const validateProductsData = (products: Product[]): string[] => {
  const errors: string[] = [];
  
  products.forEach((product, index) => {
    if (!product.name || product.name.trim() === '') {
      errors.push(`Linha ${index + 1}: Nome do produto é obrigatório`);
    }
  });
  
  return errors;
};