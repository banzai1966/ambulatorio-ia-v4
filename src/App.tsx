import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  FileDown,
  MessageCircle,
  Building2,
  X,
  Loader2,
  User,
  Calendar,
  Phone,
  Check,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from './lib/utils';
import { STUDIO_SPECIALTIES, StudioSpecialtyId } from './constants/specialties';
import {
  WhiteLabelClinicBrand,
  loadWhiteLabelBrand,
  saveWhiteLabelBrand,
  calculatePreciseAge
} from './constants/clinicProfiles';
import PatientMediaGallery from './components/PatientMediaGallery';
import BiologicalDentistryForm, { BiologicalDentistryData } from './components/BiologicalDentistryForm';
import NutrologyModule, { NutrologyData } from './components/NutrologyModule';
import DermatologyModule, { DermatologyData } from './components/DermatologyModule';
import type { OdontogramData } from './components/InteractiveOdontogram';

export default function App() {
  const [activeSpecialty, setActiveSpecialty] = useState<StudioSpecialtyId>('biological_dentistry');
  const [brand, setBrand] = useState<WhiteLabelClinicBrand>(() => loadWhiteLabelBrand());
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [draftBrand, setDraftBrand] = useState<WhiteLabelClinicBrand>(brand);

  // Dados simples da consulta atual (sem banco pesado ou login)
  const [patientName, setPatientName] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  // Copiloto de Voz / Texto IA
  const [clinicalInput, setClinicalInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Resumo geral estruturado pela IA (opcional / complementar)
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [prescriptionText, setPrescriptionText] = useState('');

  // Estados independentes por pilar clínico (isolamento total entre especialidades)
  const [dentalData, setDentalData] = useState<BiologicalDentistryData>({});
  const [nutrologyData, setNutrologyData] = useState<NutrologyData>({});
  const [dermatologyData, setDermatologyData] = useState<DermatologyData>({});

  const calculatedAge = calculatePreciseAge(patientDob);

  useEffect(() => {
    setDraftBrand(brand);
  }, [brand]);

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    saveWhiteLabelBrand(draftBrand);
    setBrand(draftBrand);
    setShowBrandModal(false);
    toast.success('Identidade da clínica atualizada!');
  };

  // Ditado por Voz em Português (Web Speech API)
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Ditado por voz não suportado neste navegador. Digite ou cole o relato no campo.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    const baseText = clinicalInput ? `${clinicalInput.trim()} ` : '';
    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += `${piece} `;
        } else {
          interim += piece;
        }
      }
      setClinicalInput((baseText + finalTranscript + interim).trimStart());
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.success('Microfone ativo — pode ditar os achados da consulta.');
  };

  // Processamento com IA Copiloto (/api/process-clinical)
  const handleAnalyzeWithAi = async () => {
    if (!clinicalInput.trim()) {
      toast.error('Digite ou dite o relato da consulta antes de estruturar com a IA.');
      return;
    }

    setIsProcessingAi(true);
    try {
      const dobContext = patientDob
        ? ` Data de nascimento informada: ${patientDob}${calculatedAge !== null ? ` (${calculatedAge} anos)` : ''}.`
        : '';
      const fullInput = `${patientName ? `Paciente: ${patientName}.` : ''}${dobContext}\n${clinicalInput}`;

      const resp = await axios.post(
        '/api/process-clinical',
        {
          input: fullInput,
          examMode: activeSpecialty,
          reason: 'Avaliação Clínica Especializada'
        },
        { timeout: 60000 }
      );

      const parsed = resp.data || {};
      if (!patientName && parsed.paciente_nome_completo) {
        setPatientName(parsed.paciente_nome_completo);
      }
      if (!patientDob && parsed.paciente_data_nascimento) {
        setPatientDob(parsed.paciente_data_nascimento);
      }
      if (parsed.resumo_formatado) {
        setClinicalSummary(parsed.resumo_formatado);
      }
      if (parsed.prescricao) {
        setPrescriptionText(parsed.prescricao);
      }

      const specData = parsed.dados_especialidade || {};
      if (activeSpecialty === 'biological_dentistry') {
        setDentalData((prev) => ({
          ...prev,
          ...specData,
          odontograma: specData.odontograma
            ? {
                ...(prev.odontograma || {}),
                ...specData.odontograma,
                teeth: {
                  ...(prev.odontograma?.teeth || {}),
                  ...(specData.odontograma?.teeth || {})
                }
              }
            : prev.odontograma
        }));
      } else if (activeSpecialty === 'nutrology') {
        setNutrologyData((prev) => ({
          ...prev,
          ...specData,
          suplementacao_prescrita:
            specData.suplementacao_prescrita || parsed.prescricao || prev.suplementacao_prescrita,
          plano_alimentar_orientacoes:
            specData.plano_alimentar_orientacoes ||
            parsed.conduta_plano_terapeutico ||
            prev.plano_alimentar_orientacoes,
          observacoes_clinicas:
            parsed.resumo_formatado || prev.observacoes_clinicas,
          radar_metabolico: parsed.radar_metabolico
            ? {
                energia: parsed.radar_metabolico.disposicao_energia ?? prev.radar_metabolico?.energia ?? 6,
                sono: parsed.radar_metabolico.sono ?? prev.radar_metabolico?.sono ?? 6,
                intestino: parsed.radar_metabolico.nutricao_digestao ?? prev.radar_metabolico?.intestino ?? 6,
                glicemia: prev.radar_metabolico?.glicemia ?? 6,
                imunidade: parsed.radar_metabolico.imunidade ?? prev.radar_metabolico?.imunidade ?? 6
              }
            : prev.radar_metabolico
        }));
      } else if (activeSpecialty === 'dermatology') {
        setDermatologyData((prev) => ({
          ...prev,
          ...specData,
          observacoes_dermato:
            parsed.resumo_formatado || prev.observacoes_dermato
        }));
      }

      toast.success('Consulta estruturada pela IA com sucesso!');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível processar com a IA no momento.';
      toast.error(msg);
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Geração de Laudo / Protocolo PDF White-Label
  const handleExportPdf = () => {
    const doc = new jsPDF();
    const specMeta = STUDIO_SPECIALTIES.find((s) => s.id === activeSpecialty)!;
    const todayStr = new Date().toLocaleDateString('pt-BR');

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(brand.clinicName || 'Clínica Studio Visual IA', 14, 14);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${brand.professionalName || 'Profissional'} · ${brand.councilBadge || ''} · ${specMeta.title}`,
      14,
      21
    );
    if (brand.phone || brand.address) {
      doc.text([brand.phone, brand.address].filter(Boolean).join(' · ').slice(0, 95), 14, 27);
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Paciente: ${patientName || 'Não informado'}`, 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const ageLabel = calculatedAge !== null ? ` · Idade: ${calculatedAge} anos` : '';
    doc.text(`Data: ${todayStr}${ageLabel}`, 14, 48);

    let cursorY = 56;

    const addSection = (title: string, body?: string) => {
      if (!body || !body.trim()) return;
      if (cursorY > 255) {
        doc.addPage();
        cursorY = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(2, 132, 199);
      doc.text(title, 14, cursorY);
      cursorY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(body.trim(), 182);
      doc.text(lines, 14, cursorY);
      cursorY += lines.length * 4.8 + 5;
    };

    if (clinicalSummary) addSection('Síntese Clínica', clinicalSummary);

    if (activeSpecialty === 'biological_dentistry') {
      const teethObj = dentalData.odontograma?.teeth || {};
      const teethRows = Object.values(teethObj)
        .filter((t: any) => t && t.status && t.status !== 'healthy')
        .map((t: any) => [
          `Dente ${t.id}`,
          String(t.status),
          t.cbctFindings || t.notes || '-',
          t.biologicalPlan || '-'
        ]);

      if (teethRows.length > 0) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Elemento', 'Condição', 'Achado Clínico / RX', 'Plano Biológico']],
          body: teethRows,
          styles: { fontSize: 8.5, cellPadding: 2.5 },
          headStyles: { fillColor: [2, 132, 199] }
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      }

      if (dentalData.amalgama_ativo) {
        addSection('Protocolo SMART (Remoção Segura de Amálgama)', `Elementos: ${dentalData.amalgama_elementos || 'Conforme odontograma'}`);
      }
      if (dentalData.implante_zirconia_ativo) {
        addSection('Implantes Cerâmicos Metal-Free (Zircônia)', `Elementos: ${dentalData.implante_elementos || '-'} · Sistema: ${dentalData.implante_tipo_sistema || 'Zircônia'}`);
      }
      if (dentalData.focos_cavitacao_ativo) {
        addSection('Cavitações Ósseas (NICO/FDOK)', dentalData.focos_tomografia_cbct || dentalData.focos_descricao || 'Foco cavitacional sinalizado');
      }
      addSection('Observações Odontológicas', dentalData.observacoes_odonto_biologica);
    }

    if (activeSpecialty === 'nutrology') {
      const metricsLine = [
        nutrologyData.peso_kg ? `Peso: ${nutrologyData.peso_kg} kg` : '',
        nutrologyData.altura_cm ? `Altura: ${nutrologyData.altura_cm} cm` : '',
        nutrologyData.gordura_corporal_pct ? `% Gordura: ${nutrologyData.gordura_corporal_pct}%` : '',
        nutrologyData.massa_muscular_kg ? `Massa Muscular: ${nutrologyData.massa_muscular_kg} kg` : '',
        nutrologyData.gordura_visceral ? `Gordura Visceral: ${nutrologyData.gordura_visceral}` : ''
      ]
        .filter(Boolean)
        .join(' · ');
      addSection('Bioimpedância & Composição Corporal', metricsLine);

      const markers = nutrologyData.labAnalysis?.biomarkers || [];
      if (markers.length > 0) {
        autoTable(doc, {
          startY: cursorY,
          head: [['Biomarcador', 'Resultado', 'Ref. Comum', 'Faixa Ótima', 'Conduta']],
          body: markers.map((m) => [
            m.name,
            `${m.value} ${m.unit}`,
            m.labRange,
            m.optimalRange,
            m.clinicalAction
          ]),
          styles: { fontSize: 8, cellPadding: 2.2 },
          headStyles: { fillColor: [5, 150, 105] }
        });
        cursorY = (doc as any).lastAutoTable.finalY + 8;
      }
      addSection('Prescrição Nutrológica & Suplementação', nutrologyData.suplementacao_prescrita);
      addSection('Conduta Alimentar & Estilo de Vida', nutrologyData.plano_alimentar_orientacoes);
      addSection('Observações Clínicas', nutrologyData.observacoes_clinicas);
    }

    if (activeSpecialty === 'dermatology') {
      const skinHeader = [
        dermatologyData.fototipo_fitzpatrick ? `Fitzpatrick: Tipo ${dermatologyData.fototipo_fitzpatrick}` : '',
        dermatologyData.escala_glogau ? `Glogau: Grau ${dermatologyData.escala_glogau}` : '',
        dermatologyData.skinHealthScore ? `Qualidade Cutânea: ${dermatologyData.skinHealthScore}/100` : ''
      ]
        .filter(Boolean)
        .join(' · ');
      addSection('Avaliação Cutânea & Escalas', skinHeader);
      addSection('Resumo Visual', dermatologyData.patientSummary || dermatologyData.clinicalSummary);
      addSection('Skincare Diurno (Manhã)', dermatologyData.rotina_manha);
      addSection('Tratamento Noturno', dermatologyData.rotina_noite);
      addSection('Procedimentos em Consultório', dermatologyData.procedimentos_consultorio);
      addSection('Suplementação Oral (In)', dermatologyData.suplementacao_oral_in);
      addSection('Observações Dermatológicas', dermatologyData.observacoes_dermato);
    }

    if (prescriptionText) addSection('Prescrição Adicional', prescriptionText);

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(brand.cityFooter || '', 14, pageHeight - 12);

    const fileName = `protocolo_${activeSpecialty}_${(patientName || 'paciente').replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(fileName);
    toast.success('Laudo e protocolo em PDF gerados!');
  };

  // Envio leve pelo WhatsApp Web/App (zero necessidade de API paga ou QR Code)
  const handleSendWhatsApp = () => {
    const specMeta = STUDIO_SPECIALTIES.find((s) => s.id === activeSpecialty)!;
    const parts: string[] = [
      `*${brand.clinicName}* — ${specMeta.title}`,
      patientName ? `Paciente: *${patientName}*` : '',
      ''
    ];

    if (activeSpecialty === 'biological_dentistry') {
      if (clinicalSummary) parts.push(`*Resumo:*\n${clinicalSummary}`);
      if (dentalData.observacoes_odonto_biologica) {
        parts.push(`*Plano Odontológico:*\n${dentalData.observacoes_odonto_biologica}`);
      }
    } else if (activeSpecialty === 'nutrology') {
      if (nutrologyData.labAnalysis?.patientSummary) {
        parts.push(`*Análise Metabólica:*\n${nutrologyData.labAnalysis.patientSummary}`);
      }
      if (nutrologyData.suplementacao_prescrita) {
        parts.push(`*Suplementação:*\n${nutrologyData.suplementacao_prescrita}`);
      }
      if (nutrologyData.plano_alimentar_orientacoes) {
        parts.push(`*Orientações:*\n${nutrologyData.plano_alimentar_orientacoes}`);
      }
    } else if (activeSpecialty === 'dermatology') {
      if (dermatologyData.patientSummary) {
        parts.push(`*Avaliação Visual:*\n${dermatologyData.patientSummary}`);
      }
      if (dermatologyData.rotina_manha) parts.push(`*Manhã:*\n${dermatologyData.rotina_manha}`);
      if (dermatologyData.rotina_noite) parts.push(`*Noite:*\n${dermatologyData.rotina_noite}`);
      if (dermatologyData.suplementacao_oral_in) {
        parts.push(`*Oral (In):*\n${dermatologyData.suplementacao_oral_in}`);
      }
    }

    if (parts.filter(Boolean).length <= 2) {
      parts.push('Segue o resumo do seu atendimento clínico visual.');
    }

    const cleanPhone = patientPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone
      ? cleanPhone.startsWith('55')
        ? cleanPhone
        : `55${cleanPhone}`
      : '';
    const text = encodeURIComponent(parts.filter((p) => p !== undefined).join('\n\n'));
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

  const handleClearConsultation = () => {
    setPatientName('');
    setPatientDob('');
    setPatientPhone('');
    setClinicalInput('');
    setClinicalSummary('');
    setPrescriptionText('');
    setDentalData({});
    setNutrologyData({});
    setDermatologyData({});
    toast.success('Nova consulta pronta.');
  };

  const handleOdontogramUpdateFromGallery = (odonto: OdontogramData) => {
    setDentalData((prev) => ({ ...prev, odontograma: odonto }));
  };

  const activeSpec = STUDIO_SPECIALTIES.find((s) => s.id === activeSpecialty)!;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      <Toaster position="top-right" />

      {/* Top Bar — Contrato estrito de 3 zonas */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zona 1: Wordmark único (1 linha) */}
          <span className="text-base md:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            {brand.clinicName}
          </span>

          {/* Zona 2: 3 Especialidades */}
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {STUDIO_SPECIALTIES.map((spec) => {
              const isActive = activeSpecialty === spec.id;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => setActiveSpecialty(spec.id)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  {spec.shortLabel}
                </button>
              );
            })}
          </nav>

          {/* Zona 3: 1 Ação Primária */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setShowBrandModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Building2 size={14} />
              <span>Minha Clínica</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Cabeçalho da Especialidade + Dados Rápidos do Paciente */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeSpec.title}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSpec.tagline}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <FileDown size={14} />
                <span>Gerar Laudo / Receita PDF</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <MessageCircle size={14} />
                <span>Enviar WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleClearConsultation}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Iniciar nova consulta limpa"
              >
                <RotateCcw size={13} />
                <span>Nova Consulta</span>
              </button>
            </div>
          </div>

          {/* Barra do Paciente + Copiloto de Voz IA */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                <User size={12} />
                <span>Nome do Paciente</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ex: Maria Aparecida Silva"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Nascimento</span>
                </span>
                {calculatedAge !== null && (
                  <span className="font-mono tabular-nums text-sky-700 font-bold">
                    {calculatedAge} anos
                  </span>
                )}
              </label>
              <input
                type="date"
                value={patientDob}
                onChange={(e) => setPatientDob(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                <Phone size={12} />
                <span>WhatsApp (Opcional)</span>
              </label>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Copiloto Clínico por Voz ou Texto */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={14} className="text-sky-600" />
                <span>Copiloto Clínico IA (Dite ou digite o resumo da consulta para preencher automaticamente)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap',
                    isRecording
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {isRecording ? <Square size={12} /> : <Mic size={13} />}
                  <span>{isRecording ? 'Parar Ditado' : 'Ditar por Voz'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAnalyzeWithAi}
                  disabled={isProcessingAi || !clinicalInput.trim()}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {isProcessingAi ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>{isProcessingAi ? 'Estruturando...' : 'Estruturar com IA'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              value={clinicalInput}
              onChange={(e) => setClinicalInput(e.target.value)}
              placeholder={
                activeSpecialty === 'biological_dentistry'
                  ? 'Ex: Paciente com amálgamas extensos nos dentes 16 e 46 para protocolo SMART, indicação de implante zircônia no 36 e foco cavitacional NICO no 38...'
                  : activeSpecialty === 'nutrology'
                  ? 'Ex: Queixa de fadiga vespertina, peso 78kg, altura 1,72m, gordura 26%, insulina basal 14, vitamina D 23. Prescrever D3 10.000 UI, Berberina 500mg...'
                  : 'Ex: Fototipo III, melasma misto em região malar bilateral há 3 anos, iniciar rotina com protetor com cor FPS 60, ácido tranexâmico noturno e Polypodium oral...'
              }
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />

            {clinicalSummary && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Síntese Estruturada: </span>
                {clinicalSummary}
              </div>
            )}
          </div>
        </section>

        {/* MÓDULO ATIVO POR ESPECIALIDADE */}
        {activeSpecialty === 'biological_dentistry' && (
          <div className="space-y-6">
            <PatientMediaGallery
              patientName={patientName || 'Paciente Demonstração'}
              initialOdontogram={dentalData.odontograma}
              onOdontogramChange={handleOdontogramUpdateFromGallery}
              hideEmbeddedOdontogram={true}
            />
            <BiologicalDentistryForm
              data={dentalData}
              onChange={setDentalData}
              patientName={patientName}
              patientPhone={patientPhone}
              patientDob={patientDob}
              clinicInfo={{
                name: brand.clinicName,
                address: brand.address,
                phone: brand.phone
              }}
            />
          </div>
        )}

        {activeSpecialty === 'nutrology' && (
          <NutrologyModule
            data={nutrologyData}
            onChange={setNutrologyData}
            patientName={patientName}
          />
        )}

        {activeSpecialty === 'dermatology' && (
          <DermatologyModule
            data={dermatologyData}
            onChange={setDermatologyData}
            patientName={patientName}
          />
        )}
      </main>

      {/* Modal Minha Clínica (Personalização White-Label para demonstrações e uso real) */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Personalizar Marca da Clínica</h3>
                <p className="text-xs text-slate-500">
                  Os dados abaixo aparecem automaticamente no topo do sistema e nos laudos em PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nome da Clínica / Studio</label>
                <input
                  type="text"
                  value={draftBrand.clinicName}
                  onChange={(e) => setDraftBrand({ ...draftBrand, clinicName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nome do Profissional</label>
                  <input
                    type="text"
                    value={draftBrand.professionalName}
                    onChange={(e) => setDraftBrand({ ...draftBrand, professionalName: e.target.value })}
                    placeholder="Ex: Dr. João Mendes"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Conselho (CRM / CRO)</label>
                  <input
                    type="text"
                    value={draftBrand.councilBadge}
                    onChange={(e) => setDraftBrand({ ...draftBrand, councilBadge: e.target.value })}
                    placeholder="Ex: CRO-SP 12345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={draftBrand.phone}
                    onChange={(e) => setDraftBrand({ ...draftBrand, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Endereço</label>
                  <input
                    type="text"
                    value={draftBrand.address}
                    onChange={(e) => setDraftBrand({ ...draftBrand, address: e.target.value })}
                    placeholder="Rua / Consultório / Cidade"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Salvar Marca</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
