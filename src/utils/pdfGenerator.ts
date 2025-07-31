import jsPDF from 'jspdf';
import { Order, Customer, Product } from '@/lib/database';

export const generateOrderPDF = async (
  order: Order,
  customer: Customer,
  products: Product[]
) => {
  const pdf = new jsPDF();
  
  // Cabeçalho
  pdf.setFontSize(20);
  pdf.text('ENCOMENDA - SISTEMA PWA', 20, 30);
  
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
  pdf.text(`Data: ${order.createdAt.toLocaleDateString('pt-BR')}`, 20, 130);
  pdf.text(`Hora: ${order.createdAt.toLocaleTimeString('pt-BR')}`, 20, 140);
  
  // Lista de produtos
  pdf.setFontSize(14);
  pdf.text('PRODUTOS:', 20, 160);
  
  let yPosition = 170;
  pdf.setFontSize(12);
  
  order.products.forEach((orderProduct, index) => {
    const product = products.find(p => p.id === orderProduct.productId);
    if (product) {
      pdf.text(
        `${index + 1}. ${product.name} - Qtd: ${orderProduct.quantity}`,
        20,
        yPosition
      );
      yPosition += 10;
    }
  });
  
  // Rodapé
  pdf.setFontSize(10);
  pdf.text(
    'Encomenda gerada automaticamente pelo Sistema PWA',
    20,
    280
  );
  
  return pdf;
};

export const downloadOrderPDF = async (
  order: Order,
  customer: Customer,
  products: Product[]
) => {
  const pdf = await generateOrderPDF(order, customer, products);
  const fileName = `encomenda_${customer.name}_${order.createdAt.toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
};