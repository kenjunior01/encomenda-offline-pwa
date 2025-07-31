import Dexie, { Table } from 'dexie';

export interface User {
  id?: number;
  username: string;
  password: string;
  role: 'vendedor' | 'admin';
  department?: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos';
  createdAt: Date;
}

export interface Product {
  id?: number;
  code?: string;
  name: string;
  category?: string;
  department: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos';
  quantity?: number;
  price?: number;
  createdAt: Date;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  location: string;
}

export interface Order {
  id?: number;
  customerId: number;
  vendorId: number;
  vendorName: string;
  department: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos';
  products: { productId: number; productName: string; quantity: number }[];
  totalValue?: number;
  status: 'pendente' | 'confirmado' | 'cancelado';
  createdAt: Date;
  updatedAt: Date;
}

export class EncomendasDB extends Dexie {
  users!: Table<User>;
  products!: Table<Product>;
  customers!: Table<Customer>;
  orders!: Table<Order>;

  constructor() {
    super('EncomendasDB');
    this.version(1).stores({
      users: '++id, username, role, department',
      products: '++id, name, department, code',
      customers: '++id, name, phone',
      orders: '++id, customerId, vendorId, department, createdAt'
    });
  }
}

export const db = new EncomendasDB();

// Inicializar dados padrão
export const initializeDefaultData = async () => {
  const userCount = await db.users.count();
  
  if (userCount === 0) {
    // Criar usuários padrão
    await db.users.bulkAdd([
      {
        username: 'vendedor1',
        password: '123456',
        role: 'vendedor',
        createdAt: new Date()
      },
      {
        username: 'admin_eletro',
        password: 'admin123',
        role: 'admin',
        department: 'eletrodomesticos',
        createdAt: new Date()
      },
      {
        username: 'admin_alimentacao',
        password: 'admin123',
        role: 'admin',
        department: 'alimentacao',
        createdAt: new Date()
      },
      {
        username: 'admin_cosmeticos',
        password: 'admin123',
        role: 'admin',
        department: 'cosmeticos',
        createdAt: new Date()
      }
    ]);

    // Produtos exemplo
    await db.products.bulkAdd([
      // Eletrodomésticos
      { name: 'Geladeira Frost Free 400L', department: 'eletrodomesticos', code: 'EL001', createdAt: new Date() },
      { name: 'Fogão 4 Bocas', department: 'eletrodomesticos', code: 'EL002', createdAt: new Date() },
      { name: 'Microondas 20L', department: 'eletrodomesticos', code: 'EL003', createdAt: new Date() },
      
      // Alimentação
      { name: 'Arroz Integral 5kg', department: 'alimentacao', code: 'AL001', createdAt: new Date() },
      { name: 'Feijão Preto 1kg', department: 'alimentacao', code: 'AL002', createdAt: new Date() },
      { name: 'Óleo de Soja 900ml', department: 'alimentacao', code: 'AL003', createdAt: new Date() },
      
      // Cosméticos
      { name: 'Shampoo Hidratante 400ml', department: 'cosmeticos', code: 'CO001', createdAt: new Date() },
      { name: 'Base Líquida Matte', department: 'cosmeticos', code: 'CO002', createdAt: new Date() },
      { name: 'Perfume Masculino 100ml', department: 'cosmeticos', code: 'CO003', createdAt: new Date() }
    ]);
  }
};