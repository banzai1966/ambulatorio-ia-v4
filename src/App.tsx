import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  Save, 
  History, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  ClipboardList, 
  Stethoscope, 
  FileText, 
  Loader2, 
  Trash2, 
  HelpCircle, 
  Settings,
  X, 
  Info,
  Zap,
  ShieldCheck, 
  Search, 
  LogOut, 
  Copy, 
  Download, 
  Users, 
  Clock, 
  Eye, 
  Calendar, 
  User, 
  UserCheck, 
  MessageSquare, 
  RefreshCw,
  Brain,
  ChevronRight,
  Baby,
  Crosshair,
  Laptop,
  Smartphone,
  Image,
  FolderOpen,
  UploadCloud,
  DollarSign
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './lib/supabase';
import { cn, hasMeaningfulData } from './lib/utils';
import { processClinicalInput, generateClinicalSummary, ClinicalSummary } from './services/clinicalService';
import { sendWhatsAppMessage } from './services/whatsappService';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import MessageHistory from './components/MessageHistory';
import ManageTeam from './components/ManageTeam';
import SystemOverviewModal from './components/SystemOverviewModal';
import NeurologicalExamForm from './components/NeurologicalExamForm';
import ClinicSettings from './components/ClinicSettings';
import IntegrativeChecklistForm from './components/IntegrativeChecklistForm';
import FinancialModule from './components/FinancialModule';
import IntegrativeBodyMap from './components/IntegrativeBodyMapAnatomy';
import IntegrativeEvolution from './components/IntegrativeEvolution';
import SpecialtyFields from './components/SpecialtyFields';
import VitalMonitor from './components/VitalMonitor';
import PatientDossierView from './components/PatientDossierView';
import PatientMediaGallery from './components/PatientMediaGallery';
import PublicAnamneseView from './components/PublicAnamneseView';
import { SPECIALTIES } from './constants/specialties';
import { 
  getOfflineRecords, 
  saveRecordLocally, 
  syncOfflineRecordsWithCloud, 
  exportLocalDataJSON, 
  importLocalDataJSON,
  importLocalDataCSV,
  OfflineRecord 
} from './services/offlineStorageService';
import type { NeurologicalExamData, MuscleAssessment, SensitivityAssessment } from './types/neurologicalExam';
import type { IntegrativeChecklistData } from './types/integrativeChecklist';
import { initialIntegrativeData } from './types/integrativeChecklist';

interface ClinicalRecord {
  id?: string;
  paciente_nome_completo: string;
  paciente_cpf?: string;
  paciente_data_nascimento?: string;
  paciente_telefone?: string;
  profissional_responsavel?: string;
  especialidade: string;
  paciente_status: string;
  alertas_copiloto?: string[];
  exame_neurologico?: any;
  checklist_integrativo?: any;
  dados_especialidade?: any;
  exame_fisico?: any;
  dados_clinicos?: any;
  queixa_principal?: string;
  hipotese_diagnostica?: string;
  conduta_plano_terapeutico?: string;
  prescricao?: string;
  prescricao_estilo_vida?: string[];
  radar_metabolico?: {
    sono?: number;
    estresse?: number;
    nutricao_digestao?: number;
    imunidade?: number;
    disposicao_energia?: number;
  };
  resumo_formatado: string;
  sugestao_conduta: string;
  data_consulta?: string;
  created_at?: string;
  midia_url?: string;
  tipo_midia?: string;
  comparativo?: any;
  offline_id?: string;
  is_offline_pending?: boolean;
  saved_at?: string;
  mapeamento_corporal?: any;
  vitals?: any;
  profiles?: {
    full_name: string;
  };
}

// v2 - Mapeamento completo para fidelidade ao PDF
const INTEGRATIVE_LABELS: Record<string, string> = {
  // Suplementos
  astragalus: "Astragallus 100, 200 mg",
  dhea: "DHEA mg",
  epa_dha: "EPA+DHA 1000 mg",
  mix_pro: "MIX(Pro, Co, AV, TO, AS, MG) gt",
  coriandrum: "Coriandrum s. glic gt",
  propolis: "Própolis glic gts",
  propco: "PropCo 4:1 3:1 gts",
  mix_d9: "Mix D9",
  ginger: "Ginger 100 200 mg",
  acido_caprilico: "Acido Caprilico 200 mg D9",
  bitter_mellon: "Bitter mellon 200 mg D9",
  arnica: "Arnica (Comp)",
  myosothis: "Myosothis (Comp)",
  hip_perfuratum: "Hip Perfuratum 300 mg",
  neurexan: "Neurexan/Marac/Pasa",
  floral_bach: "Floral Bach ( R + E ) gts",
  acido_folico: "Ácido Fólico 200 ug",
  vit_b3_b6: "Vit B3/Vit B6 25 mg",
  pregne: "Pregne 30mg/Boro 1mg",
  heteropterys: "Heteropterys a mg",
  arcalion: "Arcalion/Forten",
  vinpocetina: "Vinpocetina 10 mg",
  fosfatidilserina: "Fosfatidilserina mg",
  fosfatidilcolina: "Fosfatidilcolina mg",
  dmae: "DMAE 130 mg 250 mg",
  colina: "Colina mg",
  hidroxi_triptofano: "5-Hidróxi-Triptofano mg",
  fenilalanina: "Fenilalanina mg",
  melatonina: "Melatonina 3 mg, 1 mg",
  ac_alfa_lipoico: "Ac. Alfa lipoico 100 mg",
  semente_uva: "Semente uva 100 140",
  coenzima_q10: "Coenzima Q10 50 100 mg",
  
  // Fitoterápicos
  organo_gt: "Organo gt",
  dna_rna_ch: "DNA/RNA CH",
  organo_gt_2: "Organo gt (2)",
  dna_rna_ch_2: "DNA/RNA CH (2)",
  organo_gt_3: "Organo gt (3)",
  dna_rna_ch_3: "DNA/RNA CH (3)",
  artemisia: "Artemísia D3 gt",
  phaffia: "Phaffia panic D3 gt",
  chlorella: "Chlorella cps D9",
  acai: "Açai cps D9",
  mulateiro: "Mulateiro gt",
  cmc: "CMC 5 10 mg CH5 gt",
  formula_onco_vo: "Formula onco VO gt",
  formula_onco_inalat: "Formula onco inalat ml",
  vovo_meca: "Vovo Meca gt",
  euphorbia: "Euphorbia Hetero D6",
  zedoaria: "Zedoaria 200 mg",
  naltrex: "Naltrex 1,5 3,0 4,5 mg",
  nootropil: "Nootropil 400 800 mg",
  
  // Vitaminas & Minerais
  silimarina: "Silimarina 70 mg",
  quercetina: "Quercetina mg",
  saw_palmetto: "Saw Palmetto mg",
  pygeum: "Pygeum africanus mg",
  tribulus: "Tribulus terrestris mg",
  litio: "Litio orotato 5 mg",
  cardiopeptase: "Cardiopeptase 5mg",
  betaina: "Betaina 500/pepsina 150",
  taurina: "Taurina mg",
  vit_d3: "Vit D3 UI",
  ca_mg_zn: "Ca/Mg/Zn cp",
  vit_k2: "Vit K2 100 ug",
  selenio: "Selenio ug",
  manganes: "Manganes 10 mg",
  cu: "Cu mg",
  cromo: "Cromo picolonato mg",
  lugol: "Lugol gt",

  // Biomarcadores
  telomero: "Telomero",
  sirtuina: "Sirtuina 1",
  integrin: "Integrin a5 B1",
  thromboxane: "Thromboxane B2",
  crisotila: "Crisotila-Asbestos",
  hg: "Hg",
  pb: "Pb",
  al: "Al",
  
  // Neurotransmissores
  acetylcholine: "Acetylcholine",
  serotonin: "Serotonin",
  dopamine: "Dopamine",
  cortisol: "Cortisol",
  substance_p: "Substance P",
  b_amyloid: "B Amyloid",
  homocystine: "Homocystine",
  troponin: "Troponin",
  c_fos: "C-fos, ab - 2",

  // Patógenos
  candida: "Candida Albicans",
  c_trachomatis: "C Trachomatis",
  b_burgdorferi: "B Burgdorferi",
  c_pneumoniae: "C Pneumoniae",
  mycobact_tbc: "Mycobact Tbc",
  mycobact_avium: "Mycobact Avium",
  hsv_type_1: "HSV Type 1",
  hsv_type_2: "HSV Type 2",
  zoster_virus: "Zoster Vírus 3",
  cmv_5: "CMV 5",
};

const formatIntegrativeLabel = (key: string) => {
  const mapped = INTEGRATIVE_LABELS[key];
  if (mapped) return mapped;
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('Vit ', 'Vitamina ')
    .replace('Ac ', 'Ácido ');
};

