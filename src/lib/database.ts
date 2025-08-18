import Dexie, { Table } from 'dexie';

export interface User {
  id?: number;
  username: string;
  password: string;
  role: 'vendedor' | 'supervisor' | 'admin';
  department?: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos';
  supervisorId?: number; // Para vendedores, referência ao supervisor
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
  piecesPerBox?: number; // Peças por caixa
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Warehouse {
  id?: number;
  name: string;
  department: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos';
  address?: string;
  active: boolean;
  createdAt: Date;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  location: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  boxes: number;
  pieces: number;
}

export interface Order {
  id?: number;
  customerId: number;
  vendorId: number;
  vendorName: string;
  department: 'eletrodomesticos' | 'alimentacao' | 'cosmeticos';
  warehouseId: number;
  warehouseName: string;
  items: OrderItem[];
  notes?: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  orderDate: Date; // Data da encomenda
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  id?: number;
  title: string;
  body: string;
  imageUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class EncomendasDB extends Dexie {
  users!: Table<User>;
  products!: Table<Product>;
  warehouses!: Table<Warehouse>;
  customers!: Table<Customer>;
  orders!: Table<Order>;
  announcements!: Table<Announcement>;

  constructor() {
    super('EncomendasDB');
    this.version(2).stores({
      users: '++id, username, role, department, supervisorId',
      products: '++id, name, department, code, active',
      warehouses: '++id, name, department, active',
      customers: '++id, name, phone',
      orders: '++id, customerId, vendorId, department, warehouseId, orderDate, createdAt',
      announcements: '++id, title, active, createdAt'
    });

    // Migração para versão 2
    this.version(2).upgrade(trans => {
      // Migrar produtos existentes
      return trans.table('products').toCollection().modify(product => {
        if (!product.hasOwnProperty('active')) {
          product.active = true;
        }
        if (!product.hasOwnProperty('updatedAt')) {
          product.updatedAt = new Date();
        }
      });
    });
  }
}

export const db = new EncomendasDB();

// Inicializar dados padrão
export const initializeDefaultData = async () => {
  const userCount = await db.users.count();
  
  if (userCount === 0) {
    // Criar usuário admin principal
    const adminId = await db.users.add({
      username: 'admin1',
      password: 'admin123456',
      role: 'admin',
      createdAt: new Date()
    });

    // Criar supervisores por departamento
    const supervisorEletroId = await db.users.add({
      username: 'supervisor_eletro',
      password: 'super123',
      role: 'supervisor',
      department: 'eletrodomesticos',
      createdAt: new Date()
    });

    const supervisorAlimentacaoId = await db.users.add({
      username: 'supervisor_alimentacao',
      password: 'super123',
      role: 'supervisor',
      department: 'alimentacao',
      createdAt: new Date()
    });

    const supervisorCosmeticosId = await db.users.add({
      username: 'supervisor_cosmeticos',
      password: 'super123',
      role: 'supervisor',
      department: 'cosmeticos',
      createdAt: new Date()
    });

    // Criar vendedores de exemplo
    await db.users.bulkAdd([
      {
        username: 'vendedor1',
        password: '123456',
        role: 'vendedor',
        department: 'eletrodomesticos',
        supervisorId: supervisorEletroId,
        createdAt: new Date()
      },
      {
        username: 'vendedor2',
        password: '123456',
        role: 'vendedor',
        department: 'alimentacao',
        supervisorId: supervisorAlimentacaoId,
        createdAt: new Date()
      },
      {
        username: 'vendedor3',
        password: '123456',
        role: 'vendedor',
        department: 'cosmeticos',
        supervisorId: supervisorCosmeticosId,
        createdAt: new Date()
      }
    ]);

    // Criar armazéns
    await db.warehouses.bulkAdd([
      {
        name: 'Armazém Central - Eletrodomésticos',
        department: 'eletrodomesticos',
        address: 'Rua das Indústrias, 100',
        active: true,
        createdAt: new Date()
      },
      {
        name: 'Depósito Norte - Eletrodomésticos',
        department: 'eletrodomesticos',
        address: 'Av. Norte, 250',
        active: true,
        createdAt: new Date()
      },
      {
        name: 'Centro de Distribuição - Alimentação',
        department: 'alimentacao',
        address: 'Rua dos Alimentos, 50',
        active: true,
        createdAt: new Date()
      },
      {
        name: 'Armazém Sul - Cosméticos',
        department: 'cosmeticos',
        address: 'Av. Beleza, 300',
        active: true,
        createdAt: new Date()
      }
    ]);

    // Produtos exemplo com peças por caixa
    await db.products.bulkAdd([
      // Eletrodomésticos
      { 
        name: 'Geladeira Frost Free 400L', 
        department: 'eletrodomesticos', 
        code: 'EL001', 
        piecesPerBox: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Fogão 4 Bocas', 
        department: 'eletrodomesticos', 
        code: 'EL002', 
        piecesPerBox: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Microondas 20L', 
        department: 'eletrodomesticos', 
        code: 'EL003', 
        piecesPerBox: 2,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Alimentação
      { 
        name: 'Arroz Integral 5kg', 
        department: 'alimentacao', 
        code: 'AL001', 
        piecesPerBox: 10,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Feijão Preto 1kg', 
        department: 'alimentacao', 
        code: 'AL002', 
        piecesPerBox: 12,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Óleo de Soja 900ml', 
        department: 'alimentacao', 
        code: 'AL003', 
        piecesPerBox: 24,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Cosméticos
      { 
        name: 'Shampoo Hidratante 400ml', 
        department: 'cosmeticos', 
        code: 'CO001', 
        piecesPerBox: 12,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Base Líquida Matte', 
        department: 'cosmeticos', 
        code: 'CO002', 
        piecesPerBox: 24,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        name: 'Perfume Masculino 100ml', 
        department: 'cosmeticos', 
        code: 'CO003', 
        piecesPerBox: 6,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Anúncio de exemplo
    await db.announcements.add({
      title: 'Bem-vindos ao Sistema de Encomendas!',
      body: 'Sistema atualizado com nova funcionalidade de caixas e peças. Agora você pode registrar encomendas de forma mais precisa.',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
};