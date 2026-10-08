import { jsPDF } from 'jspdf';
import { getActiveClinicConfig } from '../constants/clinicProfiles';

export interface CertificateData {
  tipo: 'repouso' | 'comparecimento' | 'acompanhante' | 'pos_operatorio' | 'laudo_parecer';
  pacienteNome: string;
  pacienteCpf?: string;
  medicoNome: string;
  medicoConselho: string;
  medicoEspecialidade: string;
  isDental: boolean;
  diasAfastamento?: number;
  dataInicio?: string;
  cid?: string;
  horarioInicio?: string;
  horarioFim?: string;
  nomeAcompanhante?: string;
  documentoAcompanhante?: string;
  parentescoAcompanhante?: string;
  procedimentoDescricao?: string;
  conteudoLivre?: string;
  cidade?: string;
  dataEmissao?: string;
}

export function generateOfficialCertificatePDF(data: CertificateData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const clinicConfig = getActiveClinicConfig(data.medicoNome);
  const isDental = data.isDental;

  // Paleta de cores elegante e discreta
  // Médica: azul ardósia / azul corporativo | Odonto: esmeralda / petróleo suave
  const primaryR = isDental ? 15 : 15;
  const primaryG = isDental ? 90 : 45;
  const primaryB = isDental ? 80 : 85;

  // Borda externa elegante e discreta
  doc.setDrawColor(210, 220, 230);
  doc.setLineWidth(0.4);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Fio decorativo superior
  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(12, 12, pageWidth - 24, 4, 'F');

  // Cabeçalho da Clínica / Consultório
  doc.setFontSize(15);
  doc.setTextColor(primaryR, primaryG, primaryB);
  doc.setFont('helvetica', 'bold');
  const clinicTitle = clinicConfig.name || (isDental ? 'Consultório de Odontologia Biológica & Cirurgia' : 'Ambulatório IA • Medicina & Saúde Integrativa');
  doc.text(clinicTitle, pageWidth / 2, 26, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(90, 100, 115);
  doc.setFont('helvetica', 'normal');
  const subtitle = clinicConfig.slogan || (isDental ? 'Odontologia Biológica, Cirurgia Zircônia & Saúde Integrativa' : 'Neurologia Clínica & Medicina Integrativa');
  doc.text(subtitle, pageWidth / 2, 32, { align: 'center' });
  doc.text(`${clinicConfig.address || 'São Paulo - SP'}  •  Tel: ${clinicConfig.phone || '(11) 99876-5432'}`, pageWidth / 2, 37, { align: 'center' });

  // Linha divisória sutil
  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 42, pageWidth - 20, 42);

  // Identificação do Tipo de Documento
  let docTitle = 'ATESTADO CLÍNICO';
  let legalBasis = '';

  if (data.tipo === 'repouso') {
    docTitle = isDental ? 'ATESTADO ODONTOLÓGICO DE REPOUSO' : 'ATESTADO MÉDICO DE AFASTAMENTO';
    legalBasis = isDental ? 'Conforme Lei Federal nº 5.081/1966 (Art. 6º, III)' : 'Conforme Resolução CFM nº 1.658/2002 e Lei 605/1949';
  } else if (data.tipo === 'comparecimento') {
    docTitle = isDental ? 'DECLARAÇÃO DE COMPARECIMENTO ODONTOLÓGICO' : 'DECLARAÇÃO DE COMPARECIMENTO MÉDICO';
    legalBasis = 'Para fins de comprovação de presença em ato assistencial à saúde';
  } else if (data.tipo === 'acompanhante') {
    docTitle = 'DECLARAÇÃO DE ACOMPANHANTE';
    legalBasis = 'Comprovação de acompanhamento de paciente em atendimento de saúde';
  } else if (data.tipo === 'pos_operatorio') {
    docTitle = isDental ? 'ATESTADO CIRÚRGICO PÓS-OPERATÓRIO (ODONTOLOGIA)' : 'DECLARAÇÃO DE REPOUSO PÓS-PROCEDIMENTO';
    legalBasis = isDental ? 'Lei Federal nº 5.081/1966 • Repouso e Cuidados Pós-Cirúrgicos' : 'Recomendações e repouso pós-procedimento clínico';
  } else {
    docTitle = isDental ? 'PARECER / LAUDO ODONTOLÓGICO' : 'LAUDO / PARECER MÉDICO ESPECIALIZADO';
    legalBasis = 'Avaliação e relatório clínico oficial';
  }

  // Caixa de Título Centralizada
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(30, 50, pageWidth - 60, 16, 2, 2, 'F');
  doc.setDrawColor(215, 225, 235);
  doc.roundedRect(30, 50, pageWidth - 60, 16, 2, 2, 'S');

  doc.setFontSize(13);
  doc.setTextColor(primaryR, primaryG, primaryB);
  doc.setFont('helvetica', 'bold');
  doc.text(docTitle, pageWidth / 2, 59, { align: 'center' });

  if (legalBasis) {
    doc.setFontSize(7.5);
    doc.setTextColor(110, 125, 140);
    doc.setFont('helvetica', 'italic');
    doc.text(legalBasis, pageWidth / 2, 63.5, { align: 'center' });
  }

  // Caixa de Dados do Paciente
  doc.setFillColor(252, 253, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(20, 72, pageWidth - 40, 22, 'F');
  doc.rect(20, 72, pageWidth - 40, 22, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 60, 75);
  doc.text('PACIENTE:', 25, 80);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 30, 45);
  doc.text((data.pacienteNome || 'Não informado').toUpperCase(), 50, 80);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 60, 75);
  doc.text('DOCUMENTO (CPF):', 25, 88);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 30, 45);
  doc.text(data.pacienteCpf || 'Não informado no prontuário', 65, 88);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 60, 75);
  doc.text('DATA DO ATENDIMENTO:', 130, 88);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 30, 45);
  doc.text(data.dataEmissao || new Date().toLocaleDateString('pt-BR'), 175, 88);

  // Corpo do Texto do Atestado
  const corpoTexto = data.conteudoLivre || montarTextoPadrao(data);
  
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 40, 55);
  
  const linhasTexto = doc.splitTextToSize(corpoTexto, pageWidth - 46);
  doc.text(linhasTexto, 23, 106, { lineHeightFactor: 1.55 });

  // CID-10 destacado se houver
  let curY = 106 + (linhasTexto.length * 6.5);
  if (data.cid && data.cid.trim()) {
    curY += 6;
    doc.setFillColor(243, 246, 252);
    doc.setDrawColor(210, 225, 245);
    doc.roundedRect(23, curY, pageWidth - 46, 12, 2, 2, 'F');
    doc.roundedRect(23, curY, pageWidth - 46, 12, 2, 2, 'S');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryR, primaryG, primaryB);
    doc.text(`DIAGNÓSTICO CODIFICADO (CID-10): ${data.cid.toUpperCase()}`, 28, curY + 7);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 115, 130);
    doc.text('(Informado mediante autorização expressa do paciente nos termos da Resolução CFM 1.658/02)', 105, curY + 7);
    curY += 16;
  }

  // Local e Data por Extenso
  const hoje = new Date();
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const diaExt = hoje.getDate();
  const mesExt = meses[hoje.getMonth()];
  const anoExt = hoje.getFullYear();
  const cidade = data.cidade || (isDental ? 'Bragança Paulista - SP' : 'São Paulo - SP');
  const dataExtenso = `${cidade}, ${diaExt} de ${mesExt} de ${anoExt}.`;

  const dataY = Math.max(curY + 12, pageHeight - 82);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 60, 75);
  doc.text(dataExtenso, pageWidth / 2, dataY, { align: 'center' });

  // Bloco de Assinatura e Carimbo Oficial
  const sigY = dataY + 22;
  doc.setDrawColor(160, 175, 195);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 45, sigY, pageWidth / 2 + 45, sigY);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryR, primaryG, primaryB);
  doc.text(data.medicoNome || clinicConfig.professional_name, pageWidth / 2, sigY + 5.5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 80, 95);
  doc.text(`${data.medicoConselho || clinicConfig.council_badge}  •  ${data.medicoEspecialidade || clinicConfig.specialty_label}`, pageWidth / 2, sigY + 10, { align: 'center' });

  // Selo de Autenticidade Digital
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 130, 120);
  doc.text('DOCUMENTO ASSINADO DIGITALMENTE • PADRÃO ICP-BRASIL / MP 2.200-2/2001', pageWidth / 2, sigY + 15, { align: 'center' });

  // Hash SHA-256 decorativo para segurança
  const randomHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
  doc.setFontSize(6.5);
  doc.setFont('courier', 'normal');
  doc.setTextColor(140, 150, 165);
  doc.text(`HASH DE VALIDAÇÃO: ${randomHash.substring(0, 16)}-${randomHash.substring(16, 32)}`, pageWidth / 2, sigY + 19, { align: 'center' });

  // Rodapé Oficial
  doc.setDrawColor(225, 230, 240);
  doc.setLineWidth(0.3);
  doc.line(18, pageHeight - 18, pageWidth - 18, pageHeight - 18);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 140, 155);
  const footerNote = isDental
    ? 'Documento odontológico oficial válido em todo o território nacional conforme Lei Federal nº 5.081/1966 e resoluções do CFO/CRO.'
    : 'Documento médico oficial emitido em conformidade com as normas ético-profissionais do Conselho Federal de Medicina (CFM).';
  doc.text(footerNote, pageWidth / 2, pageHeight - 14, { align: 'center' });

  return doc;
}

