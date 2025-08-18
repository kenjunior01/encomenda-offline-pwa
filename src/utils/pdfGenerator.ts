import jsPDF from 'jspdf';
import { Order, Customer, Product, Warehouse } from '@/lib/database';

export const generateOrderPDF = async (
  order: Order,
  customer: Customer,
  products: Product[],
  warehouse: Warehouse
) => {
  const pdf = new jsPDF();
  
  // Cabeçalho
  pdf.setFontSize(20);
  pdf.text('LIVRO DE ENCOMENDAS - SISTEMA PWA', 20, 30);
  
  // Linha divisória
  pdf.setLineWidth(0.5);
  pdf.line(20, 35, 190, 35);
  
  // Informações do cliente
  pdf.setFontSize(14);
  pdf.text('DADOS DO CLIENTE:', 20, 50);
  
  pdf.setFontSize(12);
  pdf.text(`Nome: ${customer.name}`, 20, 60);
  pdf.text(`Telefone: ${customer.phone}`, 20, 70);
  pdf.text(`Localização: ${customer.location}`, 20, 80);
  
  // Informações da encomenda
  pdf.setFontSize(14);
  pdf.text('DADOS DA ENCOMENDA:', 20, 100);
  
  pdf.setFontSize(12);
  pdf.text(`Departamento: ${order.department.toUpperCase()}`, 20, 110);
  pdf.text(`Vendedor: ${order.vendorName}`, 20, 120);
  pdf.text(`Data da Encomenda: ${order.orderDate.toLocaleDateString('pt-BR')}`, 20, 130);
  pdf.text(`Criada em: ${order.createdAt.toLocaleDateString('pt-BR')} às ${order.createdAt.toLocaleTimeString('pt-BR')}`, 20, 140);
  
  // Armazém de retirada
  pdf.setFontSize(14);
  pdf.text('ARMAZÉM DE RETIRADA:', 110, 100);
  pdf.setFontSize(12);
  pdf.text(`${warehouse.name}`, 110, 110);
  if (warehouse.address) {
    pdf.text(`${warehouse.address}`, 110, 120);
  }
  
  // Observações
  if (order.notes) {
    pdf.setFontSize(14);
    pdf.text('OBSERVAÇÕES:', 110, 140);
    pdf.setFontSize(10);
    const notesLines = pdf.splitTextToSize(order.notes, 70);
    pdf.text(notesLines, 110, 150);
  }
  
  // Cálculos de totais
  const totalBoxes = order.items.reduce((total, item) => total + item.boxes, 0);
  const totalPieces = order.items.reduce((total, item) => total + item.pieces, 0);
  
  // Lista de produtos - Tabela
  pdf.setFontSize(14);
  pdf.text('PRODUTOS ENCOMENDADOS:', 20, 170);
  
  // Cabeçalho da tabela
  pdf.setFontSize(10);
  pdf.text('#', 20, 185);
  pdf.text('PRODUTO', 30, 185);
  pdf.text('CAIXAS', 140, 185);
  pdf.text('PEÇAS', 165, 185);
  
  // Linha do cabeçalho
  pdf.line(20, 187, 190, 187);
  
  let yPosition = 195;
  pdf.setFontSize(10);
  
  order.items.forEach((orderItem, index) => {
    const product = products.find(p => p.id === orderItem.productId);
    if (product) {
      // Quebrar texto longo se necessário
      const productName = product.name.length > 35 
        ? product.name.substring(0, 32) + '...'
        : product.name;
      
      pdf.text(`${index + 1}`, 20, yPosition);
      pdf.text(productName, 30, yPosition);
      pdf.text(`${orderItem.boxes}`, 140, yPosition);
      pdf.text(`${orderItem.pieces}`, 165, yPosition);
      
      yPosition += 8;
      
      // Nova página se necessário
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
    }
  });
  
  // Linha final e totais
  pdf.line(20, yPosition + 5, 190, yPosition + 5);
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.text(`TOTAL: ${totalBoxes} caixas + ${totalPieces} peças`, 20, yPosition);
  
  // Rodapé
  pdf.setFontSize(8);
  pdf.text(
    `Encomenda #${order.id} - Gerada em ${new Date().toLocaleString('pt-BR')}`,
    20,
    280
  );
  pdf.text(
    'Sistema PWA de Encomendas - 100% Offline',
    20,
    285
  );
  
  return pdf;
};

export const downloadOrderPDF = async (
  order: Order,
  customer: Customer,
  products: Product[],
  warehouse: Warehouse
) => {
  const pdf = await generateOrderPDF(order, customer, products, warehouse);
  const fileName = `encomenda_${customer.name.replace(/\s+/g, '_')}_${order.orderDate.toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
};