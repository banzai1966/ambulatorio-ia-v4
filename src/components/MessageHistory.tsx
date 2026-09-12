import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  MessageSquare, 
  ArrowLeft, 
  Paperclip, 
  Image as ImageIcon, 
  Loader2, 
  Play, 
  Pause, 
  Square, 
  Mic, 
  X, 
  Stethoscope, 
  Send, 
  RefreshCw, 
  Activity,
  ChevronRight,
  ChevronLeft,
  FileText,
  QrCode,
  UserPlus,
  Search,
  Check,
  CheckCheck,
  User,
  Phone,
  Calendar,
  Sparkles,
  Trash2
} from 'lucide-react';
import { sendWhatsAppMessage } from '../services/whatsappService';
import WhatsAppQRModal from './WhatsAppQRModal';

interface Message {
  id: number;
  created_at: string;
  telefone_cliente: string;
  mensagem: string;
  direcao: 'enviada' | 'recebida';
  midia_url?: string;
  tipo?: string;
  tipo_midia?: string;
}

export default function MessageHistory({ onSchedule, initialPhone }: { onSchedule: (name: string, phone: string) => void, initialPhone?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(initialPhone || null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [patientNamesMap, setPatientNamesMap] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [pendingMedia, setPendingMedia] = useState<{ base64: string, type: string, name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'message' | 'conversation';
    id?: number;
    phone?: string;
    name?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll para o final da conversa quando novas mensagens chegam
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, selectedPhone, activeTab]);

  useEffect(() => {
    if (isRecordingAudio) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecordingAudio]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTimestamp = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (initialPhone) {
      setSelectedPhone(initialPhone);
    }
  }, [initialPhone]);

  // Carrega mapeamento de nomes de pacientes
  const fetchPatientNames = async () => {
    try {
      const { data } = await supabase
        .from('prontuarios')
        .select('paciente_telefone, paciente_nome_completo');
      
      if (data && data.length > 0) {
        const map: Record<string, string> = {};
        data.forEach(p => {
          if (p.paciente_telefone && p.paciente_nome_completo) {
            const norm = normalizePhone(p.paciente_telefone);
            if (norm) map[norm] = p.paciente_nome_completo;
          }
        });
        setPatientNamesMap(map);
      }
    } catch (err) {
      console.error("Erro ao buscar mapa de nomes:", err);
    }
  };

  useEffect(() => {
    console.log("[IA] Supabase Config:", {
      url: import.meta.env.VITE_SUPABASE_URL ? "Configurada" : "AUSENTE",
      key: import.meta.env.VITE_SUPABASE_ANON_KEY ? "Configurada" : "AUSENTE"
    });
    
    fetchMessages();
    fetchPatientNames();
    
    // Ouvinte em tempo real para novas mensagens
    const channel = supabase
      .channel('public:mensagens')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        console.log('Nova mensagem em tempo real:', payload);
        setMessages(prev => {
          if (!payload.new || !payload.new.id) return prev;
          if (prev.some(m => m.id === payload.new.id)) return prev;
          const newMsg = payload.new as Message;
          return [...prev, newMsg];
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedPhone) {
      fetchPatientHistory(selectedPhone);
    } else {
      setPatientHistory([]);
    }
  }, [selectedPhone]);

  const fetchPatientHistory = async (phone: string) => {
    console.time(`[PERF] fetchPatientHistory-${phone}`);
    try {
      const cleanPhone = phone.split('@')[0];

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const allColumns = "id, paciente_nome_completo, paciente_cpf, paciente_data_nascimento, paciente_status, data_consulta, especialidade, resumo_formatado, sugestao_conduta, user_id, medico_id, profissional_responsavel, created_at, paciente_telefone";

      const tryFetch = async (cols: string, useFilter: boolean = true, attempt: number = 1): Promise<any> => {
        if (attempt > 10) throw new Error("Muitas tentativas de busca falharam devido a erros de schema.");
        
        try {
          let query = supabase.from('prontuarios').select(cols);
          
          if (useFilter && cols.includes('paciente_telefone')) {
            query = query.eq('paciente_telefone', cleanPhone);
          }

          if (cols.includes('data_consulta')) {
            query = query.order('data_consulta', { ascending: false });
          } else if (cols.includes('created_at')) {
            query = query.order('created_at', { ascending: false });
          }

          const { data, error } = await query;
          
          if (error) {
            const isColumnError = error.message.toLowerCase().includes('column') || 
                                 error.message.toLowerCase().includes('find the') ||
                                 error.message.toLowerCase().includes('not found') ||
                                 error.message.toLowerCase().includes('schema');

            if (isColumnError) {
              const missing = 
                error.message.match(/column "([^"]+)"/)?.[1] || 
                error.message.match(/find the '([^']+)' column/)?.[1] ||
                error.message.match(/column '([^']+)'/)?.[1];
              
              if (missing) {
                if (missing === 'paciente_telefone') {
                  return tryFetch(cols, false, attempt + 1);
                }
                const newCols = cols.split(',').map(c => c.trim()).filter(c => c !== missing).join(', ');
                if (newCols && newCols !== cols) return tryFetch(newCols, useFilter, attempt + 1);
              }
              if (useFilter) return tryFetch(cols, false, attempt + 1);
              if (cols !== 'id, paciente_nome_completo, resumo_formatado') {
                return tryFetch('id, paciente_nome_completo, resumo_formatado', false, attempt + 1);
              }
            }
            throw error;
          }
          return data;
        } catch (e: any) {
          if (attempt < 5 && (e.message?.includes('column') || e.message?.includes('schema'))) {
            return tryFetch('id, paciente_nome_completo, resumo_formatado', false, attempt + 1);
          }
          throw e;
        }
      };

      const data = await tryFetch(allColumns);
      
      setPatientHistory((data || []).map(r => {
        return {
          ...r,
          resumo_formatado: r.resumo_formatado || r.queixa_principal || '',
          sugestao_conduta: r.sugestao_conduta || r.conduta_plano_terapeutico || ''
        };
      }));
    } catch (err) {
      console.error("Erro ao buscar histórico do paciente:", err);
    } finally {
      console.timeEnd(`[PERF] fetchPatientHistory-${phone}`);
    }
  };

  const formatMediaUrl = (url: string | null, type: string) => {
    if (!url) return '';
    const cleanUrl = url.trim().replace(/\s/g, '');
    if (cleanUrl.startsWith('data:')) return cleanUrl;
    if (cleanUrl.startsWith('http')) return cleanUrl;
    
    if (cleanUrl.length > 50 && !cleanUrl.includes('.')) {
      if (type.toLowerCase().includes('imagem') || type.toLowerCase().includes('image')) {
        if (cleanUrl.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${cleanUrl}`;
        if (cleanUrl.startsWith('/9j/')) return `data:image/jpeg;base64,${cleanUrl}`;
        return `data:image/jpeg;base64,${cleanUrl}`;
      }
      if (type.toLowerCase().includes('audio')) {
        return `data:audio/ogg;base64,${cleanUrl}`;
      }
      if (type.toLowerCase().includes('document') || type.toLowerCase().includes('pdf')) {
        return `data:application/pdf;base64,${cleanUrl}`;
      }
    }
    return cleanUrl;
  };

  const cleanMessageText = (text: string | null) => {
    if (!text) return '';
    let processedText = text.trim();
    if (processedText.startsWith('{') && (processedText.includes('":') || processedText.includes('":'))) {
      try {
        const cleanJson = processedText.replace(/\\"/g, '"');
        const obj = JSON.parse(cleanJson);
        processedText = obj.conversation || obj.text || obj.message || processedText;
      } catch (e) {
        const match = processedText.match(/"conversation"\s*:\s*"([^"]+)"/);
        if (match) processedText = match[1];
      }
    }
    if (processedText.includes('{"') || processedText.includes('"}')) {
       processedText = processedText.replace(/\{.*"conversation":"([^"]+)".*\}/, '$1');
    }

    const lowerText = processedText.toLowerCase().trim();
    const genericTerms = ['mídia', 'midia', 'imagem', 'áudio', 'audio', 'video', 'arquivo', '[imagem recebida]', 'imagem recebida'];
    if (genericTerms.includes(lowerText)) return '';
    return processedText;
  };

  const normalizePhone = (phone: string | null | undefined) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  const fetchMessages = async (page = 0, pageSize = 50, showLoading = true) => {
    console.time(`[PERF] fetchMessages-${page}`);
    try {
      if (showLoading) setLoading(true);
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('mensagens')
        .select('id, created_at, telefone_cliente, mensagem, direcao, midia_url, tipo, tipo_midia')
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const reversedData = [...data].reverse();
        if (page === 0) {
          setMessages(reversedData);
        } else {
          setMessages(prev => [...reversedData, ...prev]);
        }
      } else {
        if (page === 0) setMessages([]);
      }
    } catch (err: any) {
      console.error("[IA] Erro ao buscar mensagens:", err);
      if (showLoading) toast.error(`Erro ao carregar mensagens: ${err.message || "Erro de conexão"}`);
    } finally {
      if (showLoading) setLoading(false);
      console.timeEnd(`[PERF] fetchMessages-${page}`);
    }
  };

  const contacts = useMemo(() => {
    if (messages.length === 0) return [];

    const normalizedMap = new Map<string, string>();
    const uniqueMessages = Array.from(new Map(messages.filter(m => m && m.id).map(m => [m.id, m])).values());
    
    uniqueMessages.forEach(m => {
      const norm = normalizePhone(m.telefone_cliente);
      const key = norm || m.telefone_cliente || 'desconhecido';
      if (!normalizedMap.has(key)) {
        normalizedMap.set(key, m.telefone_cliente || 'Sem Número');
      }
    });

    return Array.from(normalizedMap.keys()).map(normPhone => {
      const originalPhone = normalizedMap.get(normPhone)!;
      const contactMessages = uniqueMessages.filter(m => {
        const mNorm = normalizePhone(m.telefone_cliente);
        return (mNorm === normPhone) || (m.telefone_cliente === normPhone) || (!mNorm && !m.telefone_cliente && normPhone === 'desconhecido');
      });
      const lastMsg = contactMessages[contactMessages.length - 1];
      
      if (!lastMsg) return null;

      const tipo = (lastMsg.tipo || lastMsg.tipo_midia || '').toLowerCase();
      const mUrl = lastMsg.midia_url;
      const msgText = (lastMsg.mensagem || '').toLowerCase();
      
      let isImage = tipo.includes('image') || tipo.includes('imagem');
      let isAudio = tipo.includes('audio') || tipo.includes('ptt');
      
      if (!isImage && !isAudio && mUrl) {
        const urlLower = mUrl.toLowerCase();
        if (urlLower.includes('image') || urlLower.includes('data:image') || urlLower.match(/\.(jpg|jpeg|png|webp|gif)/)) isImage = true;
        if (urlLower.includes('audio') || urlLower.includes('data:audio') || urlLower.match(/\.(ogg|mp3|wav|m4a)/)) isAudio = true;
      }

      if (!isAudio && mUrl && (msgText.includes('áudio') || msgText.includes('audio'))) isAudio = true;
      
      const patientName = patientNamesMap[normPhone];

      return {
        phone: originalPhone,
        normPhone,
        patientName,
        lastMessage: lastMsg,
        displayType: isImage ? '📷 Imagem' : isAudio ? '🎵 Áudio' : 'Mensagem'
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => {
      const dateA = a?.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
      const dateB = b?.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [messages, patientNamesMap]);

  const handleReply = async (phone: string) => {
    if (isSendingMessage || (!replyText.trim() && !pendingMedia)) return;
    
    const sentMsgText = replyText.trim();
    const sentMedia = pendingMedia;

    setIsSendingMessage(true);
    try {
      // Adiciona otimisticamente na lista de mensagens
      const tempId = `temp_${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: tempId,
          telefone_cliente: phone,
          mensagem: sentMsgText || (sentMedia?.type === 'image' ? '[Imagem]' : '[Documento]'),
          direcao: 'enviada',
          created_at: new Date().toISOString(),
          lida: true,
          midia_url: sentMedia ? sentMedia.base64 : undefined,
          tipo: sentMedia ? 'media' : 'text',
          tipo_midia: sentMedia?.type
        }
      ]);

      await sendWhatsAppMessage(
        phone, 
        sentMsgText, 
        sentMedia?.base64, 
        sentMedia?.type, 
        sentMedia?.name
      );
      
      setReplyText('');
      setPendingMedia(null);
      toast.success("Mensagem enviada com sucesso!");
      setTimeout(() => fetchMessages(), 800);
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      const errorMessage = err.response?.data?.error || err.message || "Erro desconhecido";
      toast.error(`Erro ao enviar mensagem: ${errorMessage}`);
      fetchMessages();
    } finally {
      setIsSendingMessage(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPhone) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const isImage = file.type.startsWith('image');
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        
        setPendingMedia({
          base64,
          type: isImage ? 'image' : 'document',
          name: file.name
        });
        toast.success(`${isImage ? 'Imagem' : (isPdf ? 'PDF' : 'Documento')} pronto para envio.`);
      } catch (err) {
        console.error("Erro ao ler arquivo:", err);
        toast.error("Erro ao ler arquivo.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startRecordingAudio = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WEBVIEW_ERROR");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/ogg') 
          ? 'audio/ogg' 
          : '';

      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/ogg' });
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            setIsSendingMedia(true);
            const base64 = (reader.result as string).split(',')[1];
            await sendMediaToBackend(base64, 'audio', 'audio.ogg');
          } catch (err) {
            console.error("Erro ao processar áudio:", err);
            toast.error("Erro ao processar áudio.");
          } finally {
            setIsSendingMedia(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecordingAudio(true);
    } catch (err: any) {
      console.error("Erro ao acessar microfone:", err);
      toast.error("Permissão de microfone não concedida.");
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const sendMediaToBackend = async (base64: string, mediaType: string, fileName: string) => {
    if (!selectedPhone) return;
    try {
      await sendWhatsAppMessage(selectedPhone, '', base64, mediaType, fileName);
      fetchMessages();
      toast.success("Áudio enviado!");
    } catch (err: any) {
      console.error("Erro ao enviar mídia:", err);
      toast.error(`Erro ao enviar mídia: ${err.message}`);
    }
  };

  const handleDeleteMessage = (msgId: number) => {
    setDeleteTarget({
      type: 'message',
      id: msgId
    });
  };

  const handleDeleteConversation = (phone: string, name?: string) => {
    setDeleteTarget({
      type: 'conversation',
      phone,
      name: name || patientNamesMap[normalizePhone(phone)] || phone
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === 'message' && deleteTarget.id) {
        const msgId = deleteTarget.id;
        const { error } = await supabase.from('mensagens').delete().eq('id', msgId);
        if (error) throw error;

        setMessages(prev => prev.filter(m => m.id !== msgId));
        toast.success("Mensagem apagada com sucesso!");
      } else if (deleteTarget.type === 'conversation' && deleteTarget.phone) {
        const phone = deleteTarget.phone;
        const norm = normalizePhone(phone);

        const targetIds = messages
          .filter(m => {
            const mNorm = normalizePhone(m.telefone_cliente);
            return (mNorm && mNorm === norm) || m.telefone_cliente === phone;
          })
          .map(m => m.id);

        if (targetIds.length > 0) {
          const { error } = await supabase.from('mensagens').delete().in('id', targetIds);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('mensagens').delete().eq('telefone_cliente', phone);
          if (error) throw error;
        }

        setMessages(prev => prev.filter(m => {
          const mNorm = normalizePhone(m.telefone_cliente);
          return mNorm !== norm && m.telefone_cliente !== phone;
        }));

        if (selectedPhone === phone || (selectedPhone && normalizePhone(selectedPhone) === norm)) {
          setSelectedPhone(null);
        }

        toast.success("Conversa excluída com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro ao excluir:", err);
      toast.error(`Erro ao excluir: ${err.message || 'Falha ao processar a exclusão'}`);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Função para abrir nova conversa com qualquer número de telefone
  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    let clean = newChatPhone.replace(/\D/g, '');
    if (!clean) {
      toast.error("Digite um número de telefone válido.");
      return;
    }
    // Adiciona o DDI do Brasil (55) se o número tiver 10 ou 11 dígitos
    if ((clean.length === 10 || clean.length === 11) && !clean.startsWith('55')) {
      clean = '55' + clean;
    }

    if (newChatName.trim()) {
      setPatientNamesMap(prev => ({ ...prev, [clean]: newChatName.trim() }));
      try {
        await supabase.from('prontuarios').insert([{
          paciente_nome_completo: newChatName.trim(),
          paciente_telefone: clean,
          paciente_status: 'Novo Contato'
        }]);
      } catch (err) {
        console.warn("Aviso ao salvar nome temporário:", err);
      }
    }

    setSelectedPhone(clean);
    setIsNewChatModalOpen(false);
    setNewChatPhone('');
    setNewChatName('');
    toast.success(`Conversa aberta com ${clean}`);
  };

  if (loading && messages.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs h-[650px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-sm font-semibold">Carregando painel de mensagens...</p>
        </div>
      </div>
    );
  }

  const currentPatientName = patientHistory[0]?.paciente_nome_completo || (selectedPhone ? patientNamesMap[normalizePhone(selectedPhone)] : null) || selectedPhone;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex h-[680px] relative overflow-hidden font-sans">
      
      {/* PAINEL ESQUERDO: LISTA DE CONVERSAS */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200/70 flex flex-col bg-slate-50/50 ${selectedPhone ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Topo do Painel de Contatos */}
        <div className="p-3.5 bg-white border-b border-slate-200/70 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-900">Mensagens & WhatsApp</h2>
              <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Conectado
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
              title="Iniciar nova conversa com um telefone"
            >
              <UserPlus size={15} />
              <span className="hidden sm:inline">Nova</span>
            </button>
            
            <button 
              onClick={() => setIsQrModalOpen(true)}
              className="p-2 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-xl transition-all"
              title="QR Code / Status da Conexão"
            >
              <QrCode size={18} />
            </button>

            <button 
              onClick={() => {
                fetchMessages();
                fetchPatientNames();
              }} 
              className="p-2 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-xl transition-all"
              title="Atualizar conversas"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>

        {/* Barra de Busca de Pacientes */}
        <div className="p-2.5 bg-white border-b border-slate-100">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Lista Scrollável de Contatos */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
          {contacts.length === 0 && !loading && (
            <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <MessageSquare size={36} className="text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Nenhuma conversa recente</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Clique em "Nova" para digitar um número de WhatsApp.</p>
              <button 
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
              >
                + Iniciar Conversa
              </button>
            </div>
          )}

          {contacts
            .filter(c => 
              (c.phone || '').includes(searchTerm) || 
              (c.normPhone || '').includes(searchTerm) ||
              (c.patientName || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(contact => {
              const isSelected = normalizePhone(selectedPhone) === normalizePhone(contact.phone);
              const displayName = contact.patientName || contact.phone;
              const hasName = !!contact.patientName;
              const msgText = cleanMessageText(contact.lastMessage.mensagem) || contact.displayType;

              return (
                <div 
                  key={contact.phone}
                  onClick={() => setSelectedPhone(contact.phone)}
                  className={`p-3.5 cursor-pointer transition-all flex items-center gap-3 border-l-4 group ${
                    isSelected 
                      ? 'bg-blue-50/70 border-blue-600 font-semibold' 
                      : 'hover:bg-slate-50 border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {hasName ? displayName.charAt(0).toUpperCase() : <Phone size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-xs font-bold text-slate-800 truncate">{displayName}</h3>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {formatMessageTimestamp(contact.lastMessage.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      {contact.lastMessage.direcao === 'enviada' && (
                        <CheckCheck size={14} className="text-blue-600 shrink-0" />
                      )}
                      <p className="truncate text-slate-500 font-normal">{msgText}</p>
                    </div>

                    {hasName && (
                      <span className="text-[9px] text-slate-400 font-mono">{contact.phone}</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(contact.phone);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-200/60 rounded-lg shrink-0"
                    title="Excluir conversa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* PAINEL DIREITO: TELA DE CHAT & MENSAGENS */}
      <div className={`flex-1 flex flex-col bg-[#f8fafc] relative ${selectedPhone ? 'flex' : 'hidden md:flex items-center justify-center'}`}>
        
        {selectedPhone ? (
          <>
            {/* Cabeçalho da Conversa */}
            <div className="p-3 bg-white border-b border-slate-200/70 flex items-center justify-between z-10 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setSelectedPhone(null)} 
                  className="md:hidden p-1 text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                  {currentPatientName ? currentPatientName.charAt(0).toUpperCase() : <User size={16} />}
                </div>

                <div className="min-w-0">
                  <h2 className="font-extrabold text-xs text-slate-900 truncate">
                    {currentPatientName}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {selectedPhone} {patientHistory[0]?.paciente_cpf ? `• CPF: ${patientHistory[0].paciente_cpf}` : ''}
                  </p>
                </div>
              </div>

              {/* Botões do Topo do Chat */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold border border-slate-200/70">
                  <button 
                    onClick={() => setActiveTab('chat')} 
                    className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'chat' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Conversa
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')} 
                    className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Prontuário ({patientHistory.length})
                  </button>
                </div>

                <button 
                  onClick={() => onSchedule(currentPatientName || '', selectedPhone || '')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                  title="Criar agendamento para este paciente"
                >
                  <Calendar size={13} />
                  <span className="hidden sm:inline">Agendar</span>
                </button>

                <button 
                  onClick={() => handleDeleteConversation(selectedPhone)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Excluir todas as mensagens desta conversa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* ÁREA DE MENSAGENS (BALÕES REFINADOS) */}
            {activeTab === 'chat' ? (
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5 flex flex-col bg-[#f1f5f9]/70">
                
                <div className="mx-auto my-2 px-3.5 py-1 bg-white rounded-full border border-slate-200/80 text-[10px] font-bold text-slate-500 shadow-2xs">
                  Criptografia de ponta a ponta via Evolution WhatsApp API
                </div>

                {Array.from(new Map(messages.filter(m => m && m.id).map(m => [m.id, m])).values())
                  .filter(m => normalizePhone(m.telefone_cliente) === normalizePhone(selectedPhone))
                  .sort((a, b) => {
                    if (!a?.created_at || !b?.created_at) return 0;
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  })
                  .map(msg => {
                    const mUrl = msg.midia_url;
                    const mTipo = (msg.tipo || msg.tipo_midia || '').toLowerCase();
                    const msgText = (msg.mensagem || '').toLowerCase();
                    const isSent = msg.direcao === 'enviada';

                    let isImage = mTipo.includes('image') || mTipo.includes('imagem');
                    let isAudio = mTipo.includes('audio') || mTipo.includes('ptt');
                    let isDocument = mTipo.includes('document') || mTipo.includes('pdf') || mTipo.includes('application');
                    let isCall = mTipo.includes('call') || mTipo.includes('missed') || msgText.includes('chamada') || msgText.includes('ligação');

                    if (!isImage && !isAudio && !isDocument && mUrl) {
                      const urlLower = mUrl.toLowerCase();
                      const isBase64 = mUrl.length > 100 && !mUrl.includes('.');
                      
                      if (urlLower.includes('image') || urlLower.includes('data:image') || urlLower.match(/\.(jpg|jpeg|png|webp|gif)/)) {
                        isImage = true;
                      } else if (urlLower.includes('audio') || urlLower.includes('data:audio') || urlLower.includes('audio/ogg') || urlLower.match(/\.(ogg|mp3|wav|m4a)/)) {
                        isAudio = true;
                      } else if (urlLower.includes('pdf') || urlLower.includes('document') || urlLower.match(/\.(pdf|doc|docx)/)) {
                        isDocument = true;
                      } else if (isBase64) {
                        if (mUrl.startsWith('iVBORw0KGgo') || mUrl.startsWith('/9j/')) isImage = true;
                        else if (mUrl.startsWith('JVBERi0')) isDocument = true;
                        else if (mUrl.length > 500) isAudio = true;
                      }
                    }

                    if (!isAudio && mUrl && (msgText.includes('áudio') || msgText.includes('audio') || mTipo.includes('audio'))) isAudio = true;

                    return (
                      <div 
                        key={msg.id} 
                        className={`p-3.5 rounded-2xl text-xs max-w-[82%] sm:max-w-[70%] shadow-2xs relative group transition-all ${
                          isSent 
                            ? 'bg-[#eaf2fc] text-slate-900 self-end rounded-tr-none ml-auto border border-blue-200/90' 
                            : 'bg-white text-slate-800 self-start rounded-tl-none border border-slate-200/80'
                        }`}
                      >
                        {isCall ? (
                          <div className={`flex items-center gap-2 font-bold py-1 ${isSent ? 'text-blue-900' : 'text-red-600'}`}>
                            <Activity size={16} />
                            <span>Chamada {msgText.includes('missed') || mTipo.includes('missed') ? 'Perdida' : 'Recebida'}</span>
                            {msg.mensagem && <span className={`text-[10px] font-normal ${isSent ? 'text-slate-600' : 'text-slate-500'}`}>({msg.mensagem})</span>}
                          </div>
                        ) : mUrl && isImage ? (
                          <div className="flex flex-col gap-2">
                            <img 
                              src={formatMediaUrl(mUrl, 'image')} 
                              alt="" 
                              className="rounded-xl max-w-full h-auto cursor-pointer hover:opacity-95 transition-opacity min-h-[100px] bg-slate-100 object-cover"
                              onClick={() => window.open(formatMediaUrl(mUrl, 'image'), '_blank')}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Imagem+Indispon%C3%ADvel';
                              }}
                            />
                            {cleanMessageText(msg.mensagem) && (
                              <p className={`leading-relaxed font-normal ${isSent ? 'text-slate-900' : 'text-slate-800'}`}>{cleanMessageText(msg.mensagem)}</p>
                            )}
                          </div>
                        ) : mUrl && isDocument ? (
                          <div className="flex flex-col gap-2">
                            <a 
                              href={formatMediaUrl(mUrl, 'document')} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors border ${
                                isSent 
                                  ? 'bg-white/80 text-slate-900 hover:bg-white border-blue-200/80' 
                                  : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200/80'
                              }`}
                            >
                              <FileText size={22} className="text-blue-600 shrink-0" />
                              <span className="truncate max-w-[200px] font-semibold">{msg.mensagem && msg.mensagem !== '[Documento]' ? msg.mensagem : 'Documento / PDF'}</span>
                            </a>
                          </div>
                        ) : isAudio && mUrl && (mUrl.startsWith('http') || mUrl.length > 100) ? (
                          <div className="flex flex-col gap-1 min-w-[220px]">
                            <audio 
                              src={formatMediaUrl(mUrl, 'audio')} 
                              controls 
                              className="w-full h-9 rounded-lg"
                              preload="metadata"
                            >
                              Seu navegador não suporta o áudio.
                            </audio>
                            {cleanMessageText(msg.mensagem) && <p className="text-[10px] opacity-70 italic">{cleanMessageText(msg.mensagem)}</p>}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed font-normal">{cleanMessageText(msg.mensagem)}</p>
                        )}

                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isSent ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span>{formatMessageTimestamp(msg.created_at)}</span>
                          {isSent && <CheckCheck size={13} className="text-blue-600" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id);
                            }}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-black/5 ${isSent ? 'text-slate-400 hover:text-red-600' : 'text-slate-400 hover:text-red-600'}`}
                            title="Apagar esta mensagem"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* ABA DE PRONTUÁRIO & HISTÓRICO CLINICO DO PACIENTE */
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {patientHistory.length > 0 ? (
                  patientHistory.map(record => (
                    <div key={record.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-all">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                        <div className="font-extrabold text-xs text-slate-800">
                          {record.data_consulta ? new Date(record.data_consulta).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}) : 'Consulta'} - {record.especialidade || 'Atendimento'}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          {record.paciente_status || 'Realizado'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1.5 font-medium">
                        <Stethoscope size={13} className="text-blue-600" />
                        Médico: {record.profissional_responsavel || 'Não informado'}
                      </div>

                      <div className="text-xs text-slate-600 space-y-2">
                        {record.resumo_formatado && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-normal whitespace-pre-wrap">
                            <span className="font-bold text-slate-700 block mb-1">Resumo da Anamnese:</span>
                            {record.resumo_formatado}
                          </div>
                        )}
                        {record.sugestao_conduta && (
                          <div className="text-blue-950 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
                            <b className="font-bold">Conduta / Plano:</b> {record.sugestao_conduta}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <Stethoscope size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold">Nenhum prontuário registrado para este número</p>
                    <p className="text-[11px] text-slate-400 mt-1">Ao realizar atendimentos com este paciente, os prontuários aparecerão aqui automaticamente.</p>
                  </div>
                )}
              </div>
            )}

            {/* BARRA DE ENVIO DE MENSAGENS (FOOTER DO CHAT) */}
            <div className="p-3 bg-white border-t border-slate-200/70 flex flex-col gap-2">
              {pendingMedia && (
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-2xs">
                  {pendingMedia.type === 'image' ? (
                    <img src={`data:image/jpeg;base64,${pendingMedia.base64}`} alt="Preview" className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                      <FileText size={18} />
                    </div>
                  )}
                  <span className="text-xs text-slate-700 font-semibold flex-1 truncate">{pendingMedia.name}</span>
                  <button onClick={() => setPendingMedia(null)} className="p-1 text-slate-400 hover:text-red-500 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSendingMedia}
                  className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-all disabled:opacity-50 shrink-0"
                  title="Anexar foto ou arquivo"
                >
                  {isSendingMedia ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <Paperclip size={18} />}
                </button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleSendMedia}
                />

                {isRecordingAudio ? (
                  <div className="flex-1 flex items-center gap-3 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-700 font-bold flex-1">Gravando áudio: {formatTime(recordingTime)}</span>
                    <button onClick={stopRecordingAudio} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-xs">
                      <Square size={14} fill="currentColor" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReply(selectedPhone)}
                      className="flex-1 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Escreva uma mensagem..."
                    />
                    <button 
                      onClick={startRecordingAudio}
                      className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all shrink-0"
                      title="Gravar mensagem de áudio"
                    >
                      <Mic size={18} />
                    </button>
                  </>
                )}

                <button 
                  onClick={() => handleReply(selectedPhone)} 
                  disabled={isSendingMessage || isSendingMedia || isRecordingAudio || (!replyText.trim() && !pendingMedia)}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs transition-all shrink-0 active:scale-95"
                >
                  {(isSendingMessage || isSendingMedia) ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Tela Vazia quando nenhuma conversa é selecionada */
          <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-3 shadow-xs border border-blue-100">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">WhatsApp & Mensagens Ambulatório IA</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Selecione uma conversa ao lado ou clique no botão **"Nova"** para falar diretamente com qualquer número.
            </p>
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus size={15} />
              Iniciar Nova Conversa
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE INICIAR NOVA CONVERSA */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Nova Conversa WhatsApp</h3>
                  <p className="text-[11px] text-slate-500">Digite o número com DDD para abrir o chat</p>
                </div>
              </div>
              <button onClick={() => setIsNewChatModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartNewChat} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Telefone com DDD *
                </label>
                <input 
                  type="text"
                  placeholder="Ex: 11999998888 ou 5511999998888"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  autoFocus
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Dica: O código 55 (Brasil) será adicionado automaticamente se você não digitar.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome do Paciente / Contato (Opcional)
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Maria da Silva"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1"
                >
                  <MessageSquare size={14} />
                  Abrir Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {deleteTarget.type === 'message' ? 'Apagar Mensagem' : 'Apagar Conversa'}
                </h3>
                <p className="text-[11px] text-slate-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {deleteTarget.type === 'message' 
                ? 'Tem certeza de que deseja excluir esta mensagem do histórico?' 
                : `Tem certeza de que deseja apagar todo o histórico da conversa com ${deleteTarget.name || deleteTarget.phone}?`}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      <WhatsAppQRModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
    </div>
  );
}
