import jsPDF from 'jspdf';

interface NewOrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string;
  customer_id?: string;
  department: string;
  total: number;
  notes?: string;
  status: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  department: string;
  warehouse_id?: string;
}

interface Warehouse {
  id: string;
  name: string;
  department: string;
}

export const generateOrderPDF = async (
  order: Order,
  customer: Customer,
  products: Product[],
  warehouse: Warehouse,
  orderItems: NewOrderItem[],
  vendorName: string
) => {
  const pdf = new jsPDF();
  
  // Colors and styling
  const primaryColor: [number, number, number] = [41, 128, 185]; // Blue
  const secondaryColor: [number, number, number] = [52, 73, 94]; // Dark gray
  const accentColor: [number, number, number] = [231, 76, 60]; // Red
  
  // Header with company branding
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, 210, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SISTEMA DE ENCOMENDAS', 20, 25);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Fatura de Encomenda', 20, 32);
  
  // Order ID and date in header
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text(`Encomenda #${order.id.substring(0, 8)}`, 150, 20);
  pdf.text(`Data: ${new Date(order.created_at).toLocaleDateString('pt-BR')}`, 150, 27);
  pdf.text(`Status: ${order.status.toUpperCase()}`, 150, 34);
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  // Company info section
  pdf.setFillColor(248, 249, 250);
  pdf.rect(20, 50, 170, 25, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(20, 50, 170, 25);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  pdf.text('DADOS DA EMPRESA', 25, 60);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Sistema PWA de Encomendas por Departamento', 25, 67);
  pdf.text(`Vendedor: ${vendorName}`, 25, 72);
  
  // Customer section
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(20, 85, 80, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DO CLIENTE', 25, 89);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  let yPos = 100;
  pdf.text(`Nome: ${customer.name}`, 25, yPos);
  if (customer.phone) {
    yPos += 7;
    pdf.text(`Telefone: ${customer.phone}`, 25, yPos);
  }
  if (customer.email) {
    yPos += 7;
    pdf.text(`Email: ${customer.email}`, 25, yPos);
  }
  if (customer.address) {
    yPos += 7;
    pdf.text(`Endereço: ${customer.address}`, 25, yPos);
  }
  
  // Warehouse section
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(110, 85, 80, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ARMAZÉM', 115, 89);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`${warehouse.name}`, 115, 100);
  pdf.text(`Departamento: ${order.department.toUpperCase()}`, 115, 107);
  
  // Items table header
  const tableStartY = Math.max(yPos + 15, 130);
  
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(20, tableStartY, 170, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('#', 25, tableStartY + 5);
  pdf.text('PRODUTO', 35, tableStartY + 5);
  pdf.text('QTDE', 130, tableStartY + 5);
  pdf.text('PREÇO UNIT.', 150, tableStartY + 5);
  pdf.text('TOTAL', 175, tableStartY + 5);
  
  // Items
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  let currentY = tableStartY + 15;
  let totalAmount = 0;
  
  orderItems.forEach((item, index) => {
    const product = products.find(p => p.id === item.product_id);
    if (product) {
      const itemTotal = item.quantity * item.price;
      totalAmount += itemTotal;
      
      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(20, currentY - 4, 170, 8, 'F');
      }
      
      pdf.text(`${index + 1}`, 25, currentY);
      
      // Truncate long product names
      const productName = product.name.length > 25 
        ? product.name.substring(0, 22) + '...'
        : product.name;
      pdf.text(productName, 35, currentY);
      
      pdf.text(`${item.quantity}`, 130, currentY);
      pdf.text(`${item.price.toFixed(2)} MT`, 150, currentY);
      pdf.text(`${itemTotal.toFixed(2)} MT`, 175, currentY);
      
      currentY += 8;
      
      // Add new page if needed
      if (currentY > 270) {
        pdf.addPage();
        currentY = 30;
      }
    }
  });
  
  // Total section
  pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setLineWidth(1);
  pdf.line(130, currentY + 5, 190, currentY + 5);
  
  pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  pdf.rect(130, currentY + 10, 60, 12, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`TOTAL: ${totalAmount.toFixed(2)} MT`, 135, currentY + 18);
  
  // Notes section
  if (order.notes) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OBSERVAÇÕES:', 25, currentY + 15);
    
    pdf.setFont('helvetica', 'normal');
    const notesLines = pdf.splitTextToSize(order.notes, 165);
    pdf.text(notesLines, 25, currentY + 22);
  }
  
  // Footer
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, 280, 190, 280);
  
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(8);
  pdf.text(`Encomenda gerada em ${new Date().toLocaleString('pt-BR')}`, 20, 287);
  pdf.text('Sistema PWA de Encomendas - Versão 2.0', 20, 292);
  pdf.text(`ID da Encomenda: ${order.id}`, 130, 287);
  pdf.text('Documento gerado automaticamente', 130, 292);
  
  return pdf;
};

export const downloadOrderPDF = async (
  order: Order,
  customer: Customer,
  products: Product[],
  warehouse: Warehouse,
  orderItems: NewOrderItem[],
  vendorName: string
) => {
  const pdf = await generateOrderPDF(order, customer, products, warehouse, orderItems, vendorName);
  const fileName = `fatura_${customer.name.replace(/\s+/g, '_')}_${new Date(order.created_at).toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
};