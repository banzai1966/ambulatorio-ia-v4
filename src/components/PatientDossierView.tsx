import { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  UserCheck,
  Stethoscope, 
  ShieldCheck, 
  X,
  Search,
  Zap,
  Printer,
  Brain,
  Leaf,
  Layers,
  Square,
  Loader2
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
import { supabase } from '../lib/supabase';
import DigitalSignatureModal from './DigitalSignatureModal';
import NPSAndGoogleReviewModal from './NPSAndGoogleReviewModal';
import { initialIntegrativeData } from '../types/integrativeChecklist';
import { hasMeaningfulData, formatDateMask } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { processClinicalInput } from '../services/clinicalService';
import { resolveDoctorKey } from '../constants/clinicProfiles';

interface ClinicalDoctorProfile {
  id: string;
  full_name: string;
  especialidade: string;
  crm_cro?: string;
  default_mode?: 'biological_dentistry' | 'neurological' | 'integrative' | 'standard';
}

const DEFAULT_DOCTOR_PROFILES: ClinicalDoctorProfile[] = [
  {
    id: 'dr_carlos',
    full_name: 'Dr. Carlos Morato',
    especialidade: 'Neurologia & Medicina Integrativa',
    crm_cro: 'CRM/SP 145.892',
    default_mode: 'neurological',
  },
  {
    id: 'dra_lucy',
    full_name: 'Dra. Lucy Morata',
    especialidade: 'Odontologia Biológica & Saúde Integrativa',
    crm_cro: 'CRO/SP 98.412',
    default_mode: 'biological_dentistry',
  },
  {
    id: 'dr_marco',
    full_name: 'Marco Duarte',
    especialidade: 'Gestão & Administração Geral',
    crm_cro: 'Administrador Mestre',
    default_mode: 'standard',
  }
];

interface PatientDossierViewProps {
  patientName: string;
  patientPhone?: string;
  patientCpf?: string;
  patientDob?: string;
  patientStatus?: string;
  convenio?: string;
  statusPagamento?: string;
  valorConsulta?: string;
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
  teamProfiles?: any[];
  currentUser?: any;
}

// Precise age calculation function according to AGENTS.md Rule 1
function calculateAgeExact(dobString?: string): number | string {
  if (!dobString || typeof dobString !== 'string' || !dobString.trim()) return '--';
  const clean = dobString.trim();
  let day: number, month: number, year: number;

  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // 0-indexed month
      year = parseInt(parts[2], 10);
    } else {
      return '--';
    }
  } else if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    } else {
      return '--';
    }
  } else {
    return '--';
  }

  if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1900 || year > 2100) return '--';

  const today = new Date();
  let age = today.getFullYear() - year;
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age--;
  }
  return age >= 0 ? age : '--';
}

