import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  FileCheck2,
  FileText,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Upload,
  RotateCcw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { BiologicalDentistryData } from './BiologicalDentistryForm';
import {
  TOOTH_METADATA,
  STATUS_CONFIG,
  normalizeToothStatus,
  ToothRecord
} from './InteractiveOdontogram';
import { WhiteLabelClinicBrand, calculatePreciseAge } from '../constants/clinicProfiles';

interface Props {
  dentalData: BiologicalDentistryData;
  onUpdateDentalData: (next: BiologicalDentistryData) => void;
  patientName: string;
  patientDob: string;
  patientPhone: string;
  brand: WhiteLabelClinicBrand;
}

type BodyZoneId =
  | 'head_sinus'
  | 'thyroid_throat'
  | 'heart_circulation'
  | 'lungs_respiratory'
  | 'stomach_liver'
  | 'intestines_gut'
  | 'kidneys_spine'
  | 'joints_muscles';

interface BodyZoneMeta {
  id: BodyZoneId;
  label: string;
  shortLabel: string;
  cx: number;
  cy: number;
  r: number;
  clinicalImpact: string;
  matchKeywords: string[];
}

const BODY_ZONES: BodyZoneMeta[] = [
  {
    id: 'head_sinus',
    label: 'Seios Maxilares, SNC & Trigêmeo',
    shortLabel: 'Cabeça & Seios',
    cx: 130,
    cy: 44,
    r: 18,
    clinicalImpact:
      'Focos nos molares superiores e sisos irradiam para seios maxilares, enxaquecas, zumbido e tensão no nervo trigêmeo.',
    matchKeywords: ['seio maxilar', 'sistema nervoso', 'trigêmeo', 'olho', 'ouvido']
  },
  {
    id: 'thyroid_throat',
    label: 'Tireoide, Amígdalas & Mucosa',
    shortLabel: 'Tireoide & Garganta',
    cx: 130,
    cy: 86,
    r: 14,
    clinicalImpact:
      'Pré-molares e terceiros molares compartilham drenagem linfática direta com a tireoide e anel amigdalino.',
    matchKeywords: ['tireoide', 'brônquios', 'mucosa']
  },
  {
    id: 'lungs_respiratory',
    label: 'Pulmões & Sistema Respiratório',
    shortLabel: 'Pulmões',
    cx: 108,
    cy: 130,
    r: 20,
    clinicalImpact:
      'Pré-molares superiores e molares inferiores associam-se ao meridiano Pulmão–Intestino Grosso, influenciando imunidade respiratória.',
    matchKeywords: ['pulmão', 'brônquios', 'respirat']
  },
  {
    id: 'heart_circulation',
    label: 'Coração & Sistema Cardiovascular',
    shortLabel: 'Coração',
    cx: 148,
    cy: 134,
    r: 17,
    clinicalImpact:
      'Sisos (18, 28, 38, 48) e canais infectados liberam mediadores inflamatórios ligados ao meridiano do Coração e ritmo cardíaco.',
    matchKeywords: ['coração', 'intestino delgado']
  },
  {
    id: 'stomach_liver',
    label: 'Estômago, Fígado & Pâncreas',
    shortLabel: 'Estômago & Fígado',
    cx: 122,
    cy: 176,
    r: 21,
    clinicalImpact:
      'Caninos ligam-se ao eixo Fígado/Vesícula; molares superiores e pré-molares inferiores ao eixo Estômago/Pâncreas.',
    matchKeywords: ['estômago', 'baço', 'pâncreas', 'fígado', 'vesícula']
  },
  {
    id: 'intestines_gut',
    label: 'Intestino Grosso, Delgado & Microbiota',
    shortLabel: 'Intestinos',
    cx: 130,
    cy: 222,
    r: 22,
    clinicalImpact:
      'Metais pesados (mercúrio de amálgamas) e toxinas bacterianas de canais afetam permeabilidade intestinal e imunidade.',
    matchKeywords: ['intestino', 'cólon']
  },
  {
    id: 'kidneys_spine',
    label: 'Rins, Bexiga & Coluna Lombar',
    shortLabel: 'Rins & Lombar',
    cx: 130,
    cy: 266,
    r: 18,
    clinicalImpact:
      'Incisivos centrais e laterais conectam-se diretamente ao eixo Rim–Bexiga, adrenal, vitalidade e coluna lombossacra.',
    matchKeywords: ['rim', 'bexiga', 'urogenital', 'lombar', 'adrenal']
  },
  {
    id: 'joints_muscles',
    label: 'Articulações (ATM, Ombro, Quadril, Joelho)',
    shortLabel: 'Articulações',
    cx: 82,
    cy: 332,
    r: 16,
    clinicalImpact:
      'Interferências oclusais e focos silenciosos perpetuam inflamação crônica em ombros, quadril, coluna e joelhos.',
    matchKeywords: ['joelho', 'quadril', 'ombro', 'atm', 'tendões']
  }
];

