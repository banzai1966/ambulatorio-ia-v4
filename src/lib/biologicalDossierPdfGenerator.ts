import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToothRecord, TOOTH_METADATA } from '../components/InteractiveOdontogram';
import { BiologicalDentistryData } from '../components/BiologicalDentistryForm';
import { LUCY_LOGO_DATA_URL } from '../constants/lucyLogoBase64';

interface DossierPDFParams {
  patientName: string;
  patientPhone?: string;
  patientCpf?: string;
  patientDob?: string;
  data: BiologicalDentistryData;
  clinicInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    cnpj?: string;
  };
}

export function generateBiologicalDossierDirectPDF({
  patientName,
  patientPhone,
  patientCpf,
  patientDob,
  data,
  clinicInfo
}: DossierPDFParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);
  const teethData: Record<number, ToothRecord> = data.odontograma?.teeth || {};
  const identifiedTeeth = Object.values(teethData).filter(t => t && t.status && t.status !== 'healthy');

  const formattedDate = new Date().toLocaleDateString('pt-BR');
  const protocolId = `BIO-${Math.floor(100000 + Math.random() * 900000)}`;

  // =========================================================================
  // HELPER: CABEÇALHO TIMBRADO OFICIAL (DRA. LUCY MURATA)
  // =========================================================================
  const drawTimbradaHeader = (pageNum: number) => {
    // Linha de Destaque Dourada no Topo
    doc.setFillColor(212, 175, 55); // Ouro #D4AF37
    doc.rect(0, 0, pageWidth, 3.5, 'F');

    // Inserção da Imagem Oficial em Alta Resolução da Dra. Lucy Murata
    try {
      doc.addImage(LUCY_LOGO_DATA_URL, 'PNG', margin, 6, 46, 15);
    } catch (e) {
      console.warn('Erro ao inserir logo no PDF:', e);
    }

    // Nome da Clínica
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSULTÓRIO DRA. LUCY MURATA', margin + 49, 11);

    // Especialidades
    doc.setTextColor(30, 64, 175); // blue-800
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Odontologia Biológica & Saúde Integrativa • Reabilitação Metal-Free', margin + 49, 15.5);

    // Endereço e Contato
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    const address = clinicInfo?.address || 'Torre II – Praça Maastricht, 200 - Sl 103, Jardim Sao Jose, Bragança Paulista - SP, 12917-021';
    const phone = clinicInfo?.phone || '(11) 91031-5626';
    doc.text(`${address} • Tel/WhatsApp: ${phone}`, margin + 49, 19.5);

    // Badge CRO / IAOMT no Canto Direito
    doc.setFillColor(239, 246, 255); // blue-50
    doc.setDrawColor(191, 219, 254); // blue-200
    doc.setLineWidth(0.4);
    doc.roundedRect(pageWidth - margin - 40, 6, 40, 15.5, 2, 2, 'FD');

    doc.setTextColor(30, 58, 138); // blue-900
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Dra. Lucy Murata', pageWidth - margin - 20, 10.5, { align: 'center' });

    doc.setTextColor(37, 99, 235); // blue-600
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CRO-SP: 69246 • IAOMT', pageWidth - margin - 20, 14.5, { align: 'center' });

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Odontologia Biológica', pageWidth - margin - 20, 18.5, { align: 'center' });

    // Divisor fino
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 24.5, pageWidth - margin, 24.5);
  };

  // =========================================================================
  // HELPER: BANNER DO DOSSIÊ E DADOS DO PACIENTE
  // =========================================================================
  const drawPatientBox = (titleText: string, pageNumText: string) => {
    // Banner Escuro
    doc.setFillColor(30, 27, 75); // indigo-950
    doc.roundedRect(margin, 27, contentWidth, 12, 2, 2, 'F');

    doc.setTextColor(216, 180, 254); // purple-300
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`DOSSIÊ CLÍNICO DO PACIENTE • ${pageNumText.toUpperCase()}`, margin + 4, 31.5);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(titleText, margin + 4, 36);

    // Emissão / Protocolo no banner
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emissão: ${formattedDate} | Protocolo: ${protocolId}`, pageWidth - margin - 4, 34, { align: 'right' });

    // Caixa de Dados do Paciente
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, 41, contentWidth, 11, 1.5, 1.5, 'FD');

    const colW = contentWidth / 4;
    
    // Paciente
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('PACIENTE', margin + 3, 45);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(patientName || 'Não Informado', colW - 4)[0], margin + 3, 49.5);

    // CPF
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('CPF', margin + colW + 3, 45);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(patientCpf || 'Não Informado', margin + colW + 3, 49.5);

    // Nascimento
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('NASCIMENTO / IDADE', margin + (colW * 2) + 3, 45);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(patientDob || 'Não Informado', margin + (colW * 2) + 3, 49.5);

    // Contato
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTATO / WHATSAPP', margin + (colW * 3) + 3, 45);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(patientPhone || 'Não Informado', margin + (colW * 3) + 3, 49.5);
  };

  // =========================================================================
  // HELPER: RODAPÉ DE PÁGINA COM ASSINATURA
  // =========================================================================
  const drawPageFooter = (currentPage: number, totalPages: number) => {
    const footerY = 275;
    
    // Divisor
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    // Assinatura Dra. Lucy Murata
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Dra. Lucy Murata', pageWidth / 2, footerY + 5, { align: 'center' });

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CRO-SP: 69246 • Membro IAOMT • Odontologia Biológica & Saúde Integrativa', pageWidth / 2, footerY + 9, { align: 'center' });

    // Paginação
    doc.setFontSize(6.5);
    doc.text('Ambulatório IA • Sistema Integrado de Saúde', margin, footerY + 12);
    doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - margin, footerY + 12, { align: 'right' });
  };

  // =========================================================================
  // PÁGINA 1: MAPA DE CORRELAÇÃO DENTE-ÓRGÃO & TABELA DE VOLL
  // =========================================================================
  drawTimbradaHeader(1);
  drawPatientBox('Mapa de Correlação Dente-Órgão & Focos Biológicos', 'Página 1 de 2');

  let currentY = 57;

  // 1. Seção: Mapeamento da Arcada
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Mapeamento da Arcada & Cargas Biológicas Identificadas (FDI 11 a 48)', margin, currentY);
  currentY += 4;

  if (identifiedTeeth.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 10, 1, 1, 'FD');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Nenhum foco crítico registrado nesta sessão. Exame clínico de rotina biológica focado na prevenção.', margin + 4, currentY + 6);
    currentY += 13;
  } else {
    // Tabela resumida de dentes
    const teethRows = identifiedTeeth.slice(0, 6).map(t => {
      const isAmalgam = t.status === 'amalgam';
      const isZirconia = t.status === 'zirconia_implant';
      const isNico = t.status === 'cavitation_nico';
      const isEndo = t.status === 'endodontic';
      const isCrown = t.status === 'ceramic_crown';
      
      const label = isAmalgam ? 'Amálgama Metálico (Troca SMART)' :
                    isZirconia ? 'Implante Cerâmico Zircônia' :
                    isNico ? 'Cavitação Óssea NICO/FDOK' :
                    isEndo ? 'Dente Tratado Endodonticamente' :
                    isCrown ? 'Coroa Cerâmica Metal-Free' : 'Outra Condição';

      return [
        `Elemento #${t.id}`,
        label,
        TOOTH_METADATA[t.id]?.meridian || 'Estômago / Baço-Pâncreas',
        t.notes || 'Avaliação biológica e plano de intervenção integrado'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Elemento', 'Classificação Biológica', 'Meridiano de Acupuntura', 'Observações Clínicas']],
      body: teethRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 27, 75],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: 'bold' },
        1: { cellWidth: 50 },
        2: { cellWidth: 42 },
        3: { cellWidth: 'auto' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 2. Seção: Correlações Sistêmicas Dente-Órgão (Tabela de Voll)
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Correlações Sistêmicas Dente-Órgão & Eletroacupuntura de Voll', margin, currentY);
  currentY += 3;

  const vollData = [
    ['Incisivos (#11, #12, #21, #22, #31, #32, #41, #42)', 'Rins, Bexiga, Sistema Urogenital, L5-S1', 'Medo / Insegurança, Lombalgias, Fadiga Renal'],
    ['Caninos (#13, #23, #33, #43)', 'Fígado, Vesícula Biliar, Tendões e Olhos', 'Irritabilidade, Tensão Muscular, Enxaquecas Oculares'],
    ['Pré-Molares (#14, #15, #24, #25, #34, #35, #44, #45)', 'Pulmão, Intestino Grosso, C2-C3, Pele', 'Tristeza / Pesar, Alergias, Constipação, Rinites'],
    ['Molares (#16, #17, #26, #27, #36, #37, #46, #47)', 'Estômago, Baço-Pâncreas, Mama, Tireoide', 'Preocupação, Má Digestão, Disbiose, Fadiga Crônica'],
    ['Sisos / 3º Molares (#18, #28, #38, #48)', 'Coração, Intestino Delgado, Sistema Nervoso Central', 'Ansiedade, Palpitações, Insônia, Sobrecarga Neural']
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Elementos Dentários (FDI)', 'Órgãos, Tecidos e Meridianos Relacionados', 'Sintomas & Repercussões Clínicas Sistêmicas']],
    body: vollData,
    theme: 'striped',
    headStyles: {
      fillColor: [67, 56, 202], // indigo-700
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 1.8
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 65 },
      2: { cellWidth: 'auto' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // 3. Seção: Pilares e Protocolos Ativos
  if (currentY < 240) {
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Protocolos Clínicos & Terapias Coadjuvantes Habilitadas', margin, currentY);
    currentY += 4;

    const protocols = [
      `• Protocolo SMART (IAOMT): ${data.amalgama_ativo ? 'HABILITADO - Remoção com dique, oxigênio e sucção de alta potência' : 'Conforme indicação da arcada'}`,
      `• Reabilitação Cerâmica Metal-Free: ${data.implante_zirconia_ativo ? 'HABILITADO - Implantes de Zircônia biocompatíveis + PRF' : 'Planejamento livre de ligas metálicas'}`,
      `• Descontaminação de Focos NICO/FDOK: ${data.focos_cavitacao_ativo ? 'HABILITADO - Curetagem biológica guiada por CBCT' : 'Ausência de cavitações ativas'}`,
      `• Ozonioterapia Odontológica: ${data.ozonioterapia_ativo ? 'HABILITADO - Água ozonizada e insuflação gasosa pré/pós' : 'Protocolo antisséptico padrão'}`
    ];

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    protocols.forEach(p => {
      doc.text(p, margin + 2, currentY);
      currentY += 3.8;
    });
  }

  drawPageFooter(1, 2);

  // =========================================================================
  // PÁGINA 2: CRONOGRAMA 4 FASES & PRESCRIÇÃO SISTÊMICA
  // =========================================================================
  doc.addPage('a4', 'portrait');
  drawTimbradaHeader(2);
  drawPatientBox('Plano Terapêutico Biológico: Cronograma em 4 Fases & Suplementação', 'Página 2 de 2');

  currentY = 57;

  // 1. Cronograma em 4 Fases
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Cronograma Operatório Sequencial em 4 Fases Biológicas', margin, currentY);
  currentY += 3;

  const phasesData = [
    [
      'FASE 1: PREPARO & DETOX\n(30 a 45 dias prévios)',
      'Otimização do Terreno Biológico',
      '• Vitamina D3 (>60 ng/mL) e Vitamina K2 (MK-7)\n• Suporte hepático (Glutationa / Silimarina) e hidratação celular\n• Eliminação de focos de disbiose e inflamação subclínica'
    ],
    [
      'FASE 2: CIRURGIAS & SMART\n(Sessões Cirúrgicas)',
      'Remoção de Focos & Cargas',
      '• Remoção Segura de Amálgamas segundo o protocolo SMART da IAOMT\n• Tratamento de cavitações ósseas NICO/FDOK e exodontias biológicas\n• Descontaminação profunda com Ozônio Medicinal e Terapia Neural'
    ],
    [
      'FASE 3: METAL-FREE & PRF\n(Reabilitação Estrutural)',
      'Reconstrução Imunológica',
      '• Instalação de Implantes Cerâmicos de Zircônia 100% livres de metal\n• Enxertia biológica com Fibrina Rica em Plaquetas (PRF / i-PRF)\n• Restaurações estéticas livres de bisfenol e monômeros tóxicos'
    ],
    [
      'FASE 4: INTEGRAÇÃO & MANUTENÇÃO\n(Pós-Cirúrgico Contínuo)',
      'Estabilidade & Longevidade',
      '• Quelagênio residual suave (Chlorella / Vitamina C injetável/lipossomal)\n• Termografia e reavaliação dos meridianos de acupuntura\n• Manutenção periódica da saúde periodontal e microbiota oral'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Fase e Janela Temporal', 'Objetivo Clínico', 'Diretrizes Operatórias & Cuidados Integrativos']],
    body: phasesData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 27, 75],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2
    },
    styles: {
      fontSize: 7,
      cellPadding: 2.2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 'auto' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 2. Protocolo de Suplementação
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Protocolo de Suplementação Sistêmica Pré e Pós-Operatória', margin, currentY);
  currentY += 3;

  const suppData = [
    ['Vitamina D3 + Vitamina K2 (MK-7)', '5.000 a 10.000 UI + 100 mcg/dia', 'Elevar níveis séricos para osteointegração sólida e modulação do sistema imune.'],
    ['Vitamina C Tamponada + Bioflavonoides', '1.000 mg a 2.000 mg/dia', 'Estímulo à síntese de colágeno, ação antioxidante e proteção contra estresse oxidativo.'],
    ['Zinco Quelato + Magnésio Dimalato', '30 mg (Zn) + 300 mg (Mg)/dia', 'Cicatrização óssea/mucosa e relaxamento neuromuscular mastigatório.'],
    ['Arnica Montana CH6 (Homeopatia)', '5 glóbulos 3x ao dia (pré e pós)', 'Minimizar edema pós-cirúrgico, dor e acelerar a recuperação tecidual.'],
    ['Coenzima Q10 (Ubiquinol)', '100 mg a 200 mg/dia', 'Energia mitocondrial e regeneração periodontal biológica.']
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Suplemento / Nutracêutico', 'Posologia Recomendada', 'Finalidade Terapêutica Biológica']],
    body: suppData,
    theme: 'striped',
    headStyles: {
      fillColor: [16, 185, 129], // emerald-600
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      cellPadding: 1.8
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 45 },
      2: { cellWidth: 'auto' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Orientações Finais
  if (currentY < 245) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Orientações e Termo de Compromisso Biológico:', margin + 3, currentY + 4.5);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    const terms = 'O paciente declara estar ciente de que a Odontologia Biológica busca restabelecer a harmonia entre dentes, meridianos e o sistema imunológico global. O cumprimento do protocolo nutricional pré e pós-operatório é fundamental para o sucesso das cirurgias e integração dos implantes cerâmicos.';
    doc.text(doc.splitTextToSize(terms, contentWidth - 6), margin + 3, currentY + 8.5);
  }

  drawPageFooter(2, 2);

  return doc;
}
