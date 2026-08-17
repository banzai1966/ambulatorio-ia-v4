import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Calendar, 
  FileText, 
  Mic, 
  Sparkles, 
  Activity, 
  Paperclip, 
  CreditCard, 
  FileSignature, 
  HeartHandshake, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Download, 
  Plus, 
  MessageSquare, 
  ChevronRight, 
  Stethoscope, 
  ShieldCheck, 
  X,
  Search,
  Zap,
  Printer,
  Brain,
  Leaf
} from 'lucide-react';
import PatientMediaGallery from './PatientMediaGallery';
import NeurologicalExamForm from './NeurologicalExamForm';
import IntegrativeChecklistForm from './IntegrativeChecklistForm';
import IntegrativeBodyMap from './IntegrativeBodyMapAnatomy';
import IntegrativeEvolution from './IntegrativeEvolution';
import BiologicalDentistryForm from './BiologicalDentistryForm';
import SpecialtyFields from './SpecialtyFields';
import VitalMonitor from './VitalMonitor';
import PrescriptionAnvisaModal from './PrescriptionAnvisaModal';
import PreConsultationAnamneseModal from './PreConsultationAnamneseModal';
import DigitalSignatureModal from './DigitalSignatureModal';
import NPSAndGoogleReviewModal from './NPSAndGoogleReviewModal';
import { initialIntegrativeData } from '../types/integrativeChecklist';
import { hasMeaningfulData } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { processClinicalInput } from '../services/clinicalService';

interface PatientDossierViewProps {
  patientName: string;
  patientPhone?: string;
  patientCpf?: string;
  patientDob?: string;
  patientStatus?: string;
  convenio?: string;
  currentRecord: any;
  history: any[];
  examMode: string;
  setExamMode: (mode: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  isProcessing: boolean;
  liveTranscript: string;
  onSaveRecord: (recordOverride?: any) => void;
  isSaving: boolean;
  saveSuccess?: boolean;
  onOpenChat?: (phone: string) => void;
  onGeneratePDF?: (record: any) => void;
  onGenerateAtestadoPDF?: () => void;
  onGenerateReceitaPDF?: () => void;
  onClose: () => void;
  setCurrentRecord: (record: any) => void;
  specialtyData: any;
  setSpecialtyData: (data: any) => void;
  integrativeData: any;
  setIntegrativeData: (data: any) => void;
}

// Precise age calculation function according to AGENTS.md Rule 1
function calculateAgeExact(dobString?: string): number | string {
  if (!dobString) return '--';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '--';
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : '--';
}

function getPatientDisplayId(record: any, name: string): string {
  if (record?.id) return String(record.id).substring(0, 8).toUpperCase();
  if (record?.offline_id) return String(record.offline_id).replace('OFFLINE_', '').substring(0, 6).toUpperCase();
  if (!name) return '33867';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 90000 + 10000);
}

function getActiveIntegrativeItems(data: any): { key: string; label: string; value: string }[] {
  if (!data || typeof data !== 'object') return [];
  const items: { key: string; label: string; value: string }[] = [];
  
  const labelsMap: Record<string, string> = {
    colina: 'Colina',
    hidroxi_triptofano: '5-HTP (Hidroxitriptofano)',
    fenilalanina: 'L-Fenilalanina',
    melatonina: 'Melatonina',
    ac_alfa_lipoico: 'Ácido Alfa Lipóico',
    semente_uva: 'Extrato de Semente de Uva',
    coenzima_q10: 'Coenzima Q10',
    astragalus: 'Astragalus Membraneus',
    dhea: 'DHEA',
    epa_dha: 'Ômega 3 (EPA/DHA)',
    mix_pro: 'Mix Probiótico',
    coriandrum: 'Coriandrum Sativum',
    propolis: 'Própolis Verde',
    propco: 'Própolis + Coenzima Q10',
    mix_d9: 'Mix D9 Integrativo',
    ginger: 'Extrato de Gengibre',
    acido_caprilico: 'Ácido Caprílico',
    bitter_mellon: 'Bitter Melon',
    arnica: 'Arnica Montana',
    myosothis: 'Myosothis',
    hip_perfuratum: 'Hypericum Perforatum',
    neurexan: 'Neurexan',
    floral_bach: 'Florais de Bach',
    acido_folico: 'Metilfolato',
    vit_b3_b6: 'Complexo B (B3 / B6)',
    pregne: 'Pregnenolona',
    heteropterys: 'Heteropterys',
    arcalion: 'Arcalion',
    vinpocetina: 'Vinpocetina',
    fosfatidilserina: 'Fosfatidilserina',
    fosfatidilcolina: 'Fosfatidilcolina',
    dmae: 'DMAE',
    vit_d3: 'Vitamina D3',
    ca_mg_zn: 'Cálcio + Magnésio + Zinco',
    vit_k2: 'Vitamina K2 (MK-7)',
    selenio: 'Selênio Quelato',
    manganes: 'Manganês Quelato',
    cu: 'Cobre Quelato',
    cromo: 'Picolinato de Cromo',
    lugol: 'Solução de Lugol',
    silimarina: 'Silimarina',
    quercetina: 'Quercetina',
    saw_palmetto: 'Saw Palmetto',
    pygeum: 'Pygeum Africanum',
    tribulus: 'Tribulus Terrestris',
    litio: 'Orotato de Lítio',
    cardiopeptase: 'Cardiopeptase',
    betaina: 'Betaína HCl',
    taurina: 'L-Taurina'
  };

  for (const sectionKey in data) {
    const section = data[sectionKey];
    if (section && typeof section === 'object') {
      for (const itemKey in section) {
        const val = section[itemKey];
        if (val && val !== false && String(val).trim() !== '' && String(val).toLowerCase() !== 'false') {
          items.push({
            key: itemKey,
            label: labelsMap[itemKey] || itemKey.replace(/_/g, ' ').toUpperCase(),
            value: String(val)
          });
        }
      }
    }
  }

  return items;
}