function mapToothToZones(toothNumber: number): BodyZoneId[] {
  const meta = TOOTH_METADATA[toothNumber];
  if (!meta) return [];
  const haystack = `${meta.organ} ${meta.meridian} ${meta.tissue} ${meta.vertebrae}`.toLowerCase();
  const matched = BODY_ZONES.filter((z) =>
    z.matchKeywords.some((kw) => haystack.includes(kw))
  ).map((z) => z.id);
  return matched.length > 0 ? matched : ['joints_muscles'];
}

export default function IntegrativePresentationSuite({
  dentalData,
  onUpdateDentalData,
  patientName,
  patientDob,
  patientPhone,
  brand
}: Props) {
  const [activeView, setActiveView] = useState<'boca_corpo' | 'plano_fases' | 'comparador'>('boca_corpo');
  const [selectedZoneId, setSelectedZoneId] = useState<BodyZoneId | null>(null);

  // Estado do Comparador Antes / Depois com fotos reais da clínica
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [splitPercent, setSplitPercent] = useState<number>(50);

  const flaggedTeeth = useMemo(() => {
    const raw = Object.values(dentalData.odontograma?.teeth || {}) as ToothRecord[];
    return raw
      .filter((t) => t && normalizeToothStatus(t.status) !== 'healthy')
      .sort((a, b) => a.id - b.id);
  }, [dentalData.odontograma]);

  const zoneToothMap = useMemo(() => {
    const map: Record<BodyZoneId, ToothRecord[]> = {
      head_sinus: [],
      thyroid_throat: [],
      lungs_respiratory: [],
      heart_circulation: [],
      stomach_liver: [],
      intestines_gut: [],
      kidneys_spine: [],
      joints_muscles: []
    };
    flaggedTeeth.forEach((tooth) => {
      const zones = mapToothToZones(tooth.id);
      zones.forEach((z) => {
        if (!map[z].some((t) => t.id === tooth.id)) {
          map[z].push(tooth);
        }
      });
    });
    return map;
  }, [flaggedTeeth]);

  const activeZones = useMemo(
    () => BODY_ZONES.filter((z) => zoneToothMap[z.id].length > 0),
    [zoneToothMap]
  );

  const focusedZone = useMemo(() => {
    if (selectedZoneId) return BODY_ZONES.find((z) => z.id === selectedZoneId) || null;
    return activeZones[0] || BODY_ZONES[3];
  }, [selectedZoneId, activeZones]);

  // Carregar caso exemplo completo para demonstração imediata
  const handleLoadShowcaseCase = () => {
    onUpdateDentalData({
      ...dentalData,
      odontograma: {
        teeth: {
          16: {
            id: 16,
            status: 'amalgam',
            galvanismo_mv: 215,
            cbctFindings: 'Amálgama extenso com microinfiltração e alto galvanismo (+215 mV)',
            biologicalPlan: 'Remoção Segura Protocolo SMART + Onlay Cerâmica'
          },
          26: {
            id: 26,
            status: 'endodontic',
            cbctFindings: 'Canal antigo com rarefação periapical próxima ao seio maxilar',
            biologicalPlan: 'Avaliação endodôntica biológica + Ozônio / Substituição Zircônia',
            neuralTherapy: true
          },
          21: {
            id: 21,
            status: 'zirconia_implant',
            cbctFindings: 'Espessura óssea favorável para reabilitação cerâmica anterior',
            biologicalPlan: 'Implante Zircônia Metal-Free + L-PRF'
          },
          38: {
            id: 38,
            status: 'cavitation_nico',
            cbctFindings: 'Área hipodensa NICO/FDOK em leito retromolar esquerdo',
            biologicalPlan: 'Curetagem biológica piezoelétrica + Ozônio + L-PRF + Terapia Neural',
            neuralTherapy: true
          }
        }
      },
      amalgama_ativo: true,
      presenca_amalgama: true,
      amalgama_elementos: '16',
      smart_dique_nitrilo: true,
      smart_oxigenio_nasal: true,
      smart_exaustor_vapor: true,
      smart_irrigacao_alta: true,
      smart_carvao_chlorella: true,
      smart_quelacao_vitc: true,
      focos_cavitacao_ativo: true,
      focos_descricao: 'Foco osteonecrótico NICO região 38 e lesão periapical no dente 26',
      focos_tomografia_cbct: 'Hipodensidade trabecular retromolar 38 + espessamento mucoso seio maxilar E',
      implante_zirconia_ativo: true,
      implante_elementos: '21',
      implante_tipo_sistema: 'Zircônia Monobloco / Cerâmica Pura',
      implante_estagio: 'Planejamento Tomográfico CBCT',
      implante_prf_ienxerto: true,
      implante_cirurgia_guiada: true,
      terapia_neural_ativo: true,
      terapia_neural_locais: 'Região retromolar 38, polo amigdalino esquerdo e fundo de vestíbulo 26',
      ozonioterapia_ativo: true,
      ozonio_modalidades: ['Insuflação Cavitacional', 'Água Ozonizada (Irrigação)'],
      suplemento_vit_d3_k2: true,
      suplemento_vit_c: true,
      suplemento_zinco_mg: true,
      suplemento_arnica_homeo: true
    });
    setSelectedZoneId(null);
    toast.success('Caso clínico integrativo demonstrativo carregado!');
  };

  // Construção automática das 3 Fases do Tratamento
  const threePhasesPlan = useMemo(() => {
    const amalgamTeeth = flaggedTeeth
      .filter((t) => normalizeToothStatus(t.status) === 'amalgam')
      .map((t) => t.id);
    const nicoEndoTeeth = flaggedTeeth
      .filter((t) => {
        const s = normalizeToothStatus(t.status);
        return s === 'cavitation_nico' || s === 'endodontic';
      })
      .map((t) => t.id);
    const rehabTeeth = flaggedTeeth
      .filter((t) => {
        const s = normalizeToothStatus(t.status);
        return s === 'zirconia_implant' || s === 'ceramic_crown' || s === 'missing';
      })
      .map((t) => t.id);

    const phase1Items: string[] = [];
    if (dentalData.suplemento_vit_d3_k2) phase1Items.push('Vitamina D3 + K2 (MK-7) para remodelação óssea ideal (>60 ng/mL)');
    if (dentalData.suplemento_vit_c) phase1Items.push('Vitamina C tamponada pré e pós-procedimento para síntese de colágeno');
    if (dentalData.suplemento_zinco_mg) phase1Items.push('Zinco + Magnésio Bisglicinato para resposta imune e muscular');
    if (dentalData.smart_carvao_chlorella) phase1Items.push('Quelantes naturais (Chlorella / Carvão Ativado) antes da remoção metálica');
    if (dentalData.suplemento_arnica_homeo) phase1Items.push('Arnica Montana / Homeopatia integrativa de suporte cicatricial');
    if (dentalData.suplemento_coenzima_q10) phase1Items.push('Coenzima Q10 + Probióticos para proteção mitocondrial');
    if (phase1Items.length === 0) {
      phase1Items.push('Avaliação de terreno biológico (Vitamina D3, Vitamina C, Zinco) antes de intervenções invasivas');
    }

    const phase2Items: string[] = [];
    if (dentalData.amalgama_ativo || amalgamTeeth.length > 0) {
      const list = dentalData.amalgama_elementos || amalgamTeeth.join(', ') || 'conforme odontograma';
      phase2Items.push(`Remoção Segura de Amálgama Protocolo SMART (IAOMT) nos dentes: ${list}`);
    }
    if (dentalData.focos_cavitacao_ativo || nicoEndoTeeth.length > 0) {
      const list = nicoEndoTeeth.length > 0 ? `Dentes/Regiões ${nicoEndoTeeth.join(', ')}` : 'Regiões sinalizadas na CBCT';
      phase2Items.push(`Saneamento de focos inflamatórios / cavitações NICO (${list}) com curetagem biológica e irrigação ozonizada`);
    }
    if (dentalData.terapia_neural_ativo || dentalData.ozonioterapia_ativo) {
      phase2Items.push('Repolarização neural (Procaína 0.5%) e descontaminação com Ozonioterapia / Laserterapia');
    }
    if (phase2Items.length === 0) {
      phase2Items.push('Marque amálgamas, canais ou focos NICO no odontograma para preencher automaticamente esta etapa');
    }

    const phase3Items: string[] = [];
    if (dentalData.implante_zirconia_ativo || rehabTeeth.length > 0) {
      const list = dentalData.implante_elementos || rehabTeeth.join(', ') || 'conforme planejamento';
      phase3Items.push(`Reabilitação Metal-Free / Implantes Cerâmicos em Zircônia (elementos: ${list})`);
    }
    if (dentalData.implante_prf_ienxerto) {
      phase3Items.push('Bioestimulação autóloga com membranas L-PRF / fibrina rica em plaquetas');
    }
    if (dentalData.implante_cirurgia_guiada) {
      phase3Items.push('Cirurgia Guiada 3D de alta precisão baseada em Tomografia Cone Beam');
    }
    if (phase3Items.length === 0) {
      phase3Items.push('Restaurações cerâmicas livres de metal e ajuste oclusal fisiológico');
    }

    return [
      {
        step: 'Fase 01',
        title: 'Preparo Biológico & Imunidade',
        subtitle: 'Otimização do terreno celular antes dos procedimentos',
        items: phase1Items,
        accent: 'border-sky-200 bg-sky-50/50 text-sky-900'
      },
      {
        step: 'Fase 02',
        title: 'Descontaminação & Remoção de Focos',
        subtitle: 'Protocolo SMART (IAOMT), cavitações NICO, ozônio e terapia neural',
        items: phase2Items,
        accent: 'border-amber-200 bg-amber-50/50 text-amber-900'
      },
      {
        step: 'Fase 03',
        title: 'Reabilitação Metal-Free',
        subtitle: 'Devolução estética e funcional 100% biocompatível',
        items: phase3Items,
        accent: 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
      }
    ];
  }, [dentalData, flaggedTeeth]);

  // Enviar Plano de 3 Fases no WhatsApp do Paciente
  const handleSend3PhasesWhatsApp = () => {
    const lines: string[] = [
      `*${brand.clinicName || 'Clínica Odontológica'}*`,
      patientName ? `Plano Biológico Personalizado — *${patientName}*` : 'Plano Biológico Personalizado',
      '',
      ...threePhasesPlan.map(
        (p) => `*${p.step} · ${p.title}*\n${p.items.map((i) => `• ${i}`).join('\n')}`
      ),
      '',
      `Qualquer dúvida, nossa equipe (${brand.professionalName || 'Atendimento'}) está à disposição.`
    ];

    const cleanPhone = (patientPhone || '').replace(/\D/g, '');
    const formattedPhone = cleanPhone
      ? cleanPhone.startsWith('55')
        ? cleanPhone
        : `55${cleanPhone}`
      : '';
    const text = encodeURIComponent(lines.join('\n'));
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Gerar PDF 1: Termo de Consentimento Livre e Esclarecido (SMART / NICO / Zircônia)
  const handleExportConsentPdf = () => {
    const doc = new jsPDF();
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const age = calculatePreciseAge(patientDob);

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(brand.clinicName || 'Clínica de Odontologia Biológica', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${brand.professionalName || 'Cirurgião-Dentista'} · ${brand.councilBadge || 'CRO'} · Termo de Consentimento Esclarecido`,
      14,
      21
    );

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE CONSENTIMENTO — PROTOCOLO BIOLÓGICO (IAOMT / SMART / NICO)', 14, 42);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const ageText = age !== null ? ` (${age} anos)` : '';
    doc.text(`Paciente: ${patientName || '________________________________________'}${ageText}    Data: ${todayStr}`, 14, 50);

    const teethList =
      flaggedTeeth.length > 0
        ? flaggedTeeth.map((t) => `${t.id} (${STATUS_CONFIG[normalizeToothStatus(t.status)].shortLabel})`).join(', ')
        : 'Conforme avaliação clínica e odontograma anexo.';

    const paragraphs = [
      `1. OBJETO DO PROCEDIMENTO: Declaro ter sido devidamente esclarecido(a) sobre o planejamento odontológico biológico proposto para os elementos/regiões: ${teethList}.`,
      `2. PROTOCOLO DE PROTEÇÃO SMART (QUANDO APLICÁVEL A AMÁLGAMAS): Compreendo que restaurações de amálgama contêm mercúrio e que sua remoção segue barreiras de biossegurança (dique de borracha nitrílica, sucção de alta potência/exaustor, irrigação abundante, oxigenação nasal e suporte pré/pós com quelantes naturais) visando reduzir ao máximo a exposição a vapores ou partículas.`,
      `3. CIRURGIA BIOLÓGICA / CAVITAÇÕES NICO / IMPLANTES CERÂMICOS: Fui informado(a) sobre a limpeza óssea cavitacional, uso eventual de Ozonioterapia, Terapia Neural com Procaína e concentrados sanguíneos autólogos (L-PRF) ou implantes em Zircônia livre de metais, bem como possíveis efeitos transitórios como edema leve, sensibilidade local ou necessidade de reavaliação tomográfica.`,
      `4. ORIENTAÇÕES E COMPROMISSO: Comprometo-me a seguir o protocolo nutricional e medicamentoso pré e pós-operatório prescrito, informando imediatamente qualquer intercorrência clínica.`
    ];

    let y = 60;
    paragraphs.forEach((p) => {
      const split = doc.splitTextToSize(p, 182);
      doc.text(split, 14, y);
      y += split.length * 4.8 + 5;
    });

    y += 14;
    doc.line(14, y, 96, y);
    doc.line(114, y, 196, y);
    doc.setFontSize(8.5);
    doc.text('Assinatura do(a) Paciente / Responsável', 14, y + 5);
    doc.text(`${brand.professionalName || 'Cirurgião-Dentista'} · ${brand.councilBadge || 'CRO'}`, 114, y + 5);

    doc.save(`termo_consentimento_smart_${(patientName || 'paciente').replace(/[^a-z0-9]/gi, '_')}.pdf`);
    toast.success('Termo de Consentimento SMART/NICO gerado em PDF!');
  };

  // Gerar PDF 2: Guia Pré & Pós-Operatório Integrativo com Posologia Base
  const handleExportPrepGuidePdf = () => {
    const doc = new jsPDF();
    const todayStr = new Date().toLocaleDateString('pt-BR');

    doc.setFillColor(2, 132, 199);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${brand.clinicName || 'Clínica Odontológica'} — Guia Pré & Pós-Operatório`, 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paciente: ${patientName || 'Não informado'} · Data: ${todayStr}`, 14, 21);

    const rows: string[][] = [];
    if (dentalData.suplemento_vit_d3_k2) {
      rows.push(['Vitamina D3 + K2 (MK-7)', 'Otimização óssea e imunológica (meta sérica > 60 ng/mL)', 'Conforme prescrição individualizada']);
    }
    if (dentalData.suplemento_vit_c) {
      rows.push(['Vitamina C Tamponada', 'Antioxidante celular e suporte à cicatrização de colágeno', 'Pré e pós-procedimento']);
    }
    if (dentalData.suplemento_zinco_mg) {
      rows.push(['Zinco + Magnésio Bisglicinato', 'Modulação inflamatória e reparo tecidual', 'Uso contínuo no preparo cirúrgico']);
    }
    if (dentalData.smart_carvao_chlorella || dentalData.amalgama_ativo) {
      rows.push(['Chlorella / Carvão Ativado', 'Ligante intestinal de metais pesados antes da remoção SMART', '1 hora antes e após a sessão']);
    }
    if (dentalData.suplemento_arnica_homeo) {
      rows.push(['Arnica Montana (Homeopatia)', 'Controle natural de edema e desconforto pós-operatório', 'Iniciar na véspera e manter por 5 dias']);
    }
    if (dentalData.suplemento_coenzima_q10) {
      rows.push(['Coenzima Q10 + Probióticos', 'Energia mitocondrial gengival e proteção de mucosa', 'Uso diário conforme receita']);
    }

    if (rows.length === 0) {
      rows.push(['Hidratação & Preparo Base', 'Ingestão hídrica adequada e alimentação anti-inflamatória', '48h antes da consulta']);
      rows.push(['Higiene Oral Suave', 'Escova extra-macia e enxaguante sem álcool / água ozonizada', 'Pós-procedimento imediato']);
    }

    autoTable(doc, {
      startY: 36,
      head: [['Ativo / Conduta', 'Finalidade Biológica', 'Momento Sugerido']],
      body: rows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Recomendações Pós-Atendimento:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    const care = [
      '• Evitar alimentos açucarados, ultraprocessados e bebidas muito quentes nas primeiras 48 horas.',
      '• Aplicar compressa fria externa nas primeiras 24h caso haja procedimento cirúrgico ou implante.',
      '• Não fazer bochechos vigorosos nas primeiras 24h após cirurgias/curetagens NICO para preservar o coágulo/L-PRF.'
    ];
    doc.text(care, 14, finalY + 6);

    doc.save(`guia_pre_pos_integrativo_${(patientName || 'paciente').replace(/[^a-z0-9]/gi, '_')}.pdf`);
    toast.success('Guia Pré e Pós-Operatório gerado em PDF!');
  };

  const handlePhotoUpload = (slot: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (slot === 'before') setBeforeImage(reader.result);
        else setAfterImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 space-y-5">
      {/* Cabeçalho da Suíte de Apresentação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Apresentação Clínica ao Paciente &amp; Documentação IAOMT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualização sistêmica Boca–Corpo, roteiro de tratamento em 3 fases e termos prontos para aprovação na cadeira.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {flaggedTeeth.length === 0 && (
            <button
              type="button"
              onClick={handleLoadShowcaseCase}
              className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles size={13} />
              <span>Carregar Caso Modelo</span>
            </button>
          )}

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView('boca_corpo')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                activeView === 'boca_corpo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Mapa Boca ↔ Corpo
            </button>
            <button
              type="button"
              onClick={() => setActiveView('plano_fases')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                activeView === 'plano_fases' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Plano em 3 Fases
            </button>
            <button
              type="button"
              onClick={() => setActiveView('comparador')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                activeView === 'comparador' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Antes ↔ Depois (Foto Real)
            </button>
          </div>
        </div>
      </div>

      {/* VISÃO 1: MAPA VISUAL BOCA ↔ CORPO (DIAGRAMA MÉDICO LIMPO, SEM 3D/LEGO) */}
      {activeView === 'boca_corpo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Coluna Esquerda: Atlas Anatômico Interativo */}
          <div className="lg:col-span-5 bg-slate-950 rounded-2xl p-5 text-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
              <span className="font-bold text-slate-100">Atlas Sistêmico Dente–Órgão</span>
              <span className="font-mono tabular-nums text-slate-400">
                {activeZones.length} {activeZones.length === 1 ? 'sistema ativo' : 'sistemas ativos'}
              </span>
            </div>

            <div className="relative flex items-center justify-center py-4">
              <svg
                viewBox="0 0 260 390"
                className="w-full max-w-[260px] h-auto select-none"
                role="img"
                aria-label="Diagrama anatômico de correlação dente e órgãos"
              >
                {/* Silhueta Anatômica Médica Clean */}
                <g fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Cabeça e pescoço */}
                  <ellipse cx="130" cy="44" rx="28" ry="32" fill="#0f172a" />
                  <path d="M116 74 L116 94 M144 74 L144 94" />
                  {/* Tronco */}
                  <path
                    d="M116 94 C90 98 68 112 66 140 L60 220 C60 232 72 234 78 220 L86 156 L86 270 C86 286 96 296 130 296 C164 296 174 286 174 270 L174 156 L182 220 C188 234 200 232 200 220 L194 140 C192 112 170 98 144 94 Z"
                    fill="#0f172a"
                  />
                  {/* Membros inferiores referência */}
                  <path d="M94 292 L90 368 M166 292 L170 368 M130 296 L124 368 M130 296 L136 368" opacity="0.45" />
                  {/* Eixo vertebral sutil */}
                  <line x1="130" y1="82" x2="130" y2="275" stroke="#1e293b" strokeDasharray="3 4" />
                </g>

                {/* Zonas Orgânicas Clicáveis */}
                {BODY_ZONES.map((zone) => {
                  const linkedTeeth = zoneToothMap[zone.id];
                  const isAffected = linkedTeeth.length > 0;
                  const isFocused = focusedZone?.id === zone.id;

                  return (
                    <g
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className="cursor-pointer"
                    >
                      {isAffected && (
                        <circle
                          cx={zone.cx}
                          cy={zone.cy}
                          r={zone.r + 6}
                          fill="rgba(244, 63, 94, 0.14)"
                          stroke="rgba(244, 63, 94, 0.45)"
                          strokeWidth="1"
                        />
                      )}
                      <circle
                        cx={zone.cx}
                        cy={zone.cy}
                        r={zone.r}
                        fill={
                          isAffected
                            ? 'rgba(244, 63, 94, 0.34)'
                            : isFocused
                              ? 'rgba(56, 189, 248, 0.25)'
                              : 'rgba(148, 163, 184, 0.12)'
                        }
                        stroke={
                          isFocused
                            ? '#38bdf8'
                            : isAffected
                              ? '#fb7185'
                              : '#475569'
                        }
                        strokeWidth={isFocused ? 2.2 : 1.4}
                      />
                      <text
                        x={zone.cx}
                        y={zone.cy + 3.5}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold"
                        fill={isAffected ? '#fecdd3' : isFocused ? '#bae6fd' : '#94a3b8'}
                      >
                        {isAffected ? linkedTeeth.map((t) => t.id).slice(0, 2).join(',') : '·'}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex items-center justify-between gap-2">
              <span>Clique em qualquer área do corpo para inspecionar</span>
              <span className="font-mono text-rose-300 font-semibold whitespace-nowrap">
                {flaggedTeeth.length} {flaggedTeeth.length === 1 ? 'dente marcado' : 'dentes marcados'}
              </span>
            </div>
          </div>

          {/* Coluna Direita: Explicação Clínica e Lista de Dentes x Sistemas */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {focusedZone && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {focusedZone.label}
                  </h3>
                  <span
                    className={cn(
                      'text-xs font-bold font-mono tabular-nums',
                      zoneToothMap[focusedZone.id].length > 0 ? 'text-rose-700' : 'text-slate-500'
                    )}
                  >
                    {zoneToothMap[focusedZone.id].length > 0
                      ? `${zoneToothMap[focusedZone.id].length} dente(s) com interferência`
                      : 'Sem interferência marcada'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {focusedZone.clinicalImpact}
                </p>

                {zoneToothMap[focusedZone.id].length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    {zoneToothMap[focusedZone.id].map((tooth) => {
                      const meta = TOOTH_METADATA[tooth.id];
                      const cfg = STATUS_CONFIG[normalizeToothStatus(tooth.status)];
                      return (
                        <div
                          key={tooth.id}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">
                              Dente {tooth.id} ({meta?.name.split('(')[0].trim()})
                            </span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="font-semibold text-rose-700">{cfg.shortLabel}</span>
                            {tooth.cbctFindings && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{tooth.cbctFindings}</p>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-600 whitespace-nowrap shrink-0">
                            Meridiano {meta?.meridian}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tabela Resumo dos Sistemas para seleção rápida */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BODY_ZONES.map((zone) => {
                const count = zoneToothMap[zone.id].length;
                const isSelected = focusedZone?.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : count > 0
                          ? 'bg-rose-50/70 border-rose-200 text-slate-900 hover:bg-rose-100/70'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <div className="text-xs font-bold truncate">{zone.shortLabel}</div>
                    <div
                      className={cn(
                        'text-[11px] font-mono tabular-nums mt-0.5',
                        isSelected ? 'text-slate-300' : count > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'
                      )}
                    >
                      {count > 0 ? `${count} foco(s)` : 'Livre'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ações Rápidas de Documentos IAOMT */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Gere os documentos clínicos integrativos prontos para assinatura e preparo do paciente:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportConsentPdf}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileCheck2 size={14} />
                  <span>Termo SMART / NICO (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPrepGuidePdf}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileText size={14} />
                  <span>Guia Pré/Pós Integrativo (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISÃO 2: PLANO BIOLÓGICO EM 3 FASES (APROVAÇÃO DE ORÇAMENTO) */}
      {activeView === 'plano_fases' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {threePhasesPlan.map((phase) => (
              <div
                key={phase.step}
                className={cn('rounded-2xl border p-4 flex flex-col justify-between space-y-3', phase.accent)}
              >
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider opacity-75">
                    {phase.step}
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">{phase.title}</h3>
                  <p className="text-xs text-slate-600">{phase.subtitle}</p>
                  <ul className="space-y-2 pt-2 border-t border-slate-200/70">
                    {phase.items.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-800 flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-slate-700" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>Roteiro atualizado automaticamente com os dentes e protocolos marcados acima.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportConsentPdf}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileCheck2 size={14} />
                <span>Termo SMART (PDF)</span>
              </button>
              <button
                type="button"
                onClick={handleExportPrepGuidePdf}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileText size={14} />
                <span>Guia Pré/Pós (PDF)</span>
              </button>
              <button
                type="button"
                onClick={handleSend3PhasesWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <MessageCircle size={14} />
                <span>Enviar Plano 3 Fases no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISÃO 3: COMPARADOR ANTES ↔ DEPOIS COM FOTOS REAIS DO PACIENTE */}
      {activeView === 'comparador' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Upload size={15} className="text-slate-600 shrink-0" />
                <span className="font-bold text-slate-800 truncate">
                  {beforeImage ? 'Foto 1 (Antes) carregada — trocar' : 'Subir Foto 1: Antes (ex: Amálgama / Inicial)'}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoUpload('before', e)}
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Upload size={15} className="text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800 truncate">
                  {afterImage ? 'Foto 2 (Depois) carregada — trocar' : 'Subir Foto 2: Depois / Caso Referência Cerâmica'}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoUpload('after', e)}
              />
            </label>
          </div>

          {beforeImage && afterImage ? (
            <div className="space-y-3">
              <div className="relative w-full max-w-3xl mx-auto h-[360px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 select-none">
                <img
                  src={afterImage}
                  alt="Depois / Referência Clínica"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                >
                  <img
                    src={beforeImage}
                    alt="Antes / Condição Inicial"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
                  style={{ left: `${splitPercent}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center">
                    <SlidersHorizontal size={14} />
                  </div>
                </div>

                <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 text-white text-[11px] font-bold rounded-lg">
                  Antes
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-700/90 text-white text-[11px] font-bold rounded-lg">
                  Depois / Referência
                </span>
              </div>

              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Arraste:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={splitPercent}
                  onChange={(e) => setSplitPercent(Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    setBeforeImage(null);
                    setAfterImage(null);
                    setSplitPercent(50);
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw size={12} />
                  <span>Limpar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1.5">
              <Activity size={24} className="mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700">Comparador com Fotos Reais da Clínica</p>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Suba duas fotos reais (ex.: foto intraoral antes da remoção de amálgama e foto final ou caso semelhante em cerâmica) para deslizar na TV diante do paciente, sem gráficos artificiais.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
