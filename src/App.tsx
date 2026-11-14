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
  RotateCcw,
  Save,
  FolderOpen,
  Trash2
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
import IntegrativePresentationSuite from './components/IntegrativePresentationSuite';
import type { OdontogramData } from './components/InteractiveOdontogram';

export default function App() {
  const activeSpecialty: StudioSpecialtyId = 'biological_dentistry';
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

  // Estado clínico exclusivo da Odontologia Biológica
  const [dentalData, setDentalData] = useState<BiologicalDentistryData>({});

  // Pasta Rápida de Atendimentos Salvos (para guardar ditado por voz, síntese IA e laudos)
  interface SavedConsultationRecord {
    id: string;
    savedAt: string;
    specialty: StudioSpecialtyId;
    patientName: string;
    patientDob: string;
    patientPhone: string;
    clinicalInput: string;
    clinicalSummary: string;
    prescriptionText: string;
    dentalData: BiologicalDentistryData;
  }

  const SAVED_RECORDS_KEY = 'studio_clinico_saved_records_v1';
  const [savedRecords, setSavedRecords] = useState<SavedConsultationRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SAVED_RECORDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);

  const persistSavedRecords = (next: SavedConsultationRecord[]) => {
    setSavedRecords(next);
    try {
      localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(next));
    } catch {
      toast.error('Limite de armazenamento local atingido para salvar novos registros.');
    }
  };

  const handleSaveConsultation = (override?: Partial<SavedConsultationRecord>, silent = false) => {
    const rec: SavedConsultationRecord = {
      id: `rec_${Date.now()}`,
      savedAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      specialty: 'biological_dentistry',
      patientName: (override?.patientName ?? patientName).trim() || 'Paciente sem nome',
      patientDob: override?.patientDob ?? patientDob,
      patientPhone: override?.patientPhone ?? patientPhone,
      clinicalInput: override?.clinicalInput ?? clinicalInput,
      clinicalSummary: override?.clinicalSummary ?? clinicalSummary,
      prescriptionText: override?.prescriptionText ?? prescriptionText,
      dentalData: override?.dentalData ?? dentalData
    };

    const next = [rec, ...savedRecords].slice(0, 40);
    persistSavedRecords(next);
    if (!silent) {
      toast.success('Protocolo e ditado salvos na Pasta Rápida!');
    }
  };

  const handleLoadSavedRecord = (rec: SavedConsultationRecord) => {
    setPatientName(rec.patientName === 'Paciente sem nome' ? '' : rec.patientName);
    setPatientDob(rec.patientDob || '');
    setPatientPhone(rec.patientPhone || '');
    setClinicalInput(rec.clinicalInput || '');
    setClinicalSummary(rec.clinicalSummary || '');
    setPrescriptionText(rec.prescriptionText || '');
    setDentalData(rec.dentalData || {});
    setShowSavedDrawer(false);
    toast.success(`Atendimento de ${rec.patientName} carregado na tela.`);
  };

  const handleDeleteSavedRecord = (id: string) => {
    persistSavedRecords(savedRecords.filter((r) => r.id !== id));
    toast.success('Registro removido.');
  };

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
      const nextName = !patientName && parsed.paciente_nome_completo ? parsed.paciente_nome_completo : patientName;
      const nextDob = !patientDob && parsed.paciente_data_nascimento ? parsed.paciente_data_nascimento : patientDob;
      const nextSummary = parsed.resumo_formatado || clinicalSummary;
      const nextPrescription = parsed.prescricao || prescriptionText;

      const nextDental: BiologicalDentistryData = {
        ...dentalData,
        ...specData,
        odontograma: specData.odontograma
          ? {
              ...(dentalData.odontograma || {}),
              ...specData.odontograma,
              teeth: {
                ...(dentalData.odontograma?.teeth || {}),
                ...(specData.odontograma?.teeth || {})
              }
            }
          : dentalData.odontograma
      };
      setDentalData(nextDental);

      handleSaveConsultation(
        {
          specialty: 'biological_dentistry',
          patientName: nextName,
          patientDob: nextDob,
          patientPhone,
          clinicalInput,
          clinicalSummary: nextSummary,
          prescriptionText: nextPrescription,
          dentalData: nextDental
        },
        true
      );

      toast.success('Consulta estruturada e salva em Atendimentos Salvos!');
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

    if (prescriptionText) addSection('Prescrição Adicional', prescriptionText);

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(brand.cityFooter || '', 14, pageHeight - 12);

    const fileName = `protocolo_odonto_${(patientName || 'paciente').replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(fileName);
    toast.success('Laudo e protocolo em PDF gerados!');
  };

  // Envio leve pelo WhatsApp Web/App (zero necessidade de API paga ou QR Code)
  const handleSendWhatsApp = () => {
    const specMeta = STUDIO_SPECIALTIES[0];
    const parts: string[] = [
      `*${brand.clinicName}* — ${specMeta.title}`,
      patientName ? `Paciente: *${patientName}*` : '',
      ''
    ];

    if (clinicalSummary) parts.push(`*Resumo:*\n${clinicalSummary}`);
    if (dentalData.observacoes_odonto_biologica) {
      parts.push(`*Plano Odontológico:*\n${dentalData.observacoes_odonto_biologica}`);
    }

    if (parts.filter(Boolean).length <= 2) {
      parts.push('Segue o resumo do seu planejamento odontológico visual.');
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

          {/* Zona 2: Identificador focado em Odontologia Visual IA */}
          <span className="hidden md:inline-block text-xs font-semibold text-slate-500 tracking-wide whitespace-nowrap">
            Odontologia Visual IA · Scanner Radiográfico &amp; Odontograma 3D
          </span>

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
                onClick={() => handleSaveConsultation()}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Salvar atendimento, ditado e laudo na Pasta Rápida"
              >
                <Save size={14} />
                <span>Salvar Atendimento</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSavedDrawer(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Ver atendimentos, ditados e laudos salvos"
              >
                <FolderOpen size={14} />
                <span>Salvos ({savedRecords.length})</span>
              </button>

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
              placeholder="Ex: Paciente com amálgamas extensos nos dentes 16 e 46 para protocolo SMART, indicação de implante zircônia no 36 e foco cavitacional NICO no 38..."
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

        {/* MÓDULO ÚNICO: ODONTOLOGIA BIOLÓGICA & VISUAL IA */}
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
          <IntegrativePresentationSuite
            dentalData={dentalData}
            onUpdateDentalData={setDentalData}
            patientName={patientName}
            patientDob={patientDob}
            patientPhone={patientPhone}
            brand={brand}
          />
        </div>
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

      {/* Pasta Rápida de Atendimentos & Ditados Salvos */}
      {showSavedDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pasta Rápida de Atendimentos Salvos</h3>
                <p className="text-xs text-slate-500">
                  Seus ditados por voz, sínteses da IA e protocolos ficam guardados aqui para reabrir, gerar PDF ou enviar no WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {savedRecords.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Nenhum atendimento salvo ainda</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Quando você usar o Ditado por Voz + "Estruturar com IA" ou clicar em "Salvar Atendimento", o registro completo aparece aqui.
                  </p>
                </div>
              ) : (
                savedRecords.map((rec) => {
                  const specLabel =
                    STUDIO_SPECIALTIES.find((s) => s.id === rec.specialty)?.shortLabel || rec.specialty;
                  return (
                    <div
                      key={rec.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">{rec.patientName}</span>
                          <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-semibold">
                            {specLabel}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">{rec.savedAt}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {rec.clinicalSummary || rec.clinicalInput || 'Registro salvo sem texto adicional.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleLoadSavedRecord(rec)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Abrir na Tela
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedRecord(rec.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Excluir registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
