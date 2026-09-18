import { jsPDF } from 'jspdf';

interface Chapter {
  number: string;
  title: string;
  category: string;
  summary: string;
  highlights: { title: string; desc: string }[];
  details: string[];
}

export function generateManualClinicoPDF(manualType: 'dra_lucy' | 'dr_carlos'): void {
  const isLucy = manualType === 'dra_lucy';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Paleta de Cores
  const primaryColor = isLucy ? [13, 148, 136] : [30, 58, 138]; // Teal-600 vs Blue-900
  const headerBgColor = isLucy ? [15, 23, 42] : [15, 23, 42]; // Slate-900
  const accentColor = isLucy ? [16, 185, 129] : [59, 130, 246]; // Emerald vs Blue
  const textDark = [15, 23, 42];
  const textMuted = [71, 85, 105];

  let currentY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(
      isLucy 
        ? 'MANUAL CLÍNICO • DRA. LUCY MORATA • ODONTOLOGIA BIOLÓGICA & DSD'
        : 'MANUAL CLÍNICO • DR. CARLOS MORATO • NEUROLOGIA & MEDICINA INTEGRATIVA',
      margin,
      10
    );
    doc.text('AMBULATÓRIO IA', pageWidth - margin, 10, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
    currentY = 18;
  };

  // 1. CAPA / CABEÇALHO DO MANUAL
  doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
  doc.roundedRect(margin, currentY, contentWidth, 42, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isLucy 
      ? 'PROTOCOLO CLÍNICO AVANÇADO • CRO/SP 98.412' 
      : 'PROTOCOLO CLÍNICO AVANÇADO • CRM/SP 145.892', 
    margin + 6, 
    currentY + 9
  );

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isLucy 
      ? 'Manual Clínico: Odontologia Biológica & Saúde Sistêmica' 
      : 'Manual Clínico: Neurologia & Medicina Integrativa', 
    margin + 6, 
    currentY + 18
  );

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text(
    isLucy 
      ? 'Dra. Lucy Morata • Odontologia Biológica, Cirurgia Zircônia, DSD, CBCT e Terapia Neural' 
      : 'Dr. Carlos Morato • Neurologia Clínica, Exame de Wexler, Dermátomos e Ortomolecular', 
    margin + 6, 
    currentY + 26
  );

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Ambulatório IA • Gestor & Administrador: Marco Duarte • Versão Oficial 4.6', 
    margin + 6, 
    currentY + 34
  );

  currentY += 48;

  // Definindo capítulos detalhados
  const lucyChapters: Chapter[] = [
    {
      number: '1',
      title: 'Visão Geral da Odontologia Biológica & Saúde Sistêmica',
      category: 'Fundamentos Clínicos',
      summary: 'A odontologia biológica compreende que cada elemento dentário possui conexão vascular, linfática, neural e bioenergética direta com o organismo como um todo.',
      highlights: [
        { title: 'Biocompatibilidade de Materiais', desc: 'Priorização de materiais inertes (Zircônia pura, cerâmica vítrea e resinas livres de BPA).' },
        { title: 'Biorregulação & Focos Ocultos', desc: 'Investigação ativa de campos de interferência que sustentam doenças autoimunes e fadiga crônica.' }
      ],
      details: [
        'A boca não é um sistema isolado. Restaurações metálicas com mercúrio, infecções periapicais crônicas e cavitações ósseas podem desencadear processos inflamatórios sistêmicos de baixo grau.',
        'O prontuário da Dra. Lucy foi projetado para integrar a anamnese odontológica com sintomas sistêmicos, guiando um plano de tratamento biológico e minimamente invasivo.'
      ]
    },
    {
      number: '2',
      title: 'Odontograma Anatômico 3D & Tabela de Meridianos (FDI 11 a 48)',
      category: 'Mapeamento Anatômico & Bioenergético',
      summary: 'Mapeamento visual e interativo dos 32 dentes permanentes com correlação direta dente-órgão-meridiano da Medicina Tradicional Chinesa.',
      highlights: [
        { title: 'Nomenclatura FDI Internacional', desc: 'Arcada superior (18 a 28) e inferior (48 a 38) com códigos de cores clínicos instantâneos.' },
        { title: 'Meridianos dos Dentes Anteriores (11, 12, 21, 22)', desc: 'Conexão com Rins, Bexiga, Sistema Urogenital e vértebras L2/L3.' },
        { title: 'Meridianos dos Molares (16, 26, 36, 46)', desc: 'Conexão com Estômago, Baço-Pâncreas, Tireoide e vértebras T11/T12.' }
      ],
      details: [
        'Ao clicar em qualquer dente no odontograma interativo, o sistema exibe imediatamente os órgãos, glândulas, articulações e vértebras reflexas associadas.',
        'Permite registrar laudos tomográficos específicos, condutas biológicas e notas clínicas personalizadas por elemento.'
      ]
    },
    {
      number: '3',
      title: 'Protocolo SMART (IAOMT) — Remoção Segura de Amálgama',
      category: 'Biossegurança & Toxicologia',
      summary: 'Norma internacional de segurança máxima para extração de restaurações de amálgama dental sem contaminação do paciente, da equipe ou do meio ambiente.',
      highlights: [
        { title: 'Dique de Borracha de Nitrilo Não-Látex', desc: 'Isolamento absoluto que impede a deglutição de partículas e fragmentos de mercúrio.' },
        { title: 'Oxigênio Nasal a 100%', desc: 'Suprimento de ar limpo para o paciente durante todo o procedimento de desgaste.' },
        { title: 'Exaustor de Vapores & Alta Irrigação', desc: 'Captação a vácuo dos vapores de mercúrio associada à refrigeração abundante com soro/água gelada.' },
        { title: 'Suporte Nutricional Quelante', desc: 'Uso de Carvão Ativado / Chlorella intraoral e quelação com Vitamina C lipossomal.' }
      ],
      details: [
        'O sistema conta com o botão "Preset SMART": com apenas 1 clique, todos os itens de biossegurança são marcados e a conduta clínica é documentada para fins éticos e legais.'
      ]
    },
    {
      number: '4',
      title: 'Implantes de Zircônia Metal-Free & Membranas L-PRF',
      category: 'Implantodontia Biológica',
      summary: 'Reabilitação cirúrgica livre de metais com pinos cerâmicos de dióxido de zircônio e bioestimulação autóloga com Fibrina Rica em Plaquetas e Leucócitos.',
      highlights: [
        { title: 'Zircônia Cerâmica Biocompatível', desc: 'Zero corrosão galvânica, não condutora elétrica/térmica e excelente resposta tecidual gengival.' },
        { title: 'Membranas L-PRF (Fibrina Leucoplaquetária)', desc: 'Aceleração da neoangiogênese e regeneração óssea a partir do sangue do próprio paciente.' },
        { title: 'Cirurgia Guiada 3D', desc: 'Posicionamento tridimensional prototipado a partir de Tomografia Cone Beam.' }
      ],
      details: [
        'Permite documentar o sistema de implante utilizado, o tipo de enxerto ósseo particulado e o protocolo de centrifugação do PRF diretamente no prontuário.'
      ]
    },
    {
      number: '5',
      title: 'Cavitações Ósseas NICO / FDOK & Mediador Inflamatório RANTES/CCL5',
      category: 'Osteonecrose Isquêmica',
      summary: 'Diagnóstico e abordagem terapêutica de infecções ósseas crônicas silenciosas em áreas de extrações dentárias prévias (especialmente terceiros molares 18, 28, 38 e 48).',
      highlights: [
        { title: 'Diagnóstico por Tomografia CBCT', desc: 'Identificação de áreas hipodensas trabeculares e defeitos osteomedulares não visíveis em radiografias comuns.' },
        { title: 'Mediador RANTES / CCL5', desc: 'Desintoxicação de citocinas pró-inflamatórias que mantêm doenças inflamatórias crônicas.' },
        { title: 'Desbridamento Biológico & O3', desc: 'Curetagem conservadora da cavidade, insuflação com ozônio medicinal e vedação biológica.' }
      ],
      details: [
        'O prontuário da Dra. Lucy possui módulo dedicado para listar os quadrantes afetados, grau de cavitação e resposta sistêmica pós-intervenção.'
      ]
    },
    {
      number: '6',
      title: 'Ozonioterapia Odontológica & Terapia Neural com Procaína',
      category: 'Bioestimulação & Campo de Interferência',
      summary: 'Recursos avançados para eliminação de biofilmes patogênicos e desbloqueio de campos de interferência autonômicos.',
      highlights: [
        { title: 'Ozônio Medicinal (O3)', desc: 'Utilização de gás de ozônio para descontaminação cavitária, água ozonizada para irrigação cirúrgica e óleo ozonizado para cicatrização tecidual.' },
        { title: 'Terapia Neural (Procaína a 0,7%)', desc: 'Infiltrações em cicatrizes pós-operatórias, pontos de dor na ATM e áreas de dentes tratados endodonticamente para repolarização da membrana celular.' }
      ],
      details: [
        'Permite selecionar modalidades de ozonioterapia com um clique e especificar os sítios anatômicos de aplicação de terapia neural.'
      ]
    },
    {
      number: '7',
      title: 'Recepção Inteligente, Agenda Automatizada & Pré-Anamnese via WhatsApp',
      category: 'Fluxo Operacional & Automação de Recepção',
      summary: 'Sistema automatizado que conecta o agendamento de consultas cirúrgicas/clínicas, envio imediato do formulário de pré-anamnese biológica no WhatsApp e triagem em tempo real.',
      highlights: [
        { title: 'Agendamento com Pré-Anamnese Instantânea', desc: 'Ao cadastrar o paciente na agenda, o sistema dispara automaticamente para o WhatsApp um link interativo para o paciente preencher o histórico biológico no próprio celular.' },
        { title: 'Sincronização Direta no Prontuário', desc: 'As respostas de histórico médico, cirurgias, queixa principal e alergias já chegam pré-carregadas no prontuário da Dra. Lucy antes do paciente sentar na cadeira.' },
        { title: 'Redução Drástica de No-Show (Faltas)', desc: 'Lembretes automáticos com orientações prévias de consulta, horário, localização e botão de confirmação ativa de presença.' },
        { title: 'Gestão de Fila & Orçamentos', desc: 'Controle de status em tempo real (Aguardando Atendimento, Em Procedimento e Finalizado) e emissão de orçamentos e recibos com 1 clique.' }
      ],
      details: [
        'A Dra. Lucy ganha de 15 a 20 minutos por consulta, não precisando preencher dados básicos de cadastro ou históricos repetitivos manualmente.',
        'O paciente vivencia uma experiência de atendimento de altíssimo padrão tecnológico e acolhimento humano desde o primeiro contato.'
      ]
    },
    {
      number: '8',
      title: 'Prescrição & Suporte Nutricional Pré e Pós-Operatório',
      category: 'Suplementação Sistêmica',
      summary: 'Protocolo ortomolecular desenhado para elevar a imunidade, otimizar a densidade óssea e neutralizar estresse oxidativo cirúrgico.',
      highlights: [
        { title: 'Vitamina D3 (10.000 UI) + Vitamina K2 (MK-7 120mcg)', desc: 'Fixação adequada do cálcio no tecido ósseo e imunomodulação.' },
        { title: 'Vitamina C Tamponada / Lipossomal (1.000mg a 2.000mg)', desc: 'Síntese de colágeno e ação antioxidante quelante.' },
        { title: 'Zinco Quelato (30mg) + Magnésio Dimalato (300mg)', desc: 'Coenzimas essenciais para cicatrização e relaxamento muscular mastigatório.' },
        { title: 'Homeopatia: Arnica Montana 6CH', desc: 'Prevenção de edema, hematomas e trauma tecidual.' }
      ],
      details: [
        'Gera receitas oficiais prontas para impressão e envio automático com assinatura digital para o WhatsApp do paciente.'
      ]
    },
    {
      number: '9',
      title: 'Simulador de Sorriso Digital (DSD) & Galeria Radiológica Integrada',
      category: 'Estética Biológica & Planejamento Facial',
      summary: 'Tecnologia visual integrada para calibração estética, proporção áurea dental e banco de imagens radiológicas e fotográficas.',
      highlights: [
        { title: 'Simulador de Sorriso DSD Interativo', desc: 'Carregamento de foto do paciente, calibrador de linha média, zênite gengival e simulação de facetas cerâmicas antes do preparo.' },
        { title: 'Galeria Radiológica & Panorâmica', desc: 'Armazenamento de exames e laudos vinculados diretamente à ficha do paciente sem necessidade de softwares externos.' }
      ],
      details: [
        'Enquanto clínicas convencionais precisam de 3 a 4 softwares diferentes (DSD, DICOM, prontuário e receituário), o Ambulatório IA unifica toda a jornada estética e cirúrgica.'
      ]
    },
    {
      number: '10',
      title: 'Scanner Tomográfico IA (CBCT), Precisão Diagnóstica & Galvanismo por Voz',
      category: 'Visão Computacional & Bioeletricidade Oral',
      summary: 'Leitura multimodal com Gemini 2.5 Flash Vision, taxas reais de acerto, limites científicos do 100% e aferição hands-free de microvoltagem oral.',
      highlights: [
        { title: 'Scanner Laser Multimodal (CBCT/Panorâmica)', desc: 'Identifica amálgamas, implantes e rarefações trabeculares NICO/FDOK com animação laser e correlação bioenergética de Voll.' },
        { title: 'Taxas Reais de Precisão da IA', desc: 'Metais e amálgamas (~90-95%), endodontias (~85-90%), edentulismo (~95%) e cavitações NICO (~70-80%). Nenhuma IA atinge 100% devido a artefatos de beam hardening e variações anatômicas; a validação final é 100% soberana da Dra. Lucy.' },
        { title: 'Galvanismo Oral & Microvoltímetro Hands-Free', desc: 'Aferição de sobrecarga bioelétrica em mV com voltímetro de contato. A Dra. Lucy dita com luvas estéreis (ex: "Dente 16 com 250 mV") e a IA preenche o odontograma 3D sem quebrar a assepsia cirúrgica.' }
      ],
      details: [
        'A visão computacional atua como copiloto de visão aumentada, e o preenchimento de galvanismo por voz garante biossegurança estrita e zero tempo de digitação.'
      ]
    },
    {
      number: '11',
      title: 'Inteligência Artificial & Escuta Ambiental Odontológica (30 a 40 Minutos)',
      category: 'Inteligência Artificial & Produtividade',
      summary: 'Captação contínua da consulta odontológica sem interrupções, descartando ruídos mecânicos e preenchendo o prontuário em tempo real.',
      highlights: [
        { title: 'Escuta Ambiental Hands-Free', desc: 'A Dra. Lucy deixa o microfone ligado durante toda a avaliação de 30 a 40 minutos com o paciente.' },
        { title: 'Mapeamento Instantâneo do Odontograma', desc: 'Ao conversar naturalmente sobre os dentes (ex: "amálgama no 36 com SMART, implante de zircônia no 11"), a IA marca o odontograma com as cores exatas.' },
        { title: 'S.O.A.P. & Prescrição Automática', desc: 'Ao clicar em "Parar Gravação", a IA estrutura o laudo, calcula as correlações com os meridianos e prepara a receita cirúrgica.' }
      ],
      details: [
        'Zero tempo digitando no teclado após a consulta. Maior foco visual e conexão de acolhimento com o paciente.'
      ]
    }
  ];

  const carlosChapters: Chapter[] = [
    {
      number: '1',
      title: 'Visão Geral da Neurologia Clínica & Medicina Integrativa',
      category: 'Fundamentos Clínicos',
      summary: 'Abordagem neurológica aprofundada aliada à medicina metabólica, biorregulação do eixo intestino-cérebro e combate à neuroinflamação.',
      highlights: [
        { title: 'Avaliação Neurológica Sistêmica', desc: 'Integração de reflexos, pares cranianos e cognição com marcadores inflamatórios e carências nutricionais.' },
        { title: 'Decisão Clínica Baseada em Evidências', desc: 'Uso de inteligência artificial de escuta ambiental para transformar a consulta em dados estruturados.' }
      ],
      details: [
        'O prontuário do Dr. Carlos Morato conecta o exame físico neurológico objetivo com um amplo rastreamento de fitoterápicos, vitaminas, minerais e patógenos crônicos.'
      ]
    },
    {
      number: '2',
      title: 'Boneco Anatômico de Wexler — Graduação de Reflexos Profundos',
      category: 'Exame Físico Objetivo',
      summary: 'Estrutura interativa dos 8 pontos reflexos profundos simétricos com escala internacional de 0 a 4+.',
      highlights: [
        { title: '8 Pontos Reflexos', desc: 'Bíceps D/E (C5-C6), Estilorradial D/E (C5-C6), Patelar D/E (L3-L4) e Aquileu D/E (S1-S2).' },
        { title: 'Escala de Graduação', desc: '0 (Abolido), 1+ (Hipoativo), 2+ (Normal / Normorreflexia), 3+ (Vivo / Hiperativo) e 4+ (Clonus / Exaltado).' }
      ],
      details: [
        'Suporte híbrido: clique manual direto no boneco para alternar as notas ou preenchimento automático por comando de voz da IA.'
      ]
    },
    {
      number: '3',
      title: 'Mapa Anatômico de Dermátomos C2 a S5 & Sensibilidade',
      category: 'Exame Sensitivo Cutâneo',
      summary: 'Mapeamento topográfico segmentar da sensibilidade tátil, dolorosa e térmica em todos os níveis da medula espinhal.',
      highlights: [
        { title: 'Dermátomos Cervicais (C2 a C8)', desc: 'Cabeça, pescoço, ombros e membros superiores.' },
        { title: 'Dermátomos Torácicos (T1 a T12)', desc: 'Tórax, abdômen e linha da cicatriz umbilical (T10).' },
        { title: 'Dermátomos Lombossacrais (L1 a S5)', desc: 'Região inguinal, coxas, pernas, pés e sensibilidade perineal.' },
        { title: 'Classificação Clínica', desc: 'Normoestesia (Verde), Hipoestesia (Amarelo), Hiperestesia (Laranja), Parestesia (Roxo) e Anestesia (Vermelho).' }
      ],
      details: [
        'Permite a localização anatômica precisa de radiculopatias, compressões medulares e neuropatias periféricas.'
      ]
    },
    {
      number: '4',
      title: 'Força Muscular (Escala MRC 0 a 5) & Pares Cranianos (I a XII)',
      category: 'Exame Motor & Tronco Encefálico',
      summary: 'Avaliação motora de grupos musculares e integridade dos 12 pares de nervos cranianos.',
      highlights: [
        { title: 'Escala MRC de Força', desc: 'Grau 0 (Nenhuma contração) até Grau 5 (Força normal contra resistência máxima).' },
        { title: 'Pares Cranianos', desc: 'Olfatório (I), Óptico (II), Oculomotores (III, IV, VI), Trigêmeo (V), Facial (VII), Vestibulococlear (VIII), Glossofaríngeo (IX), Vago (X), Acessório (XI) e Hipoglosso (XII).' }
      ],
      details: [
        'A IA reconhece comandos clínicos durante a consulta e marca os desvios e assimetrias faciais ou de membros automaticamente.'
      ]
    },
    {
      number: '5',
      title: 'Mini-Exame do Estado Mental (MEEM / Folstein) & Mapeamento Corporal 360°',
      category: 'Avaliação Cognitiva & Álgica',
      summary: 'Rastreio cognitivo padronizado de 0 a 30 pontos e localização anatômica de pontos de dor.',
      highlights: [
        { title: 'Domínios do MEEM', desc: 'Orientação Temporal e Espacial, Memória Imediata, Atenção e Cálculo, Evocação e Linguagem.' },
        { title: 'Mapeamento Corporal 360°', desc: 'Boneco anterior e posterior para fixar pontos de dor miofascial, nevralgias e queixas corporais ativas.' }
      ],
      details: [
        'O sistema calcula a pontuação total do MEEM e ajusta o ponto de corte com base na escolaridade do paciente.'
      ]
    },
    {
      number: '6',
      title: 'Checklist Integrativo de Ortomolecular & Patógenos Crônicos',
      category: 'Medicina Metabólica & Imunológica',
      summary: 'Rastreamento sistemático de mais de 40 suplementos, aminoácidos, nootrópicos, minerais e infecções crônicas subclínicas.',
      highlights: [
        { title: 'Suplementos & Nootrópicos', desc: 'Fosfatidilserina, Coenzima Q10, Ácido Alfa-Lipóico, DHEA, Melatonina, Curcumina e Ômega-3 EPA/DHA.' },
        { title: 'Vitaminas & Minerais', desc: 'Vitamina D3, K2, Complexo B ativo (Metilfolato, B12), Magnésio, Selênio, Zinco e Cromo.' },
        { title: 'Rastreamento de Patógenos', desc: 'Investigação de Candida, Borrelia burgdorferi (Lyme), Chlamydia pneumoniae, HSV-1/2, Zoster e Citomegalovírus.' }
      ],
      details: [
        'Permite a personalização da conduta com base nas necessidades neuroenergéticas e metabólicas individuais.'
      ]
    },
    {
      number: '7',
      title: 'Recepção Inteligente, Agenda Automatizada & Pré-Anamnese via WhatsApp',
      category: 'Fluxo Operacional & Automação de Recepção',
      summary: 'Ecossistema automatizado que integra a marcação de consultas neurológicas e integrativas com envio automático do formulário de pré-anamnese clínica no WhatsApp do paciente.',
      highlights: [
        { title: 'Disparo Imediato da Pré-Anamnese', desc: 'Assim que o paciente é agendado, o sistema envia automaticamente no WhatsApp um link interativo para o paciente preencher queixa principal, sintomas e histórico médico.' },
        { title: 'Importação Automática para o Prontuário', desc: 'Quando o Dr. Carlos abre a ficha do paciente, todos os dados respondidos no celular já estão organizados no prontuário, poupando 15 a 20 minutos de digitação.' },
        { title: 'Confirmação Ativa & Lembrete de Exames', desc: 'Lembretes automáticos com orientações para o paciente trazer ressonâncias, tomografias, exames de sangue e receitas anteriores.' },
        { title: 'Triagem & Fila de Espera em Tempo Real', desc: 'Acompanhamento do status do paciente (Aguardando Médico, Em Consulta e Concluído) e envio de receitas por WhatsApp com 1 clique.' }
      ],
      details: [
        'O Dr. Carlos não perde tempo coletando dados cadastrais e histórico de rotina, dedicando 100% da consulta ao exame neurológico e raciocínio integrativo.',
        'Reduz a taxa de não comparecimento (no-show) e eleva a percepção de excelência tecnológica e cuidado do paciente.'
      ]
    },
    {
      number: '8',
      title: 'Prescrição Médica Inteligente & Receituário Oficial',
      category: 'Prescrição & Documentação Legal',
      summary: 'Emissão de receituários médicos em total conformidade com a Anvisa e Conselho Federal de Medicina.',
      highlights: [
        { title: 'Tipos de Receituário', desc: 'Receita Branca Simples, Controle Especial C1/C5 (Duas Vias) e Notificações de Receita.' },
        { title: 'Assinatura & Validação', desc: 'Inclusão de assinatura digitalizada, carimbo com CRM e QR Code para validação da autenticidade.' }
      ],
      details: [
        'Disponibiliza modelos de prescrição e integração direta para disparo de PDF no WhatsApp do paciente.'
      ]
    },
    {
      number: '9',
      title: 'Inteligência Artificial & Escuta Ambiental de Longa Duração (30 a 40 Minutos)',
      category: 'Inteligência Artificial & Escuta Contínua',
      summary: 'Gravação ambiental passiva e estruturação clínica de consultas completas de até 40 minutos com diarização e supressão de ruídos.',
      highlights: [
        { title: 'Captação de Longo Alcance', desc: 'Microfone capta a conversa ambiente com cancelamento de eco e supressão de ruídos de tráfego/ar-condicionado.' },
        { title: 'Filtragem Semântica', desc: 'Descarta barulhos de teclado e papéis, focando nos dados neurológicos e integrativos relevantes.' },
        { title: 'Preenchimento Multidimensional', desc: 'Marca o Boneco de Wexler, os Dermátomos, o Checklist Integrativo, o S.O.A.P. e a Receita com 1 clique.' }
      ],
      details: [
        'Permite ao Dr. Carlos manter 100% da atenção visual e humana no paciente durante toda a consulta médica.'
      ]
    }
  ];

  const chapters = isLucy ? lucyChapters : carlosChapters;

  // Renderiza cada capítulo
  chapters.forEach((chap) => {
    checkPageBreak(55);

    // Box do Capítulo
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 8, 2, 2, 'FD');

    // Título do Capítulo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`CAPÍTULO ${chap.number}: ${chap.title.toUpperCase()}`, margin + 3, currentY + 5.5);

    currentY += 12;

    // Categoria e Resumo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`Categoria: ${chap.category}`, margin, currentY);
    currentY += 4.5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const summaryLines = doc.splitTextToSize(chap.summary, contentWidth);
    doc.text(summaryLines, margin, currentY);
    currentY += summaryLines.length * 4.2 + 3;

    // Destaques / Tópicos
    chap.highlights.forEach((h) => {
      checkPageBreak(14);
      doc.setFillColor(isLucy ? 240 : 239, isLucy ? 253 : 246, isLucy ? 250 : 255);
      doc.setDrawColor(isLucy ? 204 : 191, isLucy ? 251 : 219, isLucy ? 241 : 254);
      doc.setLineWidth(0.2);
      
      const descLines = doc.splitTextToSize(h.desc, contentWidth - 10);
      const boxHeight = 6 + descLines.length * 3.8;

      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`• ${h.title}:`, margin + 3, currentY + 4.5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(descLines, margin + 3, currentY + 8.5);

      currentY += boxHeight + 2.5;
    });

    // Detalhes extras do capítulo
    if (chap.details && chap.details.length > 0) {
      chap.details.forEach((d) => {
        checkPageBreak(12);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        const dLines = doc.splitTextToSize(`→ ${d}`, contentWidth);
        doc.text(dLines, margin, currentY);
        currentY += dLines.length * 3.8 + 2;
      });
    }

    currentY += 4;
  });

  // RODAPÉ FINAL COM PÁGINAS
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Ambulatório IA • Sistema Integrado de Saúde & Odontologia Biológica', 
      margin, 
      pageHeight - 7
    );
    doc.text(
      `Página ${i} de ${totalPages}`, 
      pageWidth - margin, 
      pageHeight - 7, 
      { align: 'right' }
    );
  }

  // Nome do arquivo
  const fileName = isLucy
    ? 'Manual_Clinico_Dra_Lucy_Morata_Odontologia_Biologica.pdf'
    : 'Manual_Clinico_Dr_Carlos_Morato_Neurologia_Integrativa.pdf';

  doc.save(fileName);
}