export default function PatientDossierView({
  patientName,
  patientPhone = '',
  patientCpf = '',
  patientDob = '',
  patientStatus = 'Estável',
  convenio = 'Particular',
  currentRecord,
  history,
  examMode,
  setExamMode,
  isRecording,
  startRecording,
  stopRecording,
  isProcessing,
  liveTranscript,
  onSaveRecord,
  isSaving,
  saveSuccess,
  onOpenChat,
  onGeneratePDF,
  onGenerateAtestadoPDF,
  onGenerateReceitaPDF,
  onClose,
  setCurrentRecord,
  specialtyData,
  setSpecialtyData,
  integrativeData,
  setIntegrativeData,
}: PatientDossierViewProps) {
  const [activeTab, setActiveTab] = useState<
    'evolucao' | 'anamnese' | 'plano' | 'especialidade' | 'prescricoes' | 'anexos' | 'contratos' | 'financeiro'
  >('evolucao');

  const age = calculateAgeExact(patientDob);

  // SOAP format state if doctor prefers divided boxes
  const [useDividedSoap, setUseDividedSoap] = useState(true);
  const [queixaPrincipal, setQueixaPrincipal] = useState(currentRecord?.queixa_principal || '');
  const [exameFisico, setExameFisico] = useState(currentRecord?.exame_fisico || '');
  const [hipoteseDiag, setHipoteseDiag] = useState(currentRecord?.hipotese_diagnostica || '');
  const [condutaPlano, setCondutaPlano] = useState(currentRecord?.conduta_plano_terapeutico || '');

  // Dynamic Prescription and Certificate States
  const [prescricaoText, setPrescricaoText] = useState(currentRecord?.prescricao || currentRecord?.conduta_plano_terapeutico || '');
  const [diasAfastamento, setDiasAfastamento] = useState(1);
  const [atestadoCid, setAtestadoCid] = useState(currentRecord?.hipotese_diagnostica || 'M501 - TRANSTORNO DO DISCO CERVICAL COM RADICULOPATIA');
  const [docType, setDocType] = useState<'receituario' | 'atestado'>('receituario');
  const [isDictatingPrescription, setIsDictatingPrescription] = useState(false);

  const handleDictatePrescription = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Reconhecimento de voz não suportado neste navegador. Use Google Chrome ou Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsDictatingPrescription(true);
      toast('🎙️ Ouvindo prescrição... Fale os medicamentos e posologia.', { icon: '🎤' });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsDictatingPrescription(false);
      if (transcript) {
        setPrescricaoText(prev => prev ? `${prev}\n• ${transcript}` : `• ${transcript}`);
        toast.success('Prescrição ditada adicionada com sucesso!');
      }
    };

    recognition.onerror = () => {
      setIsDictatingPrescription(false);
    };

    recognition.onend = () => {
      setIsDictatingPrescription(false);
    };

    recognition.start();
  };

  // Jornada do Paciente - Modais & Estados
  const [isPrescriptionAnvisaOpen, setIsPrescriptionAnvisaOpen] = useState(false);
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isNpsModalOpen, setIsNpsModalOpen] = useState(false);
  const [isPromoter, setIsPromoter] = useState(true);
  const [showVitalMonitor, setShowVitalMonitor] = useState(false);
  const [clinicalAlerts, setClinicalAlerts] = useState<string[]>(
    currentRecord?.alertas_copiloto || currentRecord?.alertas_clinicos || []
  );
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);

  const handleProcessTextAI = async (textToProcess?: string) => {
    const text = textToProcess || currentRecord?.resumo_formatado;
    if (!text || !text.trim()) {
      toast.error("Por favor, digite ou cole um texto antes de processar com a IA.");
      return;
    }
    setIsLocalProcessing(true);
    try {
      const result = await processClinicalInput(text, examMode || 'standard', 'Atendimento em Bloco Único');
      if (result) {
        if (result.queixa_principal) setQueixaPrincipal(result.queixa_principal);
        if (result.exame_fisico) setExameFisico(result.exame_fisico);
        if (result.hipotese_diagnostica) setHipoteseDiag(result.hipotese_diagnostica);
        if (result.conduta_plano_terapeutico) setCondutaPlano(result.conduta_plano_terapeutico);
        if (setCurrentRecord) {
          setCurrentRecord((prev: any) => ({
            ...prev,
            ...result
          }));
        }
        toast.success("IA extraiu e preencheu a ficha do paciente com sucesso!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha ao processar texto com a IA.");
    } finally {
      setIsLocalProcessing(false);
    }
  };

  const handleSaveRecord = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();

    const recordToSave = {
      ...currentRecord,
      paciente_nome_completo: patientName || currentRecord?.paciente_nome_completo || "PACIENTE",
      paciente_cpf: patientCpf || currentRecord?.paciente_cpf || "",
      paciente_data_nascimento: patientDob || currentRecord?.paciente_data_nascimento || "",
      paciente_telefone: patientPhone || currentRecord?.paciente_telefone || "",
      queixa_principal: queixaPrincipal,
      exame_fisico: exameFisico,
      hipotese_diagnostica: hipoteseDiag,
      conduta_plano_terapeutico: condutaPlano,
      prescricao: prescricaoText,
      checklist_integrativo: integrativeData,
      dados_especialidade: {
        ...specialtyData,
        mapeamento_corporal: currentRecord?.mapeamento_corporal || specialtyData?.mapeamento_corporal || []
      },
      mapeamento_corporal: currentRecord?.mapeamento_corporal || specialtyData?.mapeamento_corporal || [],
      especialidade: examMode === 'integrative' ? 'Integrativa' : (examMode === 'neurological' ? 'Neurologia' : (currentRecord?.especialidade || 'Geral')),
      resumo_formatado: currentRecord?.resumo_formatado || queixaPrincipal
    };

    setCurrentRecord(recordToSave);
    onSaveRecord(recordToSave);
  };

  // Selected historic record for detail modal view
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<any | null>(null);

  const handleLoadHistoryRecord = (rec: any) => {
    const loadedChecklist = rec.checklist_integrativo ? {
      ...initialIntegrativeData,
      ...rec.checklist_integrativo
    } : initialIntegrativeData;

    const loadedSpecialty = rec.dados_especialidade || {};
    const loadedBodyMap = (rec.mapeamento_corporal && rec.mapeamento_corporal.length > 0)
      ? rec.mapeamento_corporal 
      : (rec.dados_especialidade?.mapeamento_corporal || []);

    const sanitizedRecord = {
      ...rec,
      checklist_integrativo: loadedChecklist,
      dados_especialidade: {
        ...loadedSpecialty,
        mapeamento_corporal: loadedBodyMap
      },
      mapeamento_corporal: loadedBodyMap,
      vitals: rec.vitals || rec.dados_especialidade?.vitals || undefined,
    };
    
    setCurrentRecord(sanitizedRecord);
    setIntegrativeData(loadedChecklist);
    setSpecialtyData({
      ...loadedSpecialty,
      mapeamento_corporal: loadedBodyMap
    });

    if (rec.queixa_principal) setQueixaPrincipal(rec.queixa_principal);
    if (rec.exame_fisico) setExameFisico(rec.exame_fisico);
    if (rec.hipotese_diagnostica) {
      setHipoteseDiag(rec.hipotese_diagnostica);
      setAtestadoCid(rec.hipotese_diagnostica);
    }
    if (rec.conduta_plano_terapeutico) setCondutaPlano(rec.conduta_plano_terapeutico);
    if (rec.prescricao || rec.conduta_plano_terapeutico) setPrescricaoText(rec.prescricao || rec.conduta_plano_terapeutico);
    
    if (rec.especialidade?.toLowerCase().includes('neuro') || (rec.exame_neurologico && hasMeaningfulData(rec.exame_neurologico))) {
      setExamMode('neurological');
    } else if (rec.especialidade?.toLowerCase().includes('integrativa') || (rec.checklist_integrativo && hasMeaningfulData(rec.checklist_integrativo))) {
      setExamMode('integrative');
    } else if (rec.especialidade?.toLowerCase().includes('odontologia') || rec.especialidade?.toLowerCase().includes('biolog')) {
      setExamMode('biological_dentistry');
    } else {
      setExamMode('standard');
    }

    setSelectedHistoryRecord(null);
    toast.success('Atendimento histórico carregado no editor principal!');
  };

  // Keep state synced when currentRecord changes
  useEffect(() => {
    if (currentRecord) {
      if (currentRecord.queixa_principal !== undefined) setQueixaPrincipal(currentRecord.queixa_principal || '');
      if (currentRecord.exame_fisico !== undefined) setExameFisico(currentRecord.exame_fisico || '');
      if (currentRecord.hipotese_diagnostica !== undefined) {
        setHipoteseDiag(currentRecord.hipotese_diagnostica || '');
        if (currentRecord.hipotese_diagnostica) setAtestadoCid(currentRecord.hipotese_diagnostica);
      }
      if (currentRecord.conduta_plano_terapeutico !== undefined) setCondutaPlano(currentRecord.conduta_plano_terapeutico || '');
      if (currentRecord.prescricao !== undefined) setPrescricaoText(currentRecord.prescricao || currentRecord.conduta_plano_terapeutico || '');

      const recAlerts = currentRecord.alertas_copiloto || currentRecord.alertas_clinicos;
      if (Array.isArray(recAlerts)) {
        setClinicalAlerts(recAlerts);
      } else {
        setClinicalAlerts([]);
      }

      if (currentRecord.checklist_integrativo && hasMeaningfulData(currentRecord.checklist_integrativo)) {
        setIntegrativeData(currentRecord.checklist_integrativo);
      }

      if (currentRecord.dados_especialidade) {
        setSpecialtyData(currentRecord.dados_especialidade);
      }
    }
  }, [currentRecord]);

  return (
    <div className="space-y-6">
      {/* Patient Dossier Header (Prontuário Azul Style) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden transition-all">
        {/* Top Gradient Stripe - Prontuário Azul */}
        <div className="pv-header-gradient-blue h-3.5 w-full" />

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Patient Info */}
            <div className="flex items-start gap-4">
              <div className={`relative w-16 h-16 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-inner shrink-0 transition-all ${
                isPromoter 
                  ? 'ring-4 ring-emerald-500 ring-offset-2 shadow-emerald-500/30' 
                  : 'border border-blue-200'
              }`}>
                {patientName ? patientName.charAt(0).toUpperCase() : 'P'}
                {isPromoter && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full shadow-xs uppercase">
                    Promotor 5★
                  </span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{patientName || 'PACIENTE NÃO INFORMADO'}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    ID: {getPatientDisplayId(currentRecord, patientName)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {convenio || 'Particular'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {patientStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>🎂 {patientDob ? (isNaN(new Date(patientDob).getTime()) ? patientDob : new Date(patientDob).toLocaleDateString('pt-BR')) : 'N/D'} • <strong>{age !== '--' ? `${age} anos` : 'Idade N/D'}</strong></span>
                  <span>👤 Paciente Ativo</span>
                  {patientCpf && <span>📄 CPF: {patientCpf}</span>}
                  {patientPhone && <span>📞 Tel: {patientPhone}</span>}
                </p>

                {/* Etiquetas de Alertas Clínicos Pulsantes */}
                {clinicalAlerts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {clinicalAlerts.map((alert, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300 animate-pulse flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        {alert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons & Journey Automation Controls */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={() => setShowVitalMonitor(!showVitalMonitor)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                  showVitalMonitor
                    ? 'bg-cyan-600 text-white shadow-cyan-600/30 ring-2 ring-cyan-400'
                    : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700'
                }`}
                title="Monitor Multiparamétrico com Sinais Vitais em Tempo Real (ECG, SpO2, Pressão, Soro IV)"
              >
                <Activity size={15} className="animate-pulse text-cyan-400" />
                {showVitalMonitor ? 'Ocultar Monitor' : 'Monitor Vinais IA (ECG/Soro)'}
              </button>

              <button
                type="button"
                onClick={() => setIsAnamneseModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95"
                title="Cadastro e Anamnese Pré-Consulta com ViaCEP e Alertas"
              >
                <FileText size={15} />
                Anamnese Pré-Consulta
              </button>

              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95"
                title="Assinatura Touchscreen para TCLE e Contratos"
              >
                <FileSignature size={15} />
                Assinatura
              </button>

              <button
                type="button"
                onClick={() => setIsNpsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-extrabold transition-all shadow-md active:scale-95"
                title="Pesquisa NPS e Booster do Google Meu Negócio"
              >
                <HeartHandshake size={15} />
                NPS Google
              </button>

              <button
                onClick={() => {
                  if (isRecording) stopRecording();
                  else startRecording();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                }`}
              >
                <Mic size={16} />
                {isRecording ? 'Parar' : 'Atender IA'}
              </button>

              <button
                onClick={handleSaveRecord}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                  saveSuccess 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <CheckCircle2 size={16} />
                {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Evoluir'}
              </button>

              {onOpenChat && patientPhone && (
                <button
                  onClick={() => onOpenChat(patientPhone)}
                  className="p-2.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-2xl transition-all"
                  title="Enviar mensagem no WhatsApp"
                >
                  <MessageSquare size={18} />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                title="Fechar Prontuário"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Sub-Tab Navigation Bar (Prontuário Azul Style) */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setExamMode('standard');
                setActiveTab('evolucao');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                activeTab === 'evolucao' && examMode === 'standard' ? 'pv-tab-active-blue' : 'pv-tab-inactive'
              }`}
            >
              <Activity size={15} />
              Evolução & Atendimento
            </button>

            <button
              onClick={() => setActiveTab('anamnese')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                activeTab === 'anamnese' ? 'pv-tab-active-blue' : 'pv-tab-inactive'
              }`}
            >
              <FileText size={15} />
              Anamnese & Mapeamento de Dores
            </button>

            <button
              onClick={() => {
                setExamMode('integrative');
                setActiveTab('evolucao');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                activeTab === 'evolucao' && examMode === 'integrative' 
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20' 
                  : 'pv-tab-inactive hover:text-emerald-700'
              }`}
            >
              <Leaf size={15} className={activeTab === 'evolucao' && examMode === 'integrative' ? 'text-white' : 'text-emerald-600'} />
              🌿 Medicina Integrativa
            </button>

            <button
              onClick={() => {
                setExamMode('neurological');
                setActiveTab('evolucao');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                activeTab === 'evolucao' && examMode === 'neurological' 
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20' 
                  : 'pv-tab-inactive hover:text-purple-700'
              }`}
            >
              <Brain size={15} className={activeTab === 'evolucao' && examMode === 'neurological' ? 'text-white' : 'text-purple-600'} />
              🧠 Exame Neurológico
            </button>

            <button
              onClick={() => {
                setExamMode('biological_dentistry');
                setActiveTab('evolucao');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                activeTab === 'evolucao' && examMode === 'biological_dentistry' 
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20' 
                  : 'pv-tab-inactive hover:text-blue-700'
              }`}
            >
              <Sparkles size={15} className={activeTab === 'evolucao' && examMode === 'biological_dentistry' ? 'text-white' : 'text-blue-600'} />
              🦷 Odontologia Biológica
            </button>

            <button
              onClick={() => setActiveTab('plano')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                activeTab === 'plano' ? 'pv-tab-active-blue' : 'pv-tab-inactive'
              }`}
            >
              <Stethoscope size={15} />
              Plano Terapêutico
            </button>

            <button
              onClick={() => setActiveTab('anexos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                activeTab === 'anexos' ? 'pv-tab-active-blue' : 'pv-tab-inactive'
              }`}
            >
              <Paperclip size={15} />
              Anexos & Exames Imagem (TC/X-Ray)
            </button>

            <button
              onClick={() => setActiveTab('prescricoes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                activeTab === 'prescricoes' ? 'pv-tab-active-blue' : 'pv-tab-inactive'
              }`}
            >
              <FileSignature size={15} />
              Prescrições & Receituário
            </button>

            <button
              onClick={() => setActiveTab('financeiro')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${
                activeTab === 'financeiro' ? 'pv-tab-active-blue' : 'pv-tab-inactive'
              }`}
            >
              <CreditCard size={15} />
              Financeiro & Convênios
            </button>
          </div>
        </div>
      </div>

      {/* Monitor Multiparamétrico de Sinais Vitais / ECG / Soro IV */}
      <AnimatePresence>
        {showVitalMonitor && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <VitalMonitor 
              bpm={currentRecord?.vitals?.bpm || currentRecord?.dados_clinicos?.fc || 75}
              spo2={currentRecord?.vitals?.spo2 || currentRecord?.dados_clinicos?.spo2 || 98}
              resp={currentRecord?.vitals?.resp || currentRecord?.dados_clinicos?.fr || 16}
              pressao={currentRecord?.vitals?.pressao || currentRecord?.dados_clinicos?.pressao || '120/80'}
              soroName={currentRecord?.vitals?.soroName || 'Soro Fisiológico 0.9% (500ml)'}
              soroRate={currentRecord?.vitals?.soroRate || '21 gotas/min • 63 mL/h'}
              resumo_clinico={currentRecord?.resumo_formatado || 'Sinais vitais e perfusão hemodinâmica monitorados em tempo real'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Rendered According to Active Sub-Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'evolucao' && (
          <motion.div
            key="tab-evolucao"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column (5/12): Pixeon Timeline - Historical Evolutions */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col h-[780px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Histórico do Prontuário</h3>
                    <p className="text-[10px] text-slate-400">Registros clínicos e evoluções passadas</p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                  {history.length} Atendimentos
                </span>
              </div>

              {/* Scrollable Timeline List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar-emerald">
                {/* Real-time Timeline items saved from current session or database */}
                {history.length > 0 ? (
                  history.map((rec, index) => {
                    const isCurrentPatient = !patientName || (rec.paciente_nome_completo && rec.paciente_nome_completo.toLowerCase().trim() === patientName.toLowerCase().trim());
                    return (
                      <div 
                        key={rec.id || `rec-${index}`} 
                        onClick={() => setSelectedHistoryRecord(rec)}
                        className={`p-3.5 space-y-2 cursor-pointer transition-all hover:shadow-md group rounded-2xl border ${
                          isCurrentPatient 
                            ? 'bg-emerald-50/80 border-emerald-300 hover:border-emerald-500 shadow-xs' 
                            : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className={isCurrentPatient ? "text-emerald-600" : "text-slate-400"} />
                            {rec.data_consulta ? (rec.data_consulta.includes('-') ? new Date(rec.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR') : rec.data_consulta) : 'Atendimento'}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] rounded-full uppercase flex items-center gap-1 font-extrabold ${
                            isCurrentPatient ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                          }`}>
                            <Eye size={10} /> {rec.especialidade || rec.paciente_status || 'Gravado'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="font-semibold text-slate-800 line-clamp-2 bg-white p-2.5 rounded-xl border border-slate-200/80 group-hover:border-emerald-300">
                            "{rec.resumo_formatado || rec.queixa_principal || rec.conduta_plano_terapeutico || 'Atendimento salvo no prontuário.'}"
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-0.5">
                            <span className="font-medium text-slate-600">👤 {rec.paciente_nome_completo || patientName || 'Paciente'}</span>
                            <span className="font-bold text-slate-500">🩺 {rec.profissional_responsavel || 'Médico'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="p-4 text-center text-xs text-slate-600 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-1">
                      <p className="font-bold text-slate-800">Nenhum atendimento gravado ainda</p>
                      <p className="text-[11px] text-slate-500">Ao clicar em <strong className="text-emerald-700">"Evoluir / Salvar Prontuário"</strong>, seus atendimentos salvos aparecerão nesta lista em tempo real.</p>
                    </div>

                    <div 
                      onClick={() => setSelectedHistoryRecord({
                        data_consulta: '2026-07-28',
                        paciente_nome_completo: patientName || 'Paciente Exemplo',
                        especialidade: 'Medicina Integrativa & Bloqueio',
                        profissional_responsavel: 'Dr. Carlos Morato',
                        queixa_principal: 'Queixas de dores articulares e fadiga crônica persistente. Paciente relata melhora após bloqueio de nervo PE.',
                        exame_fisico: 'Sinais vitais estáveis. PA 120/80 mmHg, FC 74 bpm. Ausência de edema de membros inferiores.',
                        hipotese_diagnostica: 'M501 - TRANSTORNO DO DISCO CERVICAL COM RADICULOPATIA',
                        conduta_plano_terapeutico: '1. Manter suplementação com Coenzima Q10 e Melatonina.\n2. Sessão de Fisioterapia Neuro Centro agendada.\n3. Retorno em 30 dias para reavaliação.',
                        resumo_formatado: 'Atendimento de demonstração em 28/07/2026.'
                      })}
                      className="bg-slate-50/80 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 space-y-1.5 cursor-pointer transition-all opacity-75 hover:opacity-100"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>28/07/2026 (Histórico Exemplo)</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] rounded-full uppercase">
                          Exemplo
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100">
                        "Exemplo de atendimento passado para consulta de demonstração."
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column (7/12): Active Clinical Record Editor (SOAP / Voice Copilot) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-[780px] overflow-hidden">
              {/* Fixed Top Header & Specialty Bar */}
              <div className="pb-4 border-b border-slate-100 space-y-3 bg-white z-10 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Registro Clínico do Atendimento</h3>
                      <p className="text-[10px] text-slate-400">Preenchimento automático por voz ou campos SOAP</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setUseDividedSoap(true)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        useDividedSoap ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Estrutura SOAP
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseDividedSoap(false)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        !useDividedSoap ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Bloco Único
                    </button>
                  </div>
                </div>

                {/* Specialty Selector Pill Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                  <button
                    onClick={() => setExamMode('standard')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      examMode === 'standard' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Geral / Clínica
                  </button>
                  <button
                    onClick={() => setExamMode('neurological')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      examMode === 'neurological' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🧠 Exame Neurológico
                  </button>
                  <button
                    onClick={() => setExamMode('integrative')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      examMode === 'integrative' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🌿 Medicina Integrativa
                  </button>
                  <button
                    onClick={() => setExamMode('biological_dentistry')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      examMode === 'biological_dentistry' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🦷 Odonto Biológica & Implantes Zircônia
                  </button>
                </div>
              </div>

              {/* Scrollable Clinical Form Body */}
              <div className="flex-1 overflow-y-auto pt-4 space-y-4 custom-scrollbar-blue pr-1">
                {/* Live Audio Transcription Notice */}
                {isRecording && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-800 animate-pulse">
                    <Mic size={18} className="text-red-600 shrink-0" />
                    <div>
                      <p className="font-bold">Ouvindo consulta por voz em tempo real...</p>
                      <p className="opacity-80 font-mono text-[11px] mt-0.5">"{liveTranscript || 'Aguardando voz do médico...'}"</p>
                    </div>
                  </div>
                )}

                {/* Divided SOAP Layout or Single Free Text */}
                {useDividedSoap ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Queixa Principal (Problema Ativo)
                      </label>
                      <textarea
                        rows={3}
                        value={queixaPrincipal}
                        onChange={(e) => setQueixaPrincipal(e.target.value)}
                        placeholder="PACIENTE COM DIFICULDADES NA MARCHA HÁ ALGUNS MESES..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Exame Físico
                      </label>
                      <textarea
                        rows={2}
                        value={exameFisico}
                        onChange={(e) => setExameFisico(e.target.value)}
                        placeholder="Sinais vitais normais, reflexos preservados..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Conclusão / Suspeita Diagnóstica (CID-10)
                      </label>
                      <input
                        type="text"
                        value={hipoteseDiag}
                        onChange={(e) => setHipoteseDiag(e.target.value)}
                        placeholder="M501 - TRANSTORNO DO DISCO CERVICAL COM RADICULOPATIA"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-blue-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Plano Terapêutico (Conduta / Prescrição)
                      </label>
                      <textarea
                        rows={3}
                        value={condutaPlano}
                        onChange={(e) => setCondutaPlano(e.target.value)}
                        placeholder="Encaminhamento para Fisioterapia e prescrição médica..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Evolução Livre / Copiloto de IA
                      </label>
                      <button
                        type="button"
                        onClick={() => handleProcessTextAI(currentRecord?.resumo_formatado)}
                        disabled={isLocalProcessing || isProcessing || !currentRecord?.resumo_formatado?.trim()}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                          currentRecord?.resumo_formatado?.trim() 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        title="Clique para a IA analisar o texto e preencher automaticamente a ficha do paciente"
                      >
                        <Sparkles size={14} />
                        <span>{isLocalProcessing || isProcessing ? 'Processando com IA...' : '✨ Processar com IA / Auto-Preencher'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Este campo é ideal para colar um texto corrido. Para extrair os dados e preencher a ficha do paciente, basta clicar no botão roxo <strong className="text-purple-700 font-bold">"✨ Processar com IA"</strong> acima.
                    </p>
                    <textarea
                      rows={10}
                      value={currentRecord?.resumo_formatado || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (setCurrentRecord) {
                          setCurrentRecord({ ...currentRecord, resumo_formatado: val });
                        }
                      }}
                      placeholder="Digite ou cole a evolução da consulta aqui..."
                      className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-sans leading-relaxed"
                    />
                  </div>
                )}

                {/* Specialized Form Renderings */}
                {examMode === 'neurological' && (
                  <div className="border-t pt-4">
                    <h4 className="font-bold text-xs uppercase text-purple-700 mb-2">Formulário Especializado: Neurologia</h4>
                    <NeurologicalExamForm
                      data={currentRecord?.exame_neurologico || specialtyData || {}}
                      onChange={(data) => {
                        setSpecialtyData(data);
                        if (setCurrentRecord) {
                          setCurrentRecord({ ...(currentRecord || {}), exame_neurologico: data });
                        }
                      }}
                    />
                  </div>
                )}

                {examMode === 'integrative' && (
                  <div className="border-t pt-4">
                    <h4 className="font-bold text-xs uppercase text-emerald-700 mb-2">Checklist de Medicina Integrativa</h4>
                    <IntegrativeChecklistForm
                      data={integrativeData}
                      onChange={setIntegrativeData}
                    />
                  </div>
                )}

                {examMode === 'biological_dentistry' && (
                  <div className="border-t pt-4">
                    <BiologicalDentistryForm
                      data={currentRecord?.dados_especialidade || specialtyData || {}}
                      onChange={(data) => setSpecialtyData(data)}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Anamnese & Mapeamento Corporal de Dores */}
        {activeTab === 'anamnese' && (
          <motion.div
            key="tab-anamnese"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Anamnese & Mapeamento Corporal de Dores</h3>
                <p className="text-xs text-slate-500">Marque diretamente nos modelos anatômicos os pontos de dor, gatilhos miofasciais e queixas do paciente.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <IntegrativeBodyMap
                  data={currentRecord?.mapeamento_corporal || []}
                  onChange={(points) => {
                    if (setCurrentRecord && currentRecord) {
                      setCurrentRecord({
                        ...currentRecord,
                        mapeamento_corporal: points
                      });
                    }
                  }}
                />
              </div>

              <div className="lg:col-span-6 space-y-4">
                <h4 className="font-bold text-sm text-slate-800">Histórico de Sintomas e Hábitos</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Anamnese Detalhada</label>
                  <textarea
                    rows={6}
                    value={queixaPrincipal}
                    onChange={(e) => setQueixaPrincipal(e.target.value)}
                    placeholder="Sintomas, início do quadro, fatores de melhora e piora..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Antecedentes Pessoais e Alergias</label>
                  <textarea
                    rows={4}
                    value={currentRecord?.antecedentes || ''}
                    onChange={(e) => {
                      if (setCurrentRecord && currentRecord) {
                        setCurrentRecord({ ...currentRecord, antecedentes: e.target.value });
                      }
                    }}
                    placeholder="Cirurgias prévias, comorbidades, alergias a medicamentos ou metais..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Dynamic Specialty Module (Medicina Integrativa, Exame Neurológico, Odontologia Biológica, Geral) */}
        {(activeTab === 'especialidade' || (activeTab as string) === 'harmonizacao') && (
          <motion.div
            key={`tab-specialty-${examMode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6"
          >
            {examMode === 'integrative' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Leaf className="text-emerald-600" size={22} />
                      Medicina Integrativa & Saúde Geral
                    </h3>
                    <p className="text-xs text-slate-500">Checklist integrativo, suplementos, vitaminas, minerais e rastreamento de patógenos.</p>
                  </div>
                </div>

                <IntegrativeChecklistForm
                  data={integrativeData}
                  onChange={setIntegrativeData}
                />
              </div>
            )}

            {examMode === 'neurological' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Brain className="text-purple-600" size={22} />
                      Avaliação Neurológica Especializada
                    </h3>
                    <p className="text-xs text-slate-500">Registro completo de pares cranianos, força muscular, tônus, sensibilidade, reflexos e coordenação.</p>
                  </div>
                </div>

                <NeurologicalExamForm
                  data={currentRecord?.exame_neurologico || specialtyData || {}}
                  onChange={(data) => {
                    setSpecialtyData(data);
                    if (setCurrentRecord) {
                      setCurrentRecord({ ...(currentRecord || {}), exame_neurologico: data });
                    }
                  }}
                />
              </div>
            )}

            {examMode === 'biological_dentistry' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="text-blue-600" size={22} />
                      Odontologia Biológica & Implantes Metal-Free (Zircônia)
                    </h3>
                    <p className="text-xs text-slate-500">Módulo Dra. Lucy para planejamento de implantes cerâmicos, remoção segura de amálgama (SMART), cavitações e terapia neural.</p>
                  </div>
                </div>

                <BiologicalDentistryForm
                  data={currentRecord?.dados_especialidade || specialtyData || {}}
                  onChange={(data) => setSpecialtyData(data)}
                />

                <div className="pt-4 border-t">
                  <h4 className="font-bold text-sm text-slate-800 mb-3">Imagens Odontológicas, Tomografia CBCT & Registros do Tratamento</h4>
                  <PatientMediaGallery patientName={patientName} />
                </div>
              </div>
            )}

            {examMode === 'standard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="text-blue-600" size={22} />
                      Clínica Geral & Rotina Médica
                    </h3>
                    <p className="text-xs text-slate-500">Acompanhamento geral e rotina de consulta médica.</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <p className="font-bold text-slate-800 mb-2">Orientações do Atendimento Clínico Geral:</p>
                  <p>Utilize a aba principal <strong>Evolução & Atendimento</strong> para o registro contínuo das notas SOAP e gravação por voz. Este espaço reúne o resumo das evoluções gerais do paciente.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab: Anexos e Imagens Radiológicas */}
        {activeTab === 'anexos' && (
          <motion.div
            key="tab-anexos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PatientMediaGallery patientName={patientName} />
          </motion.div>
        )}

        {/* Tab: Prescrições & Laudos */}
        {activeTab === 'prescricoes' && (
          <motion.div
            key="tab-prescricoes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Emissão de Receitas e Atestados Médicos</h3>
                <p className="text-xs text-slate-500">Gere documentos clínicos oficiais com cabeçalho da clínica e assinatura digital.</p>
              </div>

              {/* Toggle Document Type */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDocType('receituario')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    docType === 'receituario' 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Receituário & Suplementos
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('atestado')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    docType === 'atestado' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Atestado Médico Oficial
                </button>
              </div>
            </div>

            {docType === 'receituario' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Editor Column */}
                <div className="lg:col-span-6 space-y-4">
                  {/* BARRA UNIFICADA: DITADO POR VOZ + CONTROLE ANVISA */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 p-4 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Mic size={18} className="text-emerald-600 animate-pulse" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Ditado de Prescrição por Voz</span>
                          <span className="text-[10px] text-slate-500">Fale os remédios ou suplementos para preencher</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleDictatePrescription}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md active:scale-95 ${
                          isDictatingPrescription
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <Mic size={16} className={isDictatingPrescription ? 'animate-bounce' : ''} />
                        <span>{isDictatingPrescription ? 'Ouvindo Prescrição...' : 'Ditar Prescrição por Voz'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 text-xs">
                      <span className="text-slate-600 font-medium text-[11px]">Modelos Oficiais:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPrescriptionAnvisaOpen(true)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                          title="Receita Controlada Oficial (Amarela A, Azul B, Branca C)"
                        >
                          <ShieldCheck size={14} /> Notificação Controlada ANVISA
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Composição do Receituário / Fórmula
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const activeItems = getActiveIntegrativeItems(integrativeData);
                        if (activeItems.length === 0) {
                          toast.error('Nenhum suplemento marcado no checklist integrativo.');
                          return;
                        }
                        const formattedList = activeItems.map((item, idx) => `${idx + 1}. ${item.label}: ${item.value}`).join('\n');
                        const newText = prescricaoText 
                          ? `${prescricaoText}\n\nFÓRMULA INTEGRATIVA & SUPLEMENTAÇÃO:\n${formattedList}`
                          : `FÓRMULA INTEGRATIVA & SUPLEMENTAÇÃO:\n${formattedList}`;
                        setPrescricaoText(newText);
                        toast.success('Suplementos integrativos importados para a receita!');
                      }}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Sparkles size={14} className="text-emerald-600" />
                      Importar do Checklist Integrativo
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={prescricaoText}
                    onChange={(e) => setPrescricaoText(e.target.value)}
                    placeholder="Digite os medicamentos, dosagens, posologia e fórmula de suplementação integrativa..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono leading-relaxed shadow-inner"
                  />

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveRecord}
                      className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Salvar Receita no Prontuário
                    </button>

                    {onGenerateReceitaPDF && (
                      <button
                        onClick={onGenerateReceitaPDF}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                      >
                        <FileSignature size={16} />
                        Gerar PDF Oficial
                      </button>
                    )}
                  </div>
                </div>

                {/* Official Prescription Preview */}
                <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-inner text-slate-800 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-center border-b border-slate-200 pb-4">
                      <h2 className="font-extrabold text-sm uppercase tracking-widest text-slate-900">AMBULATÓRIO IA • MEDICINA INTEGRATIVA</h2>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Dr. Carlos Alberto Morato • CRM 126.235586</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{patientName || 'PACIENTE'}</p>
                        <p className="text-[10px] text-slate-500">CPF: {patientCpf || 'Não informado'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {new Date().toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs font-mono leading-relaxed space-y-2 min-h-[220px] whitespace-pre-wrap">
                      {prescricaoText || (
                        <span className="text-slate-400 italic">Preencha o campo ao lado para visualizar a receita formatada...</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 text-center border-t border-slate-200 text-xs">
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
                    <p className="font-bold text-slate-900">Dr. Carlos Alberto Morato</p>
                    <p className="text-[10px] text-slate-500">Assinatura Digital ICP-Brasil Verificada</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Atestado Médico View */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">Parâmetros do Atestado Médico</h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Dias de Afastamento</label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={diasAfastamento}
                      onChange={(e) => setDiasAfastamento(parseInt(e.target.value) || 1)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Diagnóstico / CID-10 (Opcional)</label>
                    <input
                      type="text"
                      value={atestadoCid}
                      onChange={(e) => setAtestadoCid(e.target.value)}
                      placeholder="Ex: M501 - TRANSTORNO DO DISCO CERVICAL"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    {onGenerateAtestadoPDF && (
                      <button
                        onClick={onGenerateAtestadoPDF}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                      >
                        <Printer size={16} />
                        Gerar e Imprimir Atestado em PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Atestado Preview */}
                <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6 shadow-inner text-slate-800 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="text-center border-b border-slate-200 pb-4">
                      <h2 className="font-extrabold text-base uppercase tracking-widest text-slate-900">ATESTADO MÉDICO</h2>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        AMBULATÓRIO IA • UNIDADE DE MEDICINA INTEGRATIVA
                      </p>
                    </div>

                    <div className="text-xs space-y-4 font-sans leading-relaxed text-slate-800 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                      <p>
                        Atesto para os devidos fins que o(a) Sr.(a) <strong className="text-slate-900 uppercase font-black">{patientName || 'PACIENTE'}</strong>, inscrito(a) no CPF nº <strong>{patientCpf || '---'}</strong>, esteve em atendimento médico nesta unidade nesta data.
                      </p>
                      <p>
                        Necessitando de <strong>{diasAfastamento} ({diasAfastamento === 1 ? 'um' : (diasAfastamento === 2 ? 'dois' : (diasAfastamento === 3 ? 'três' : (diasAfastamento === 5 ? 'cinco' : diasAfastamento)))}) dia(s)</strong> de afastamento de suas atividades profissionais/escolares por motivo de saúde, a contar desta data.
                      </p>
                      {atestadoCid && (
                        <p className="font-bold text-blue-800 bg-blue-50 p-2.5 rounded-xl border border-blue-100 text-[11px]">
                          CID-10: {atestadoCid}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 text-center text-xs border-t border-slate-200 space-y-1">
                    <div className="w-36 border-b border-slate-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-900">Dr. Carlos Alberto Morato</p>
                    <p className="text-[10px] text-slate-500">CRM 126.235586 • Medicina e Saúde Integrativa</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab: Plano Terapêutico */}
        {activeTab === 'plano' && (
          <motion.div
            key="tab-plano"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="text-blue-600" size={22} />
                  Plano Terapêutico & Conduta Médica
                </h3>
                <p className="text-xs text-slate-500">Orientações clínicas, conduta integrativa, suplementação e plano de acompanhamento do paciente.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveRecord}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Salvar Plano no Prontuário
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Plan Text Editor */}
              <div className="lg:col-span-7 space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detalhamento da Conduta e Orientações Terapêuticas
                </label>

                <textarea
                  rows={14}
                  value={condutaPlano}
                  onChange={(e) => setCondutaPlano(e.target.value)}
                  placeholder="1. Conduta clínica e orientações gerais...\n2. Hábitos de vida e nutrição integrativa...\n3. Encaminhamentos e retornos agendados..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans leading-relaxed shadow-inner"
                />

                <div className="flex items-center gap-3 pt-2">
                  {onGeneratePDF && (
                    <button
                      onClick={() => onGeneratePDF(currentRecord)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      <Download size={16} />
                      Gerar PDF do Plano Terapêutico
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(`Olá ${patientName}, aqui está o resumo do seu Plano Terapêutico do Ambulatório IA:\n\n${condutaPlano}`);
                      window.open(`https://wa.me/55${patientPhone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Enviar via WhatsApp
                  </button>
                </div>
              </div>

              {/* Integrative Supplements & Nutraceuticals Summary */}
              <div className="lg:col-span-5 bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Leaf className="text-emerald-600" size={18} />
                    Suplementos Ativos no Checklist
                  </h4>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {getActiveIntegrativeItems(integrativeData).length} ativos
                  </span>
                </div>

                {getActiveIntegrativeItems(integrativeData).length > 0 ? (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar-blue">
                    {getActiveIntegrativeItems(integrativeData).map((item) => (
                      <div key={item.key} className="p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-2xs hover:border-emerald-300 transition-all">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{item.label}</p>
                          <p className="text-[11px] text-emerald-700 font-semibold">{item.value}</p>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 space-y-2">
                    <Leaf size={32} className="mx-auto text-slate-300" />
                    <p className="text-xs font-medium">Nenhum suplemento ativo no checklist deste atendimento.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setExamMode('integrative');
                        setActiveTab('evolucao');
                      }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all mt-2 inline-block"
                    >
                      Abrir Checklist Integrativo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Financeiro */}
        {activeTab === 'financeiro' && (
          <motion.div
            key="tab-financeiro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="text-blue-600" size={22} />
                  Financeiro & Faturamento TISS
                </h3>
                <p className="text-xs text-slate-500">Gestão de convênios, guias TISS, recibos particulares e honorários médicos.</p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Atendimento Liberado
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Convênio / Plano</span>
                <p className="text-sm font-extrabold text-slate-900">{convenio || 'SUL AMÉRICA EMPRESA'}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Guia TISS Autorizada</span>
                <p className="text-sm font-extrabold text-blue-700">#983241-2026</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Valor Consulta / Honorário</span>
                <p className="text-sm font-extrabold text-emerald-700">R$ 450,00</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Historic Record Detail Modal */}
      {selectedHistoryRecord && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setSelectedHistoryRecord(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 my-auto max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {selectedHistoryRecord.especialidade || 'Consulta Médica'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Calendar size={12} />
                    {selectedHistoryRecord.data_consulta ? (
                      selectedHistoryRecord.data_consulta.includes('-') 
                        ? new Date(selectedHistoryRecord.data_consulta).toLocaleDateString('pt-BR') 
                        : selectedHistoryRecord.data_consulta
                    ) : 'Data não informada'}
                  </span>
                </div>
                <h2 className="text-xl font-bold mt-1 text-white">
                  {selectedHistoryRecord.paciente_nome_completo || patientName || 'Paciente'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Médico Responsável: {selectedHistoryRecord.profissional_responsavel || 'Dr. Carlos Morato'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedHistoryRecord(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Fechar (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Scroll */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-sm">
              {/* SOAP Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Queixa Principal / Anamnese</span>
                  <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                    {selectedHistoryRecord.queixa_principal || 'Sem queixas registradas.'}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Exame Físico & Achados</span>
                  <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                    {selectedHistoryRecord.exame_fisico || 'Sinais vitais normais. Exame sem alterações agudas.'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-1">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Conclusão / CID-10 / Hipótese Diagnóstica</span>
                <p className="text-slate-900 font-bold">
                  {selectedHistoryRecord.hipotese_diagnostica || 'Avaliação clínica geral.'}
                </p>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Plano Terapêutico & Conduta</span>
                <p className="text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                  {selectedHistoryRecord.conduta_plano_terapeutico || selectedHistoryRecord.sugestao_conduta || 'Manutenção da conduta habitual.'}
                </p>
              </div>

              {/* Specialty specific summary if exists */}
              {selectedHistoryRecord.checklist_integrativo && hasMeaningfulData(selectedHistoryRecord.checklist_integrativo) && (
                <div className="bg-purple-50/90 p-4 rounded-2xl border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      🌿 Prescrição & Checklist Integrativo ({selectedHistoryRecord.data_consulta ? (selectedHistoryRecord.data_consulta.includes('-') ? new Date(selectedHistoryRecord.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR') : selectedHistoryRecord.data_consulta) : 'Data do Prontuário'})
                    </span>
                    <span className="text-[10px] bg-purple-200/60 text-purple-900 font-extrabold px-2 py-0.5 rounded-md">
                      {getActiveIntegrativeItems(selectedHistoryRecord.checklist_integrativo).length} Itens Registrados
                    </span>
                  </div>
                  {getActiveIntegrativeItems(selectedHistoryRecord.checklist_integrativo).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {getActiveIntegrativeItems(selectedHistoryRecord.checklist_integrativo).map((item) => (
                        <div key={item.key} className="bg-white p-2.5 rounded-xl border border-purple-200/80 text-xs flex justify-between items-center shadow-2xs">
                          <span className="font-bold text-purple-950">{item.label}</span>
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">{item.value || 'Prescrito/Ativo'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-purple-900 font-medium">
                      Suplementações e protocolo da medicina integrativa devidamente associados ao prontuário.
                    </p>
                  )}
                </div>
              )}

              {/* Resumo Formatado se houver */}
              {selectedHistoryRecord.resumo_formatado && (
                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Resumo do Atendimento</span>
                  <p className="text-xs text-slate-700 whitespace-pre-line italic leading-relaxed">
                    {selectedHistoryRecord.resumo_formatado}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleLoadHistoryRecord(selectedHistoryRecord)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Activity size={16} />
                Carregar Dados no Atendimento Atual
              </button>

              <div className="flex items-center gap-2">
                {onGeneratePDF && (
                  <button
                    type="button"
                    onClick={() => onGeneratePDF(selectedHistoryRecord)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    <Printer size={15} />
                    Imprimir / PDF
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedHistoryRecord(null)}
                  className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Modais da Jornada do Paciente */}
      <PrescriptionAnvisaModal
        isOpen={isPrescriptionAnvisaOpen}
        onClose={() => setIsPrescriptionAnvisaOpen(false)}
        patientName={patientName}
        patientPhone={patientPhone}
        patientCpf={patientCpf}
        doctorName="Dr. Carlos Morato"
      />

      <PreConsultationAnamneseModal
        isOpen={isAnamneseModalOpen}
        onClose={() => setIsAnamneseModalOpen(false)}
        patientNamePrefill={patientName}
        patientPhonePrefill={patientPhone}
        patientCpfPrefill={patientCpf}
        onAnamneseSubmitted={(data) => {
          if (data.alertas_clinicos) {
            setClinicalAlerts(data.alertas_clinicos);
          }
        }}
      />

      <DigitalSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        patientName={patientName}
        patientCpf={patientCpf}
      />

      <NPSAndGoogleReviewModal
        isOpen={isNpsModalOpen}
        onClose={() => setIsNpsModalOpen(false)}
        patientName={patientName}
        patientPhone={patientPhone}
        onPromoterStatusChanged={(status) => setIsPromoter(status)}
      />
    </div>
  );
}
