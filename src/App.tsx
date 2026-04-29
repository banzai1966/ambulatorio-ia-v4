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
  Crosshair
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
import IntegrativeBodyMap from './components/IntegrativeBodyMapAnatomy';
import IntegrativeEvolution from './components/IntegrativeEvolution';
import SpecialtyFields from './components/SpecialtyFields';
import { SPECIALTIES } from './constants/specialties';
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
  mapeamento_corporal?: any;
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

  useEffect(() => {
    // Forçar limpeza de Service Worker (PWA) que trava o cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log("Service Worker desregistrado para forçar atualização.");
        }
      });
    }

    toast.success("Ambulatório IA v4.4 - LAYOUT RESTAURADO!");
    console.log("App Version: v4.4 (Clinical Focus & Scale Fix)");
    document.title = "AMB IA v4.4 - HD Precision";
    
    // Versão controlada de flush para v4.4
    const FLUSH_KEY = 'amb_ia_flush_v4.4';
    if (!localStorage.getItem(FLUSH_KEY)) {
      localStorage.clear();
      localStorage.setItem(FLUSH_KEY, 'true');
      console.log("Restaurando layout v4.4...");
      setTimeout(() => window.location.reload(), 500);
    }
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
              ]).then(() => console.log("Referências de dados atualizadas para o novo ID."));
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
      
      setHistory(recordsWithProfiles.map((r: any) => {
        let dados = r.dados_clinicos || {};
        if (typeof r.dados_clinicos === 'string') {
          try {
            dados = JSON.parse(r.dados_clinicos);
          } catch (e) {
            // Se falhar, assume que é texto livre
            dados = { observacoes: r.dados_clinicos };
          }
        }
        return {
          ...r,
          dados_clinicos: dados,
          // Prioriza os campos no nível superior (novas colunas), fallback para o JSON antigo
          resumo_formatado: r.resumo_formatado || dados.resumo_formatado || '',
          sugestao_conduta: r.sugestao_conduta || dados.sugestao_conduta || ''
        };
      }));
    } catch (err) {
      console.error("Failed to fetch history", err);
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
        const sanitizeChecklist = (aiData: any) => {
          const baseData = currentRecord?.checklist_integrativo || { ...initialIntegrativeData };
          if (!aiData || typeof aiData !== 'object') return baseData;
          
          const sanitized: any = JSON.parse(JSON.stringify(baseData));
          const flatInput: Record<string, string> = {};
          
          const flatten = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            Object.entries(obj).forEach(([k, v]) => {
              if (typeof v === 'object' && v !== null) {
                flatten(v);
              } else if (v !== undefined && v !== null && v !== false) {
                const strV = String(v).trim().toLowerCase();
                // Filtro rigoroso contra lixo da IA
                if (strV !== 'null' && strV !== 'undefined' && strV !== 'false' && strV !== 'nan' && strV !== 'rejeitado' && strV !== 'não citado' && strV !== 'pendente') {
                  flatInput[k.toLowerCase()] = String(v);
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
              
              if (detectedValue) {
                sanitized[section][key] = detectedValue;
              }
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
          dados_clinicos: result.dados_clinicos || {},
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
          data_consulta: getLocalISODate()
        };
        
        setCurrentRecord(newRecord);
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

  const saveRecord = async () => {
    if (!currentRecord || !user) return;
    setIsSaving(true);
    setError(null);
    try {
      const cleanCPF = currentRecord.paciente_cpf ? String(currentRecord.paciente_cpf).replace(/\D/g, '') : null;
      
      // Define o médico responsável: Prioridade para o selecionado na agenda, fallback para o usuário atual
      const medicoIdToSave = selectedMedicoId || user.id;
      
      // Força a especialidade para 'Integrativa' se o modo for integrativo
      const especialidadeToSave = examMode === 'integrative' ? 'Integrativa' : currentRecord.especialidade;

      console.log("saveRecord - selectedPatientPhone (state):", selectedPatientPhone);
      console.log("saveRecord - medicoIdToSave:", medicoIdToSave);
      // Formata a data de nascimento para YYYY-MM-DD para manter consistência no banco
      let formattedBirthDate = currentRecord.paciente_data_nascimento;
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
        user_id: user.id, // O usuário que está salvando (pode ser recepcionista ou o próprio médico)
        profissional_responsavel: currentRecord.profissional_responsavel || user.full_name || user.email,
        paciente_nome_completo: currentRecord.paciente_nome_completo || selectedPatient || "Não Identificado",
        paciente_cpf: cleanCPF,
        paciente_data_nascimento: formattedBirthDate,
        especialidade: especialidadeToSave,
        paciente_status: currentRecord.paciente_status || 'Ativo',
        paciente_telefone: currentRecord.paciente_telefone || selectedPatientPhone,
        queixa_principal: currentRecord.queixa_principal,
        hipotese_diagnostica: currentRecord.hipotese_diagnostica,
        conduta_plano_terapeutico: currentRecord.conduta_plano_terapeutico,
        prescricao: currentRecord.prescricao,
        resumo_formatado: currentRecord.resumo_formatado,
        sugestao_conduta: currentRecord.sugestao_conduta,
        dados_clinicos: currentRecord.dados_clinicos,
        comparativo: currentRecord.comparativo,
        data_consulta: currentRecord.data_consulta || getLocalISODate(),
        created_at: new Date().toISOString() // Garante o timestamp de criação
      };

      // Adiciona campos específicos baseados no modo de exame
      // Limpar objetos vazios para não confundir a visualização do histórico
      if (examMode === 'neurological' || (currentRecord.exame_neurologico && hasMeaningfulData(currentRecord.exame_neurologico))) {
        recordToSave.exame_neurologico = currentRecord.exame_neurologico;
      }
      
      if (examMode === 'integrative' || (currentRecord.checklist_integrativo && hasMeaningfulData(currentRecord.checklist_integrativo))) {
        recordToSave.checklist_integrativo = currentRecord.checklist_integrativo;
      }
      // Sempre salvar mapeamento se existir, independente do modo
      if (currentRecord.mapeamento_corporal && currentRecord.mapeamento_corporal.length > 0) {
        recordToSave.mapeamento_corporal = currentRecord.mapeamento_corporal;
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

        // Garantir que mapeamento_corporal seja salvo DENTRO do JSON dados_especialidade e NÃO na raiz
        if (data.mapeamento_corporal) {
          payload.dados_especialidade = payload.dados_especialidade || {};
          payload.dados_especialidade.mapeamento_corporal = data.mapeamento_corporal;
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
      const { error: saveError } = await trySaveRecord(recordToSave);

        if (saveError) {
          console.error("Erro detalhado do Supabase ao salvar:", JSON.stringify(saveError, null, 2));
          let friendlyError = saveError.message || saveError.code || 'Erro desconhecido';
          
          if (friendlyError.includes('column') && friendlyError.includes('does not exist')) {
            friendlyError = `Erro de Schema: A coluna ${friendlyError.match(/"([^"]+)"/)?.[1] || ''} não existe no banco.`;
          }
          
          setError(`Erro ao salvar: ${friendlyError}`);
          toast.error(`Falha ao salvar: ${friendlyError}. Contate o suporte.`);
        } else {
        console.log("saveRecord - Sucesso ao salvar!");
        toast.success("Prontuário salvo com sucesso!");
        setSaveSuccess(true);
        setTimeout(() => {
          setCurrentRecord(null);
          setHasHistory(false);
          setSaveSuccess(false);
          fetchHistory();
          
          // Atualiza o status do agendamento se houver um ID selecionado
          if (selectedAppointmentId) {
            supabase.from('agendamentos').update({ status: 'Concluído' }).eq('id', selectedAppointmentId).then(({ error: upError }) => {
              if (upError) {
                // Tenta na tabela fallback se a primeira falhar
                supabase.from('appointments').update({ status: 'Concluído' }).eq('id', selectedAppointmentId).then(({ error: fallbackError }) => {
                  if (fallbackError) console.warn("Erro ao atualizar status fallback:", fallbackError);
                });
              }
            });
          }

          setSelectedPatient(null);
          setSelectedPatientPhone('');
          setSelectedAppointmentReason('');
          setSelectedAppointmentId(null);
          setShowDashboard(true); // Volta para o dashboard após salvar
        }, 2000);
      }
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
    // Generate date in Brazilian timezone to avoid UTC offset issues (e.g. 28 vs 29)
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Sao_Paulo', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      return formatter.format(new Date()); // Always returns YYYY-MM-DD
    } catch (e) {
      console.warn("Failed to format date with timezone", e);
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        doc.text(`Marcha: ${safeText(ex.marcha || 'N/A')}`, margin, currentY);
        currentY += 10;

        // Tabelas de Força e Sensibilidade
        if (ex.forca_muscular && typeof ex.forca_muscular === 'object') {
          const muscleData = Object.entries(ex.forca_muscular).map(([key, val]: [string, any]) => [
            key.toUpperCase(), safeText(val?.forca), safeText(val?.tonus), safeText(val?.trofismo), safeText(val?.mov_anormais || val?.mov_normais)
          ]).filter(row => row[1] || row[2] || row[3] || row[4]);

          if (muscleData.length > 0) {
            checkPageBreak(40);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 50, 100);
            doc.text("AVALIAÇÃO MOTORA (FORÇA, TÔNUS, TROFISMO):", margin, currentY);
            currentY += 6;
            autoTable(doc, {
              startY: currentY,
              head: [['Região', 'Força', 'Tônus', 'Trofismo', 'Mov. Anormais']],
              body: muscleData,
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
              headStyles: { fillColor: [240, 248, 255], textColor: [0, 50, 100], fontStyle: 'bold', lineWidth: 0.1 },
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
      if (record.dados_especialidade && Object.keys(record.dados_especialidade).length > 1) {
        const specDataStr = Object.entries(record.dados_especialidade)
          .filter(([k]) => k !== 'mapeamento_corporal')
          .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${safeText(v)}`)
          .join(' | ');

        if (specDataStr) {
          checkPageBreak(20);
          doc.setFontSize(12);
          doc.setTextColor(0, 50, 100);
          doc.text(`Dados de ${safeText(record.especialidade)}`, margin, currentY);
          currentY += 7;
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          const specLines = doc.splitTextToSize(specDataStr, contentWidth);
          doc.text(specLines, margin, currentY);
          currentY += (specLines.length * 5) + 10;
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
    <div className="min-h-screen clinical-grid flex flex-col">
      {/* Aviso de WebView / Microfone Bloqueado */}
      <AnimatePresence>
        {isWebView && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-white overflow-hidden sticky top-0 z-[60] shadow-lg"
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

      {/* Header */}
      <header className="border-b border-clinical-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => {
              setShowManageTeam(false);
              setShowAgenda(false);
              setShowHistory(false);
              setShowMessageHistory(false);
              setShowDashboard(true);
              setSelectedPatient(null);
            }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-clinical-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-clinical-blue/20 shrink-0">
              <Stethoscope size={20} className="sm:hidden" />
              <Stethoscope size={24} className="hidden sm:block" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="font-bold text-lg sm:text-xl tracking-tight leading-tight">Ambulatório IA</h1>
              <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold leading-tight">Gestão de Saúde Voluntária</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <div className="hidden md:flex flex-col items-end shrink-0">
              <span className="text-xs font-bold text-slate-700">{user?.full_name || user?.email}</span>
              <button onClick={handleLogout} className="text-[10px] text-red-500 font-bold uppercase tracking-wider hover:underline">Sair</button>
            </div>
            <div className="hidden md:block h-8 w-[1px] bg-slate-200 mx-2 shrink-0" />
            
            <div className="relative flex-1 overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">

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
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm",
                  showDashboard ? "bg-clinical-blue/10 text-clinical-blue" : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <Activity size={18} />
                <span className="hidden sm:inline">Dashboard</span>
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
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm",
                  (!showDashboard && !showAgenda && !showHistory && !showMessageHistory && !showManageTeam && !selectedPatient) ? "bg-clinical-blue/10 text-clinical-blue" : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <Mic size={18} />
                <span className="hidden sm:inline">Atendimento</span>
              </button>

              <button 
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 font-medium text-xs sm:text-sm"
                title="Ajuda e Guia do Usuário"
              >
                <HelpCircle size={18} className="text-clinical-blue" />
                <span className="hidden sm:inline">Ajuda</span>
              </button>

              {user?.role === 'admin' && (
                <>
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
                      "relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm",
                      showManageTeam ? "bg-clinical-blue/10 text-clinical-blue" : "hover:bg-slate-100 text-slate-600"
                    )}
                    title="Gerenciar Equipe"
                  >
                    <Users size={18} />
                    <span className="hidden sm:inline">Equipe</span>
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-bounce">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </>
              )}
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
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm",
                  showAgenda ? "bg-clinical-blue/10 text-clinical-blue" : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <Calendar size={18} />
                <span className="hidden sm:inline">{showAgenda ? 'Voltar' : 'Agenda'}</span>
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
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm",
                  showMessageHistory ? "bg-clinical-blue/10 text-clinical-blue" : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <MessageSquare size={18} />
                <span className="hidden sm:inline">{showMessageHistory ? 'Voltar' : 'Mensagens'}</span>
              </button>
              <button 
                onClick={() => {
                  setShowHistory(!showHistory);
                  setShowAgenda(false);
                  setShowMessageHistory(false);
                  setShowDashboard(false);
                  setShowManageTeam(false);
                  setSelectedPatient(null);
                }}
                className={cn(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm",
                  showHistory ? "bg-clinical-blue/10 text-clinical-blue" : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <History size={18} />
                <span className="hidden sm:inline">{showHistory ? 'Voltar' : 'Histórico'}</span>
              </button>
              <button 
                onClick={() => setShowClinicSettings(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 font-medium text-xs sm:text-sm"
                title="Configurações da Clínica"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Configurar PDF</span>
              </button>
              <button 
                onClick={() => setShowSystemOverview(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 font-medium text-xs sm:text-sm"
              >
                <Info size={18} />
                <span className="hidden sm:inline">Sobre</span>
              </button>
              <button onClick={handleLogout} className="md:hidden p-2 text-red-500 hover:bg-red-50 rounded-lg ml-1 shrink-0">
                <LogOut size={18} />
              </button>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
          </div>
        </div>
      </div>
    </header>

      <SystemOverviewModal 
        isOpen={showSystemOverview} 
        onClose={() => setShowSystemOverview(false)} 
        userId={user?.id || ''}
      />

      {/* Modal de Configurações da Clínica */}
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
            onStartConsultation={(paciente, telefone, motivo, medicoId, appointmentId) => {
            console.log("onStartConsultation - paciente:", paciente, "telefone:", telefone, "motivo:", motivo, "medicoId:", medicoId, "appointmentId:", appointmentId);
            setShowAgenda(false);
            setShowDashboard(false);
            setSelectedPatient(paciente);
            setSelectedPatientPhone(telefone || '');
            setSelectedAppointmentReason(motivo || '');
            setSelectedMedicoId(medicoId || null);
            setSelectedAppointmentId(appointmentId || null);
            setCurrentRecord(null);
            setExamMode('standard');
            setPrefillPatient(null);
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
                        placeholder="Buscar por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinical-blue/20 focus:border-clinical-blue w-full sm:w-64 transition-all"
                      />
                    </div>
                    <button 
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                    >
                      <Download size={18} />
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {history.length > 0 ? (
                    history.map((record) => (
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
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-pink-200 bg-pink-100 text-pink-700 shadow-sm animate-pulse">
                                    INTEGRATIVA
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
                                  // Garantia de carga do mapeamento seja da raiz (se existir coluna) ou do "baú" dados_especialidade
                                  mapeamento_corporal: (record.mapeamento_corporal && record.mapeamento_corporal.length > 0)
                                    ? record.mapeamento_corporal 
                                    : (record.dados_especialidade?.mapeamento_corporal || [])
                                };
                                console.log("LOG_VERSAO: 3.2 - Carregando mapeamento:", sanitizedRecord.mapeamento_corporal);
                                setCurrentRecord(sanitizedRecord);
                                setShowHistory(false);
                                if (record.especialidade?.toLowerCase().includes('neuro') || (record.exame_neurologico && hasMeaningfulData(record.exame_neurologico))) {
                                  setExamMode('neurological');
                                } else if (record.especialidade?.toLowerCase().includes('integrativa') || (record.checklist_integrativo && hasMeaningfulData(record.checklist_integrativo))) {
                                  setExamMode('integrative');
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
                    ))
                  ) : (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                        <Search size={32} />
                      </div>
                      <h3 className="font-bold text-slate-400">Nenhum registro encontrado</h3>
                      <p className="text-slate-400 text-sm">Tente buscar por outro nome ou CPF.</p>
                    </div>
                  )}
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
                {/* Sidebar Column: Recording & Tips (4/12) */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-clinical-border p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold">Ambulatório IA - v4.4</h2>
                    </div>

                    <div className="mb-8">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Especialidade do Atendimento</p>
                      <div className="flex bg-slate-100 p-1.5 rounded-2xl flex-wrap gap-1">
                        {SPECIALTIES.map((spec) => (
                          <button 
                            key={spec.id}
                            onClick={() => {
                              setExamMode(spec.id);
                              if (currentRecord) {
                                const updatedRecord = { ...currentRecord };
                                if (spec.id === 'neurological' && !updatedRecord.exame_neurologico) {
                                  updatedRecord.exame_neurologico = {};
                                }
                                if (spec.id === 'integrative' && !updatedRecord.checklist_integrativo) {
                                  updatedRecord.checklist_integrativo = { ...initialIntegrativeData };
                                }
                                updatedRecord.especialidade = stripEmojis(spec.name);
                                setCurrentRecord(updatedRecord);
                              }
                            }}
                            className={cn(
                              "flex-1 px-3 py-2 text-xs font-bold uppercase rounded-xl transition-all whitespace-nowrap min-w-[min-content]",
                              examMode === spec.id ? "bg-white text-clinical-blue shadow-sm border border-slate-200" : "text-slate-500 hover:text-blue-600 hover:bg-slate-200/50"
                            )}
                          >
                            {spec.name}
                          </button>
                        ))}
                      </div>
                      <p className="text-slate-500 text-xs mt-3 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {SPECIALTIES.find(s => s.id === examMode)?.description || "Grave o áudio do atendimento clínico."}
                      </p>
                    </div>
                    
                    {selectedPatient && (
                      <div className="mb-6 p-4 bg-clinical-blue/5 border border-clinical-blue/10 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="w-10 h-10 bg-clinical-blue/10 rounded-xl flex items-center justify-center text-clinical-blue">
                          <User size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-clinical-blue uppercase font-bold tracking-widest leading-none mb-1">Paciente Ativo</p>
                          <h3 className="font-bold text-slate-800">{selectedPatient}</h3>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedPatient(null);
                            setSelectedPatientPhone('');
                          }}
                          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <AnimatePresence mode="wait">
                        {isRecording ? (
                          <motion.div 
                            key="recording"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <button 
                              onClick={stopRecording}
                              className="relative mb-6 focus:outline-none"
                              aria-label="Parar gravação"
                            >
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 bg-red-500/20 rounded-full"
                              />
                              <div className="w-24 h-24 sm:w-20 sm:h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/30 relative z-10 hover:bg-red-600 transition-colors">
                                <Square size={32} fill="currentColor" />
                              </div>
                            </button>
                            <span className="text-red-500 font-bold animate-pulse mb-4 uppercase tracking-[0.2em] text-xs">Gravando...</span>
                            
                            {liveTranscript && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full max-w-[200px] p-4 bg-white/50 rounded-xl border border-slate-200 text-slate-600 text-[10px] italic text-center max-h-24 overflow-y-auto shadow-inner no-scrollbar"
                              >
                                "{liveTranscript}"
                              </motion.div>
                            )}
                          </motion.div>
                        ) : isProcessing ? (
                          <motion.div 
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <div className="relative mb-6">
                              <Loader2 className="w-16 h-16 text-clinical-blue animate-spin" />
                              <Activity className="absolute inset-0 m-auto text-clinical-blue/30" size={24} />
                            </div>
                            <span className="text-clinical-blue font-black tracking-widest text-[10px] uppercase">Analisando...</span>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <button 
                              onClick={startRecording}
                              className="w-20 h-20 bg-clinical-blue rounded-full flex items-center justify-center text-white shadow-xl shadow-clinical-blue/30 hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-clinical-blue/20"
                              aria-label="Iniciar gravação"
                            >
                              <Mic size={32} />
                            </button>
                            <span className="mt-6 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Clique para iniciar</span>
                            
                            {(examMode === 'integrative' || examMode === 'neurological') && (
                              <button 
                                onClick={() => {
                                  const baseEspec = examMode === 'integrative' ? 'Medicina Integrativa' : 'Neurologia';
                                  const tempRecord = {
                                    paciente_nome_completo: selectedPatient || 'Paciente Manual',
                                    paciente_cpf: '',
                                    paciente_telefone: selectedPatientPhone,
                                    paciente_status: 'Estável',
                                    especialidade: baseEspec,
                                    checklist_integrativo: examMode === 'integrative' ? { ...initialIntegrativeData } : undefined,
                                    exame_neurologico: examMode === 'neurological' ? {} : undefined,
                                    mapeamento_corporal: [],
                                    resumo_formatado: '',
                                    sugestao_conduta: '',
                                    data_consulta: getLocalISODate()
                                  };
                                  setCurrentRecord(tempRecord as any);
                                  setHasHistory(true);
                                  setShowDashboard(false);
                                }}
                                className="mt-8 flex items-center gap-2 text-clinical-blue font-bold hover:underline py-3 px-4 border border-clinical-blue/10 rounded-xl hover:bg-clinical-blue/5 transition-all text-xs"
                              >
                                <ClipboardList size={18} />
                                Abrir Checklist Manualmente
                              </button>
                            )}

                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Genérico Roteiro de Teste Demonstrativo (Moved outside so it stays visible while recording) */}
                    <div className="mt-8 mx-4 sm:mx-10 max-w-2xl mx-auto bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-indigo-900 animate-in slide-in-from-top-4 fade-in duration-300">
                      <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                        Roteiro de Teste (Leia no microfone para ver o poder da IA):
                      </h3>
                      <p className="text-xs sm:text-sm italic select-all cursor-pointer bg-white/50 p-4 rounded-xl border border-indigo-50/50 leading-relaxed text-justify">
                        {examMode === 'integrative' && '"O Paciente chama-se Carlos de Souza, 45 anos. Refere dor aguda nos dois joelhos, peso nas pernas e insônia frequente. Desejo manter a reposição de Vitamina D3 50.000 UI semanal. Adicionar Coenzima Q10 200mg, DHEA 25mg e também o fitoterápico Artemísia em gotas. Sinalizar déficit leve de Serotonina. Hipótese: Dores articulares e deficiências vitamínicas. Conduta: Administrar ibuprofeno para dores focais. Prescrição: Ibuprofeno 400mg, 1 comprimido pela manhã."'}
                        {examMode === 'neurological' && '"O Paciente chama-se Carlos de Souza, 45 anos. No exame neurológico ele apresenta fácies típica, atitude ativa e dominância destra. A marcha é normal. A fluência verbal é da classe 30 a 45. O teste cognitivo apresentou orientação temporal e espacial normais, memória imediata e repetição preservadas, atingindo um total de 28 na pontuação. Sensibilidade de toque na cabeça preservada. Sobre a área de dores do mapeamento, o paciente manifesta uma dor persistente na região lombar posterior. Hipótese: Lombalgia crônica."'}
                        {examMode !== 'integrative' && examMode !== 'neurological' && '"Paciente: João Silva, nascido em 10/05/1975. Queixa de dor de cabeça forte há 3 dias, acompanhada de dor na nuca e dor lombar. Pressão arterial 140 por 90. Hipótese: Cefaleia tensional e Lombalgia. Sugerido analgésico, repouso, e encaminhamento para fisioterapia. Prescrição: Paracetamol 750mg, tomar 1 comprimido a cada 8 horas."'}
                      </p>
                    </div>

                    {error && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                          </div>
                          <button 
                            onClick={() => setError(null)}
                            className="p-1 hover:bg-red-100 rounded-full transition-colors shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity className="text-clinical-blue" />
                      <h3 className="font-bold text-lg">Dicas de Uso</h3>
                    </div>
                    <ul className="space-y-4 text-sm text-slate-400">
                      <li className="flex gap-3">
                        <span className="text-clinical-blue font-mono">01</span>
                        <span>Inicie a gravação falando o <b>Nome, CPF e Data de Nascimento</b> do paciente.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-clinical-blue font-mono">02</span>
                        <span>Relate o atendimento naturalmente.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-clinical-blue font-mono">03</span>
                        <span>A IA identificará a especialidade e preencherá os campos.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Main Content Area: Results */}
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    {currentRecord ? (
                      <motion.div 
                        key="result"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        {/* Status Header */}
                        <div className="bg-white rounded-3xl border border-clinical-border p-8 shadow-sm">
                          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                            <h3 className="text-lg font-bold text-slate-800">Detalhes do Registro</h3>
                            
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => {
                                  setCurrentRecord(null);
                                  setHasHistory(false);
                                }}
                                className="flex items-center justify-center gap-2 bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                              >
                                <X size={16} />
                                Descartar
                              </button>
                              <button 
                                onClick={saveRecord}
                                disabled={isSaving || saveSuccess}
                                className={cn(
                                  "flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg",
                                  saveSuccess 
                                    ? "bg-emerald-100 text-emerald-600 border border-emerald-200" 
                                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                                )}
                              >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                {saveSuccess ? 'Salvo!' : isSaving ? 'Salvando...' : 'Salvar Registro'}
                              </button>
                            </div>
                          </div>

                          <div className="mt-8 flex items-start gap-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                              <User size={24} />
                            </div>
                            <div className="flex-1 w-full max-w-full overflow-hidden">
                                <input 
                                  type="text"
                                  value={currentRecord.paciente_nome_completo}
                                  onChange={(e) => setCurrentRecord({...currentRecord, paciente_nome_completo: e.target.value})}
                                  className="font-bold text-xl text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-clinical-blue focus:outline-none transition-colors w-full mb-2"
                                  placeholder="Nome do Paciente"
                                />
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                                  <div className="flex items-center gap-2 text-[10px] bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 shrink-0">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">CPF:</span>
                                    <input 
                                      type="text"
                                      value={currentRecord.paciente_cpf || ''}
                                      onChange={(e) => setCurrentRecord({...currentRecord, paciente_cpf: e.target.value})}
                                      className="font-mono font-bold text-slate-600 bg-transparent focus:outline-none w-24 sm:w-28"
                                      placeholder="000.000.000-00"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 shrink-0">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">Nasc:</span>
                                    <input 
                                      type="text"
                                      value={currentRecord.paciente_data_nascimento || ''}
                                      onChange={(e) => setCurrentRecord({...currentRecord, paciente_data_nascimento: e.target.value})}
                                      className="font-mono font-bold text-slate-600 bg-transparent focus:outline-none w-20 sm:w-24"
                                      placeholder="DD/MM/AAAA"
                                    />
                                  </div>
                                  <div className={cn("px-2 py-1 rounded-full text-[10px] font-bold border capitalize shrink-0", getStatusColor(currentRecord.paciente_status))}>
                                    {currentRecord.paciente_status}
                                  </div>
                                </div>
                            </div>
                          </div>
                        </div>

                        {/* Export Actions Bar */}
                        <div className="flex flex-wrap gap-4 mb-6">
                          <div className="flex bg-white rounded-2xl shadow-sm border border-slate-100 p-1">
                            <button 
                              onClick={() => generatePDF(currentRecord)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-xl transition-all text-xs font-bold text-slate-700"
                              title="Baixar Prontuário"
                            >
                              <FileText size={16} className="text-clinical-blue" />
                              PDF Atendimento
                            </button>
                            <button 
                              onClick={() => generatePDF(currentRecord, true)}
                              className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all"
                              title="WhatsApp"
                            >
                              <MessageSquare size={18} />
                            </button>
                          </div>

                          {(currentRecord.prescricao || currentRecord.checklist_integrativo) && (
                            <div className="flex bg-white rounded-2xl shadow-sm border border-slate-100 p-1">
                              <button 
                                onClick={() => generatePrescriptionPDF(currentRecord)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 rounded-xl transition-all text-xs font-bold text-indigo-700"
                                title="Baixar Receituário"
                              >
                                <FileText size={16} className="text-indigo-600" />
                                PDF Receita
                              </button>
                              <button 
                                onClick={() => generatePrescriptionPDF(currentRecord, true)}
                                className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all"
                                title="WhatsApp"
                              >
                                <MessageSquare size={18} />
                              </button>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => generateCSV(currentRecord)}
                            className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-clinical-blue transition-all"
                            title="CSV"
                          >
                            <Copy size={18} />
                          </button>
                        </div>

                        {/* Exam Specific Content */}
                        {examMode === 'integrative' ? (
                          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-white rounded-[2rem] border border-clinical-border p-8 shadow-sm w-full mx-auto">
                              <IntegrativeBodyMap 
                                data={currentRecord.mapeamento_corporal || []}
                                onChange={(newData) => setCurrentRecord({ ...currentRecord, mapeamento_corporal: newData })}
                              />
                            </div>
                            
                            <div className="space-y-8 w-full mx-auto">
                              <div className="bg-white rounded-[2rem] border border-clinical-border p-8 shadow-sm">
                                <IntegrativeEvolution 
                                  currentData={currentRecord.checklist_integrativo} 
                                  bodyMapData={currentRecord.mapeamento_corporal}
                                  historyRecords={(history || []).filter(h => 
                                    h && currentRecord && (
                                      // Se o registro atual tem ID, não comparamos com ele mesmo
                                      (!currentRecord.id || h.id !== currentRecord.id) &&
                                      (
                                        // Filtro rigoroso por CPF ou Nome (se o nome for longo o suficiente e não for genérico)
                                        (h.paciente_cpf && currentRecord.paciente_cpf && h.paciente_cpf === currentRecord.paciente_cpf) || 
                                        (h.paciente_nome_completo && currentRecord.paciente_nome_completo && 
                                         h.paciente_nome_completo.trim().toLowerCase() === currentRecord.paciente_nome_completo.trim().toLowerCase() &&
                                         currentRecord.paciente_nome_completo.length > 5 &&
                                         !['não identificado', 'paciente não identificado', 'atendimento', 'consulta'].includes(currentRecord.paciente_nome_completo.trim().toLowerCase()))
                                      )
                                    )
                                  )}
                                />
                              </div>
                              <div className="bg-white rounded-[2rem] border border-clinical-border p-8 shadow-sm overflow-x-auto">
                                <IntegrativeChecklistForm 
                                  data={currentRecord.checklist_integrativo}
                                  onChange={(newData) => setCurrentRecord({ ...currentRecord, checklist_integrativo: newData })}
                                  currentDate={currentRecord.id ? (currentRecord.data_consulta || currentRecord.created_at) : undefined}
                                  historyRecords={(history || []).filter(h => 
                                    h && currentRecord && (
                                      (!currentRecord.id || h.id !== currentRecord.id) &&
                                      (
                                        (h.paciente_cpf && currentRecord.paciente_cpf && h.paciente_cpf === currentRecord.paciente_cpf) || 
                                        (h.paciente_nome_completo && currentRecord.paciente_nome_completo && 
                                         h.paciente_nome_completo.trim().toLowerCase() === currentRecord.paciente_nome_completo.trim().toLowerCase() &&
                                         currentRecord.paciente_nome_completo.length > 5 &&
                                         !['não identificado', 'paciente não identificado', 'atendimento', 'consulta'].includes(currentRecord.paciente_nome_completo.trim().toLowerCase()))
                                      )
                                    )
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 w-full">
                            {/* Coluna Principal (Exames Estruturados & Mapeamento) */}
                            <div className="space-y-8 w-full">
                              
                              {/* Componentes Médicos Específicos (Neurologia / Especialidades) */}
                              {(examMode === 'neurological' || (currentRecord.exame_neurologico && hasMeaningfulData(currentRecord.exame_neurologico))) && (
                                <div className="space-y-8">
                                  <NeurologicalExamForm 
                                    data={currentRecord.exame_neurologico || {}} 
                                    onChange={(data) => setCurrentRecord({...currentRecord, exame_neurologico: data})}
                                  />
                                  
                                  {/* Body Map integrado no contexto Neurológico */}
                                  <div className="bg-white rounded-3xl border border-clinical-border p-4 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Activity size={20} />
                                      </div>
                                      Mapeamento de Sensibilidade e Dor (Neuro)
                                    </h3>
                                    <IntegrativeBodyMap 
                                      data={currentRecord.mapeamento_corporal || []} 
                                      onChange={(newData) => setCurrentRecord({...currentRecord, mapeamento_corporal: newData})}
                                    />
                                  </div>
                                </div>
                              )}

                              {currentRecord.dados_especialidade && examMode !== 'neurological' && (
                                <SpecialtyFields 
                                  specialtyId={examMode}
                                  data={currentRecord.dados_especialidade}
                                  onChange={(data) => {
                                    setSpecialtyData(data);
                                    setCurrentRecord(prev => ({ ...prev, dados_especialidade: data }));
                                  }}
                                />
                              )}

                              {/* Body Map Visível apenas no Modo Clínico Geral se houver queixas/dor marcadas */}
                              {examMode === 'standard' && currentRecord.mapeamento_corporal && currentRecord.mapeamento_corporal.length > 0 && (
                                <div className="bg-white rounded-[2rem] border border-clinical-border p-8 shadow-sm">
                                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                      <Activity size={20} />
                                    </div>
                                    Mapeamento de Queixas/Dor (Clínico)
                                  </h3>
                                  <IntegrativeBodyMap 
                                    data={currentRecord.mapeamento_corporal} 
                                    onChange={(newData) => setCurrentRecord({...currentRecord, mapeamento_corporal: newData})}
                                  />
                                </div>
                              )}

                              {/* Demais Dados Clínicos Diversos (Se houver) */}
                              {Object.entries(currentRecord.dados_clinicos || {}).length > 0 && examMode !== 'neurological' && (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(currentRecord.dados_clinicos || {}).map(([key, val]) => (
                                    val && val !== "null" && (
                                      <div key={key} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-clinical-blue/30 transition-all">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-1 group-hover:text-clinical-blue transition-colors">
                                          {key.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-sm font-mono font-bold text-slate-700 break-words">{String(val)}</span>
                                      </div>
                                    )
                                  ))}
                                </div>
                              )}

                              {/* Removido o Body Map para Especialidades Gerais, pois o usuário quer apenas nos modos neurológico e integrativo. */}

                              {/* Relato em Áudio/Mídia (Se houver) */}
                              {(() => {
                                const mediaUrl = currentRecord.midia_url;
                                const cleanUrl = mediaUrl?.trim() || '';
                                let detectedType = currentRecord.tipo_midia?.toLowerCase() || '';
                                
                                if (!detectedType && cleanUrl) {
                                  if (cleanUrl.startsWith('data:image') || cleanUrl.startsWith('iVBORw0KGgo') || cleanUrl.startsWith('/9j/') || cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
                                    detectedType = 'image';
                                  } else if (cleanUrl.startsWith('data:audio') || cleanUrl.includes('audio') || cleanUrl.length > 500) {
                                    detectedType = 'audio';
                                  }
                                }

                                const isImage = detectedType.includes('image') || detectedType.includes('imagem');
                                const isAudio = detectedType.includes('audio') || detectedType.includes('ptt');

                                if (!cleanUrl) return null;

                                return (
                                  <div className="bg-white rounded-3xl border border-clinical-border p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                      <Eye className="text-clinical-blue" size={20} />
                                      <h3 className="font-bold text-lg text-slate-800">Mídia Associada</h3>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      {isImage ? (
                                        <img 
                                          src={cleanUrl.startsWith('data:') ? cleanUrl : (cleanUrl.startsWith('http') ? cleanUrl : (cleanUrl.startsWith('iVBORw0KGgo') ? `data:image/png;base64,${cleanUrl}` : `data:image/jpeg;base64,${cleanUrl}`)) } 
                                          alt="Exame enviado pelo paciente" 
                                          className="max-w-full h-auto rounded-2xl shadow-sm border border-slate-200"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : isAudio ? (
                                        <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-3">
                                          <audio 
                                            src={cleanUrl.startsWith('data:') ? cleanUrl : (cleanUrl.startsWith('http') ? cleanUrl : `data:audio/ogg;base64,${cleanUrl}`)} 
                                            controls 
                                            className="w-full"
                                          >
                                            Seu navegador não suporta o player de áudio.
                                          </audio>
                                        </div>
                                      ) : (
                                        <a href="#" className="flex items-center gap-2 bg-clinical-blue text-white px-4 py-2 rounded-xl">
                                          Visualizar Anexo
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            {/* Section Secundária now moved below the ternary */}
                            </div>
                          </div>
                      )}
                      
                      {/* Seção Secundária (Resumos Textuais, Condutas e IA) COMUM A TODOS OS MODOS */}
                      <div className="w-full pt-8 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2 mt-8">
                        <div className="grid md:grid-cols-2 gap-6">

                            
                            {/* Alertas Copiloto (Topo da Coluna de Decisão, se houver) */}
                            {currentRecord.alertas_copiloto && currentRecord.alertas_copiloto.length > 0 && (
                              <div className="col-span-full bg-amber-50 rounded-3xl border border-amber-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                                      <Zap size={16} fill="currentColor" />
                                    </div>
                                    <h3 className="font-black text-amber-900 tracking-tight text-lg">COPILOTO IA</h3>
                                  </div>
                                  <button onClick={() => setCurrentRecord({ ...currentRecord, alertas_copiloto: [] })} className="text-amber-500 hover:bg-amber-100 p-1 rounded-lg">
                                    <X size={16} />
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  {currentRecord.alertas_copiloto.map((alerta, idx) => (
                                    <div key={idx} className="flex gap-3 bg-white/60 p-3 rounded-xl border border-amber-200/50 text-sm text-amber-900 font-medium">
                                      <Activity size={16} className="shrink-0 mt-0.5 text-amber-600" />
                                      {alerta}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Grid GERAL de Textos - Exibido em ALL MODES - RESTORING V4 ORIGINAL EXACT CARDS */}
                            
                            {/* Resumo do Atendimento */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <FileText className="text-clinical-blue" size={20} />
                                <h3 className="font-bold text-lg text-slate-800">Resumo do Atendimento</h3>
                              </div>
                              <p className="text-slate-600 leading-relaxed text-sm">
                                {currentRecord.resumo_formatado || currentRecord.queixa_principal || "Nenhum relato transcrito."}
                              </p>
                            </div>

                            {/* Conduta e Plano Terapêutico */}
                            {(currentRecord.conduta_plano_terapeutico || currentRecord.sugestao_conduta) && (
                              <div className="bg-emerald-50/70 rounded-3xl border border-emerald-100 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                  <Stethoscope className="text-emerald-600" size={20} />
                                  <h3 className="font-bold text-lg text-emerald-900">Conduta e Plano Terapêutico</h3>
                                </div>
                                <p className="text-emerald-800 font-medium leading-relaxed text-sm whitespace-pre-wrap">
                                  {currentRecord.conduta_plano_terapeutico || currentRecord.sugestao_conduta}
                                </p>
                              </div>
                            )}

                            {/* Hipótese Diagnóstica */}
                            {currentRecord.hipotese_diagnostica && (
                              <div className="bg-indigo-50/50 rounded-3xl border border-indigo-100 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                  <Activity className="text-indigo-600" size={20} />
                                  <h3 className="font-bold text-lg text-indigo-900">Hipótese Diagnóstica</h3>
                                </div>
                                <p className="text-indigo-800 font-medium leading-relaxed text-sm">
                                  {currentRecord.hipotese_diagnostica}
                                </p>
                              </div>
                            )}

                            {/* Prescrição / Receituário */}
                            {currentRecord.prescricao && (
                              <div className="bg-amber-50/50 rounded-3xl border border-amber-100 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                  <ClipboardList className="text-amber-600" size={20} />
                                  <h3 className="font-bold text-lg text-amber-900">Prescrição / Receituário</h3>
                                </div>
                                <div className="bg-white/80 p-4 rounded-xl border border-amber-100/50 text-amber-900 font-mono text-xs whitespace-pre-wrap">
                                  {currentRecord.prescricao}
                                </div>
                              </div>
                            )}

                            {/* Resumo Formatado */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <FileText className="text-slate-400" size={20} />
                                <h3 className="font-bold text-lg text-slate-800">Resumo Formatado</h3>
                              </div>
                              <p className="text-slate-600 leading-relaxed text-sm italic">
                                "{currentRecord.resumo_formatado || currentRecord.queixa_principal || "Nenhum relato transcrito."}"
                              </p>
                            </div>

                            {/* Hipótese Diagnóstica e Conduta Combinadas */}
                            {(currentRecord.hipotese_diagnostica || currentRecord.conduta_plano_terapeutico || currentRecord.prescricao) && (
                                <div className="bg-indigo-50/30 rounded-3xl border border-indigo-100 p-6 shadow-sm">
                                  <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle2 className="text-indigo-600" size={20} />
                                    <h3 className="font-bold text-lg text-indigo-900">Hipótese Diagnóstica e Conduta</h3>
                                  </div>
                                  <div className="space-y-4">
                                    {currentRecord.hipotese_diagnostica && (
                                      <div>
                                        <p className="text-indigo-900 font-bold text-sm mb-1">Hipótese:</p>
                                        <p className="text-indigo-800 text-sm">{currentRecord.hipotese_diagnostica}</p>
                                      </div>
                                    )}
                                    {(currentRecord.conduta_plano_terapeutico || currentRecord.sugestao_conduta) && (
                                      <div>
                                        <p className="text-indigo-900 font-bold text-sm mb-1">Conduta:</p>
                                        <p className="text-indigo-800 text-sm">{currentRecord.conduta_plano_terapeutico || currentRecord.sugestao_conduta}</p>
                                      </div>
                                    )}
                                    {currentRecord.prescricao && (
                                      <div>
                                        <p className="text-indigo-900 font-bold text-sm mb-1 flex items-center gap-2">
                                          <FileText size={14} /> Receituário / Prescrição
                                        </p>
                                        <p className="text-indigo-700 text-sm whitespace-pre-wrap">{currentRecord.prescricao}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                            )}

                            {/* Evolução IA */}
                            {currentRecord?.comparativo?.analise && (
                              <div className="col-span-full bg-slate-900 text-slate-50 rounded-3xl p-6 shadow-md">
                                <div className="flex items-center gap-3 mb-4">
                                  <TrendingUp className="text-indigo-400" size={20} />
                                  <h3 className="font-bold text-lg">Evolução do Caso</h3>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto no-scrollbar pr-2 mb-4">
                                  {currentRecord.comparativo.analise}
                                </p>
                                {currentRecord?.comparativo?.evolucao_percentual && (
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30">
                                    <TrendingUp size={14} />
                                    <span className="text-xs font-bold">{currentRecord.comparativo.evolucao_percentual}</span>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                        {/* ========================================= */}
                        {/* END OF V4.4 LAYOUT REORGANIZATION */}
                        {/* ========================================= */}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/50 rounded-3xl border border-dashed border-slate-300"
                      >
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                          <Activity size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Aguardando Dados</h3>
                        <p className="text-slate-400 text-sm max-w-xs">Os resultados da análise clínica aparecerão aqui após o processamento do áudio.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <footer className="p-8 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
        © 2026 Ambulatório IA • Tecnologia para Saúde Voluntária
      </footer>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-clinical-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-clinical-blue/20">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Guia do Ambulatório Digital</h2>
                    <p className="text-sm text-slate-500 font-medium">Como extrair o máximo da sua ferramenta de IA</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 sm:p-12">
                <div className="grid md:grid-cols-2 gap-12">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 text-clinical-blue">
                      <Zap size={20} />
                      <h3 className="font-bold text-lg">Como relatar (Passo a Passo)</h3>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-clinical-blue/10 text-clinical-blue flex items-center justify-center font-bold text-sm">1</div>
                        <p className="text-slate-600 text-sm leading-relaxed">Clique no botão de <strong>Microfone</strong> e dite os dados do paciente (Nome, CPF e Data de Nascimento).</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-clinical-blue/10 text-clinical-blue flex items-center justify-center font-bold text-sm">2</div>
                        <p className="text-slate-600 text-sm leading-relaxed">Relate o atendimento de forma natural. Fale sobre sintomas, exames realizados e valores (ex: Pressão 12 por 8).</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-clinical-blue/10 text-clinical-blue flex items-center justify-center font-bold text-sm">3</div>
                        <p className="text-slate-600 text-sm leading-relaxed">Clique em <strong>Parar</strong> e aguarde a IA processar. Em segundos, os dados estarão estruturados na tela.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-clinical-blue/10 text-clinical-blue flex items-center justify-center font-bold text-sm">4</div>
                        <p className="text-slate-600 text-sm leading-relaxed"><strong>Especialidades:</strong> Selecione o modo (Pediatria, Cardio, Psiquiatria, etc.) antes de gravar. A IA preencherá os campos específicos automaticamente.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">5</div>
                        <p className="text-slate-600 text-sm leading-relaxed"><strong>Mesclagem Inteligente:</strong> Você pode marcar itens manualmente no checklist antes do áudio. A IA irá apenas <strong>adicionar</strong> novas informações sem apagar o que você já marcou.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-amber-500 pt-6">
                      <Brain size={20} />
                      <h3 className="font-bold text-lg">Recursos Avançados (Copiloto IA)</h3>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 text-amber-500"><Crosshair size={18} /></div>
                        <p className="text-slate-600 text-sm leading-relaxed"><strong>Mapeamento Corporal (Bonecos Autoclicáveis):</strong> Ao ditar dores e sintomas, a IA identifica a região anatômica e plota pontos no Body Map com a queixa e localização, eliminando cliques manuais.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="mt-1 text-amber-500"><Clock size={18} /></div>
                        <p className="text-slate-600 text-sm leading-relaxed"><strong>Cronobiologia (Receituário por Períodos):</strong> Se você citar horários na prescrição ("Tome de manhã", "Antes de dormir"), a IA organiza o Receituário em blocos formatados com ícones, garantindo precisão cronológica.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="mt-1 text-amber-500"><Activity size={18} /></div>
                        <p className="text-slate-600 text-sm leading-relaxed"><strong>Copiloto IA de Sinergia:</strong> Na Especialidade Integrativa, a IA monitora as combinações de suplementos. O sistema exibe um alerta de "Anjo da Guarda" silencioso se notar riscos clássicos (ex: Zinco isolado depletando cobre).</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-clinical-blue pt-6">
                      <FileText size={20} />
                      <h3 className="font-bold text-lg">Exemplos Práticos</h3>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                        <h4 className="font-bold text-emerald-800 text-sm mb-1">Roteiro de Teste Rápido (3 em 1):</h4>
                        <p className="text-emerald-700 text-sm italic">
                          "Paciente Carlos, 45 anos. Apresenta dor no joelho esquerdo. Prescrição: Ibuprofeno 400mg."
                        </p>
                        <p className="text-[10px] text-emerald-600 mt-2">
                          * Este texto testa: Extração de nome/idade, Marcação no Boneco e Geração de Receita.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Modo Clínico (Geral)</h4>
                        <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                          "Paciente: João Silva, CPF 123.456.789-00, nascido em 10/05/1975. Queixa de dor de cabeça forte há 3 dias, acompanhada de náuseas. Pressão arterial 140 por 90, pulso 80. Sugiro analgésico e repouso."
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Modo Neurológico</h4>
                        <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                          "Paciente: Maria Oliveira, nascida em 20/03/1980. Exame neurológico: marcha atáxica, força muscular grau 4 em membros superiores, reflexo patelar diminuído à direita. Nervos cranianos sem alterações. Cognitivo preservado."
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Modo Psiquiatria</h4>
                        <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                          "Paciente: Roberto Souza. Relato: Humor deprimido há 2 semanas, insônia de manutenção. Em uso de Sertralina 50mg. Nega ideação suicida."
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Modo Integrativo</h4>
                        <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                          "Paciente: Carlos Lima, CPF 987.654.321-00. Relato integrativo: paciente com fadiga crônica, exames mostram Cortisol baixo e presença de Alumínio. Prescrevo Silimarina e Quercetina."
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-clinical-blue pt-6">
                      <FileText size={20} />
                      <h3 className="font-bold text-lg">Prontuários e Prescrições PDF</h3>
                    </div>
                    <div className="space-y-4 pt-2">
                      <p className="text-slate-600 text-sm leading-relaxed">O sistema permite a exportação de dados clínicos para facilitar a gestão do seu ambulatório.</p>
                      <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 ml-2">
                        <li><strong>Prontuários:</strong> Gere PDFs estruturados e profissionais. O título e o slogan mudam automaticamente conforme a especialidade (ex: Prontuário de Cardiologia).</li>
                        <li><strong>Prescrições:</strong> Ao gerar um resumo clínico via IA, o sistema extrai automaticamente a prescrição. O PDF da receita também se adapta à especialidade.</li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-3 text-clinical-blue pt-6">
                      <MessageSquare size={20} />
                      <h3 className="font-bold text-lg">Mídias e Caminho da Mensagem</h3>
                    </div>
                    <div className="space-y-4 pt-2">
                      <p className="text-slate-600 text-sm leading-relaxed">O sistema processa automaticamente <strong>imagens, áudios e chamadas</strong> enviados pelos pacientes via WhatsApp.</p>
                      <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 ml-2">
                        <li><strong>Imagens:</strong> Visualize exames e fotos diretamente no histórico.</li>
                        <li><strong>Áudios:</strong> Ouça relatos com o player integrado. Se um áudio não aparecer, use o botão de <strong>Atualizar</strong> no topo do chat.</li>
                        <li><strong>Chamadas:</strong> O sistema registra chamadas perdidas ou recebidas como eventos na conversa.</li>
                        <li><strong>Caminho da Mensagem:</strong> Toda comunicação é centralizada via API do WhatsApp. Se o paciente ligar ou enviar de um número novo, o sistema tentará identificar pelo telefone.</li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-3 text-clinical-blue pt-6">
                      <Zap size={20} />
                      <h3 className="font-bold text-lg">Automação de Lembretes (WhatsApp)</h3>
                    </div>
                    <div className="space-y-4 pt-2">
                      <p className="text-slate-600 text-sm leading-relaxed">O sistema verifica diariamente sua agenda e envia lembretes automáticos para os pacientes via WhatsApp.</p>
                      <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 ml-2">
                        <li>Identifica consultas do dia seguinte.</li>
                        <li>Envia mensagem personalizada automaticamente.</li>
                        <li>Marca o lembrete como enviado para evitar duplicidade.</li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-3 text-emerald-500 pt-6">
                      <ShieldCheck size={20} />
                      <h3 className="font-bold text-lg">Segurança, Banco de Dados e Acesso</h3>
                    </div>
                    <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50 space-y-4">
                      <div className="flex items-start gap-3">
                        <Info size={16} className="text-emerald-600 mt-1 flex-shrink-0" />
                        <p className="text-xs text-emerald-800 leading-relaxed"><strong>Banco de Dados em Nuvem:</strong> O sistema inteiro está conectado a um banco de dados seguro em nuvem. Isso significa que todos os prontuários, históricos de pacientes e evoluções clínicas ficam salvos permanentemente e podem ser acessados de qualquer dispositivo.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Info size={16} className="text-emerald-600 mt-1 flex-shrink-0" />
                        <p className="text-xs text-emerald-800 leading-relaxed"><strong>Autenticação (Fase de Degustação):</strong> Atualmente, o sistema permite o cadastro livre para fins de demonstração e degustação da tecnologia. Na versão oficial, o controle de acesso será centralizado, onde a administração fornecerá as credenciais (login e senha) diretamente aos profissionais autorizados, garantindo total controle e segurança hospitalar.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Search size={16} className="text-emerald-600 mt-1 flex-shrink-0" />
                        <p className="text-xs text-emerald-800 leading-relaxed">No <strong>Histórico</strong>, você pode buscar pacientes por nome ou CPF. O sistema organiza tudo em uma linha do tempo cronológica, puxando os dados diretamente do banco de dados.</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8">
                    <div className="bg-slate-50 rounded-[32px] p-8 space-y-6">
                      <h3 className="font-bold text-slate-800 flex items-center gap-3">
                        <ClipboardList size={20} className="text-slate-400" />
                        O que a IA oferece?
                      </h3>
                      <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-clinical-blue mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="block text-sm font-bold text-slate-700">Transcrição Inteligente</span>
                            <span className="text-xs text-slate-500">Converte sua voz em texto estruturado em tempo real para documentação rápida.</span>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-clinical-blue mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="block text-sm font-bold text-slate-700">Extração de Parâmetros</span>
                            <span className="text-xs text-slate-500">Identifica automaticamente Glicemia, Pressão, IMC, Peso e mais.</span>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-clinical-blue mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="block text-sm font-bold text-slate-700">Análise de Evolução</span>
                            <span className="text-xs text-slate-500">Compara os dados atuais com atendimentos anteriores do mesmo paciente.</span>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-clinical-blue mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="block text-sm font-bold text-slate-700">Sugestão de Conduta</span>
                            <span className="text-xs text-slate-500">Oferece uma segunda opinião clínica baseada nos dados extraídos.</span>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        <FileText size={18} />
                        Exportação Profissional
                      </h4>
                      <p className="text-indigo-100 text-xs leading-relaxed mb-4">
                        Todos os atendimentos podem ser exportados em PDF com um clique. O documento é formatado seguindo padrões médicos, pronto para ser anexado ou impresso.
                      </p>
                      <div className="pt-4 border-t border-indigo-500/30 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-80">
                        <span>Suporte à LGPD</span>
                        <span>Dados Criptografados</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="px-8 py-3 bg-clinical-blue text-white rounded-2xl font-bold shadow-lg shadow-clinical-blue/20 hover:scale-105 transition-transform"
                >
                  Entendi, vamos começar!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toaster position="top-right" />
    </div>
  );
}