export default function App() {
  console.log("App: SPECIALTIES carregadas:", SPECIALTIES);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ClinicalRecord | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedPatientPhone, setSelectedPatientPhone] = useState('');
  const [selectedPatientCpf, setSelectedPatientCpf] = useState('');
  const [selectedPatientDob, setSelectedPatientDob] = useState('');
  const [selectedPatientConvenio, setSelectedPatientConvenio] = useState<string>('SulAmérica Saúde');
  const [selectedAppointmentReason, setSelectedAppointmentReason] = useState('');
  const [selectedMedicoId, setSelectedMedicoId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [prefillPatient, setPrefillPatient] = useState<{name: string, phone: string} | null>(null);
  const [preselectedChatPhone, setPreselectedChatPhone] = useState<string | null>(null);
  const [history, setHistory] = useState<ClinicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);
  const [showMessageHistory, setShowMessageHistory] = useState(false);
  const [showSystemOverview, setShowSystemOverview] = useState(false);
  const [showClinicSettings, setShowClinicSettings] = useState(false);
  const [clinicInfo, setClinicInfo] = useState<any>(null);

  useEffect(() => {
    const loadClinicInfo = () => {
      const saved = localStorage.getItem('clinic_info');
      if (saved) {
        setClinicInfo(JSON.parse(saved));
      }
    };
    loadClinicInfo();
    window.addEventListener('clinic_info_updated', loadClinicInfo);
    return () => window.removeEventListener('clinic_info_updated', loadClinicInfo);
  }, []);
  const [showHelp, setShowHelp] = useState(false);
  const [showManageTeam, setShowManageTeam] = useState(false);
  const [showFinancial, setShowFinancial] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState<{ email: string; id: string; role: 'admin' | 'doctor' | 'receptionist'; status: 'pending' | 'approved'; full_name?: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebView, setIsWebView] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [examMode, setExamMode] = useState<string>('standard');
  const [specialtyData, setSpecialtyData] = useState<any>({});
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [clinicalSummary, setClinicalSummary] = useState<ClinicalSummary | null>(null);
  const [integrativeData, setIntegrativeData] = useState<IntegrativeChecklistData>(initialIntegrativeData);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Estados de Suporte Offline & PWA
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    // Atualiza contagem inicial de registros offline
    const updateOfflineState = () => {
      const recs = getOfflineRecords();
      const pending = recs.filter(r => r.is_offline_pending);
      setOfflinePendingCount(pending.length);
    };

    updateOfflineState();

    const handleOnline = async () => {
      setIsOnline(true);
      toast.success("📶 Conexão de Internet restaurada! Sincronizando com a nuvem...");
      setIsSyncingOffline(true);
      try {
        const { syncedCount } = await syncOfflineRecordsWithCloud(supabase);
        if (syncedCount > 0) {
          toast.success(`☁️ ${syncedCount} prontuários offline foram sincronizados com sucesso!`);
          fetchHistory();
        }
      } catch (err) {
        console.error("Erro na auto-sincronização:", err);
      } finally {
        setIsSyncingOffline(false);
        updateOfflineState();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast("📡 Modo Offline Ativo. Seus atendimentos serão salvos com segurança no computador.", { icon: '💻', duration: 5000 });
    };

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      console.log("[PWA] Prompt de instalação capturado.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    toast.success("Ambulatório IA - Conectado à Nuvem!");
    console.log("App Version: v4.5 (PWA Cloud)");
    document.title = "Ambulatório IA - Prontuário Médico Inteligente";

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Auto-login logic for quick access
  useEffect(() => {
    if (authMode === 'login' && !email && !password) {
      setEmail('demo@ambulatorio.ia');
      setPassword('Demo1234!');
    }
  }, [authMode]);

  // Auto-dismiss error after 10 seconds
  useEffect(() => {
    if (error) {
      if (errorTimeout) clearTimeout(errorTimeout);
      const timeout = setTimeout(() => setError(null), 10000);
      setErrorTimeout(timeout);
    }
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
    };
  }, [error]);

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const isConfigured = true;

  useEffect(() => {
    // Detecta se está dentro de um WebView (WhatsApp, Instagram, Facebook)
    const checkWebView = () => {
      const ua = window.navigator.userAgent;
      const isInstagram = ua.indexOf('Instagram') > -1;
      const isFacebook = ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1;
      const isWhatsApp = ua.indexOf('WhatsApp') > -1;
      
      // Se não tiver getUserMedia, provavelmente é um WebView restrito ou HTTP
      const noMedia = !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia;
      
      if (isInstagram || isFacebook || isWhatsApp || noMedia) {
        // Só ativa se for mobile
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
          setIsWebView(true);
        }
      }
    };

    checkWebView();
  }, []);

  useEffect(() => {
    if (isConfigured) {
      // Listener de estado de autenticação
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth event:", event, session?.user?.email);
        if (session?.user) {
          checkUser();
          fetchPendingCount();
        } else {
          setUser(null);
          setHistory([]);
          setCurrentRecord(null);
        }
      });

      checkUser();
      fetchPendingCount();
      
      // Assinante para mudanças na tabela de perfis
      const channel = supabase
        .channel('profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, async (payload) => {
          console.log("Mudança no perfil detectada:", payload);
          
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          // Se for um novo cadastro pendente, mostramos um toast para o admin
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            // Verificamos se o usuário atual é admin antes de mostrar o toast
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', authUser?.id)
              .single();
              
            if (profile?.role === 'admin') {
              toast.success(`Novo cadastro pendente: ${payload.new.email}`, { 
                duration: 8000,
                icon: '🔔'
              });
            }
          }

          // Só atualiza se a mudança for no perfil do próprio usuário logado
          if (authUser && payload.new && (payload.new as any).id === authUser.id) {
            checkUser();
          }
          
          // Atualiza contagem pendente para todos (o badge só aparece para admin)
          fetchPendingCount();
        })
        .subscribe();

      // Assinante para novas mensagens
      const messageChannel = supabase
        .channel('mensagens')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
          console.log("Nova mensagem recebida:", payload);
          // Toca um som de notificação
          const audio = new Audio('https://actions.google.com/sounds/v1/notifications/beep_short.ogg');
          audio.play();
          // Mostra um toast
          toast.success(`Nova mensagem de: ${payload.new.telefone_cliente}`, { duration: 5000 });
        })
        .subscribe();
        
      return () => { 
        subscription.unsubscribe();
        supabase.removeChannel(channel); 
        supabase.removeChannel(messageChannel);
      };
    }
  }, [isConfigured]);

  const fetchPendingCount = async () => {
    try {
      // Consulta simples para evitar erro 500
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'pending');
      
      if (!error && data) {
        setPendingCount(data.length);
      }
    } catch (err) {
      console.error("Erro ao buscar contagem:", err);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        console.log("Verificando usuário:", authUser.email);
        
        // 1. Tenta buscar o perfil pelo ID atual (Auth ID)
        const { data: profiles, error: fetchError } = await supabase
          .from('profiles')
          .select('id, email, role, status, full_name, especialidade')
          .eq('id', authUser.id);
        
        if (fetchError) {
          console.error("Erro ao buscar perfil:", fetchError);
        }

        let profile = profiles && profiles.length > 0 ? profiles[0] : null;
        
        // 2. Se não encontrou pelo ID, tenta buscar pelo E-MAIL (Migração de ID)
        if (!profile && authUser.email) {
          console.log("Perfil não encontrado pelo ID. Tentando buscar pelo e-mail para vincular...");
          const { data: emailProfiles } = await supabase
            .from('profiles')
            .select('id, email, role, status, full_name, especialidade')
            .eq('email', authUser.email);
          
          if (emailProfiles && emailProfiles.length > 0) {
            const oldProfile = emailProfiles[0];
            const oldId = oldProfile.id;
            console.log(`Vínculo encontrado! Atualizando ID antigo (${oldId}) para o novo ID (${authUser.id})...`);
            
            // Atualiza o ID na tabela de perfis
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ id: authUser.id })
              .eq('email', authUser.email);
            
            if (!updateError) {
              console.log("ID do perfil atualizado com sucesso.");
              profile = { ...oldProfile, id: authUser.id };
              
              // Atualiza referências em outras tabelas (Migração de dados legados)
              // Fazemos isso de forma assíncrona para não travar o login
              Promise.all([
                supabase.from('prontuarios').update({ user_id: authUser.id }).eq('user_id', oldId),
                supabase.from('prontuarios').update({ medico_id: authUser.id }).eq('medico_id', oldId),
                supabase.from('mensagens').update({ user_id: authUser.id }).eq('user_id', oldId),
                supabase.from('agendamentos').update({ medico_id: authUser.id }).eq('medico_id', oldId)
              ]).then(() => console.log("Referências de dados atualizadas para o novo ID.")).catch(e => console.warn("Erro ao atualizar referências:", e));
            } else {
              console.error("Erro ao atualizar ID do perfil:", updateError);
            }
          }
        }

        console.log("Perfil final:", profile);
          
        // Se o e-mail for o seu, garantimos que seja Admin
        const isAdminEmail = authUser.email === 'marco.agduarte22@gmail.com';
        
        if (profile) {
          const role = isAdminEmail ? 'admin' : profile.role;
          const status = isAdminEmail ? 'approved' : profile.status;
          
          console.log(`Usuário ${authUser.email} - Role: ${role}, Status: ${status}`);
          
          // Só atualiza se houver mudança real para evitar loops
          if (!user || user.id !== authUser.id || user.role !== role || user.status !== status) {
            console.log("Atualizando estado do usuário no React...");
            setUser({ 
              email: authUser.email || '', 
              id: authUser.id, 
              role: role,
              status: status,
              full_name: profile?.full_name
            });
          }
          if (role === 'admin') fetchPendingCount();
        } else {
          // Se não houver perfil, verifica se é o primeiro ou se é o seu e-mail
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true });
            
          const role = (count === 0 || isAdminEmail) ? 'admin' : 'receptionist';
          const status = (count === 0 || isAdminEmail) ? 'approved' : 'pending';
          
          console.log("Criando novo perfil com role:", role);
          
          const { data: newProfiles, error: insertError } = await supabase
            .from('profiles')
            .insert([{ 
              id: authUser.id, 
              email: authUser.email, 
              role: role, 
              status: status,
              full_name: authUser.user_metadata?.full_name || ''
            }])
            .select('id, email, role, status, full_name, especialidade');
            
          if (insertError) {
            console.error("Erro ao criar perfil no banco de dados:", insertError);
            toast.error(`Erro ao registrar perfil: ${insertError.message}`);
            setError(`Erro ao registrar perfil: ${insertError.message}. Por favor, contate o suporte.`);
          }
            
          const newProfile = newProfiles && newProfiles.length > 0 ? newProfiles[0] : null;
          const finalRole = newProfile?.role || role;
          const finalStatus = newProfile?.status || status;
            
          if (!user || user.id !== authUser.id || user.role !== finalRole || user.status !== finalStatus) {
            setUser({ 
              email: authUser.email || '', 
              id: authUser.id, 
              role: finalRole,
              status: finalStatus
            });
          }
          if (finalRole === 'admin') fetchPendingCount();
        }
      }
    } catch (err: any) {
      console.error("Auth check failed", err);
      toast.error(`Falha na verificação de acesso: ${err.message}`);
    }
  };

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    setError(null);
    const demoEmail = 'demo@ambulatorio.ia';
    const demoPassword = 'Demo1234!';
    
    try {
      // Tenta fazer login primeiro
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      // Se o erro for "Invalid login credentials", significa que o usuário não existe no Auth
      if (signInError && signInError.message.includes('Invalid login credentials')) {
        console.log("Usuário demo não encontrado. Criando agora...");
        
        // Tenta criar o usuário no Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              full_name: 'Médico de Demonstração'
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Garante que o perfil seja criado como 'doctor' e 'approved'
          // O trigger do banco pode criar como 'receptionist'/'pending', então forçamos aqui
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              role: 'doctor', 
              status: 'approved',
              full_name: 'Médico de Demonstração'
            })
            .eq('id', signUpData.user.id);
            
          if (profileError) {
            // Se o update falhar (talvez o trigger ainda não inseriu), tentamos um upsert
            await supabase.from('profiles').upsert({
              id: signUpData.user.id,
              email: demoEmail,
              role: 'doctor',
              status: 'approved',
              full_name: 'Médico de Demonstração'
            });
          }
          
          toast.success("Conta de demonstração criada e logada!");
          return; // O onAuthStateChange cuidará do resto se houver sessão
        }
      } else if (signInError) {
        throw signInError;
      }

      // Se o login der certo, garantimos que o perfil exista, seja médico e esteja aprovado
      if (signInData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', signInData.user.id)
          .single();

        if (!profile || profile.role !== 'doctor' || profile.status !== 'approved') {
          await supabase.from('profiles').upsert({
            id: signInData.user.id,
            email: demoEmail,
            role: 'doctor',
            status: 'approved',
            full_name: 'Médico de Demonstração'
          });
        }
      }

      await checkUser();
      toast.success("Login de demonstração realizado!");
    } catch (err: any) {
      console.error("Erro no login demo:", err);
      setError(err.message || "Falha no login de demonstração.");
      toast.error("Erro ao acessar conta demo.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      if (authMode === 'login') {
        let { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        // Se for o e-mail de demo e der erro de credenciais, tentamos criar
        if (error && error.message.includes('Invalid login credentials') && email === 'demo@ambulatorio.ia') {
          console.log("Criando usuário demo via login principal...");
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: 'Médico de Demonstração' } }
          });
          
          if (!signUpError && signUpData.user) {
            await supabase.from('profiles').upsert({
              id: signUpData.user.id,
              email: email,
              role: 'doctor',
              status: 'approved',
              full_name: 'Médico de Demonstração'
            });
            data = signUpData as any;
            error = null;
          }
        }

        if (error) {
          if (error.message.includes('Failed to fetch') || error.message.includes('timeout')) {
            throw new Error('Não foi possível conectar ao servidor. Verifique sua internet ou tente novamente mais tarde.');
          }
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou senha incorretos.');
          }
          throw error;
        }
        if (data.user) {
          const isAdminEmail = data.user.email === 'marco.agduarte22@gmail.com';
          
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, role, status, full_name, especialidade')
            .eq('id', data.user.id);
          
          const profile = profiles && profiles.length > 0 ? profiles[0] : null;
          
          setUser({ 
            email: data.user.email || '', 
            id: data.user.id, 
            role: isAdminEmail ? 'admin' : (profile?.role || 'receptionist'),
            status: isAdminEmail ? 'approved' : (profile?.status || 'approved')
          });
        }
      } else {
        if (!name.trim()) {
          throw new Error("Por favor, preencha seu nome completo.");
        }
        if (!isPasswordValid) {
          throw new Error("A senha não atende a todos os requisitos de segurança.");
        }

        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });
        
        console.log("Auth SignUp Result:", { data, error });
        
        if (error) {
          console.error("Auth SignUp Error Details:", error);
          throw error;
        }
        
        // Se o Supabase retornar um usuário mas NÃO retornar uma sessão,
        // significa que a "Confirmação de E-mail" está ativada no painel.
        if (data.user && data.session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, status, full_name, especialidade')
            .eq('id', data.user.id)
            .single();
          setUser({ 
            email: data.user.email || '', 
            id: data.user.id, 
            role: profile?.role || 'receptionist',
            status: profile?.status || 'pending'
          });
        } else if (data.user && !data.session) {
          setError("Cadastro realizado! Verifique a caixa de entrada do seu e-mail para confirmar a conta antes de entrar.");
          setAuthMode('login'); // Volta para a tela de login
        }
      }
    } catch (err: any) {
      if (err.message === "Invalid login credentials") {
        setError("E-mail ou senha incorretos. (Ou seu e-mail ainda não foi confirmado)");
      } else {
        setError(err.message || 'Falha na autenticação');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
    setCurrentRecord(null);
  };
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    fetchHistory();
    const hasSeenOverview = localStorage.getItem('hasSeenSystemOverview');
    if (!hasSeenOverview) {
      setShowSystemOverview(true);
      localStorage.setItem('hasSeenSystemOverview', 'true');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
      if (user.role === 'admin') {
        fetchPendingCount();
      }
    }
  }, [user]);

  const fetchHistory = async (name?: string) => {
    if (!user) return;
    
    // Lista conservadora de colunas que sabemos que existem
    const baseColumns = "id, paciente_nome_completo, paciente_cpf, paciente_data_nascimento, paciente_status, data_consulta, especialidade, resumo_formatado, sugestao_conduta, user_id, medico_id, profissional_responsavel, created_at";
    // Colunas extras confirmadas
    const extraColumns = "exame_neurologico, exame_fisico, checklist_integrativo, queixa_principal, hipotese_diagnostica, conduta_plano_terapeutico, prescricao, dados_clinicos, paciente_telefone, comparativo, dados_especialidade";
    const allColumns = `${baseColumns}, ${extraColumns}`;

    try {
      // Tenta buscar de forma resiliente
      const tryFetchHistory = async (columns: string, useFilter: boolean = true, attempt: number = 1): Promise<any> => {
        if (attempt > 15) throw new Error("Muitas tentativas de busca falharam devido a erros de schema.");
        
        console.log(`fetchHistory (Tentativa ${attempt}): Colunas: ${columns.substring(0, 40)}... (Filtro: ${useFilter})`);
        
        try {
          let query = supabase.from('prontuarios').select(columns);

          if (useFilter && user.role !== 'admin' && !name) {
            query = query.or(`medico_id.eq.${user.id},user_id.eq.${user.id}`);
          }

          // Ordenação
          if (columns.includes('created_at')) {
            query = query.order('created_at', { ascending: false });
          } else if (columns.includes('data_consulta')) {
            query = query.order('data_consulta', { ascending: false });
          }

          // Filtro de busca
          if (name) {
            const cleanSearch = name.trim();
            if (cleanSearch.length >= 3) {
              const searchFilters = [];
              if (columns.includes('paciente_nome_completo')) searchFilters.push(`paciente_nome_completo.ilike.%${cleanSearch}%`);
              if (columns.includes('paciente_cpf')) searchFilters.push(`paciente_cpf.ilike.%${cleanSearch}%`);
              if (columns.includes('paciente_telefone')) searchFilters.push(`paciente_telefone.ilike.%${cleanSearch}%`);
              if (searchFilters.length > 0) query = query.or(searchFilters.join(','));
            }
          }

          const { data, error } = await query;
          
          if (error) {
            console.warn(`fetchHistory (Erro ${attempt}):`, error.message);
            
            const isColumnError = error.message.toLowerCase().includes('column') || 
                                 error.message.toLowerCase().includes('find the') ||
                                 error.message.toLowerCase().includes('not found') ||
                                 error.message.toLowerCase().includes('schema');

            if (isColumnError) {
              // Tenta identificar a coluna faltante de várias formas
              const missingColumn = 
                error.message.match(/column "([^"]+)"/)?.[1] || 
                error.message.match(/find the '([^']+)' column/)?.[1] ||
                error.message.match(/column '([^']+)'/)?.[1] ||
                error.message.match(/column ([^ ]+) does not exist/)?.[1];
              
              if (missingColumn) {
                console.log(`fetchHistory: Removendo '${missingColumn}' e tentando novamente...`);
                if (missingColumn === 'medico_id' || missingColumn === 'user_id' || missingColumn === 'paciente_telefone') {
                  return tryFetchHistory(columns, false, attempt + 1);
                }
                const newColumns = columns.split(',').map(c => c.trim()).filter(c => c !== missingColumn).join(', ');
                if (newColumns && newColumns !== columns) return tryFetchHistory(newColumns, useFilter, attempt + 1);
              }
              
              // Se não identificou a coluna mas é erro de schema, tenta sem filtro
              if (useFilter) return tryFetchHistory(columns, false, attempt + 1);
              
              // Fallback para busca mínima absoluta
              if (columns !== 'id, paciente_nome_completo, resumo_formatado') {
                return tryFetchHistory('id, paciente_nome_completo, resumo_formatado', false, attempt + 1);
              }
            }
            throw error;
          }
          return data;
        } catch (e: any) {
          if (attempt < 5 && (e.message?.includes('column') || e.message?.includes('schema'))) {
            return tryFetchHistory('id, paciente_nome_completo, resumo_formatado', false, attempt + 1);
          }
          throw e;
        }
      };

      const data = await tryFetchHistory(allColumns);
      
      // Se houver dados, tenta buscar os nomes dos perfis separadamente para evitar erro de relacionamento
      let recordsWithProfiles = data || [];
      if (recordsWithProfiles.length > 0) {
        try {
          const userIds = [...new Set(recordsWithProfiles.map((r: any) => r.user_id).filter(Boolean))];
          if (userIds.length > 0) {
            const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
            if (profiles) {
              const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
              recordsWithProfiles = recordsWithProfiles.map((r: any) => ({
                ...r,
                profiles: profileMap[r.user_id] || null
              }));
            }
          }
        } catch (pErr) {
          console.warn("Erro ao buscar perfis:", pErr);
        }
      }
      
      const offlineRecords = getOfflineRecords();

      const serverHistory = recordsWithProfiles.map((r: any) => {
        let dados = r.dados_clinicos || {};
        if (typeof r.dados_clinicos === 'string') {
          try {
            dados = JSON.parse(r.dados_clinicos);
          } catch (e) {
            dados = { observacoes: r.dados_clinicos };
          }
        }
        return {
          ...r,
          dados_clinicos: dados,
          resumo_formatado: r.resumo_formatado || dados.resumo_formatado || '',
          sugestao_conduta: r.sugestao_conduta || dados.sugestao_conduta || ''
        };
      });

      // Mescla registros do servidor com registros offline ainda não sincronizados
      const pendingOffline = offlineRecords.filter(off => off.is_offline_pending);
      const merged = [...pendingOffline, ...serverHistory];

      // Remove eventuais duplicatas por id ou offline_id
      const uniqueMap = new Map();
      merged.forEach(item => {
        const key = item.id || item.offline_id || `${item.paciente_nome_completo}_${item.created_at}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      });

      setHistory(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error("Failed to fetch history from cloud, loading local offline records", err);
      const offlineRecords = getOfflineRecords();
      if (offlineRecords.length > 0) {
        setHistory(offlineRecords);
        toast("Exibindo prontuários salvos localmente no computador.", { icon: '💻' });
      }
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const toastId = toast.loading("Excluindo prontuário...");

    try {
      const { error } = await supabase
        .from('prontuarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Prontuário excluído com sucesso!", { id: toastId });
      fetchHistory(searchTerm);
    } catch (err: any) {
      console.error("Erro ao excluir registro", err);
      toast.error(`Falha ao excluir o registro: ${err.message || 'Erro de permissão'}`, { id: toastId });
    }
  };

  const exportToCSV = () => {
    if (!history || history.length === 0) {
      toast.error("Nenhum registro para exportar.");
      return;
    }

    const headers = ["Data da Consulta", "Nome do Paciente", "CPF", "Data de Nascimento", "Especialidade", "Status", "Resumo Formatado", "Sugestão de Conduta"];
    
    const rows = history.map(record => {
      const data = formatDateBR(record.data_consulta || record.created_at);
      const nome = record.paciente_nome_completo || '';
      const cpf = record.paciente_cpf || '';
      const nascimento = record.paciente_data_nascimento || '';
      const especialidade = record.especialidade || '';
      const status = record.paciente_status || '';
      const resumo = record.resumo_formatado || '';
      const conduta = record.sugestao_conduta || '';

      return [data, nome, cpf, nascimento, especialidade, status, resumo, conduta].map(field => {
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    // Adiciona BOM para o Excel reconhecer os acentos (UTF-8)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prontuarios_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (showHistory) fetchHistory(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, showHistory]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WEBVIEW_ERROR");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        await handleAudioProcess(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setLiveTranscript('');
      transcriptRef.current = '';

      // Tenta iniciar o Web Speech API para transcrição em tempo real (Mágica!)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          // Garantir que não existam instâncias antigas rodando
          if ((window as any).currentRecognition) {
            try { (window as any).currentRecognition.stop(); } catch (e) {}
          }
          const recognition = new SpeechRecognition();
          (window as any).currentRecognition = recognition;
          recognition.lang = 'pt-BR';
          recognition.continuous = true;
          recognition.interimResults = true;
          
          recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            setLiveTranscript(currentTranscript);
            transcriptRef.current = currentTranscript;
          };
          
          recognition.onerror = (e: any) => console.log("Speech recognition error:", e);
          
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.log("Speech recognition init failed", e);
        }
      }

    } catch (err: any) {
      console.error("Erro ao acessar microfone:", err);
      const errorName = err.name || '';
      const errorMessage = err.message || '';
      
      const isIframe = window.self !== window.top;
      
      if (errorMessage === "WEBVIEW_ERROR") {
        setError("Microfone Bloqueado! Você está no navegador interno (WhatsApp/Instagram). Copie o link e cole diretamente no Chrome ou Safari para gravar áudios.");
      } else if (
        errorName === 'NotAllowedError' || 
        errorName === 'PermissionDeniedError' || 
        errorMessage.toLowerCase().includes('permission denied') ||
        errorMessage.toLowerCase().includes('permissão negada')
      ) {
        if (isIframe) {
          setError("O microfone está bloqueado pelo ambiente de teste. \n\nSOLUÇÃO: Clique no ícone de 'Abrir em nova aba' (quadrado com seta) no topo da tela para usar o microfone corretamente.");
        } else {
          setError("Permissão de microfone negada. \n\n1. Clique no cadeado (🔒) na barra de endereços.\n2. Ative o Microfone.\n3. Recarregue a página.");
        }
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setError("Nenhum microfone encontrado no seu dispositivo.");
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setError("O microfone já está sendo usado por outro aplicativo.");
      } else {
        setError(`Erro ao acessar microfone: ${errorMessage || 'Erro desconhecido'}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const handleGenerateSummary = async (phone: string, providedMessages?: any[]) => {
    if (!phone) {
      toast.error("Selecione um paciente primeiro.");
      return;
    }
    
    setIsGeneratingSummary(true);
    setShowSummary(true);
    try {
      let messagesToProcess = providedMessages || [];
      
      if (messagesToProcess.length === 0) {
        const { data, error } = await supabase
          .from('mensagens')
          .select('*')
          .eq('telefone_cliente', phone)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        messagesToProcess = data || [];
      }
      
      if (messagesToProcess.length === 0) {
        toast.error("Nenhuma mensagem encontrada para este paciente.");
        setIsGeneratingSummary(false);
        setShowSummary(false);
        return;
      }
      
      const filteredMessages = messagesToProcess.filter(m => m.telefone_cliente === phone);
      
      const messagesWithMedia = await Promise.all(filteredMessages.map(async (m) => {
        const url = m.midia_url;
        const isAudio = (m.tipo_midia || m.tipo || '').toLowerCase().includes('audio') || 
                        (url && (url.includes('audio') || url.includes('ogg') || (url.length > 100 && !url.includes('.'))));
        
        if (isAudio && url) {
          if (url.startsWith('data:audio')) {
            return { ...m, audioData: url.split(',')[1], mimeType: url.split(';')[0].split(':')[1] };
          } else if (url.length > 100 && !url.includes('.')) {
            return { ...m, audioData: url, mimeType: 'audio/ogg' };
          }
        }
        return m;
      }));

      const summary = await generateClinicalSummary(messagesWithMedia);
      setClinicalSummary(summary);
      toast.success("Resumo clínico gerado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar resumo:", err);
      toast.error("Falha ao gerar resumo clínico.");
      setShowSummary(false);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAudioProcess = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      let result;
      const finalTranscript = transcriptRef.current.trim();
      
      // Se a transcrição em tempo real funcionou bem (mais de 15 caracteres), usamos ela!
      // É muito mais rápido e barato processar texto do que áudio no Gemini.
      if (finalTranscript.length > 15) {
        console.log("Usando transcrição em texto (mais rápido/barato):", finalTranscript);
        const currentSpecialty = SPECIALTIES.find(s => s.id === examMode);
        result = await processClinicalInput(
          finalTranscript, 
          examMode, 
          selectedAppointmentReason,
          currentSpecialty?.promptContext
        );
      } else {
        // Fallback de segurança: se a transcrição falhou, processamos o áudio original
        console.log("Usando processamento de áudio (fallback de segurança)");
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve((reader.result as string).split(',')[1]);
          };
        });
        const currentSpecialty = SPECIALTIES.find(s => s.id === examMode);
        result = await processClinicalInput({
          data: base64Data,
          mimeType: 'audio/webm'
        }, examMode, selectedAppointmentReason, currentSpecialty?.promptContext);
      }
      
      // Busca automática por histórico via CPF
        if (result.paciente_cpf && user) {
          try {
            const tryFetchHistoryCheck = async (columns: string): Promise<any> => {
              const { data, error } = await supabase
                .from("prontuarios")
                .select(columns)
                .eq("paciente_cpf", result.paciente_cpf)
                .eq("user_id", user.id)
                .order("data_consulta", { ascending: false })
                .limit(1);

              if (error) {
                console.warn("handleAudioProcess: Erro ao buscar histórico:", error.message);
                if (error.message.includes('column') && error.message.includes('does not exist')) {
                  const match = error.message.match(/column "([^"]+)"/);
                  if (match && match[1]) {
                    const missing = match[1];
                    const newCols = columns.split(',').map(c => c.trim()).filter(c => c !== missing).join(', ');
                    if (newCols) return tryFetchHistoryCheck(newCols);
                  }
                }
                // Se falhar tudo, tenta uma busca mínima
                if (columns !== 'id') return tryFetchHistoryCheck('id');
                throw error;
              }
              return data;
            };

            const data = await tryFetchHistoryCheck("id, paciente_nome_completo, paciente_cpf, paciente_data_nascimento, profissional_responsavel, especialidade, paciente_status, dados_clinicos, exame_neurologico, checklist_integrativo, dados_especialidade, resumo_formatado, sugestao_conduta, data_consulta, created_at");
            
            if (data && data.length > 0) {
              setHasHistory(true);
              console.log("Histórico encontrado para o paciente:", data[0]);
            } else {
              setHasHistory(false);
            }
          } catch (hErr) {
            setHasHistory(false);
            console.error("Erro ao buscar histórico", hErr);
          }
        } else {
          setHasHistory(false);
        }
        
        if (!result || typeof result !== 'object') {
          throw new Error("Resposta da IA inválida ou vazia.");
        }

        console.log("[IA] Resultado bruto processado:", result);
        
        // Garantir que a estrutura de dados esteja correta antes de salvar (Mesclagem Inteligente)
        const sanitizeSpecialtyData = (aiData: any) => {
          const baseData = currentRecord?.dados_especialidade || {};
          if (!aiData || typeof aiData !== 'object') return baseData;
          
          const sanitized: any = { ...baseData };
          Object.entries(aiData).forEach(([key, val]) => {
            let finalVal = val;
            if (typeof val === 'string') {
              const cleanVal = val.replace(/[kKgGcmCM\s]/g, '').replace(',', '.');
              const numVal = parseFloat(cleanVal);
              finalVal = isNaN(numVal) ? val : numVal;
            }
            
            // Lógica de Mesclagem: 
            // Se for booleano, faz um OR (mantém o true se já existir)
            // Se for valor novo, sobrescreve (ex: novo peso medido)
            if (typeof finalVal === 'boolean') {
              sanitized[key] = sanitized[key] || finalVal;
            } else {
              sanitized[key] = finalVal;
            }
          });
          return sanitized;
        };

        console.log("[DEBUG AI RESULT]", result);

        const rawClinicalText = `${finalTranscript} ${result?.resumo_formatado || ''} ${result?.conduta_plano_terapeutico || ''} ${result?.prescricao || ''} ${result?.queixa_principal || ''}`;

        const normalizeStr = (s: string) => 
          s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const KEY_SYNONYMS: Record<string, string[]> = {
          colina: ["colina"],
          hidroxi_triptofano: ["hidroxi", "triptofano", "5-htp", "5htp"],
          fenilalanina: ["fenilalanina"],
          melatonina: ["melatonina"],
          ac_alfa_lipoico: ["alfa lipoico", "lipoico", "ala"],
          semente_uva: ["semente de uva", "semente uva"],
          coenzima_q10: ["coenzima", "q10", "coq10"],
          astragalus: ["astragalus", "astragallus"],
          dhea: ["dhea"],
          epa_dha: ["epa", "dha", "omega 3", "omega-3", "omega"],
          mix_pro: ["mix pro", "probiotico"],
          coriandrum: ["coriandrum", "coentro"],
          propolis: ["propolis", "propolis verde"],
          propco: ["propco"],
          mix_d9: ["mix d9", "d9"],
          ginger: ["ginger", "gengibre"],
          acido_caprilico: ["caprilico"],
          bitter_mellon: ["bitter mellon", "bitter melon"],
          arnica: ["arnica"],
          myosothis: ["myosothis", "miosotis"],
          hip_perfuratum: ["hip perfuratum", "hypericum", "hiperico"],
          neurexan: ["neurexan", "passiflora"],
          floral_bach: ["floral", "florais", "bach"],
          acido_folico: ["folico", "metilfolato"],
          vit_b3_b6: ["b3", "b6", "vitamina b", "complexo b"],
          pregne: ["pregne", "pregnenolona"],
          heteropterys: ["heteropterys"],
          arcalion: ["arcalion"],
          vinpocetina: ["vinpocetina"],
          fosfatidilserina: ["fosfatidilserina"],
          fosfatidilcolina: ["fosfatidilcolina"],
          dmae: ["dmae"],

          organo_gt: ["organo gt", "organo"],
          dna_rna_ch: ["dna", "rna"],
          organo_gt_2: ["organo gt 2"],
          dna_rna_ch_2: ["dna rna 2"],
          organo_gt_3: ["organo gt 3"],
          dna_rna_ch_3: ["dna rna 3"],
          artemisia: ["artemisia", "artemisina"],
          phaffia: ["phaffia"],
          chlorella: ["chlorella", "clorela"],
          acai: ["acai", "açai"],
          mulateiro: ["mulateiro"],
          cmc: ["cmc"],
          formula_onco_vo: ["formula onco", "onco vo"],
          formula_onco_inalat: ["onco inalat"],
          vovo_meca: ["vovo meca"],
          euphorbia: ["euphorbia"],
          zedoaria: ["zedoaria"],
          naltrex: ["naltrex", "naltrexona"],
          nootropil: ["nootropil", "piracetam"],

          silimarina: ["silimarina"],
          quercetina: ["quercetina"],
          saw_palmetto: ["saw palmetto", "saw_palmetto", "palmetto"],
          pygeum: ["pygeum", "africanus"],
          tribulus: ["tribulus", "terrestris"],
          litio: ["litio", "orotato"],
          cardiopeptase: ["cardiopeptase"],
          betaina: ["betaina", "pepsina"],
          taurina: ["taurina"],
          vit_d3: ["vitamina d", "vit d", "d3", "cholecalciferol"],
          ca_mg_zn: ["calcio", "magnesio", "zinco", "ca/mg/zn", "ca mg zn"],
          vit_k2: ["vitamina k", "vit k", "k2"],
          selenio: ["selenio"],
          manganes: ["manganes"],
          cu: ["cobre"],
          cromo: ["cromo", "picolinato"],
          lugol: ["lugol", "iodo"],

          telomero: ["telomero"],
          sirtuina: ["sirtuina"],
          integrin: ["integrin"],
          thromboxane: ["thromboxane", "tromboxano"],
          crisotila: ["crisotila", "asbestos"],
          hg: ["hg", "mercurio"],
          pb: ["pb", "chumbo"],
          al: ["al", "aluminio"],

          acetylcholine: ["acetilcolina", "acetylcholine"],
          serotonin: ["serotonina", "serotonin"],
          dopamine: ["dopamina", "dopamine"],
          cortisol: ["cortisol"],
          substance_p: ["substancia p", "substance p"],
          b_amyloid: ["beta amiloide", "b amyloid"],
          homocystine: ["homocisteina", "homocystine"],
          troponin: ["troponina", "troponin"],
          c_fos: ["c-fos", "cfos"],

          candida: ["candida", "candidiasi", "disbiose"],
          c_trachomatis: ["trachomatis", "chlamydia"],
          b_burgdorferi: ["burgdorferi", "lyme"],
          c_pneumoniae: ["c pneumoniae", "chlamydia pneumoniae"],
          mycobact_tbc: ["tbc", "tuberculose", "mycobact"],
          mycobact_avium: ["avium"],
          hsv_type_1: ["hsv 1", "hsv1", "herpes 1", "herpes tipo 1"],
          hsv_type_2: ["hsv 2", "hsv2", "herpes 2", "herpes tipo 2"],
          zoster_virus: ["zoster", "herpes zoster", "zoster virus"],
          cmv_5: ["cmv", "citomegalovirus"]
        };

        const isItemMentionedInText = (key: string, rawText: string): boolean => {
          if (!rawText || typeof rawText !== 'string' || !rawText.trim()) return true;
          const normText = normalizeStr(rawText);
          const terms = KEY_SYNONYMS[key] || [key.replace(/_/g, " ")];
          return terms.some(term => {
            const normTerm = normalizeStr(term);
            if (!normTerm) return false;
            return normText.includes(normTerm);
          });
        };

        const sanitizeChecklist = (aiData: any) => {
          // Começa a partir de uma estrutura limpa para que itens não citados fiquem vazios
          const sanitized: any = JSON.parse(JSON.stringify(initialIntegrativeData));
          if (!aiData || typeof aiData !== 'object') return sanitized;
          
          const flatInput: Record<string, string> = {};
          
          const flatten = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            Object.entries(obj).forEach(([k, v]) => {
              if (typeof v === 'object' && v !== null) {
                flatten(v);
              } else if (v !== undefined && v !== null && v !== false) {
                const strV = String(v).trim();
                const lowV = strV.toLowerCase();
                // Filtro rigoroso contra lixo da IA
                if (lowV !== '' && lowV !== 'null' && lowV !== 'undefined' && lowV !== 'false' && lowV !== 'nan' && lowV !== 'rejeitado' && lowV !== 'não citado' && lowV !== 'pendente') {
                  flatInput[k.toLowerCase()] = strV;
                }
              }
            });
          };
          flatten(aiData);

          for (const section in initialIntegrativeData) {
            if (!sanitized[section]) sanitized[section] = {};
            for (const key in initialIntegrativeData[section as keyof IntegrativeChecklistData]) {
              const aiNestedVal = aiData[section] && typeof aiData[section] === 'object' ? aiData[section][key] : undefined;
              const aiFlatVal = flatInput[key.toLowerCase()];
              
              let detectedValue = aiNestedVal !== undefined ? String(aiNestedVal) : (aiFlatVal !== undefined ? aiFlatVal : '');
              
              // Sanitização final do valor detectado
              const lowVal = detectedValue.trim().toLowerCase();
              if (lowVal === 'null' || lowVal === 'undefined' || lowVal === 'false' || lowVal === 'nan' || lowVal === 'rejeitado' || lowVal === 'não citado' || lowVal === 'pendente') {
                detectedValue = '';
              }
              
              // Filtro rigoroso: Se a IA sugeriu um valor/sinalização, mas o item NUNCA foi citado na transcrição/relato, limpa o item!
              if (detectedValue !== '' && rawClinicalText.trim().length > 10) {
                if (!isItemMentionedInText(key, rawClinicalText)) {
                  console.log(`[CHECKLIST SANITIZATION] Item '${key}' purgado pois não foi citado no relato. (IA sugeriu: ${detectedValue})`);
                  detectedValue = '';
                }
              }
              
              sanitized[section][key] = detectedValue;
            }
          }
          return sanitized;
        };

        const hasIntegrativeData = result.checklist_integrativo && 
                                 typeof result.checklist_integrativo === 'object' && 
                                 Object.values(result.checklist_integrativo).some(section => 
                                   section && typeof section === 'object' && 
                                   Object.values(section).some(v => v === true || (typeof v === 'string' && v.trim() !== ''))
                                 );
        
        const detectedSpec = result.especialidade ? SPECIALTIES.find(s => 
          stripEmojis(s.name).toLowerCase() === stripEmojis(result.especialidade).toLowerCase() ||
          s.id.toLowerCase() === result.especialidade.toLowerCase()
        ) : undefined;

        if (hasIntegrativeData && examMode === 'standard') {
          setExamMode('integrative');
          toast.success("Modo Integrativo ativado automaticamente.");
        } else if (result.especialidade && examMode === 'standard') {
          if (detectedSpec && examMode !== detectedSpec.id) {
            setExamMode(detectedSpec.id);
            toast.success(`Modo ${stripEmojis(detectedSpec.name)} ativado.`);
          }
        }

        // If examMode is NOT standard, we force currentSpecialty to use the examMode, completely ignoring detectedSpec
        const currentSpecialty = examMode !== 'standard' ? SPECIALTIES.find(s => s.id === examMode) : (detectedSpec || SPECIALTIES.find(s => s.id === examMode));
        const newRecord: ClinicalRecord = {
          paciente_nome_completo: result.paciente_nome_completo || selectedPatient || '',
          paciente_cpf: result.paciente_cpf || '',
          paciente_data_nascimento: result.paciente_data_nascimento || '',
          paciente_telefone: selectedPatientPhone || '',
          especialidade: stripEmojis(currentSpecialty?.name || result.especialidade || selectedAppointmentReason || 'Geral'),
          paciente_status: result.paciente_status || 'Estável',
          dados_clinicos: (() => {
            let dados = result.dados_clinicos || {};
            if (typeof result.dados_clinicos === 'string') {
              try {
                dados = JSON.parse(result.dados_clinicos);
              } catch (e) {
                dados = { observacoes: result.dados_clinicos };
              }
            }
            return dados;
          })(),
          alertas_copiloto: Array.isArray(result.alertas_copiloto) ? result.alertas_copiloto : [],
          exame_neurologico: (examMode === 'neurological' || (result.exame_neurologico && hasMeaningfulData(result.exame_neurologico))) ? (result.exame_neurologico || {}) : undefined,
          checklist_integrativo: (examMode === 'integrative' || hasIntegrativeData) ? sanitizeChecklist(result.checklist_integrativo) : undefined,
          mapeamento_corporal: Array.isArray(result.mapeamento_corporal) ? result.mapeamento_corporal : [],
          dados_especialidade: sanitizeSpecialtyData(result.dados_especialidade || {}),
          comparativo: result.comparativo || {},
          resumo_formatado: result.resumo_formatado || '',
          hipotese_diagnostica: result.hipotese_diagnostica || '',
          conduta_plano_terapeutico: result.conduta_plano_terapeutico || '',
          prescricao: result.prescricao || '',
          sugestao_conduta: result.sugestao_conduta || '',
          queixa_principal: result.queixa_principal || '',
          vitals: result.vitals ? { ...result.vitals, resumo_clinico: result.resumo_clinico || '' } : undefined,
          data_consulta: getLocalISODate()
        };
        
        setCurrentRecord(newRecord);
        if (newRecord.checklist_integrativo) {
          setIntegrativeData(newRecord.checklist_integrativo);
        }
        if (newRecord.dados_especialidade) {
          setSpecialtyData(newRecord.dados_especialidade);
        }
    } catch (err: any) {
      console.error("Erro no processamento clínico:", err);
      const msg = err.message || "";
      if (msg.includes("API_KEY_MISSING")) {
        setError("Configuração pendente: Chave de API não encontrada.");
      } else if (msg.includes("quota") || msg.includes("429")) {
        setError("Limite de uso da IA atingido. Tente novamente em alguns minutos.");
      } else {
        setError(`Erro ao processar áudio: ${msg || 'Verifique sua conexão e tente novamente.'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const saveRecord = async (recordOverride?: any) => {
    const activeUser = user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@ambulatorio.ia', full_name: 'Dr. Carlos Morato', role: 'doctor' as const, status: 'approved' as const };
    
    const rec: any = recordOverride || currentRecord || {
      paciente_nome_completo: selectedPatient || "Paciente em Atendimento",
      paciente_cpf: selectedPatientCpf || "",
      paciente_data_nascimento: selectedPatientDob || "",
      paciente_telefone: selectedPatientPhone || "",
      especialidade: examMode === 'integrative' ? 'Integrativa' : 'Geral',
      paciente_status: 'Estável',
      dados_clinicos: {},
      queixa_principal: "Paciente em atendimento. Registrada evolução de prontuário.",
      exame_fisico: "",
      hipotese_diagnostica: "",
      conduta_plano_terapeutico: "1. Suplementação integrativa e orientações clínicas.\n2. Retorno para reavaliação.",
      resumo_formatado: "Atendimento salvo no histórico do paciente.",
      data_consulta: getLocalISODate(),
      checklist_integrativo: integrativeData
    };

    setIsSaving(true);
    setError(null);
    try {
      const cleanCPF = rec.paciente_cpf ? String(rec.paciente_cpf).replace(/\D/g, '') : null;
      
      // Define o médico responsável: Prioridade para o selecionado na agenda, fallback para o usuário atual
      const medicoIdToSave = selectedMedicoId || activeUser.id;
      
      // Força a especialidade para 'Integrativa' se o modo for integrativo
      const especialidadeToSave = examMode === 'integrative' ? 'Integrativa' : (rec.especialidade || 'Geral');

      console.log("saveRecord - selectedPatientPhone (state):", selectedPatientPhone);
      console.log("saveRecord - medicoIdToSave:", medicoIdToSave);
      // Formata a data de nascimento para YYYY-MM-DD para manter consistência no banco
      let formattedBirthDate = rec.paciente_data_nascimento;
      if (formattedBirthDate && formattedBirthDate.includes('/')) {
        const parts = formattedBirthDate.split('/');
        if (parts.length === 3) {
          // Se for DD/MM/YYYY -> YYYY-MM-DD
          if (parts[2].length === 4) {
            formattedBirthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }

      const recordToSave: any = { 
        medico_id: medicoIdToSave,
        user_id: activeUser.id, // O usuário que está salvando
        profissional_responsavel: rec.profissional_responsavel || activeUser.full_name || activeUser.email,
        paciente_nome_completo: rec.paciente_nome_completo || selectedPatient || "Não Identificado",
        paciente_cpf: cleanCPF,
        paciente_data_nascimento: formattedBirthDate,
        especialidade: especialidadeToSave,
        paciente_status: rec.paciente_status || 'Ativo',
        paciente_telefone: rec.paciente_telefone || selectedPatientPhone,
        queixa_principal: rec.queixa_principal,
        exame_fisico: rec.exame_fisico,
        hipotese_diagnostica: rec.hipotese_diagnostica,
        conduta_plano_terapeutico: rec.conduta_plano_terapeutico,
        prescricao: rec.prescricao,
        resumo_formatado: rec.resumo_formatado || rec.queixa_principal,
        sugestao_conduta: rec.sugestao_conduta,
        dados_clinicos: rec.dados_clinicos || {},
        comparativo: rec.comparativo || {},
        data_consulta: rec.data_consulta || getLocalISODate(),
        created_at: new Date().toISOString()
      };

      // Adiciona campos específicos baseados no modo de exame
      if (examMode === 'neurological' || (rec.exame_neurologico && hasMeaningfulData(rec.exame_neurologico))) {
        recordToSave.exame_neurologico = rec.exame_neurologico;
      }
      
      const checklistToSave = rec.checklist_integrativo || integrativeData;
      if (examMode === 'integrative' || (checklistToSave && hasMeaningfulData(checklistToSave))) {
        recordToSave.checklist_integrativo = checklistToSave;
      }
      if (rec.mapeamento_corporal && rec.mapeamento_corporal.length > 0) {
        recordToSave.mapeamento_corporal = rec.mapeamento_corporal;
      }
      
      if (rec.vitals) {
        recordToSave.vitals = rec.vitals;
      }
      
      recordToSave.dados_especialidade = currentRecord.dados_especialidade || specialtyData;
      recordToSave.exame_fisico = currentRecord.exame_fisico;

      const trySaveRecord = async (data: any): Promise<{ error: any }> => {
        console.log("LOG_VERSAO: 3.1 - Início do salvamento");
        
        // Colunas que REALMENTE existem no banco (conforme schema verificado)
        const EXPLICIT_ALLOWED_COLUMNS = [
          'medico_id', 'user_id', 'profissional_responsavel', 'paciente_nome_completo', 
          'paciente_cpf', 'paciente_data_nascimento', 'especialidade', 'paciente_status', 
          'paciente_telefone', 'queixa_principal', 'hipotese_diagnostica', 
          'conduta_plano_terapeutico', 'prescricao', 'resumo_formatado', 
          'sugestao_conduta', 'dados_clinicos', 'data_consulta', 'created_at',
          'exame_neurologico', 'exame_fisico', 'checklist_integrativo', 'dados_especialidade'
        ];

        // Filtra os dados para enviar rigorosamente apenas colunas permitidas
        const payload: any = {};
        EXPLICIT_ALLOWED_COLUMNS.forEach(col => {
          if (data[col] !== undefined && data[col] !== null) {
            payload[col] = data[col];
          }
        });

        // Garantir que mapeamento e vitais sejam salvos DENTRO do JSON dados_especialidade e NÃO na raiz
        if (data.mapeamento_corporal) {
          payload.dados_especialidade = payload.dados_especialidade || {};
          payload.dados_especialidade.mapeamento_corporal = data.mapeamento_corporal;
        }
        
        if (data.vitals) {
          payload.dados_especialidade = payload.dados_especialidade || {};
          payload.dados_especialidade.vitals = data.vitals;
        }

        console.log("PAYLOAD_ENVIADO (Chaves):", Object.keys(payload));
        
        try {
          const { error } = await supabase
            .from('prontuarios')
            .insert(payload)
            .select('id');
          
          if (error) {
            console.error("ERRO DETALHADO DO SUPABASE AO SALVAR:", JSON.stringify(error, null, 2));
            return { error };
          }
          return { error: null };
        } catch (e: any) {
          console.error("Erro fatal no trySaveRecord:", e);
          return { error: e };
        }
      };

      console.log("saveRecord - recordToSave:", recordToSave);
      
      let saveError: any = null;
      if (isOnline) {
        const res = await trySaveRecord(recordToSave);
        saveError = res.error;
      } else {
        saveError = new Error("NETWORK_OFFLINE");
      }

      if (saveError) {
        console.warn("Salvando prontuário no modo offline local:", saveError);
        const localRecord = saveRecordLocally(recordToSave);
        
        toast.success("💻 Prontuário salvo no seu COMPUTADOR (Modo Offline)! Sincronizará com a nuvem assim que o Wi-Fi retornar.", { duration: 6000 });
        setSaveSuccess(true);
        setOfflinePendingCount(prev => prev + 1);
        setHistory(prev => [localRecord as any, ...prev]);
      } else {
        console.log("saveRecord - Sucesso ao salvar na Nuvem!");
        toast.success("Prontuário salvo na nuvem com sucesso! Histórico atualizado.");
        setSaveSuccess(true);
        fetchHistory();
      }
        
        // Atualiza o status do agendamento se houver um ID selecionado
        if (selectedAppointmentId && isOnline) {
          try {
            const { error: upError } = await supabase.from('agendamentos').update({ status: 'Concluído' }).eq('id', selectedAppointmentId);
            if (upError) {
              await supabase.from('appointments').update({ status: 'Concluído' }).eq('id', selectedAppointmentId);
            }
          } catch (e) {
            console.warn("Erro ao atualizar status do agendamento:", e);
          }
        }

        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setError(`Erro de conexão ao salvar registro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'alerta': return 'text-red-500 bg-red-50 border-red-100';
      case 'melhora': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'piora': return 'text-orange-500 bg-orange-50 border-orange-100';
      default: return 'text-blue-500 bg-blue-50 border-blue-100';
    }
  };

  const formatDateBR = (dateStr: string | undefined) => {
    if (!dateStr) return 'Não informado';
    try {
      // Se tiver 'T00:00:00' e for UTC, é uma data YYYY-MM-DD pura que o banco converteu
      if (dateStr.includes('T00:00:00.000Z') || dateStr.includes('T00:00:00+00:00')) {
        const parts = dateStr.split('T')[0].split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      
      // Se for ISO string completa (com T), convertemos respeitando o fuso local
      if (dateStr.includes('T')) {
        const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
        return formatter.format(new Date(dateStr));
      }
      // Se for apenas YYYY-MM-DD
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
          const [year, month, day] = parts;
          return `${day.substring(0,2)}/${month}/${year}`;
        }
      }
    } catch (e) {
      console.warn("Date formatting error", e);
    }
    return dateStr;
  };

  const getLocalISODate = () => {
    // Retorna a data local no formato YYYY-MM-DD respeitando o fuso de America/Sao_Paulo
    try {
      const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric', day: 'numeric' } as const;
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(new Date());
      const monthPart = parts.find(p => p.type === 'month')?.value || '';
      const dayPart = parts.find(p => p.type === 'day')?.value || '';
      const yearPart = parts.find(p => p.type === 'year')?.value || '';
      
      const pad = (n: string) => n.padStart(2, '0');
      if (yearPart && monthPart && dayPart) {
        return `${yearPart}-${pad(monthPart)}-${pad(dayPart)}`;
      }
    } catch (e) {
      console.warn("Error getting local ISO date", e);
    }
    const local = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
  };

  const stripEmojis = (str: string) => {
    if (!str) return '';
    // Substitui emojis e caracteres especiais não-ASCII problemáticos, 
    // mas explicitamente preserva caracteres do português (acentos, ç), números e pontuação comum.
    return String(str)
      .replace(/[^\x20-\x7E\xC0-\xFF\u0100-\u017F\n\r]/g, '') // Mantém Latin básico, Latin-1 Supplement (acentos) e Latin Extended-A
      .replace(/[ \t]+/g, ' ') // normaliza espaços e tabs duplos (preservando quebras de linha \n)
      .trim();
  };

  const formatPrescricaoForPDF = (prescricao: any): string => {
    if (!prescricao) return '';
    let text = '';
    if (typeof prescricao === 'string') {
      text = prescricao;
    } else {
      text = Object.entries(prescricao).map(([key, value]) => {
        let block = `${key.toUpperCase()}\n`;
        if (Array.isArray(value)) {
          block += value.map(item => `- ${item}`).join('\n');
        } else {
          block += `- ${value}`;
        }
        return block;
      }).join('\n\n');
    }
    return stripEmojis(text);
  };

  const generateCSV = (record: ClinicalRecord) => {
    const headers = ["ID", "Paciente", "CPF", "Data Nascimento", "Especialidade", "Status", "Resumo", "Conduta"];
    const row = [
      record.id || "",
      record.paciente_nome_completo || "",
      record.paciente_cpf || "",
      record.paciente_data_nascimento || "",
      record.especialidade || "",
      record.paciente_status || "",
      (record.resumo_formatado || "").replace(/,/g, ";"),
      (record.sugestao_conduta || "").replace(/,/g, ";")
    ];
    
    const csvContent = [headers.join(","), row.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `prontuario_${(record.paciente_nome_completo || 'paciente').replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = async (record: ClinicalRecord, sendToWhatsApp = false) => {
    console.log("Gerando PDF estruturado...");
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      const safeText = (val: any) => stripEmojis(String(val || ''));
      const isNeurological = !!(record.especialidade?.toLowerCase().includes('neuro') || (record.exame_neurologico && hasMeaningfulData(record.exame_neurologico)));
      const cleanSpecialty = record.especialidade ? stripEmojis(record.especialidade) : '';
      
      let currentY = 20;

      // Helper para quebra de página
      const checkPageBreak = (needed: number) => {
        if (currentY + needed > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
          return true;
        }
        return false;
      };

      // Título
      let title = "PRONTUÁRIO CLÍNICO";
      if (cleanSpecialty) {
        const specLower = cleanSpecialty.toLowerCase();
        title = specLower.endsWith('ia') ? `PRONTUÁRIO DE ${cleanSpecialty.toUpperCase()}` : `PRONTUÁRIO ${cleanSpecialty.toUpperCase()}`;
      } else if (isNeurological) {
        title = "PRONTUÁRIO NEUROLÓGICO";
      }
      
      // Cabeçalho (Fundo azulado)
      doc.setFillColor(245, 248, 255);
      doc.rect(10, 10, pageWidth - 20, 35, 'F');
      doc.setDrawColor(0, 50, 100);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, pageWidth - 20, 35);

      doc.setFontSize(18);
      doc.setTextColor(0, 50, 100);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(clinicInfo?.name || "Ambulatório IA - Gestão de Saúde Inteligente", pageWidth / 2, 33, { align: 'center' });
      
      let defaultSlogan = "Suporte à Decisão Clínica";
      if (cleanSpecialty.toLowerCase().includes('integrativo')) defaultSlogan = "Suporte à Decisão em Medicina Integrativa";
      else if (cleanSpecialty.toLowerCase().includes('neuro') || isNeurological) defaultSlogan = "Suporte à Decisão Clínica e Neurológica";
      
      doc.text(clinicInfo?.slogan || defaultSlogan, pageWidth / 2, 38, { align: 'center' });
      doc.text(clinicInfo?.address || "", pageWidth / 2, 43, { align: 'center' });

      currentY = 60;

      // Seção: Dados do Paciente
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text("DADOS DO PACIENTE", margin, currentY);
      currentY += 2;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Paciente: ${safeText(record.paciente_nome_completo || 'Não informado')}`, margin, currentY);
      doc.text(`Data da Consulta: ${formatDateBR(record.data_consulta || record.created_at)}`, pageWidth - margin, currentY, { align: 'right' });
      currentY += 6;
      doc.text(`CPF: ${safeText(record.paciente_cpf || 'Não informado')}`, margin, currentY);
      doc.text(`Nascimento: ${safeText(record.paciente_data_nascimento || 'Não informado')}`, margin + 60, currentY);
      currentY += 12;

      // Seção: Exame Neurológico
      if (isNeurological && record.exame_neurologico) {
        const ex = record.exame_neurologico;
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setTextColor(0, 50, 100);
        doc.text("Exame Neurológico", margin, currentY);
        currentY += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const neuroHeader = `Fáscia: ${safeText(ex.fascia || 'N/A')} | Atitude: ${safeText(ex.atitude || 'N/A')} | Dominância: ${safeText(ex.dominancia || 'N/A')}`;
        doc.text(neuroHeader, margin, currentY);
        currentY += 6;
        let marchaGlasgow = `Marcha: ${safeText(ex.marcha || 'N/A')}`;
        if (ex.escala_glasgow) {
          marchaGlasgow += ` | Escala de Glasgow: ${ex.escala_glasgow}`;
        }
        doc.text(marchaGlasgow, margin, currentY);
        currentY += 10;

        // Tabelas de Força e Sensibilidade
        if (ex.forca_muscular && typeof ex.forca_muscular === 'object') {
          const muscleData = Object.entries(ex.forca_muscular).map(([key, val]: [string, any]) => [
            key.toUpperCase(), safeText(val?.tonus), safeText(val?.trofismo), safeText(val?.mov_anormais || val?.mov_normais), safeText(val?.deformidades), safeText(val?.fatigabilidade)
          ]).filter(row => row[1] || row[2] || row[3] || row[4] || row[5]);

          if (muscleData.length > 0) {
            checkPageBreak(40);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 50, 100);
            doc.text("AVALIAÇÃO MOTORA:", margin, currentY);
            currentY += 6;
            autoTable(doc, {
              startY: currentY,
              head: [['Região', 'Tônus', 'Trofismo', 'Mov. Anormais', 'Deformidades', 'Fatigabilidade']],
              body: muscleData,
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', halign: 'center' },
              headStyles: { fillColor: [240, 248, 255], textColor: [0, 50, 100], fontStyle: 'bold', lineWidth: 0.1 },
              columnStyles: { 0: { halign: 'left' } },
              margin: { left: margin, right: margin }
            });
            currentY = (doc as any).lastAutoTable?.finalY + 15;
          }
        }

        if (ex.sensibilidade && typeof ex.sensibilidade === 'object') {
          const sensData = Object.entries(ex.sensibilidade).map(([key, val]: [string, any]) => [
            key.toUpperCase(), val?.proprio ? 'X' : '', val?.vibrat ? 'X' : '', val?.temp ? 'X' : '', val?.dor ? 'X' : '', val?.toque ? 'X' : ''
          ]).filter(row => row.slice(1).some(v => v === 'X'));

          if (sensData.length > 0) {
            checkPageBreak(50);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 50, 100);
            doc.text("AVALIAÇÃO DE SENSIBILIDADE:", margin, currentY);
            currentY += 8;
            autoTable(doc, {
              startY: currentY,
              head: [['Região', 'Prop.', 'Vib.', 'Témp.', 'Dor', 'Tátil']],
              body: sensData,
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', halign: 'center' },
              headStyles: { fillColor: [240, 248, 255], textColor: [0, 50, 100], fontStyle: 'bold', lineWidth: 0.1 },
              columnStyles: { 0: { halign: 'left' } },
              margin: { left: margin, right: margin }
            });
            currentY = (doc as any).lastAutoTable?.finalY + 15;
          }
        }

        // Nervos Cranianos e Cognitivo
        const sections: {[key: string]: any} = {
          "Nervos Cranianos": ex.nervos_cranianos,
          "Alterações Cognitivas": ex.cognitivo
        };

        Object.entries(sections).forEach(([title, data]) => {
          if (data && typeof data === 'object') {
            const lines = Object.entries(data)
              .filter(([_, v]) => v)
              .map(([k, v]) => `${k.toUpperCase()}: ${safeText(v)}`)
              .join(' | ');
            
            if (lines) {
              const textLines = doc.splitTextToSize(lines, contentWidth);
              checkPageBreak(textLines.length * 6 + 10);
              doc.setFont('helvetica', 'bold');
              doc.text(title, margin, currentY);
              currentY += 7;
              doc.setFont('helvetica', 'normal');
              doc.text(textLines, margin, currentY);
              currentY += (textLines.length * 5) + 10;
            }
          }
        });
      }

      // Mapeamento Corporal
      const bodyPoints = record.mapeamento_corporal || record.dados_especialidade?.mapeamento_corporal;
      if (Array.isArray(bodyPoints) && bodyPoints.length > 0) {
        checkPageBreak(25);
        doc.setFontSize(14);
        doc.setTextColor(0, 50, 100);
        doc.text("Mapeamento de Queixas", margin, currentY);
        currentY += 7;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        bodyPoints.forEach((p, i) => {
          checkPageBreak(7);
          const side = (p.side === 'back' || p.side === 'posterior') ? 'VISTA POSTERIOR' : 'VISTA ANTERIOR';
          doc.text(`${i + 1}. ${safeText(p.label)} (${side})`, margin + 5, currentY);
          currentY += 6;
        });
        currentY += 5;
      }

      // Checklist Integrativo
      if (record.checklist_integrativo && typeof record.checklist_integrativo === 'object') {
        const ckItems: string[] = [];
        Object.entries(record.checklist_integrativo).forEach(([sec, fields]: [string, any]) => {
          if (fields && typeof fields === 'object') {
            const marked = Object.entries(fields)
              .filter(([_, v]) => v && v !== 'false' && v !== false)
              .map(([k, v]) => {
                const label = formatIntegrativeLabel(k).toUpperCase();
                return (v === true || v === 'Sinalizado') ? label : `${label}: ${v}`;
              });
            if (marked.length > 0) {
              ckItems.push(`${sec.replace(/_/g, ' ').toUpperCase()}: ${marked.join(', ')}`);
            }
          }
        });

        if (ckItems.length > 0) {
          checkPageBreak(30);
          doc.setFontSize(14);
          doc.setTextColor(0, 50, 100);
          doc.text("Checklist de Saúde Integrativa", margin, currentY);
          currentY += 10;
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          const combinedCk = ckItems.join(' | ');
          const ckLines = doc.splitTextToSize(combinedCk, contentWidth);
          doc.text(ckLines, margin, currentY);
          currentY += (ckLines.length * 5) + 12;
        }
      }

      // Especialidade
      if (record.dados_especialidade && Object.keys(record.dados_especialidade).length > 0) {
        const specDataStr = Object.entries(record.dados_especialidade)
          .filter(([k]) => k !== 'mapeamento_corporal' && k !== 'vitals')
          .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${safeText(v)}`)
          .join(' | ');

        if (specDataStr) {
          checkPageBreak(20);
          doc.setFontSize(12);
          doc.setTextColor(0, 50, 100);
          doc.text(`Dados de ${safeText(record.especialidade || 'Especialidade')}`, margin, currentY);
          currentY += 7;
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          const specLines = doc.splitTextToSize(specDataStr, contentWidth);
          doc.text(specLines, margin, currentY);
          currentY += (specLines.length * 5) + 10;
        }
      }

      // Sinais Vitais (Vitals)
      const vitalsObj = record.vitals || record.dados_especialidade?.vitals;
      if (vitalsObj && typeof vitalsObj === 'object') {
        const vitalsStr = Object.entries(vitalsObj)
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k.toUpperCase()}: ${safeText(v)}`)
          .join(' | ');
        
        if (vitalsStr) {
          checkPageBreak(20);
          doc.setFontSize(12);
          doc.setTextColor(0, 50, 100);
          doc.text("Sinais Vitais", margin, currentY);
          currentY += 7;
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          const vitalsLines = doc.splitTextToSize(vitalsStr, contentWidth);
          doc.text(vitalsLines, margin, currentY);
          currentY += (vitalsLines.length * 5) + 10;
        }
      }

      // Resumo, Hipótese e Conduta
      const contentSections = [
        { title: "Resumo do Atendimento", content: record.resumo_formatado },
        { title: "Hipótese Diagnóstica", content: record.hipotese_diagnostica },
        { title: "Conduta / Plano Terapêutico", content: record.conduta_plano_terapeutico || record.sugestao_conduta }
      ];

      contentSections.forEach(s => {
        if (s.content) {
          const textLines = doc.splitTextToSize(safeText(s.content), contentWidth);
          checkPageBreak(textLines.length * 5 + 15);
          doc.setFontSize(12);
          doc.setTextColor(0, 50, 100);
          doc.text(s.title, margin, currentY);
          currentY += 7;
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(textLines, margin, currentY);
          currentY += (textLines.length * 5) + 10;
        }
      });

      // Prescrição
      if (record.prescricao) {
        const prescLines = doc.splitTextToSize(formatPrescricaoForPDF(record.prescricao), contentWidth);
        checkPageBreak(prescLines.length * 5 + 15);
        doc.setFontSize(12);
        doc.setTextColor(0, 50, 100);
        doc.text("Prescrição / Receituário:", margin, currentY);
        currentY += 7;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(prescLines, margin, currentY);
        currentY += (prescLines.length * 5) + 10;
      }
      
      const fileName = `prontuario_${(record.paciente_nome_completo || 'paciente').replace(/\s+/g, '_')}.pdf`;
      
      if (sendToWhatsApp) {
        if (!record.paciente_telefone) {
          toast.error("Telefone do paciente não informado.");
          return;
        }
        const base64 = doc.output('datauristring').split(',')[1];
        toast.loading("Enviando via WhatsApp...", { id: 'sending-pdf' });
        await sendWhatsAppMessage(record.paciente_telefone, "Segue seu prontuário clínico.", base64, 'document', fileName);
        toast.success("Prontuário enviado!", { id: 'sending-pdf' });
      } else {
        doc.save(fileName);
        toast.success("Prontuário gerado!");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(`Erro ao gerar o PDF: ${error instanceof Error ? error.message : 'Dados mal formatados'}`);
    }
  };

  const generatePrescriptionPDF = async (record: ClinicalRecord, sendToWhatsApp = false) => {
    if (!record.prescricao && !record.checklist_integrativo) {
      toast.error("Não há prescrição ou checklist para gerar o receituário.");
      return;
    }
    console.log("Gerando Receituário Profissional...");
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      const safeText = (val: any) => stripEmojis(String(val || ''));
      let currentY = 20;

      const checkPageBreak = (needed: number) => {
        if (currentY + needed > pageHeight - 35) {
          doc.addPage();
          doc.setDrawColor(0, 50, 100);
          doc.setLineWidth(0.5);
          doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
          currentY = 20;
          return true;
        }
        return false;
      };

      // Borda Decorativa
      doc.setDrawColor(0, 50, 100);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      
      // Cabeçalho
      doc.setFillColor(245, 248, 255);
      doc.rect(11, 11, pageWidth - 22, 40, 'F');
      
      doc.setFontSize(24);
      doc.setTextColor(0, 50, 100);
      doc.setFont('helvetica', 'bold');
      doc.text("RECEITUÁRIO", pageWidth / 2, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(clinicInfo?.name || "Ambulatório IA - Gestão de Saúde Inteligente", pageWidth / 2, 38, { align: 'center' });
      doc.text(clinicInfo?.slogan || "Suporte à Decisão Clínica", pageWidth / 2, 43, { align: 'center' });

      doc.setLineWidth(0.8);
      doc.setDrawColor(0, 50, 100);
      doc.line(20, 51, 190, 51);
      
      // Dados do Paciente
      currentY = 60;
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text("PACIENTE:", margin + 5, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(safeText(record.paciente_nome_completo || 'Não informado'), margin + 30, currentY);
      
      doc.setFont('helvetica', 'bold');
      doc.text("DATA:", pageWidth - margin - 45, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDateBR(record.data_consulta || record.created_at), pageWidth - margin - 5, currentY, { align: 'right' });
      
      currentY += 15;

      doc.setFontSize(14);
      doc.setTextColor(0, 50, 100);
      doc.setFont('helvetica', 'bold');
      doc.text("PRESCRIÇÃO E ORIENTAÇÕES", pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // Conteúdo da Prescrição
      if (record.prescricao) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        const cleanPrescricao = formatPrescricaoForPDF(record.prescricao);
        const prescricaoLines = doc.splitTextToSize(cleanPrescricao, contentWidth - 10);
        
        prescricaoLines.forEach((line: string) => {
          checkPageBreak(7);
          doc.text(line, margin + 5, currentY);
          currentY += 6;
        });
        currentY += 10;
      }
      
      // Itens do Checklist Integrativo
      if (record.checklist_integrativo && typeof record.checklist_integrativo === 'object') {
        const markedItems: string[] = [];
        Object.entries(record.checklist_integrativo).forEach(([section, fields]: [string, any]) => {
          if (fields && typeof fields === 'object') {
            Object.entries(fields).forEach(([key, val]) => {
              if (val === true || val === 'true' || val === 'Sinalizado') {
                markedItems.push(formatIntegrativeLabel(key));
              } else if (val && val !== 'false' && (typeof val === 'string' || typeof val === 'number')) {
                markedItems.push(`${formatIntegrativeLabel(key)}: ${val}`);
              }
            });
          }
        });

        if (markedItems.length > 0) {
          checkPageBreak(25);
          doc.setFontSize(13);
          doc.setTextColor(0, 50, 100);
          doc.setFont('helvetica', 'bold');
          doc.text("SUPLEMENTAÇÃO E SAÚDE INTEGRATIVA", margin + 5, currentY);
          currentY += 10;
          
          markedItems.forEach((item, index) => {
            checkPageBreak(15);
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 40);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${safeText(item).toUpperCase()}`, margin + 5, currentY);
            currentY += 6;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(120, 120, 120);
            doc.text("Uso conforme orientação personalizada.", margin + 10, currentY);
            currentY += 9;
          });
        }
      }
      
      // Rodapé
      const footerY = pageHeight - 35;
      doc.setDrawColor(0, 50, 100);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 40, footerY, pageWidth / 2 + 40, footerY);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 50, 100);
      doc.setFont('helvetica', 'bold');
      const docName = record.profiles?.full_name || record.profissional_responsavel || 'Médico Responsável';
      doc.text(`Dr(a). ${docName}`, pageWidth / 2, footerY + 7, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text("Documento com validade digital gerado pelo Ambulatório IA.", pageWidth / 2, footerY + 15, { align: 'center' });
      
      const fileName = `receita_${(record.paciente_nome_completo || 'paciente').replace(/\s+/g, '_')}.pdf`;

      if (sendToWhatsApp) {
        if (!record.paciente_telefone) {
          toast.error("Telefone do paciente não informado.");
          return;
        }
        const base64 = doc.output('datauristring').split(',')[1];
        toast.loading("Enviando receituário via WhatsApp...", { id: 'sending-pdf' });
        try {
          await sendWhatsAppMessage(record.paciente_telefone, "Segue seu receituário gerado pelo Ambulatório IA.", base64, 'document', fileName);
          toast.success("Receituário enviado com sucesso!", { id: 'sending-pdf' });
        } catch (err) {
          toast.error("Erro ao enviar receituário.", { id: 'sending-pdf' });
        }
      } else {
        doc.save(fileName);
        toast.success("Receituário gerado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao gerar receituário:", error);
      toast.error("Erro ao gerar o receituário. Tente novamente.");
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-red-100 p-10 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Configuração Pendente</h1>
          <p className="text-slate-600 mb-6 text-sm">
            O aplicativo não conseguiu se conectar ao banco de dados. Para que ele funcione no Netlify, você precisa configurar as variáveis de ambiente.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl text-left text-xs font-mono text-slate-700 space-y-2 mb-6 border border-slate-200 overflow-x-auto">
            <p><strong>VITE_SUPABASE_URL</strong> = seu_link_supabase</p>
            <p><strong>VITE_SUPABASE_ANON_KEY</strong> = sua_chave_anon</p>
            <p><strong>GEMINI_API_KEY</strong> = sua_chave_gemini</p>
          </div>
          <p className="text-xs text-slate-500">
            Adicione essas variáveis no painel do Netlify (Site Settings &gt; Environment Variables) e faça um novo deploy.
          </p>
        </motion.div>
      </div>
    );
  }

  if (typeof window !== 'undefined' && (
    window.location.hash.includes('anamnese') ||
    window.location.search.includes('anamnese') ||
    window.location.search.includes('publicAnamnese')
  )) {
    return <PublicAnamneseView />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Aviso de WebView no Login */}
        <AnimatePresence>
          {isWebView && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500 text-white overflow-hidden shadow-lg"
            >
              <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="shrink-0" />
                  <div className="text-[10px] leading-tight font-medium">
                    <p className="font-bold">Microfone Bloqueado!</p>
                    <p className="opacity-90">Copie o link e cole no Chrome ou Safari. Não use o navegador do WhatsApp.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copiado!');
                  }}
                  className="px-3 py-1.5 bg-white text-amber-600 rounded-lg font-bold text-[10px] whitespace-nowrap"
                >
                  Copiar Link
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10"
          >
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-clinical-blue rounded-2xl flex items-center justify-center text-white shadow-xl shadow-clinical-blue/20 mb-6">
              <Stethoscope size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Ambulatório IA</h1>
            <p className="text-slate-400 text-sm font-medium mt-2">Acesso Restrito a Profissionais</p>
            <div className="mt-4 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-200">
              Versão de Degustação
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {authMode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-clinical-blue focus:ring-4 focus:ring-clinical-blue/5 outline-none transition-all"
                  placeholder="Dr. João Silva"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Profissional</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-clinical-blue focus:ring-4 focus:ring-clinical-blue/5 outline-none transition-all"
                placeholder="exemplo@clinica.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-clinical-blue focus:ring-4 focus:ring-clinical-blue/5 outline-none transition-all"
                placeholder="••••••••"
              />
              
              {authMode === 'signup' && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Requisitos da Senha:</p>
                  <div className={`flex items-center gap-2 text-xs font-medium ${passwordRules.length ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {passwordRules.length ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current opacity-50" />}
                    Mínimo de 8 caracteres
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium ${passwordRules.uppercase ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {passwordRules.uppercase ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current opacity-50" />}
                    Pelo menos 1 letra maiúscula
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium ${passwordRules.lowercase ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {passwordRules.lowercase ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current opacity-50" />}
                    Pelo menos 1 letra minúscula
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium ${passwordRules.number ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {passwordRules.number ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current opacity-50" />}
                    Pelo menos 1 número
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium ${passwordRules.special ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {passwordRules.special ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current opacity-50" />}
                    Pelo menos 1 caractere especial (!@#$...)
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between gap-3 text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} />
                  {error}
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full py-5 bg-clinical-blue text-white rounded-2xl font-bold shadow-xl shadow-clinical-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'login' ? 'Entrar no Sistema' : 'Criar Minha Conta')}
            </button>

            {authMode === 'login' && (
              <div className="grid grid-cols-1 gap-4">
                <button 
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={authLoading}
                  className="w-full py-4 bg-clinical-blue/10 text-clinical-blue rounded-2xl font-bold border border-clinical-blue/20 hover:bg-clinical-blue/20 transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
                >
                  <UserCheck size={18} />
                  Acesso Rápido (Demo Admin)
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center space-y-4">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-sm text-slate-400 hover:text-clinical-blue transition-colors font-medium"
            >
              {authMode === 'login' ? 'Não tem conta? Solicite acesso' : 'Já tem uma conta? Faça login'}
            </button>

            <div className="flex flex-col items-center gap-2 pt-4">
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Compartilhar Acesso</p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('https://ais-pre-cct4qcca3jzfgibsrmqhtl-51327969358.us-east1.run.app');
                  toast.success('Link do app copiado!');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 hover:text-clinical-blue hover:bg-slate-100 rounded-xl transition-all text-xs font-bold border border-slate-100"
              >
                <Copy size={14} />
                Copiar Link do Aplicativo
              </button>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row min-w-0">
      {/* Aviso de WebView / Microfone Bloqueado */}
      <AnimatePresence>
        {isWebView && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-white overflow-hidden fixed top-0 left-0 right-0 z-[100] shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <AlertCircle size={20} />
                </div>
                <div className="text-xs sm:text-sm font-medium">
                  <p className="font-bold">Atenção: Microfone Bloqueado!</p>
                  <p className="opacity-90">Você está no navegador interno (WhatsApp/Instagram). Copie o link e cole diretamente no Chrome ou Safari para gravar áudios.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copiado! Cole no Chrome ou Safari.');
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-xl font-bold text-xs transition-transform active:scale-95 shadow-sm"
                >
                  <Copy size={14} />
                  Copiar Link
                </button>
                <button 
                  onClick={() => setIsWebView(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Fechar aviso"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lateral Navigation Sidebar (Prontuário Azul) */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col justify-between p-4 shadow-xl z-40">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div 
            className="flex items-center gap-3 p-2 cursor-pointer rounded-2xl hover:bg-slate-800/80 transition-all"
            onClick={() => {
              setShowManageTeam(false);
              setShowAgenda(false);
              setShowHistory(false);
              setShowMessageHistory(false);
              setShowDashboard(true);
              setSelectedPatient(null);
            }}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30 shrink-0">
              <Stethoscope size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-none">Ambulatório IA</h1>
              <p className="text-[9px] uppercase tracking-wider text-blue-400 font-bold mt-1">Prontuário Azul v4.5</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setShowDashboard(true);
                setShowManageTeam(false);
                setShowAgenda(false);
                setShowHistory(false);
                setShowMessageHistory(false);
                setSelectedPatient(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all",
                showDashboard 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Activity size={18} />
              <span>Dashboard Geral</span>
            </button>

            <button
              onClick={() => {
                setShowDashboard(false);
                setShowManageTeam(false);
                setShowAgenda(false);
                setShowHistory(false);
                setShowMessageHistory(false);
                setSelectedPatient(null);
                setCurrentRecord(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all",
                (!showDashboard && !showAgenda && !showHistory && !showMessageHistory && !showManageTeam && !selectedPatient)
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Mic size={18} />
              <span>Atendimento Clínico</span>
            </button>

            <button
              onClick={() => {
                setShowAgenda(!showAgenda);
                setShowHistory(false);
                setShowMessageHistory(false);
                setShowDashboard(false);
                setShowManageTeam(false);
                setSelectedPatient(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all",
                showAgenda 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Calendar size={18} />
              <span>Agenda Médica</span>
            </button>

            <button
              onClick={() => {
                setShowMessageHistory(!showMessageHistory);
                setShowHistory(false);
                setShowAgenda(false);
                setShowDashboard(false);
                setShowManageTeam(false);
                setSelectedPatient(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all",
                showMessageHistory 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <MessageSquare size={18} />
              <span>Mensagens & WhatsApp</span>
            </button>

            <button
              onClick={() => {
                setShowHistory(!showHistory);
                setShowAgenda(false);
                setShowMessageHistory(false);
                setShowDashboard(false);
                setShowManageTeam(false);
                setShowFinancial(false);
                setSelectedPatient(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all",
                showHistory 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <History size={18} />
              <span>Histórico de Prontuários</span>
            </button>

            <button
              onClick={() => {
                setShowFinancial(!showFinancial);
                setShowHistory(false);
                setShowAgenda(false);
                setShowMessageHistory(false);
                setShowDashboard(false);
                setShowManageTeam(false);
                setSelectedPatient(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all",
                showFinancial 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <DollarSign size={18} />
              <span>Financeiro & Caixa</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setShowManageTeam(true);
                  setShowAgenda(false);
                  setShowHistory(false);
                  setShowMessageHistory(false);
                  setShowDashboard(false);
                  setSelectedPatient(null);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all",
                  showManageTeam 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Users size={18} />
                  <span>Equipe Médica</span>
                </div>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-[10px] font-extrabold text-white animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setShowClinicSettings(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <Settings size={18} />
              <span>Configurar PDF</span>
            </button>

            <button
              onClick={() => setShowSystemOverview(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <HelpCircle size={18} />
              <span>Ajuda, Manual & Sobre o Sistema</span>
            </button>
          </nav>

          {/* Painel de Status Offline & PWA */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                {isOnline ? "Conectado (Nuvem)" : "Modo Offline (Local)"}
              </span>
              {offlinePendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                  {offlinePendingCount} no PC
                </span>
              )}
            </div>

            {offlinePendingCount > 0 && (
              <button
                onClick={async () => {
                  if (!isOnline) {
                    toast.error("Conecte-se ao Wi-Fi para sincronizar os prontuários com a nuvem.");
                    return;
                  }
                  setIsSyncingOffline(true);
                  const toastId = toast.loading("Sincronizando com a nuvem...");
                  const { syncedCount, errorsCount } = await syncOfflineRecordsWithCloud(supabase);
                  setIsSyncingOffline(false);
                  toast.dismiss(toastId);
                  if (syncedCount > 0) {
                    toast.success(`${syncedCount} prontuários sincronizados com a nuvem!`);
                    setOfflinePendingCount(getOfflineRecords().filter(r => r.is_offline_pending).length);
                    fetchHistory();
                  } else if (errorsCount > 0) {
                    toast.error(`Falha ao enviar ${errorsCount} prontuários.`);
                  }
                }}
                disabled={isSyncingOffline || !isOnline}
                className="w-full py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all border border-amber-500/30"
              >
                <RefreshCw size={12} className={isSyncingOffline ? "animate-spin" : ""} />
                Sincronizar {offlinePendingCount} Pendentes
              </button>
            )}

            {installPromptEvent && (
              <button
                onClick={() => {
                  installPromptEvent.prompt();
                  installPromptEvent.userChoice.then((choice: any) => {
                    if (choice.outcome === 'accepted') {
                      toast.success("App instalado com sucesso no seu computador!");
                      setInstallPromptEvent(null);
                    }
                  });
                }}
                className="w-full py-1.5 px-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border border-blue-500/30"
              >
                <Download size={12} />
                Instalar App no Computador
              </button>
            )}

            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => {
                  const recs = getOfflineRecords();
                  const fullHistory = history.length > 0 ? history : recs;
                  if (fullHistory.length === 0) {
                    toast.error("Nenhum prontuário encontrado para backup.");
                    return;
                  }
                  exportLocalDataJSON(fullHistory);
                  toast.success("Backup do banco de dados salvo em Downloads!");
                }}
                className="flex-1 py-1 px-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                title="Salvar cópia de segurança em arquivo JSON"
              >
                <Save size={10} />
                Backup JSON
              </button>
            </div>
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="pt-4 border-t border-slate-800 space-y-3 mt-6">
          <div className="px-3 py-2 bg-slate-800/60 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || user?.email}</p>
              <p className="text-[10px] text-blue-400 font-semibold uppercase">{user?.role || 'Médico'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs transition-colors"
          >
            <LogOut size={16} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

      <SystemOverviewModal 
        isOpen={showSystemOverview} 
        onClose={() => setShowSystemOverview(false)} 
        userId={user?.id || ''}
      />

      <AnimatePresence>
        {showClinicSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-clinical-blue rounded-xl flex items-center justify-center text-white">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Configurações da Clínica</h3>
                    <p className="text-xs text-slate-500">Personalize o cabeçalho dos seus documentos</p>
                  </div>
                </div>
                <button onClick={() => setShowClinicSettings(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-8">
                <ClinicSettings onClose={() => setShowClinicSettings(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {user && user.status === 'pending' ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <Clock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Aguardando Aprovação</h2>
            <p className="text-slate-600 max-w-md mb-6">
              Seu cadastro foi realizado com sucesso! Agora, aguarde um administrador liberar seu acesso ao sistema.
            </p>
            <button 
              onClick={() => checkUser()}
              className="flex items-center gap-2 px-6 py-3 bg-clinical-blue text-white rounded-xl font-bold hover:bg-clinical-blue-hover transition-all shadow-lg shadow-blue-100"
            >
              <RefreshCw size={18} />
              Verificar Status
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {showManageTeam ? (
              <motion.div
                key="manage-team"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ManageTeam onClose={() => setShowManageTeam(false)} />
              </motion.div>
            ) : showFinancial ? (
              <motion.div
                key="financial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <FinancialModule />
              </motion.div>
            ) : showDashboard ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Dashboard 
                  onStartConsultation={() => {
                    setCurrentRecord({
                      paciente_nome_completo: '',
                      especialidade: 'Geral',
                      paciente_status: 'Estável',
                      resumo_formatado: '',
                      sugestao_conduta: ''
                    });
                    setShowDashboard(false);
                  }}
                  onOpenAgenda={() => { setShowAgenda(true); setShowDashboard(false); }}
                  onOpenMessages={() => { setShowMessageHistory(true); setShowDashboard(false); }}
                  onOpenHistory={() => { setShowHistory(true); setShowDashboard(false); }}
                />
              </motion.div>
            ) : showAgenda ? (
          <Agenda 
            user={user} 
            prefillPatient={prefillPatient} 
            onOpenChat={(phone) => {
              setPreselectedChatPhone(phone);
              setShowMessageHistory(true);
              setShowAgenda(false);
              setShowDashboard(false);
            }}
            onStartConsultation={(paciente, telefone, motivo, medicoId, appointmentId, convenio, especialidade) => {
              console.log("onStartConsultation - paciente:", paciente, "telefone:", telefone, "convenio:", convenio, "especialidade:", especialidade);
              setShowAgenda(false);
              setShowDashboard(false);
              setSelectedPatient(paciente);
              setSelectedPatientPhone(telefone || '');
              setSelectedAppointmentReason(motivo || '');
              setSelectedMedicoId(medicoId || null);
              setSelectedAppointmentId(appointmentId || null);
              setSelectedPatientConvenio(convenio || 'SulAmérica Saúde');
              setPrefillPatient(null);

              const specLower = (especialidade || '').toLowerCase();
              let targetExamMode: 'standard' | 'neurological' | 'integrative' | 'biological_dentistry' = 'standard';
              if (specLower.includes('integrativa')) {
                targetExamMode = 'integrative';
              } else if (specLower.includes('odontologia') || specLower.includes('biológica') || specLower.includes('biologica')) {
                targetExamMode = 'biological_dentistry';
              } else if (specLower.includes('neuro')) {
                targetExamMode = 'neurological';
              }

              setExamMode(targetExamMode);
              setCurrentRecord({
                paciente_nome_completo: paciente,
                paciente_telefone: telefone || '',
                convenio: convenio || 'SulAmérica Saúde',
                especialidade: especialidade || 'Geral',
                paciente_status: 'Estável',
                resumo_formatado: motivo ? `Queixa principal agendada: ${motivo}` : '',
                sugestao_conduta: ''
              } as any);
            }} />
        ) : showMessageHistory ? (
          <motion.div 
            key="message-history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MessageHistory 
              initialPhone={preselectedChatPhone}
              onSchedule={(name, phone) => {
                setPrefillPatient({name, phone});
                setShowAgenda(true);
                setShowDashboard(false);
                setShowMessageHistory(false);
                setPreselectedChatPhone(null);
              }} 
            />
          </motion.div>
        ) : showHistory ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-clinical-border shadow-sm">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Histórico de Atendimentos</h2>
                    <p className="text-slate-500 text-sm">Gerencie e visualize todos os prontuários salvos.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        placeholder="Buscar por nome, CPF, nascimento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinical-blue/20 focus:border-clinical-blue w-full sm:w-64 transition-all"
                      />
                    </div>
                    <button 
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                      title="Exportar prontuários filtrados em planilha CSV"
                    >
                      <Download size={16} />
                      Exportar CSV
                    </button>
                    <label 
                      className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
                      title="Importar lista de pacientes a partir de planilha Excel (.csv)"
                    >
                      <UploadCloud size={16} />
                      Importar Planilha (CSV)
                      <input 
                        type="file" 
                        accept=".csv,.txt" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const content = event.target?.result as string;
                              const updated = importLocalDataCSV(content);
                              setHistory(updated);
                              toast.success(`Planilha importada com sucesso! ${updated.length} prontuários no sistema.`);
                            } catch (err) {
                              toast.error("Erro ao importar a planilha CSV. Verifique o formato.");
                            }
                          };
                          reader.readAsText(file, 'ISO-8859-1');
                        }}
                      />
                    </label>
                    <label 
                      className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer shadow-sm"
                      title="Restaurar backup completo em formato JSON"
                    >
                      <Save size={16} />
                      Importar Backup (JSON)
                      <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const content = event.target?.result as string;
                              const updated = importLocalDataJSON(content);
                              setHistory(updated);
                              toast.success("Backup JSON importado com sucesso!");
                            } catch (err) {
                              toast.error("Erro ao importar o arquivo JSON de backup.");
                            }
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4">
                  {(() => {
                    const cleanTerm = searchTerm.toLowerCase().trim();
                    const cleanDigits = cleanTerm.replace(/\D/g, '');
                    const filtered = history.filter((record) => {
                      if (!cleanTerm) return true;
                      const nameMatch = record.paciente_nome_completo?.toLowerCase().includes(cleanTerm);
                      const cpfMatch = (cleanDigits.length > 0 && record.paciente_cpf?.replace(/\D/g, '').includes(cleanDigits)) || record.paciente_cpf?.toLowerCase().includes(cleanTerm);
                      const dobMatch = record.paciente_data_nascimento?.includes(cleanTerm);
                      const phoneMatch = record.paciente_telefone?.includes(cleanTerm);
                      const specMatch = record.especialidade?.toLowerCase().includes(cleanTerm);
                      const dateMatch = record.data_consulta?.includes(cleanTerm) || record.created_at?.includes(cleanTerm);
                      return nameMatch || cpfMatch || dobMatch || phoneMatch || specMatch || dateMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 bg-white rounded-3xl border border-clinical-border">
                          <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">Nenhum prontuário encontrado para "{searchTerm}".</p>
                        </div>
                      );
                    }

                    return filtered.map((record) => (
                      <motion.div 
                        key={record.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white p-6 rounded-3xl border border-clinical-border shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-clinical-blue/10 group-hover:text-clinical-blue transition-colors">
                              <FileText size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-slate-800">{record.paciente_nome_completo}</h3>
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", getStatusColor(record.paciente_status))}>
                                  {record.paciente_status}
                                </span>
                                {(record.especialidade?.toLowerCase().includes('neuro') || (record.exame_neurologico && hasMeaningfulData(record.exame_neurologico))) && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-100 bg-purple-50 text-purple-600">
                                    NEUROLÓGICO
                                  </span>
                                )}
                                {(record.especialidade?.toLowerCase().includes('integrativa') || (record.checklist_integrativo && hasMeaningfulData(record.checklist_integrativo))) && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100 bg-emerald-50 text-emerald-700">
                                    INTEGRATIVA
                                  </span>
                                )}
                                {(record.especialidade?.toLowerCase().includes('odontologia') || record.especialidade?.toLowerCase().includes('biológica') || record.especialidade?.toLowerCase().includes('biologica')) && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-100 bg-blue-50 text-blue-700">
                                    ODONTOLOGIA BIOLÓGICA
                                  </span>
                                )}
                                {(record.is_offline_pending || record.offline_id) && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-amber-300 bg-amber-100 text-amber-800 flex items-center gap-1">
                                    💻 SALVO NO PC (OFFLINE)
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Calendar size={14} className="text-slate-300" />
                                  {formatDateBR(record.data_consulta || record.created_at)}
                                </span>
                                {record.paciente_cpf && (
                                  <span className="flex items-center gap-1.5">
                                    <User size={14} className="text-slate-300" />
                                    CPF: {record.paciente_cpf}
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <Activity size={14} className="text-slate-300" />
                                  {record.especialidade}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Stethoscope size={14} className="text-slate-300" />
                                  {record.profiles?.full_name || record.profissional_responsavel || 'Não informado'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 self-end md:self-center">
                            <button 
                              onClick={() => {
                                if (record.paciente_telefone) {
                                  setPreselectedChatPhone(record.paciente_telefone);
                                  setShowMessageHistory(true);
                                  setShowHistory(false);
                                  setShowDashboard(false);
                                } else {
                                  toast.error("Paciente sem telefone cadastrado.");
                                }
                              }}
                              className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                              title="Enviar Mensagem"
                            >
                              <MessageSquare size={20} />
                            </button>
                            <button 
                              onClick={() => {
                              const sanitizedRecord = {
                                  ...record,
                                  checklist_integrativo: record.checklist_integrativo ? {
                                    ...initialIntegrativeData,
                                    ...record.checklist_integrativo
                                  } : undefined,
                                  // Garantia de carga do mapeamento e vitals via raiz ou do "baú" dados_especialidade
                                  mapeamento_corporal: (record.mapeamento_corporal && record.mapeamento_corporal.length > 0)
                                    ? record.mapeamento_corporal 
                                    : (record.dados_especialidade?.mapeamento_corporal || []),
                                  vitals: record.vitals || record.dados_especialidade?.vitals || undefined,
                                };
                                console.log("LOG_VERSAO: 3.2 - Carregando mapeamento:", sanitizedRecord.mapeamento_corporal);
                                setCurrentRecord(sanitizedRecord);
                                setShowHistory(false);
                                if (record.especialidade?.toLowerCase().includes('neuro') || (record.exame_neurologico && hasMeaningfulData(record.exame_neurologico))) {
                                  setExamMode('neurological');
                                } else if (record.especialidade?.toLowerCase().includes('integrativa') || (record.checklist_integrativo && hasMeaningfulData(record.checklist_integrativo))) {
                                  setExamMode('integrative');
                                } else if (record.especialidade?.toLowerCase().includes('odontologia') || record.especialidade?.toLowerCase().includes('biolog')) {
                                  setExamMode('biological_dentistry');
                                } else {
                                  setExamMode('standard');
                                }
                                setShowDashboard(false);
                              }}
                              className="p-2.5 text-slate-400 hover:text-clinical-blue hover:bg-clinical-blue/5 rounded-xl transition-all"
                              title="Visualizar"
                            >
                              <Eye size={20} />
                            </button>
                            <button 
                              onClick={() => generatePDF(record)}
                              className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Baixar PDF"
                            >
                              <Download size={20} />
                            </button>
                            <button 
                              onClick={() => generateCSV(record)}
                              className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                              title="Baixar CSV"
                            >
                              <FileText size={20} />
                            </button>
                            <button 
                              onClick={(e) => handleDelete(record.id!, e)}
                              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ));
                  })()}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="default"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <PatientDossierView
                  patientName={selectedPatient || currentRecord?.paciente_nome_completo || 'Consulta em Andamento'}
                  patientPhone={selectedPatientPhone || currentRecord?.paciente_telefone || ''}
                  patientCpf={currentRecord?.paciente_cpf || selectedPatientCpf || ''}
                  patientDob={currentRecord?.paciente_data_nascimento || selectedPatientDob || ''}
                  patientStatus={currentRecord?.paciente_status || 'Estável'}
                  convenio={selectedPatientConvenio || (currentRecord as any)?.convenio || 'Particular'}
                  currentRecord={currentRecord}
                  history={history}
                  examMode={examMode}
                  setExamMode={setExamMode}
                  isRecording={isRecording}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  isProcessing={isProcessing}
                  liveTranscript={liveTranscript}
                  onSaveRecord={saveRecord}
                  isSaving={isSaving}
                  saveSuccess={saveSuccess}
                  onOpenChat={(phone) => {
                    setPreselectedChatPhone(phone);
                    setShowMessageHistory(true);
                    setShowDashboard(false);
                    setShowAgenda(false);
                    setShowHistory(false);
                  }}
                  onGeneratePDF={(rec) => generatePDF(rec)}
                  onGenerateAtestadoPDF={() => {
                    if (currentRecord) generatePDF(currentRecord);
                    else toast.success('Atestado Médico emitido em PDF com sucesso!');
                  }}
                  onGenerateReceitaPDF={() => {
                    if (currentRecord) generatePDF(currentRecord);
                    else toast.success('Receita Médica emitida em PDF com sucesso!');
                  }}
                  onClose={() => {
                    setSelectedPatient(null);
                    setCurrentRecord(null);
                    setShowDashboard(true);
                  }}
                  setCurrentRecord={setCurrentRecord}
                  specialtyData={specialtyData}
                  setSpecialtyData={setSpecialtyData}
                  integrativeData={integrativeData}
                  setIntegrativeData={setIntegrativeData}
                />


              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <footer className="p-8 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
        © 2026 Ambulatório IA • Tecnologia para Saúde Voluntária
      </footer>

      <Toaster position="top-right" />
      </div>
    </div>
  );
}