function formatDobDisplay(dobString?: string): string {
  if (!dobString || typeof dobString !== 'string' || !dobString.trim()) return 'N/D';
  const clean = dobString.trim();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
  } else if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }
  return clean;
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
  statusPagamento,
  valorConsulta,
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
  teamProfiles,
  currentUser,
}: PatientDossierViewProps) {
  const [activeTab, setActiveTab] = useState<
    'evolucao' | 'anamnese' | 'plano' | 'especialidade' | 'prescricoes' | 'anexos' | 'contratos' | 'financeiro'
  >('evolucao');

  const [clinicalAlerts, setClinicalAlerts] = useState<string[]>(
    currentRecord?.alertas_copiloto || currentRecord?.alertas_clinicos || []
  );

  // Lista unificada de profissionais da clínica (escalável para 10, 100, 1000 médicos/dentistas)
  const allDoctorProfiles: ClinicalDoctorProfile[] = useMemo(() => {
    const list: ClinicalDoctorProfile[] = [...DEFAULT_DOCTOR_PROFILES];
    if (teamProfiles && Array.isArray(teamProfiles)) {
      teamProfiles.forEach((p: any) => {
        if (!p || !p.full_name) return;
        const exists = list.some(d => d.id === p.id || d.full_name.toLowerCase() === p.full_name.toLowerCase());
        if (!exists) {
          const spec = p.especialidade || 'Clínica Geral';
          let defMode: 'biological_dentistry' | 'neurological' | 'integrative' | 'standard' = 'standard';
          if (spec.toLowerCase().includes('odonto') || spec.toLowerCase().includes('dent')) defMode = 'biological_dentistry';
          else if (spec.toLowerCase().includes('neuro')) defMode = 'neurological';
          else if (spec.toLowerCase().includes('integra')) defMode = 'integrative';

          list.push({
            id: p.id || `doc_${Date.now()}_${Math.random()}`,
            full_name: p.full_name,
            especialidade: spec,
            crm_cro: p.crm_cro || p.crm || p.cro || 'CRM/CRO',
            default_mode: defMode,
          });
        }
      });
    }
    return list;
  }, [teamProfiles]);

  const isMasterAdmin = useMemo(() => {
    const email = (currentUser?.email || '').toLowerCase().trim();
    const id = currentUser?.id || '';
    return email === 'marco.agduarte22@gmail.com' || id === 'master-admin-marco';
  }, [currentUser]);

  // Identificação do profissional responsável ativo
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(() => {
    // 1. Se houver usuário logado (Dr. Carlos, Dra. Lucy ou outro profissional)
    if (currentUser) {
      const docKey = resolveDoctorKey(currentUser);
      if (docKey === 'dr_carlos') return 'dr_carlos';
      if (docKey === 'dra_lucy') return 'dra_lucy';
      
      const email = (currentUser.email || '').toLowerCase().trim();
      const name = (currentUser.full_name || '').toLowerCase().trim();
      const match = allDoctorProfiles.find(d => 
        (name && (d.full_name.toLowerCase().includes(name) || name.includes(d.full_name.toLowerCase()))) ||
        (email && d.full_name.toLowerCase().includes(email.split('@')[0]))
      );
      if (match && match.id !== 'dr_marco') return match.id;
    }

    // 2. Se o prontuário atual tiver médico responsável registrado
    if (currentRecord?.profissional_responsavel) {
      const match = allDoctorProfiles.find(d => 
        d.full_name.toLowerCase().includes(currentRecord.profissional_responsavel.toLowerCase()) ||
        currentRecord.profissional_responsavel.toLowerCase().includes(d.full_name.toLowerCase())
      );
      if (match) return match.id;
    }

    // 3. Se o modo de exame inicial estiver explícito
    if (examMode === 'biological_dentistry' || currentRecord?.especialidade?.toLowerCase().includes('odonto') || currentRecord?.especialidade?.toLowerCase().includes('biol')) {
      return 'dra_lucy';
    }
    if (examMode === 'neurological' || currentRecord?.especialidade?.toLowerCase().includes('neuro')) {
      return 'dr_carlos';
    }

    // 4. Se for Marco Admin ou recuperação do localStorage
    const saved = typeof window !== 'undefined' ? localStorage.getItem('clinic_active_doctor_id') : null;
    if (saved && allDoctorProfiles.some(d => d.id === saved)) return saved;

    return 'dr_carlos';
  });

  // Garante sincronização imediata caso o usuário logado seja um médico específico
  useEffect(() => {
    if (!currentUser) return;
    const docKey = resolveDoctorKey(currentUser);
    if (docKey === 'dr_carlos') {
      if (selectedDoctorId !== 'dr_carlos') {
        setSelectedDoctorId('dr_carlos');
      }
      if (examMode !== 'neurological' && examMode !== 'integrative') {
        setExamMode('neurological');
      }
    } else if (docKey === 'dra_lucy') {
      if (selectedDoctorId !== 'dra_lucy') {
        setSelectedDoctorId('dra_lucy');
      }
      if (examMode !== 'biological_dentistry') {
        setExamMode('biological_dentistry');
      }
    }
  }, [currentUser]);

  // Sincroniza profissional quando o modo de exame alternar externamente
  useEffect(() => {
    const userDocKey = currentUser ? resolveDoctorKey(currentUser) : null;
    if (examMode === 'biological_dentistry') {
      const dentalDoc = allDoctorProfiles.find(d => d.default_mode === 'biological_dentistry' || d.id === 'dra_lucy');
      if (dentalDoc && selectedDoctorId !== dentalDoc.id && userDocKey !== 'dr_carlos') {
        setSelectedDoctorId(dentalDoc.id);
      }
    } else if (examMode === 'neurological' || examMode === 'integrative') {
      const neuroDoc = allDoctorProfiles.find(d => d.default_mode === 'neurological' || d.id === 'dr_carlos');
      if (neuroDoc && selectedDoctorId !== neuroDoc.id && userDocKey !== 'dra_lucy') {
        setSelectedDoctorId(neuroDoc.id);
      }
    }
  }, [examMode, allDoctorProfiles, currentUser, selectedDoctorId]);

  const activeDoctor = useMemo(() => {
    return allDoctorProfiles.find(d => d.id === selectedDoctorId) || allDoctorProfiles[0];
  }, [allDoctorProfiles, selectedDoctorId]);

  // Seletor de especialidade e troca de profissional
  const handleSelectDoctor = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    localStorage.setItem('clinic_active_doctor_id', doctorId);
    const doc = allDoctorProfiles.find(d => d.id === doctorId);
    if (!doc) return;

    // Ajusta o modo de exame baseado na especialidade do profissional
    const targetMode = doc.default_mode || 'standard';
    setExamMode(targetMode);

    if (targetMode === 'biological_dentistry') {
      setActiveTab('especialidade');
      
      // Procura se já existe um prontuário odontológico prévio deste paciente
      const dentalRec = (history || []).find(r => 
        r.especialidade?.toLowerCase().includes('odonto') || 
        r.especialidade?.toLowerCase().includes('biolog') ||
        r.dados_especialidade?.odontograma || 
        r.profissional_responsavel?.toLowerCase().includes(doc.full_name.toLowerCase())
      );
      
      if (dentalRec) {
        setCurrentRecord(dentalRec);
        setQueixaPrincipal(dentalRec.queixa_principal || '');
        setExameFisico(dentalRec.exame_fisico || '');
        setHipoteseDiag(dentalRec.hipotese_diagnostica || '');
        setCondutaPlano(dentalRec.conduta_plano_terapeutico || '');
        setPrescricaoText(dentalRec.prescricao || dentalRec.conduta_plano_terapeutico || '');
        if (dentalRec.dados_especialidade) setSpecialtyData(dentalRec.dados_especialidade);
      } else {
        // Novo atendimento individualizado para este profissional
        setCurrentRecord({
          especialidade: doc.especialidade,
          profissional_responsavel: doc.full_name,
          medico_id: doc.id,
          paciente_nome_completo: effectiveName,
          queixa_principal: '',
          exame_fisico: '',
          hipotese_diagnostica: '',
          conduta_plano_terapeutico: '',
          prescricao: '',
          dados_especialidade: { odontograma: {} }
        });
        setQueixaPrincipal('');
        setExameFisico('');
        setHipoteseDiag('');
        setCondutaPlano('');
        setPrescricaoText('');
        setSpecialtyData({ odontograma: {} });
      }
    } else if (targetMode === 'neurological') {
      setActiveTab('evolucao');
      const neuroRec = (history || []).find(r => 
        (r.especialidade?.toLowerCase().includes('neuro') || r.exame_neurologico) &&
        (!r.profissional_responsavel || r.profissional_responsavel.toLowerCase().includes(doc.full_name.toLowerCase()))
      );
      
      if (neuroRec) {
        setCurrentRecord(neuroRec);
        setQueixaPrincipal(neuroRec.queixa_principal || '');
        setExameFisico(neuroRec.exame_fisico || '');
        setHipoteseDiag(neuroRec.hipotese_diagnostica || '');
        setCondutaPlano(neuroRec.conduta_plano_terapeutico || '');
        setPrescricaoText(neuroRec.prescricao || neuroRec.conduta_plano_terapeutico || '');
      } else {
        setCurrentRecord({
          especialidade: doc.especialidade,
          profissional_responsavel: doc.full_name,
          medico_id: doc.id,
          paciente_nome_completo: effectiveName,
          queixa_principal: '',
          exame_fisico: '',
          hipotese_diagnostica: '',
          conduta_plano_terapeutico: '',
          prescricao: '',
        });
        setQueixaPrincipal('');
        setExameFisico('');
        setHipoteseDiag('');
        setCondutaPlano('');
        setPrescricaoText('');
      }
    } else {
      setActiveTab('evolucao');
      const docRec = (history || []).find(r => 
        r.profissional_responsavel?.toLowerCase().includes(doc.full_name.toLowerCase())
      );
      if (docRec) {
        setCurrentRecord(docRec);
        setQueixaPrincipal(docRec.queixa_principal || '');
        setExameFisico(docRec.exame_fisico || '');
        setHipoteseDiag(docRec.hipotese_diagnostica || '');
        setCondutaPlano(docRec.conduta_plano_terapeutico || '');
        setPrescricaoText(docRec.prescricao || docRec.conduta_plano_terapeutico || '');
      } else {
        setCurrentRecord({
          especialidade: doc.especialidade,
          profissional_responsavel: doc.full_name,
          medico_id: doc.id,
          paciente_nome_completo: effectiveName,
          queixa_principal: '',
          exame_fisico: '',
          hipotese_diagnostica: '',
          conduta_plano_terapeutico: '',
          prescricao: '',
        });
        setQueixaPrincipal('');
        setExameFisico('');
        setHipoteseDiag('');
        setCondutaPlano('');
        setPrescricaoText('');
      }
    }
  };

  const effectiveName = (patientName && patientName !== 'Consulta em Andamento' && patientName !== 'PACIENTE NÃO INFORMADO')
    ? patientName 
    : (currentRecord?.paciente_nome_completo || currentRecord?.paciente_nome || (patientPhone ? `Paciente (${patientPhone})` : 'Paciente'));
  
  const rawDob = patientDob || currentRecord?.paciente_data_nascimento || currentRecord?.data_nascimento || '';
  const effectiveDob = (rawDob && typeof rawDob === 'string' && rawDob.includes('-') && rawDob.split('-')[0].length === 4)
    ? `${rawDob.split('-')[2]}/${rawDob.split('-')[1]}/${rawDob.split('-')[0]}`
    : rawDob;
  
  const age = calculateAgeExact(effectiveDob);
  const effectivePhoto = currentRecord?.foto_url || currentRecord?.photoPreview || (currentRecord as any)?.foto || '';
  const effectivePaymentStatus = statusPagamento || currentRecord?.status_pagamento || '';
  const effectivePaymentValue = valorConsulta || currentRecord?.valor_consulta || '';

  // Auto-sync de foto, data de nascimento, CPF e alertas clínicos caso estejam faltando no prontuário ativo
  useEffect(() => {
    const fetchPatientAnamneseAuto = async () => {
      const cleanPhone = (patientPhone || currentRecord?.paciente_telefone || '').replace(/\D/g, '');
      const cleanWithout55 = cleanPhone.startsWith('55') && cleanPhone.length > 10 ? cleanPhone.slice(2) : cleanPhone;
      const targetName = effectiveName || '';
      const appointmentId = currentRecord?.agendamento_id || currentRecord?.id || '';

      // 1. Tenta carregar do localStorage imediatamente
      try {
        let localData: any = null;
        if (appointmentId) {
          const s = localStorage.getItem(`anamnese_app_${appointmentId}`);
          if (s) localData = JSON.parse(s);
        }
        if (!localData && cleanPhone) {
          const s = localStorage.getItem(`anamnese_${cleanPhone}`) || localStorage.getItem(`anamnese_55${cleanPhone}`);
          if (s) localData = JSON.parse(s);
        }
        if (!localData && cleanWithout55) {
          const s = localStorage.getItem(`anamnese_${cleanWithout55}`);
          if (s) localData = JSON.parse(s);
        }

        if (localData) {
          const lDob = localData.data_nascimento || localData.paciente_data_nascimento;
          if (localData.foto_url && !currentRecord?.foto_url && setCurrentRecord) {
            setCurrentRecord((prev: any) => ({ ...prev, foto_url: localData.foto_url }));
          }
          if (lDob && (!currentRecord?.paciente_data_nascimento || currentRecord.paciente_data_nascimento === '') && setCurrentRecord) {
            setCurrentRecord((prev: any) => ({ ...prev, paciente_data_nascimento: lDob, data_nascimento: lDob }));
          }
          if (localData.paciente_cpf && (!currentRecord?.paciente_cpf || currentRecord.paciente_cpf === '') && setCurrentRecord) {
            setCurrentRecord((prev: any) => ({ ...prev, paciente_cpf: localData.paciente_cpf }));
          }
          if (localData.alertas_clinicos && localData.alertas_clinicos.length > 0 && clinicalAlerts.length === 0) {
            setClinicalAlerts(localData.alertas_clinicos);
          }
        }
      } catch (e) {
        console.warn("Aviso busca local storage no prontuário:", e);
      }

      // 2. Busca na API de dados de anamnese do servidor
      try {
        const queryParams = new URLSearchParams();
        if (cleanPhone) queryParams.set('phone', cleanPhone);
        if (appointmentId) queryParams.set('id', String(appointmentId));
        if (targetName && targetName !== 'Paciente') queryParams.set('name', targetName);

        const res = await fetch(`/api/public/anamnese-data?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            const rDob = d.data_nascimento || d.paciente_data_nascimento;
            if (d.foto_url && !currentRecord?.foto_url && setCurrentRecord) {
              setCurrentRecord((prev: any) => ({ ...prev, foto_url: d.foto_url }));
            }
            if (rDob && (!currentRecord?.paciente_data_nascimento || currentRecord.paciente_data_nascimento === '') && setCurrentRecord) {
              setCurrentRecord((prev: any) => ({ ...prev, paciente_data_nascimento: rDob, data_nascimento: rDob }));
            }
            if (d.paciente_cpf && (!currentRecord?.paciente_cpf || currentRecord.paciente_cpf === '') && setCurrentRecord) {
              setCurrentRecord((prev: any) => ({ ...prev, paciente_cpf: d.paciente_cpf }));
            }
            if (d.alertas_clinicos && d.alertas_clinicos.length > 0) {
              setClinicalAlerts(d.alertas_clinicos);
            }
          }
        }
      } catch (apiErr) {
        console.warn("Aviso fetch remoto anamnese:", apiErr);
      }

      // 3. Fallback direto no Supabase (agendamentos e prontuários)
      try {
        if (supabase) {
          if (appointmentId && appointmentId !== '1') {
            const { data: agData } = await supabase.from('agendamentos').select('*').eq('id', appointmentId).limit(1);
            if (agData && agData.length > 0) {
              const ag = agData[0];
              const supaDob = ag.data_nascimento || ag.paciente_data_nascimento;
              if (supaDob && (!currentRecord?.paciente_data_nascimento || currentRecord.paciente_data_nascimento === '') && setCurrentRecord) {
                setCurrentRecord((prev: any) => ({ ...prev, paciente_data_nascimento: supaDob, data_nascimento: supaDob }));
              }
              if (ag.paciente_cpf && (!currentRecord?.paciente_cpf || currentRecord.paciente_cpf === '') && setCurrentRecord) {
                setCurrentRecord((prev: any) => ({ ...prev, paciente_cpf: ag.paciente_cpf }));
              }
              if (ag.foto_url && !currentRecord?.foto_url && setCurrentRecord) {
                setCurrentRecord((prev: any) => ({ ...prev, foto_url: ag.foto_url }));
              }
            }
          }
        }
      } catch (supaErr) {
        console.warn("Aviso fallback Supabase no prontuário:", supaErr);
      }
    };

    fetchPatientAnamneseAuto();
  }, [patientPhone, effectiveName, currentRecord?.agendamento_id, currentRecord?.paciente_data_nascimento]);

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
  const [isPromoter, setIsPromoter] = useState(false);
  const [showVitalMonitor, setShowVitalMonitor] = useState(false);
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [tempDob, setTempDob] = useState('');

  const handleOpenEditDob = () => {
    setTempDob(effectiveDob || '');
    setIsEditingDob(true);
  };

  const handleSaveInlineDob = () => {
    if (!tempDob.trim()) {
      setIsEditingDob(false);
      return;
    }
    if (setCurrentRecord) {
      setCurrentRecord((prev: any) => ({
        ...prev,
        paciente_data_nascimento: tempDob,
        data_nascimento: tempDob
      }));
    }
    const cleanPhone = (patientPhone || currentRecord?.paciente_telefone || '').replace(/\D/g, '');
    if (cleanPhone) {
      try {
        const existing = localStorage.getItem(`anamnese_${cleanPhone}`) || '{}';
        const parsed = JSON.parse(existing);
        parsed.data_nascimento = tempDob;
        localStorage.setItem(`anamnese_${cleanPhone}`, JSON.stringify(parsed));
      } catch (_) {}
    }
    setIsEditingDob(false);
    toast.success("Data de nascimento e idade atualizadas com sucesso!");
  };

  const handleProcessTextAI = async (textToProcess?: string) => {
    const text = textToProcess || currentRecord?.resumo_formatado;
    if (!text || !text.trim()) {
      toast.error("Por favor, digite ou cole um texto antes de processar com a IA.");
      return;
    }
    setIsLocalProcessing(true);
    const toastId = toast.loading("Processando texto com IA e preenchendo prontuário...");
    try {
      const result = await processClinicalInput(text, examMode || 'standard', 'Atendimento em Bloco Único');
      if (result) {
        if (result.queixa_principal) setQueixaPrincipal(result.queixa_principal);
        if (result.exame_fisico) setExameFisico(result.exame_fisico);
        if (result.hipotese_diagnostica) setHipoteseDiag(result.hipotese_diagnostica);
        if (result.conduta_plano_terapeutico) setCondutaPlano(result.conduta_plano_terapeutico);
        if (result.prescricao) setPrescricaoText(result.prescricao);
        if (result.alertas_copiloto && Array.isArray(result.alertas_copiloto)) {
          setClinicalAlerts(result.alertas_copiloto);
        }

        // Extração clínica determinística para complementar/garantir preenchimento dos bonecos anatômicos
        const lowerText = text.toLowerCase();
        const fallbackNeuro: any = { reflexos_wexler: {}, dermatomos_marcardos: {}, forca_muscular: {} };
        
        // Wexler
        if (lowerText.includes('bicipital à direita (1+)') || lowerText.includes('biceps d (1+)') || lowerText.includes('bicipital d (1+)') || lowerText.includes('hiporreflexia bicipital à direita') || lowerText.includes('hiporreflexia bicipital a direita') || (lowerText.includes('bicipital') && lowerText.includes('1+'))) {
          fallbackNeuro.reflexos_wexler.biceps_d = '1+';
        }
        if (lowerText.includes('biceps e normal') || lowerText.includes('biceps e (2+)') || lowerText.includes('bicipital e (2+)')) {
          fallbackNeuro.reflexos_wexler.biceps_e = '2+';
        }
        if (lowerText.includes('patelar (3+)') || lowerText.includes('patelar d (3+)') || lowerText.includes('hiperreflexia patelar') || lowerText.includes('patelar direito (3+)')) {
          fallbackNeuro.reflexos_wexler.patelar_d = '3+';
        }
        if (lowerText.includes('patelar e e aquileu e normais') || lowerText.includes('patelar e (2+)')) {
          fallbackNeuro.reflexos_wexler.patelar_e = '2+';
        }
        if (lowerText.includes('aquileu (4+)') || lowerText.includes('aquileu d (4+)') || lowerText.includes('clonus inesgotavel em reflexo aquileu') || lowerText.includes('clônus inesgotável em reflexo aquileu') || lowerText.includes('clonus inesgotavel (4+)') || lowerText.includes('clônus inesgotável (4+)')) {
          fallbackNeuro.reflexos_wexler.aquileu_d = '4+';
        }
        if (lowerText.includes('aquileu e (2+)') || lowerText.includes('aquileu e normal')) {
          fallbackNeuro.reflexos_wexler.aquileu_e = '2+';
        }

        // Dermátomos
        if (lowerText.includes('c5') && (lowerText.includes('parestesia') || lowerText.includes('formigamento') || lowerText.includes('queimação') || lowerText.includes('queimacao'))) {
          fallbackNeuro.dermatomos_marcardos.C5 = 'parestesia';
        } else if (lowerText.includes('c5') && lowerText.includes('hipoestesia')) {
          fallbackNeuro.dermatomos_marcardos.C5 = 'hipoestesia';
        }
        if (lowerText.includes('c6') && (lowerText.includes('hipoestesia') || lowerText.includes('deficit sensitivo') || lowerText.includes('déficit sensitivo') || lowerText.includes('sensitivo compat'))) {
          fallbackNeuro.dermatomos_marcardos.C6 = 'hipoestesia';
        } else if (lowerText.includes('c6') && lowerText.includes('parestesia')) {
          fallbackNeuro.dermatomos_marcardos.C6 = 'parestesia';
        }
        if (lowerText.includes('l4')) {
          fallbackNeuro.dermatomos_marcardos.L4 = (lowerText.includes('dor') || lowerText.includes('queimação')) ? 'dor' : 'hipoestesia';
        }
        if (lowerText.includes('l5')) {
          fallbackNeuro.dermatomos_marcardos.L5 = (lowerText.includes('dor') || lowerText.includes('queimação')) ? 'dor' : 'hipoestesia';
        }

        // Combina com o resultado da IA
        const mergedNeuroResult = {
          ...(result.exame_neurologico || {}),
          reflexos_wexler: {
            ...(result.exame_neurologico?.reflexos_wexler || {}),
            ...fallbackNeuro.reflexos_wexler
          },
          dermatomos_marcardos: {
            ...(result.exame_neurologico?.dermatomos_marcardos || {}),
            ...(result.exame_neurologico?.dermatomos_marcados || {}),
            ...fallbackNeuro.dermatomos_marcardos
          }
        };

        if (result.checklist_integrativo && setIntegrativeData) {
          setIntegrativeData((prev: any) => {
            const updated = { ...(prev || {}) };
            for (const cat of Object.keys(result.checklist_integrativo)) {
              if (typeof result.checklist_integrativo[cat] === 'object' && result.checklist_integrativo[cat] !== null) {
                updated[cat] = {
                  ...(updated[cat] || {}),
                  ...result.checklist_integrativo[cat]
                };
              } else {
                updated[cat] = result.checklist_integrativo[cat];
              }
            }
            return updated;
          });
        }

        if (examMode === 'neurological' || (mergedNeuroResult && hasMeaningfulData(mergedNeuroResult))) {
          setSpecialtyData((prev: any) => {
            const updated = { ...(prev || {}) };
            for (const key of Object.keys(mergedNeuroResult)) {
              if (typeof mergedNeuroResult[key] === 'object' && mergedNeuroResult[key] !== null) {
                updated[key] = {
                  ...(updated[key] || {}),
                  ...mergedNeuroResult[key]
                };
              } else {
                updated[key] = mergedNeuroResult[key];
              }
            }
            return updated;
          });
        } else if (examMode === 'biological_dentistry' || (result.dados_especialidade && Object.keys(result.dados_especialidade).length > 0)) {
          const incomingOdonto = result.dados_especialidade?.odontograma || result.odontograma;
          setSpecialtyData((prev: any) => ({
            ...(prev || {}),
            ...(result.dados_especialidade || {}),
            odontograma: incomingOdonto 
              ? { 
                  ...(prev?.odontograma || {}), 
                  ...incomingOdonto,
                  teeth: {
                    ...(prev?.odontograma?.teeth || {}),
                    ...(incomingOdonto?.teeth || {})
                  }
                }
              : prev?.odontograma
          }));
        }

        if (setCurrentRecord) {
          setCurrentRecord((prev: any) => {
            const prevChecklist = prev?.checklist_integrativo || {};
            const incomingChecklist = result.checklist_integrativo || {};
            const mergedChecklist = { ...prevChecklist };
            for (const cat of Object.keys(incomingChecklist)) {
              if (typeof incomingChecklist[cat] === 'object' && incomingChecklist[cat] !== null) {
                mergedChecklist[cat] = {
                  ...(mergedChecklist[cat] || {}),
                  ...incomingChecklist[cat]
                };
              } else {
                mergedChecklist[cat] = incomingChecklist[cat];
              }
            }

            const prevNeuro = prev?.exame_neurologico || {};
            const incomingNeuro = mergedNeuroResult || {};
            const mergedNeuro = { ...prevNeuro };
            for (const key of Object.keys(incomingNeuro)) {
              if (typeof incomingNeuro[key] === 'object' && incomingNeuro[key] !== null) {
                mergedNeuro[key] = {
                  ...(mergedNeuro[key] || {}),
                  ...incomingNeuro[key]
                };
              } else {
                mergedNeuro[key] = incomingNeuro[key];
              }
            }

            const incomingSpec = result.dados_especialidade || {};
            const incomingOdonto = incomingSpec.odontograma || result.odontograma;
            const mergedOdonto = incomingOdonto ? {
              ...(prev?.dados_especialidade?.odontograma || {}),
              ...incomingOdonto,
              teeth: {
                ...(prev?.dados_especialidade?.odontograma?.teeth || {}),
                ...(incomingOdonto?.teeth || {})
              }
            } : prev?.dados_especialidade?.odontograma;

            const mergedDadosEspecialidade = {
              ...(prev?.dados_especialidade || {}),
              ...incomingSpec,
              ...(mergedOdonto ? { odontograma: mergedOdonto } : {})
            };

            return {
              ...prev,
              ...result,
              checklist_integrativo: result.checklist_integrativo ? mergedChecklist : prev?.checklist_integrativo,
              exame_neurologico: (examMode === 'neurological' || (mergedNeuroResult && hasMeaningfulData(mergedNeuroResult))) ? mergedNeuro : prev?.exame_neurologico,
              mapeamento_corporal: (result.mapeamento_corporal && result.mapeamento_corporal.length > 0)
                ? result.mapeamento_corporal
                : (prev?.mapeamento_corporal || []),
              dados_especialidade: mergedDadosEspecialidade
            };
          });
        }
        toast.success("✨ IA preencheu a ficha, especialidade e condutas com sucesso!", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha ao processar texto com a IA.", { id: toastId });
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
      checklist_integrativo: integrativeData || currentRecord?.checklist_integrativo,
      exame_neurologico: currentRecord?.exame_neurologico || (examMode === 'neurological' ? specialtyData : undefined),
      dados_especialidade: {
        ...specialtyData,
        mapeamento_corporal: currentRecord?.mapeamento_corporal || specialtyData?.mapeamento_corporal || []
      },
      mapeamento_corporal: currentRecord?.mapeamento_corporal || specialtyData?.mapeamento_corporal || [],
      especialidade: examMode === 'biological_dentistry'
        ? 'Odontologia Biológica' 
        : (examMode === 'integrative' ? 'Integrativa' : (examMode === 'neurological' ? 'Neurologia' : (activeDoctor.especialidade || currentRecord?.especialidade || 'Geral'))),
      profissional_responsavel: activeDoctor.full_name,
      medico_id: activeDoctor.id,
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
    const loadedNeuro = rec.exame_neurologico || rec.dados_especialidade?.exame_neurologico || loadedSpecialty?.exame_neurologico;
    const loadedBodyMap = (rec.mapeamento_corporal && rec.mapeamento_corporal.length > 0)
      ? rec.mapeamento_corporal 
      : (rec.dados_especialidade?.mapeamento_corporal || []);

    const sanitizedRecord = {
      ...rec,
      checklist_integrativo: loadedChecklist,
      exame_neurologico: loadedNeuro || rec.exame_neurologico,
      dados_especialidade: {
        ...loadedSpecialty,
        exame_neurologico: loadedNeuro || loadedSpecialty?.exame_neurologico,
        mapeamento_corporal: loadedBodyMap
      },
      mapeamento_corporal: loadedBodyMap,
      vitals: rec.vitals || rec.dados_especialidade?.vitals || undefined,
    };
    
    setCurrentRecord(sanitizedRecord);
    setIntegrativeData(loadedChecklist);
    setSpecialtyData({
      ...loadedSpecialty,
      ...(loadedNeuro || {}),
      exame_neurologico: loadedNeuro,
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
    
    // Sincroniza o profissional do prontuário histórico
    if (rec.profissional_responsavel) {
      const match = allDoctorProfiles.find(d => 
        d.full_name.toLowerCase().includes(rec.profissional_responsavel.toLowerCase()) ||
        rec.profissional_responsavel.toLowerCase().includes(d.full_name.toLowerCase())
      );
      if (match) setSelectedDoctorId(match.id);
    }

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
      {/* Patient Dossier Header (Design Limpo & Moderno) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Patient Info */}
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner shrink-0 transition-all overflow-hidden border border-slate-200">
                {effectivePhoto ? (
                  <img 
                    src={effectivePhoto} 
                    alt={effectiveName} 
                    className="w-full h-full object-cover rounded-2xl" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  effectiveName ? effectiveName.charAt(0).toUpperCase() : 'P'
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{effectiveName}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    ID: {getPatientDisplayId(currentRecord, effectiveName)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {convenio || 'Particular'}
                  </span>
                  {isPromoter && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                      ★ Promotor 5★
                    </span>
                  )}
                  {effectivePaymentStatus && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      effectivePaymentStatus.startsWith('Pago') 
                        ? 'bg-sky-50 text-sky-700 border-sky-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {effectivePaymentStatus}{effectivePaymentValue ? ` • R$ ${effectivePaymentValue}` : ''}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {patientStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-medium mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {isEditingDob ? (
                    <div className="inline-flex items-center gap-1.5 bg-blue-50/90 border border-blue-300 px-2.5 py-1 rounded-xl shadow-xs">
                      <span className="text-[11px] font-bold text-blue-900">🎂 Nascimento:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="DD/MM/AAAA"
                        value={tempDob}
                        onChange={(e) => setTempDob(formatDateMask(e.target.value))}
                        className="w-24 px-2 py-0.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveInlineDob();
                          if (e.key === 'Escape') setIsEditingDob(false);
                        }}
                      />
                      {calculateAgeExact(tempDob) !== '--' && (
                        <span className="text-[11px] font-extrabold text-blue-700 bg-blue-200/80 px-1.5 py-0.5 rounded">
                          {calculateAgeExact(tempDob)} anos
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveInlineDob}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDob(false)}
                        className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800 text-[11px] font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenEditDob}
                      className="inline-flex items-center gap-1 hover:bg-slate-100 hover:text-slate-800 px-1.5 py-0.5 rounded-lg transition-all border border-transparent cursor-pointer group"
                      title="Clique para editar / informar a data de nascimento e recalcular a idade"
                    >
                      <span>🎂 {formatDobDisplay(effectiveDob)} • <strong>{age !== '--' ? `${age} anos` : 'Idade N/D'}</strong></span>
                      <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">✎ editar</span>
                    </button>
                  )}
                  <span>👤 Paciente Ativo</span>
                  {(patientCpf || currentRecord?.paciente_cpf) && <span>📄 CPF: {patientCpf || currentRecord?.paciente_cpf}</span>}
                  {(patientPhone || currentRecord?.paciente_telefone) && <span>📞 Tel: {patientPhone || currentRecord?.paciente_telefone}</span>}
                  {currentRecord?.endereco && <span>📍 {currentRecord.endereco}</span>}
                </div>

                {/* Etiquetas de Alertas Clínicos */}
                {clinicalAlerts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {clinicalAlerts.map((alert, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        {alert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Clean Action Command Bar */}
            {/* Clean Action Command Bar */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
              {/* Primary IA Dictation */}
              <button
                type="button"
                onClick={() => {
                  if (isRecording) stopRecording();
                  else startRecording();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 border ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 animate-pulse' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-950 border-blue-200/90'
                }`}
              >
                <Mic size={16} className={isRecording ? "text-white animate-bounce" : "text-blue-600"} />
                {isRecording ? 'Ouvindo...' : 'Atender IA'}
              </button>

              {/* Primary Save Evolution */}
              <button
                type="button"
                onClick={handleSaveRecord}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 ${
                  saveSuccess 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-slate-500 hover:bg-slate-600 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 size={16} />
                {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Evoluir Prontuário'}
              </button>

              {/* Secondary Tools */}
              <button
                type="button"
                onClick={() => setShowVitalMonitor(!showVitalMonitor)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  showVitalMonitor
                    ? 'bg-blue-50 text-blue-900 border-blue-300 ring-1 ring-blue-400'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Monitor de Sinais Vitais em Tempo Real"
              >
                <Activity size={14} className={showVitalMonitor ? "text-blue-600 animate-pulse" : "text-slate-500"} />
                <span>Vitais</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAnamneseModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
                title="Cadastro e Anamnese Pré-Consulta"
              >
                <FileText size={14} className="text-slate-500" />
                <span>Anamnese</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
                title="Assinatura Digital / Termos"
              >
                <FileSignature size={14} className="text-slate-500" />
                <span>Assinatura</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNpsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
                title="Pesquisa de Satisfação NPS & Google"
              >
                <HeartHandshake size={14} className="text-slate-500" />
                <span>NPS</span>
              </button>

              {onOpenChat && patientPhone && (
                <button
                  type="button"
                  onClick={() => onOpenChat(patientPhone)}
                  className="p-2 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-xl transition-all"
                  title="Abrir WhatsApp do Paciente"
                >
                  <MessageSquare size={16} />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                title="Fechar Prontuário"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Unified Dynamic Professional Selector & Clinical Tabs Bar */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-3">
            {/* Seletor do Profissional Responsável (Suporta 10, 100, 1000 médicos/dentistas) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {activeDoctor.default_mode === 'biological_dentistry' ? (
                      <Sparkles size={15} className="text-amber-300" />
                    ) : activeDoctor.default_mode === 'neurological' ? (
                      <Brain size={15} className="text-sky-300" />
                    ) : (
                      <Stethoscope size={15} />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Profissional Responsável:
                    </span>
                    {isMasterAdmin ? (
                      <div className="relative inline-block">
                        <select
                          id="select-active-doctor"
                          value={selectedDoctorId}
                          onChange={(e) => handleSelectDoctor(e.target.value)}
                          className="font-bold text-xs text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 pr-7 cursor-pointer appearance-none shadow-2xs focus:ring-2 focus:ring-slate-400 focus:outline-hidden transition-all"
                        >
                          {allDoctorProfiles.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.full_name} ({doc.especialidade})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <span className="font-bold text-xs text-slate-800">
                        {activeDoctor.full_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <span className="px-2.5 py-0.5 rounded-md bg-white text-slate-700 font-semibold text-[11px] border border-slate-200">
                    {activeDoctor.especialidade}
                  </span>
                  {activeDoctor.crm_cro && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium text-[11px]">
                      {activeDoctor.crm_cro}
                    </span>
                  )}
                </div>
              </div>

              {/* Botões Rápidos para troca entre os principais médicos (Exclusivo Administrador Mestre Marco Duarte) */}
              {isMasterAdmin && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {allDoctorProfiles.slice(0, 3).map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleSelectDoctor(doc.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        selectedDoctorId === doc.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                      }`}
                    >
                      {doc.default_mode === 'biological_dentistry' ? (
                        <Sparkles size={12} className={selectedDoctorId === doc.id ? 'text-amber-300' : 'text-slate-500'} />
                      ) : doc.default_mode === 'neurological' ? (
                        <Brain size={12} className={selectedDoctorId === doc.id ? 'text-sky-300' : 'text-slate-500'} />
                      ) : (
                        <UserCheck size={12} className={selectedDoctorId === doc.id ? 'text-emerald-300' : 'text-slate-500'} />
                      )}
                      <span>{doc.full_name.split(' ')[0]} {doc.full_name.split(' ')[1] || ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Abas Dinâmicas de acordo com o Profissional Selecionado */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              {/* Odonto Tab para Dra. Lucy / Odontologia Biológica */}
              {(activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry') && (
                <button
                  type="button"
                  id="tab-odontologia-biologica"
                  onClick={() => {
                    setExamMode('biological_dentistry');
                    setActiveTab('especialidade');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'especialidade' && examMode === 'biological_dentistry'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <Sparkles size={14} className={activeTab === 'especialidade' && examMode === 'biological_dentistry' ? 'text-amber-300' : 'text-slate-500'} />
                  Odontologia Biológica
                </button>
              )}

              <button
                type="button"
                id="tab-evolucao-soap"
                onClick={() => {
                  if (activeDoctor.default_mode !== 'biological_dentistry' && examMode === 'biological_dentistry') {
                    setExamMode(activeDoctor.default_mode || 'standard');
                  }
                  setActiveTab('evolucao');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'evolucao' 
                    ? 'bg-slate-800 text-white shadow-xs' 
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Activity size={14} />
                Evolução & Atendimento (SOAP)
              </button>

              {/* Destaque Neurológico - Dr. Carlos ou Especialistas em Neuro */}
              {(activeDoctor.default_mode === 'neurological' || examMode === 'neurological') && (
                <button
                  type="button"
                  id="tab-exame-neurologico"
                  onClick={() => {
                    setExamMode('neurological');
                    setActiveTab('especialidade');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'especialidade' && examMode === 'neurological' 
                      ? 'bg-slate-800 text-white shadow-xs' 
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <Brain size={14} className={activeTab === 'especialidade' && examMode === 'neurological' ? 'text-sky-300' : 'text-slate-500'} />
                  Exame Neurológico
                </button>
              )}

              {/* Destaque Medicina Integrativa - Dr. Carlos ou Integrativos */}
              {(activeDoctor.default_mode === 'neurological' || activeDoctor.default_mode === 'integrative' || examMode === 'integrative') && (
                <button
                  type="button"
                  id="tab-medicina-integrativa"
                  onClick={() => {
                    setExamMode('integrative');
                    setActiveTab('especialidade');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'especialidade' && examMode === 'integrative' 
                      ? 'bg-slate-800 text-white shadow-xs' 
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <Leaf size={14} className={activeTab === 'especialidade' && examMode === 'integrative' ? 'text-emerald-300' : 'text-slate-500'} />
                  Medicina Integrativa
                </button>
              )}

              {/* Mapeamento de Dores (BodyMap) */}
              {activeDoctor.default_mode !== 'biological_dentistry' && (
                <button
                  type="button"
                  id="tab-bodymap-dores"
                  onClick={() => setActiveTab('anamnese')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'anamnese' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <FileText size={14} />
                  Mapeamento de Dores (BodyMap)
                </button>
              )}

              <button
                type="button"
                id="tab-prescricoes-receituario"
                onClick={() => setActiveTab('prescricoes')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'prescricoes' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <FileSignature size={14} />
                Prescrições & Receituário
              </button>

              <button
                type="button"
                id="tab-plano-terapeutico"
                onClick={() => setActiveTab('plano')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'plano' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Stethoscope size={14} />
                Plano Terapêutico
              </button>

              <button
                type="button"
                id="tab-anexos-imagens"
                onClick={() => setActiveTab('anexos')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'anexos' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Paperclip size={14} />
                Exames & Imagens
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Recording / AI Processing Feedback Banner */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="bg-red-500 text-white p-4 rounded-2xl shadow-lg border border-red-600 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
                <Mic className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span className="font-extrabold text-sm uppercase tracking-wide">
                    Ouvindo Consulta em Tempo Real...
                  </span>
                </div>
                <p className="text-xs text-red-100 font-medium truncate max-w-xl">
                  {liveTranscript ? `"${liveTranscript}"` : "Fale naturalmente com o paciente. A IA está capturando o áudio..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={stopRecording}
                className="w-full md:w-auto px-5 py-2.5 bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square size={14} className="fill-red-700" />
                Finalizar e Preencher com IA
              </button>
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg border border-blue-700 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">
                  Inteligência Artificial Processando Consulta...
                </span>
                <span className="text-xs text-blue-100 font-medium">
                  Extraindo queixas, odontograma, procedimentos, receitas e plano terapêutico...
                </span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              Aguarde alguns instantes...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            {/* Left Column (5/12): Historical Evolutions Timeline */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 flex flex-col h-[740px]">
              {(() => {
                const isDental = activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry' || activeDoctor.especialidade.toLowerCase().includes('odonto');
                const filteredHistory = (history || []).filter(rec => {
                  if (isDental) {
                    return (
                      rec.especialidade?.toLowerCase().includes('odonto') || 
                      rec.especialidade?.toLowerCase().includes('biolog') ||
                      rec.dados_especialidade?.odontograma || 
                      rec.profissional_responsavel?.toLowerCase().includes('lucy')
                    );
                  }
                  return true;
                });

                return (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                          <Clock size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">
                            {isDental ? 'Histórico Odontológico' : 'Histórico do Prontuário'}
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            {isDental ? 'Atendimentos de Odontologia Biológica' : 'Registros e evoluções anteriores'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                        {filteredHistory.length} Registros
                      </span>
                    </div>

                    {/* Scrollable Timeline List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar-blue">
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((rec, index) => {
                          const isCurrentPatient = !patientName || (rec.paciente_nome_completo && rec.paciente_nome_completo.toLowerCase().trim() === patientName.toLowerCase().trim());
                          const isPreCad = Boolean(
                            rec.resumo_formatado?.toLowerCase().includes('pré-cadastro') || 
                            rec.especialidade?.toLowerCase().includes('pré-cadastro') ||
                            rec.paciente_status?.toLowerCase().includes('pré-cadastro')
                          );
                          return (
                            <div 
                              key={rec.id || `rec-${index}`} 
                              onClick={() => setSelectedHistoryRecord(rec)}
                              className={`p-3.5 space-y-2 cursor-pointer transition-all hover:shadow-sm group rounded-xl border ${
                                isPreCad
                                  ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                                  : isCurrentPatient 
                                    ? 'bg-sky-50/30 border-sky-200/70 hover:border-sky-300 shadow-2xs' 
                                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                <span className="flex items-center gap-1.5">
                                  <Clock size={13} className={isPreCad ? "text-slate-500" : isCurrentPatient ? "text-sky-600" : "text-slate-400"} />
                                  {rec.data_consulta ? (rec.data_consulta.includes('-') ? new Date(rec.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR') : rec.data_consulta) : (rec.created_at ? new Date(rec.created_at).toLocaleDateString('pt-BR') : 'Atendimento')}
                                </span>
                                <span className={`px-2 py-0.5 text-[9px] rounded-md uppercase flex items-center gap-1 font-bold ${
                                  isPreCad 
                                    ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                                    : isCurrentPatient 
                                      ? 'bg-sky-100 text-sky-800 border border-sky-200/80' 
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  <Eye size={10} /> {isPreCad ? 'PRÉ-CADASTRO' : (rec.especialidade ? rec.especialidade.toUpperCase() : 'CONSULTA')}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-xs">
                                <p className={`font-medium text-slate-800 line-clamp-2 bg-white p-2.5 rounded-lg border ${
                                  isPreCad ? 'border-slate-200/80' : 'border-slate-200/80'
                                }`}>
                                  "{rec.resumo_formatado || rec.queixa_principal || rec.conduta_plano_terapeutico || 'Atendimento salvo no prontuário.'}"
                                </p>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-0.5">
                                  <span className="font-medium text-slate-600">👤 {rec.paciente_nome_completo || patientName || 'Paciente'}</span>
                                  <span className="font-semibold text-slate-500">
                                    {isPreCad ? '📲 Ficha Digital' : `🩺 ${rec.profissional_responsavel || activeDoctor.full_name}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-600 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-2 mt-4">
                          <div className="text-3xl mx-auto">{isDental ? '🦷' : '📋'}</div>
                          <p className="font-bold text-slate-800">
                            {isDental ? 'Nenhum histórico odontológico anterior' : 'Nenhum atendimento anterior salvo'}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                            {isDental 
                              ? `Este paciente ainda não possui consultas odontológicas registradas por ${activeDoctor.full_name}. A nova consulta está pronta para ser preenchida ao lado.` 
                              : 'Ao clicar em "Evoluir Prontuário", os atendimentos deste paciente aparecerão nesta lista.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Right Column (7/12): Active Clinical Record Editor (SOAP / Voice Copilot) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col h-[740px] overflow-hidden">
              {/* Fixed Top Header & SOAP Toggle */}
              <div className="pb-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                    <Stethoscope size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry' ? 'Registro Clínico Odontológico' : 'Registro Clínico da Consulta'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {`Evolução clínica • ${activeDoctor.full_name} (${activeDoctor.especialidade})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setUseDividedSoap(true)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      useDividedSoap ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Campos SOAP
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseDividedSoap(false)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      !useDividedSoap ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Bloco Único / IA
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
                      <p className="opacity-80 font-mono text-[11px] mt-0.5">"{liveTranscript || 'Aguardando voz...'}"</p>
                    </div>
                  </div>
                )}

                {/* Divided SOAP Layout or Single Free Text */}
                {useDividedSoap ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry' ? 'Queixa Odontológica Principal (Subjetivo)' : 'Queixa Principal (Problema Ativo)'}
                      </label>
                      <textarea
                        rows={3}
                        value={queixaPrincipal}
                        onChange={(e) => setQueixaPrincipal(e.target.value)}
                        placeholder={
                          activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry'
                            ? "Ex: Paciente relata dor à mastigação no dente 16, sensibilidade térmica, relato de restaurações antigas em amálgama..."
                            : "Descreva a queixa principal do paciente..."
                        }
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry' ? 'Exame Físico Intraoral & Tomografia (Objetivo)' : 'Exame Físico'}
                      </label>
                      <textarea
                        rows={2}
                        value={exameFisico}
                        onChange={(e) => setExameFisico(e.target.value)}
                        placeholder={
                          activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry'
                            ? "Ex: Exame de tecidos moles íntegro, restauração infiltrada no dente 16, área hipodensa no dente 38 na tomografia..."
                            : "Sinais vitais normais, reflexos preservados..."
                        }
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry' ? 'Diagnóstico / Suspeita Odontológica (Avaliação)' : 'Conclusão / Suspeita Diagnóstica (CID-10)'}
                      </label>
                      <input
                        type="text"
                        value={hipoteseDiag}
                        onChange={(e) => setHipoteseDiag(e.target.value)}
                        placeholder={
                          activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry'
                            ? "Ex: K02.1 - Cárie dentinária secundária / K08.8 - Foco inflamatório maxilar (NICO)"
                            : "CID-10 ou conclusão diagnóstica..."
                        }
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-blue-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry' ? 'Plano Terapêutico & Conduta Biológica (Plano)' : 'Plano Terapêutico (Conduta / Prescrição)'}
                      </label>
                      <textarea
                        rows={3}
                        value={condutaPlano}
                        onChange={(e) => setCondutaPlano(e.target.value)}
                        placeholder={
                          activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry'
                            ? "Ex: Remoção segura de amálgama (Protocolo SMART), suplementação prévia com Vitamina C/Zinco, Terapia Neural..."
                            : "Encaminhamento para Fisioterapia e prescrição médica..."
                        }
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
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          currentRecord?.resumo_formatado?.trim() 
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 cursor-pointer shadow-xs active:scale-95' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                        title="Clique para a IA analisar o texto e preencher automaticamente a ficha do paciente"
                      >
                        <Sparkles size={14} className="text-blue-600" />
                        <span>{isLocalProcessing || isProcessing ? 'Processando com IA...' : '✨ Processar com IA / Auto-Preencher'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Este campo é ideal para colar um texto corrido. Para extrair os dados e preencher a ficha do paciente, clique no botão <strong className="text-slate-800 font-bold">"✨ Processar com IA"</strong> acima.
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
                      className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans leading-relaxed"
                    />
                  </div>
                )}

                {/* Specialized Form Renderings */}
                {examMode === 'neurological' && (
                  <div className="border-t pt-4">
                    <h4 className="font-bold text-xs uppercase text-blue-900 mb-2">Formulário Especializado: Neurologia</h4>
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
                    <h4 className="font-bold text-xs uppercase text-sky-800 mb-2">Checklist de Medicina Integrativa</h4>
                    <IntegrativeChecklistForm
                      data={integrativeData}
                      onChange={setIntegrativeData}
                    />
                  </div>
                )}

                {examMode === 'biological_dentistry' && (
                  <div className="border-t pt-4">
                    <BiologicalDentistryForm
                      data={{
                        ...(currentRecord?.dados_especialidade || {}),
                        ...(specialtyData || {})
                      }}
                      onChange={(data) => {
                        setSpecialtyData(data);
                        if (setCurrentRecord) {
                          setCurrentRecord((prev: any) => ({
                            ...prev,
                            dados_especialidade: {
                              ...(prev?.dados_especialidade || {}),
                              ...data
                            }
                          }));
                        }
                      }}
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
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Coluna Esquerda: Mapeamento Anatômico 360° */}
              <div className="lg:col-span-7">
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

              {/* Coluna Direita: Anamnese & Antecedentes */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-800 text-sm">Histórico de Sintomas & Queixas</h4>
                  <p className="text-[11px] text-slate-400">Registro detalhado da queixa e antecedentes</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Anamnese Detalhada</label>
                  <textarea
                    rows={6}
                    value={queixaPrincipal}
                    onChange={(e) => setQueixaPrincipal(e.target.value)}
                    placeholder="Sintomas, início do quadro, fatores de melhora e piora..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Antecedentes Pessoais e Alergias</label>
                  <textarea
                    rows={4}
                    value={currentRecord?.antecedentes || ''}
                    onChange={(e) => {
                      if (setCurrentRecord && currentRecord) {
                        setCurrentRecord({ ...currentRecord, antecedentes: e.target.value });
                      }
                    }}
                    placeholder="Cirurgias prévias, comorbidades, alergias a medicamentos ou metais..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed font-sans"
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
                      <Brain className="text-blue-600" size={22} />
                      Avaliação Neurológica Especializada
                    </h3>
                    <p className="text-xs text-slate-500">Registro completo de pares cranianos, força muscular, tônus, sensibilidade, reflexos e coordenação.</p>
                  </div>
                </div>

                <NeurologicalExamForm
                  data={currentRecord?.exame_neurologico || specialtyData?.exame_neurologico || specialtyData || {}}
                  onChange={(data) => {
                    setSpecialtyData((prev: any) => ({ ...(prev || {}), ...data, exame_neurologico: data }));
                    if (setCurrentRecord) {
                      setCurrentRecord((prev: any) => ({ ...(prev || {}), exame_neurologico: data }));
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

                {/* 1. Galeria de Exames Radiológicos e Tomografia CBCT no topo para análise clínica */}
                <div className="bg-slate-50/80 p-4 rounded-3xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>📷</span>
                        <span>Exames de Imagem: Tomografia CBCT, Radiografias & Fotos Clínicas</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Analise as imagens e cortes tomográficos abaixo para orientar a marcação da arcada no odontograma.
                      </p>
                    </div>
                  </div>
                  <PatientMediaGallery 
                    patientName={patientName} 
                    hideEmbeddedOdontogram={true}
                    initialOdontogram={specialtyData?.odontograma || currentRecord?.dados_especialidade?.odontograma}
                    onOdontogramChange={(od) => setSpecialtyData((prev: any) => ({ ...prev, odontograma: od }))}
                  />
                </div>

                {/* 2. Formulário Clínico e Odontograma Interativo logo abaixo das imagens */}
                <BiologicalDentistryForm
                  patientName={effectiveName}
                  patientPhone={patientPhone || currentRecord?.paciente_telefone}
                  patientCpf={patientCpf || currentRecord?.paciente_cpf}
                  patientDob={effectiveDob}
                  data={{
                    ...(currentRecord?.dados_especialidade || {}),
                    ...(specialtyData || {})
                  }}
                  onChange={(data) => {
                    setSpecialtyData(data);
                    if (setCurrentRecord) {
                      setCurrentRecord((prev: any) => ({
                        ...prev,
                        dados_especialidade: {
                          ...(prev?.dados_especialidade || {}),
                          ...data
                        }
                      }));
                    }
                  }}
                />
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
            <PatientMediaGallery 
              patientName={patientName} 
              initialOdontogram={specialtyData?.odontograma || currentRecord?.dados_especialidade?.odontograma}
              onOdontogramChange={(od) => setSpecialtyData((prev: any) => ({ ...prev, odontograma: od }))}
            />
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
                <h3 className="text-xl font-bold text-slate-800">
                  {activeDoctor.default_mode === 'biological_dentistry' ? 'Emissão de Receitas e Atestados Odontológicos' : 'Emissão de Receitas e Atestados Médicos'}
                </h3>
                <p className="text-xs text-slate-500">Documentos clínicos oficiais timbrados com assinatura digital do profissional responsável.</p>
              </div>

              {/* Toggle Document Type */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDocType('receituario')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    docType === 'receituario' 
                      ? 'bg-slate-900 text-white shadow-xs' 
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
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {activeDoctor.default_mode === 'biological_dentistry' ? 'Atestado Odontológico' : 'Atestado Médico Oficial'}
                </button>
              </div>
            </div>

            {/* SELETOR RÁPIDO DE PROFISSIONAL EMISSOR */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/90 p-3 rounded-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700">Profissional Responsável (Emissor):</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {allDoctorProfiles.map((doc) => {
                    const isSelected = doc.id === selectedDoctorId;
                    const isDental = doc.default_mode === 'biological_dentistry' || doc.id === 'dra_lucy';
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleSelectDoctor(doc.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? (isDental 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                                : 'bg-blue-600 text-white border-blue-600 shadow-xs')
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isDental ? <Sparkles size={13} className={isSelected ? "text-amber-200" : "text-emerald-600"} /> : <Stethoscope size={13} className={isSelected ? "text-white" : "text-blue-600"} />}
                        <span>{doc.full_name}</span>
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-white/85' : 'text-slate-500'}`}>({doc.crm_cro})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                {activeDoctor.especialidade}
              </span>
            </div>

            {docType === 'receituario' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Editor Column */}
                <div className="lg:col-span-6 space-y-4">
                  {/* BARRA UNIFICADA: DITADO POR VOZ + CONTROLE ANVISA */}
                  <div className="bg-slate-50/90 border border-slate-200/80 p-4 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Mic size={18} className="text-blue-600" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Ditado de Prescrição por Voz</span>
                          <span className="text-[10px] text-slate-500">Fale os remédios ou suplementos para preencher</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleDictatePrescription}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-95 border ${
                          isDictatingPrescription
                            ? 'bg-red-600 text-white border-red-600 animate-pulse'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-950 border-blue-200/90'
                        }`}
                      >
                        <Mic size={16} className={isDictatingPrescription ? 'animate-bounce text-white' : 'text-blue-600'} />
                        <span>{isDictatingPrescription ? 'Ouvindo Prescrição...' : 'Ditar Prescrição por Voz'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium text-[11px]">Modelos Oficiais:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPrescriptionAnvisaOpen(true)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/90 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                          title="Receita Controlada Oficial (Amarela A, Azul B, Branca C)"
                        >
                          <ShieldCheck size={14} className="text-slate-600" /> Notificação Controlada ANVISA
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
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Sparkles size={14} className="text-blue-600" />
                      Importar do Checklist Integrativo
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={prescricaoText}
                    onChange={(e) => setPrescricaoText(e.target.value)}
                    placeholder="Digite os medicamentos, dosagens, posologia e fórmula de suplementação integrativa..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono leading-relaxed shadow-inner"
                  />

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveRecord}
                      className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Salvar Receita no Prontuário
                    </button>

                    {onGenerateReceitaPDF && (
                      <button
                        onClick={onGenerateReceitaPDF}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
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
                      <h2 className="font-extrabold text-sm uppercase tracking-widest text-slate-900">
                        AMBULATÓRIO IA • {activeDoctor.default_mode === 'biological_dentistry' ? 'ODONTOLOGIA BIOLÓGICA & SAÚDE INTEGRATIVA' : (activeDoctor.default_mode === 'neurological' ? 'NEUROLOGIA & MEDICINA INTEGRATIVA' : 'MEDICINA INTEGRATIVA')}
                      </h2>
                      <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                        {activeDoctor.full_name} • {activeDoctor.crm_cro}
                      </p>
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

                  <div className="pt-4 text-center border-t border-slate-200 text-xs space-y-0.5">
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-900">{activeDoctor.full_name}</p>
                    <p className="text-[10px] text-slate-600 font-medium">{activeDoctor.crm_cro} • {activeDoctor.especialidade}</p>
                    <p className="text-[9px] text-slate-400">Assinatura Digital ICP-Brasil Verificada</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Atestado Médico / Odontológico View */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                    {activeDoctor.default_mode === 'biological_dentistry' ? 'Parâmetros do Atestado Odontológico' : 'Parâmetros do Atestado Médico'}
                  </h4>

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
                      placeholder={activeDoctor.default_mode === 'biological_dentistry' ? "Ex: K08 - Transtornos dos dentes" : "Ex: M501 - Transtorno cervical"}
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
                      <h2 className="font-extrabold text-base uppercase tracking-widest text-slate-900">
                        {activeDoctor.default_mode === 'biological_dentistry' ? 'ATESTADO ODONTOLÓGICO' : 'ATESTADO MÉDICO'}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        AMBULATÓRIO IA • UNIDADE DE {activeDoctor.default_mode === 'biological_dentistry' ? 'ODONTOLOGIA BIOLÓGICA' : 'MEDICINA INTEGRATIVA'}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold mt-0.5">
                        {activeDoctor.full_name} • {activeDoctor.crm_cro}
                      </p>
                    </div>

                    <div className="text-xs space-y-4 font-sans leading-relaxed text-slate-800 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                      <p>
                        Atesto para os devidos fins que o(a) Sr.(a) <strong className="text-slate-900 uppercase font-black">{patientName || 'PACIENTE'}</strong>, inscrito(a) no CPF nº <strong>{patientCpf || '---'}</strong>, esteve em atendimento {activeDoctor.default_mode === 'biological_dentistry' ? 'odontológico especializado' : 'médico'} nesta unidade nesta data.
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
                    <p className="font-bold text-slate-900">{activeDoctor.full_name}</p>
                    <p className="text-[10px] text-slate-600 font-medium">{activeDoctor.crm_cro} • {activeDoctor.especialidade}</p>
                    <p className="text-[9px] text-slate-400">Assinatura Digital ICP-Brasil Verificada</p>
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
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95"
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
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95"
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
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95"
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
                    <Leaf className="text-blue-600" size={18} />
                    Suplementos Ativos no Checklist
                  </h4>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                    {getActiveIntegrativeItems(integrativeData).length} ativos
                  </span>
                </div>

                {getActiveIntegrativeItems(integrativeData).length > 0 ? (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar-blue">
                    {getActiveIntegrativeItems(integrativeData).map((item) => (
                      <div key={item.key} className="p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-2xs hover:border-blue-300 transition-all">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{item.label}</p>
                          <p className="text-[11px] text-blue-700 font-semibold">{item.value}</p>
                        </div>
                        <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
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
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all mt-2 inline-block cursor-pointer"
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
                  Profissional Responsável: {selectedHistoryRecord.profissional_responsavel || activeDoctor.full_name}
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

              <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/80 space-y-1">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Plano Terapêutico & Conduta</span>
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
        doctorName={activeDoctor.full_name}
      />

      <PreConsultationAnamneseModal
        isOpen={isAnamneseModalOpen}
        onClose={() => setIsAnamneseModalOpen(false)}
        patientNamePrefill={patientName}
        patientPhonePrefill={patientPhone}
        patientCpfPrefill={patientCpf}
        patientDobPrefill={patientDob}
        isDental={activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry'}
        specialty={activeDoctor.default_mode === 'biological_dentistry' || examMode === 'biological_dentistry' ? 'odontologia_biologica' : 'neurologia'}
        onAnamneseSubmitted={(data) => {
          if (data.alertas_clinicos) {
            setClinicalAlerts(data.alertas_clinicos);
          }
          if (data.foto_url) {
            setCurrentRecord((prev: any) => ({ ...prev, foto_url: data.foto_url }));
          }
          if (data.data_nascimento) {
            setCurrentRecord((prev: any) => ({ ...prev, data_nascimento: data.data_nascimento }));
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