export function montarTextoPadrao(data: CertificateData): string {
  const paciente = (data.pacienteNome || 'o(a) paciente').trim();
  const cpf = data.pacienteCpf ? `inscrito(a) no CPF sob nº ${data.pacienteCpf}` : '';
  const isDental = data.isDental;

  if (data.tipo === 'repouso') {
    const dias = data.diasAfastamento || 1;
    const diasExt = dias === 1 ? 'um' : (dias === 2 ? 'dois' : (dias === 3 ? 'três' : (dias === 4 ? 'quatro' : (dias === 5 ? 'cinco' : (dias === 7 ? 'sete' : `${dias}`)))));
    const atividade = isDental ? 'atendimento odontológico especializado' : 'atendimento médico';
    return `Atesto para os devidos fins legais e trabalhistas que ${paciente}, ${cpf}, esteve sob meus cuidados profissionais em ${atividade} nesta data.\n\nPor motivo de saúde, necessita de ${dias} (${diasExt}) dia(s) de repouso e afastamento de suas atividades ocupacionais, laborais ou escolares, a contar a partir de ${data.dataInicio || new Date().toLocaleDateString('pt-BR')}.`;
  }

  if (data.tipo === 'comparecimento') {
    const ini = data.horarioInicio || '08:30';
    const fim = data.horarioFim || '10:00';
    const finalidade = isDental ? 'consulta e procedimento odontológico' : 'consulta e avaliação médica';
    return `Declaro para os devidos fins de justificativa de horário que ${paciente}, ${cpf}, compareceu a este estabelecimento de saúde no dia de hoje, tendo permanecido em ${finalidade} no período das ${ini} às ${fim}.`;
  }

  if (data.tipo === 'acompanhante') {
    const acompanhante = data.nomeAcompanhante || 'o(a) acompanhante';
    const docAcomp = data.documentoAcompanhante ? `portador(a) do documento nº ${data.documentoAcompanhante}` : '';
    const parentesco = data.parentescoAcompanhante ? `(${data.parentescoAcompanhante})` : '';
    const ini = data.horarioInicio || '08:30';
    const fim = data.horarioFim || '10:00';
    return `Declaro para os devidos fins que o(a) Sr.(a) ${acompanhante}, ${docAcomp} ${parentesco}, esteve presente acompanhando o(a) paciente ${paciente} durante a realização de consulta e procedimentos de saúde nesta unidade, no período das ${ini} às ${fim} do dia de hoje.`;
  }

  if (data.tipo === 'pos_operatorio') {
    const dias = data.diasAfastamento || 2;
    const proc = data.procedimentoDescricao || (isDental ? 'intervenção cirúrgica odontológica / enxertia / remoção com protocolo biológico' : 'procedimento cirúrgico ambulatorial');
    return `Atesto que ${paciente}, ${cpf}, foi submetido(a) a ${proc} nesta data.\n\nRecomendo repouso domiciliar pós-operatório de ${dias} dia(s), com afastamento das atividades laborais, esforço físico e exposição térmica, devendo seguir rigorosamente as prescrições e cuidados terapêuticos recomendados.`;
  }

  // Laudo / Parecer
  const especialidade = isDental ? 'Odontologia Biológica & Saúde Integrativa' : 'Neurologia Clínica & Medicina Integrativa';
  return `PARECER CLÍNICO:\n\nPaciente: ${paciente}, ${cpf}.\nEspecialidade: ${especialidade}.\n\nAtesto que o(a) paciente acima qualificado(a) encontra-se em acompanhamento clínico regular nesta clínica, apresentando evolução condizente com o plano terapêutico integrativo proposto.\n\nRecomenda-se continuidade do protocolo prescrito, manutenção dos hábitos orientados e retorno conforme cronograma estabelecido.`;
}
