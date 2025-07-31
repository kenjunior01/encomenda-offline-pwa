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
  pdf.text(`Data: ${order.createdAt.toLocaleDateString('pt-BR')}`, 20, 130);
  pdf.text(`Hora: ${order.createdAt.toLocaleTimeString('pt-BR')}`, 20, 140);
  
  // Cálculos de totais
  const totalItems = order.products.reduce((total, p) => total + p.quantity, 0);
  const totalCaixas = Math.ceil(totalItems / 12); // 12 itens por caixa
  const totalEmbalagens = Math.ceil(totalItems / 6); // 6 itens por embalagem
  
  // Totais
  pdf.setFontSize(14);
  pdf.text('RESUMO:', 110, 100);
  pdf.setFontSize(12);
  pdf.text(`Total de itens: ${totalItems}`, 110, 110);
  pdf.text(`Total de caixas: ${totalCaixas}`, 110, 120);
  pdf.text(`Total de embalagens: ${totalEmbalagens}`, 110, 130);
  
  // Lista de produtos - Tabela
  pdf.setFontSize(14);
  pdf.text('PRODUTOS ENCOMENDADOS:', 20, 160);
  
  // Cabeçalho da tabela
  pdf.setFontSize(10);
  pdf.text('#', 20, 175);
  pdf.text('PRODUTO', 30, 175);
  pdf.text('QTD', 160, 175);
  
  // Linha do cabeçalho
  pdf.line(20, 177, 190, 177);
  
  let yPosition = 185;
  pdf.setFontSize(10);
  
  order.products.forEach((orderProduct, index) => {
    const product = products.find(p => p.id === orderProduct.productId);
    if (product) {
      // Quebrar texto longo se necessário
      const productName = product.name.length > 40 
        ? product.name.substring(0, 37) + '...'
        : product.name;
      
      pdf.text(`${index + 1}`, 20, yPosition);
      pdf.text(productName, 30, yPosition);
      pdf.text(`${orderProduct.quantity}`, 160, yPosition);
      
      yPosition += 8;
      
      // Nova página se necessário
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
    }
  });
  
  // Linha final
  pdf.line(20, yPosition + 5, 190, yPosition + 5);
  
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
  products: Product[]
) => {
  const pdf = await generateOrderPDF(order, customer, products);
  const fileName = `encomenda_${customer.name}_${order.createdAt.toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
};