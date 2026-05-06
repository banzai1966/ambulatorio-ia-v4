import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface PrescriptionData {
  pacienteNome: string;
  data: string;
  prescricao: string;
  medicoNome: string;
}

export function generatePrescriptionPDF(data: PrescriptionData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Borda Decorativa
  doc.setDrawColor(0, 50, 100);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  // Cabeçalho Elegante
  doc.setFillColor(245, 248, 255);
  doc.rect(11, 11, pageWidth - 22, 40, 'F');
  
  doc.setFontSize(26);
  doc.setTextColor(0, 50, 100);
  doc.setFont('helvetica', 'bold');
  doc.text("RECEITUÁRIO", 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.setFont('helvetica', 'normal');
  doc.text("Ambulatório IA - Gestão de Saúde Inteligente", 105, 38, { align: 'center' });
  doc.text("Suporte à Decisão Clínica e Neurológica", 105, 43, { align: 'center' });

  doc.setLineWidth(0.8);
  doc.setDrawColor(0, 50, 100);
  doc.line(20, 51, 190, 51);
  
  // Dados do Paciente
  doc.setFillColor(250, 250, 250);
  doc.rect(20, 58, 170, 25, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.rect(20, 58, 170, 25);

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text("PACIENTE:", 25, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(data.pacienteNome || 'Não informado', 50, 65);
  
  doc.setFont('helvetica', 'bold');
  doc.text("DATA:", 145, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(data.data || new Date().toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}), 160, 65);
  
  // Rx Symbol
  doc.setFontSize(30);
  doc.setTextColor(230, 230, 230);
  doc.text("Rx", 20, 100);

  doc.setFontSize(14);
  doc.setTextColor(0, 50, 100);
  doc.setFont('helvetica', 'bold');
  doc.text("PRESCRIÇÃO E ORIENTAÇÕES", 35, 98);
  
  // Content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const splitPrescricao = doc.splitTextToSize(data.prescricao, 160);
  doc.text(splitPrescricao, 25, 110);

  // Footer
  const footerY = pageHeight - 30;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, footerY, pageWidth / 2 + 40, footerY);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr(a). ${data.medicoNome}`, pageWidth / 2, footerY + 7, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Documento gerado eletronicamente pelo Ambulatório IA", pageWidth / 2, footerY + 15, { align: 'center' });

  doc.save(`receita_${data.pacienteNome.replace(/\s+/g, '_')}.pdf`);
}
