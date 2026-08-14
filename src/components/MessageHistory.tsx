import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  MessageSquare, 
  ArrowLeft, 
  Paperclip, 
  Image, 
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
  QrCode
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
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ base64: string, type: string, name: string } | null>(null);
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

  useEffect(() => {
    if (initialPhone) {
      setSelectedPhone(initialPhone);
    }
  }, [initialPhone]);

  useEffect(() => {
    console.log("[IA] Supabase Config:", {
      url: import.meta.env.VITE_SUPABASE_URL ? "Configurada" : "AUSENTE",
      key: import.meta.env.VITE_SUPABASE_ANON_KEY ? "Configurada" : "AUSENTE"
    });
    
    fetchMessages();
    
    // Ouvinte em tempo real para novas mensagens
    const channel = supabase
      .channel('public:mensagens')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        console.log('Nova mensagem em tempo real:', payload);
        // Adiciona a nova mensagem ao estado se ela ainda não estiver lá
        setMessages(prev => {
          if (!payload.new || !payload.new.id) return prev;
          if (prev.some(m => m.id === payload.new.id)) return prev;
          const newMsg = payload.new as Message;
          // Mantemos a ordem (antigas em cima, novas embaixo)
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
        
        console.log(`fetchPatientHistory (Tentativa ${attempt}): Colunas: ${cols.substring(0, 30)}... (Filtro: ${useFilter})`);
        
        try {
          // Tenta join com profiles apenas se cols incluir medico_id e for a tentativa inicial
          // Removido join problemático profiles:medico_id(full_name) que causa PGRST200
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
            console.warn(`fetchPatientHistory (Erro ${attempt}):`, error.message);
            
            // Se erro de coluna inexistente ou cache de schema
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
                console.log(`fetchPatientHistory: Removendo coluna problemática '${missing}'...`);
                
                if (missing === 'paciente_telefone') {
                  return tryFetch(cols, false, attempt + 1);
                }
                
                const newCols = cols.split(',').map(c => c.trim()).filter(c => c !== missing).join(', ');
                if (newCols && newCols !== cols) return tryFetch(newCols, useFilter, attempt + 1);
              }
              
              // Se não identificou a coluna mas deu erro de coluna, tenta sem filtro primeiro
              if (useFilter) return tryFetch(cols, false, attempt + 1);
              
              // Fallback para busca mínima se não identificou a coluna ou se newCols falhou
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

  // Função para normalizar a URL da mídia (remove espaços e garante o prefixo correto)
  const formatMediaUrl = (url: string | null, type: string) => {
    if (!url) return '';
    // Remove TODOS os espaços, quebras de linha e caracteres invisíveis do base64
    const cleanUrl = url.trim().replace(/\s/g, '');
    
    if (cleanUrl.startsWith('data:')) return cleanUrl;
    if (cleanUrl.startsWith('http')) return cleanUrl;
    
    // Se for um Base64 puro (comprido e sem pontos, que indicariam uma URL/arquivo), adiciona o prefixo
    if (cleanUrl.length > 50 && !cleanUrl.includes('.')) {
      if (type.toLowerCase().includes('imagem') || type.toLowerCase().includes('image')) {
        // Detecta se é PNG ou JPEG pelo início do base64
        if (cleanUrl.startsWith('iVBORw0KGgo')) {
          return `data:image/png;base64,${cleanUrl}`;
        }
        if (cleanUrl.startsWith('/9j/')) {
          return `data:image/jpeg;base64,${cleanUrl}`;
        }
        return `data:image/jpeg;base64,${cleanUrl}`;
      }
      if (type.toLowerCase().includes('audio')) {
        // WhatsApp áudio costuma ser ogg/opus
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
    // Remove lixo de JSON que às vezes vem da API (ex: {"conversation": "Olá"})
    if (processedText.startsWith('{') && (processedText.includes('":') || processedText.includes('":'))) {
      try {
        // Tenta limpar aspas extras ou caracteres de escape
        const cleanJson = processedText.replace(/\\"/g, '"');
        const obj = JSON.parse(cleanJson);
        processedText = obj.conversation || obj.text || obj.message || processedText;
      } catch (e) {
        // Fallback com Regex se o JSON estiver malformado
        const match = processedText.match(/"conversation"\s*:\s*"([^"]+)"/);
        if (match) processedText = match[1];
      }
    }

    // Se o texto ainda parecer um objeto JSON, tenta extrair o valor
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
      console.log(`[IA] Iniciando busca de mensagens (página ${page}, tamanho ${pageSize})...`);

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('mensagens')
        .select('id, created_at, telefone_cliente, mensagem, direcao, midia_url, tipo, tipo_midia')
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) {
        console.error("[IA] Erro do Supabase ao buscar mensagens:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`[IA] ${data.length} mensagens carregadas.`);
        
        // data vem ordenado por created_at DESC (mais novos primeiro)
        // Precisamos reverter para que fiquem em ordem cronológica (mais antigos primeiro)
        const reversedData = [...data].reverse();
        
        if (page === 0) {
          setMessages(reversedData);
        } else {
          // Se estivermos carregando páginas anteriores (mensagens mais antigas),
          // elas devem vir ANTES das mensagens que já temos.
          setMessages(prev => [...reversedData, ...prev]);
        }
      } else {
        console.log("[IA] Nenhum dado retornado ou lista vazia.");
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

    // Agrupa por telefone normalizado para evitar duplicatas
    const normalizedMap = new Map<string, string>(); // norm -> original
    
    // Deduplicação de mensagens por ID e conteúdo/tempo para a lista de contatos
    const uniqueMessages = Array.from(new Map(messages.filter(m => m && m.id).map(m => [m.id, m])).values());
    
    uniqueMessages.forEach(m => {
      const norm = normalizePhone(m.telefone_cliente);
      const key = norm || m.telefone_cliente || 'desconhecido';
      
      if (!normalizedMap.has(key)) {
        normalizedMap.set(key, m.telefone_cliente || 'Sem Número');
      }
    });

    console.log(`[IA] Gerando lista de contatos para ${normalizedMap.size} números únicos.`);

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
      
      return {
        phone: originalPhone,
        normPhone,
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
  }, [messages]);

  const handleReply = async (phone: string) => {
    if (isSendingMessage || (!replyText.trim() && !pendingMedia)) return;
    
    console.log(`[CHAT] 📤 Enviando resposta para ${phone}...`);
    setIsSendingMessage(true);
    try {
      await sendWhatsAppMessage(
        phone, 
        replyText, 
        pendingMedia?.base64, 
        pendingMedia?.type, 
        pendingMedia?.name
      );
      
      setReplyText('');
      setPendingMedia(null);
      // fetchMessages(); // Removido: O Supabase Realtime já adiciona a mensagem na tela automaticamente. Chamar isso causa duplicação visual.
      toast.success("Mensagem enviada!");
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      const errorMessage = err.response?.data?.error || err.message || "Erro desconhecido";
      toast.error(`Erro ao enviar mensagem: ${errorMessage}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("[CHAT] Arquivo selecionado:", file?.name, "Tipo:", file?.type);
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
        toast.success(`${isImage ? 'Imagem' : (isPdf ? 'PDF' : 'Documento')} "${file.name}" pronto para enviar.`);
      } catch (err) {
        console.error("Erro ao ler arquivo:", err);
        toast.error("Erro ao ler arquivo.");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Limpa o input para permitir selecionar o mesmo arquivo novamente
  };

  const startRecordingAudio = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WEBVIEW_ERROR");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Detectar formato suportado
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
          console.log("Audio chunk received:", event.data.size);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped, total chunks:", audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/ogg' });
        console.log("Audio blob created:", audioBlob.size);
        
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            setIsSendingMedia(true);
            const base64 = (reader.result as string).split(',')[1];
            await sendMediaToBackend(base64, 'audio', 'audio.ogg');
          } catch (err) {
            console.error("Erro ao processar áudio:", err);
            alert("Erro ao processar áudio.");
          } finally {
            setIsSendingMedia(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Coleta dados a cada 1 segundo
      setIsRecordingAudio(true);
      console.log("Recording started with mimeType:", mimeType || 'default');
    } catch (err: any) {
      console.error("Erro ao acessar microfone:", err);
      const errorName = err.name || '';
      const errorMessage = err.message || '';
      
      if (errorMessage === "WEBVIEW_ERROR") {
        toast.error("Microfone Bloqueado! Você está no navegador interno (WhatsApp/Instagram). Copie o link e cole diretamente no Chrome ou Safari para gravar áudios.");
      } else if (
        errorName === 'NotAllowedError' || 
        errorName === 'PermissionDeniedError' || 
        errorMessage.toLowerCase().includes('permission denied') ||
        errorMessage.toLowerCase().includes('permissão negada')
      ) {
        toast.error("Permissão de microfone negada. Clique no cadeado (🔒) na barra de endereços e ative o Microfone.");
      } else {
        toast.error(`Erro ao acessar microfone: ${errorMessage || 'Erro desconhecido'}`);
      }
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
      toast.success("Mídia enviada!");
    } catch (err: any) {
      console.error("Erro ao enviar mídia:", err);
      toast.error(`Erro ao enviar mídia: ${err.message}`);
    }
  };

  const syncContacts = async () => {
    try {
      const { data: allMessages } = await supabase.from('mensagens').select('telefone_cliente');
      const uniquePhones = Array.from(new Set(allMessages?.map(m => normalizePhone(m.telefone_cliente)) || []));
      
      for (const phone of uniquePhones) {
        const { data: existingPatient } = await supabase
          .from('prontuarios')
          .select('id')
          .eq('paciente_telefone', phone)
          .maybeSingle();

        if (!existingPatient) {
          await supabase.from('prontuarios').insert([{
            paciente_nome_completo: `Paciente (${phone})`,
            paciente_telefone: phone,
            paciente_status: 'Novo Contato'
          }]);
        }
      }
      alert("Sincronização concluída!");
      fetchMessages();
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
      alert("Erro ao sincronizar contatos.");
    }
  };

  const cleanupDuplicates = async () => {
    try {
      const { data: prontuarios } = await supabase.from('prontuarios').select('id, paciente_telefone');
      if (!prontuarios) return;

      const phoneMap = new Map<string, any[]>();
      prontuarios.forEach(p => {
        if (!p.paciente_telefone) return;
        const phone = normalizePhone(p.paciente_telefone);
        if (!phoneMap.has(phone)) phoneMap.set(phone, []);
        phoneMap.get(phone)?.push(p);
      });

      let deletedCount = 0;
      for (const [phone, patients] of phoneMap) {
        if (patients.length > 1) {
          // Mantém o primeiro, deleta o resto
          const toDelete = patients.slice(1);
          for (const p of toDelete) {
            await supabase.from('prontuarios').delete().eq('id', p.id);
            deletedCount++;
          }
        }
      }
      alert(`Limpeza concluída! ${deletedCount} duplicados removidos.`);
      fetchMessages();
    } catch (err) {
      console.error("Erro ao limpar duplicados:", err);
      alert("Erro ao limpar duplicados.");
    }
  };

  /*
  const handleGenerateSummary = async () => {
    if (!selectedPhone || messages.length === 0) return;
    
    setIsGeneratingSummary(true);
    setShowSummary(true);
    try {
      const filteredMessages = messages.filter(m => normalizePhone(m.telefone_cliente) === normalizePhone(selectedPhone));
      
      // Busca as mídias (áudios) para enviar para a IA se necessário
      const messagesWithMedia = await Promise.all(filteredMessages.map(async (m) => {
        const url = m.midia_url;
        const isAudio = (m.tipo_midia || m.tipo || '').toLowerCase().includes('audio') || 
                        (url && (url.includes('audio') || url.includes('ogg') || (url.length > 100 && !url.includes('.'))));
        
        if (isAudio && url) {
          // Se for base64, já temos o dado. Se for URL, precisaríamos baixar (mas vamos assumir base64 por enquanto)
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
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  */

  if (loading) return <div className="p-6">Carregando...</div>;

  const win = window as any;
  const apiKey = (win.process?.env?.API_KEY) || (win.API_KEY);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex h-[600px] relative overflow-hidden">
      {/* Lista de Contatos */}
      <div className={`w-1/3 border-r border-slate-100 overflow-y-auto ${selectedPhone ? 'hidden md:block' : 'w-full'}`}>
        <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span>Conversas</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all border border-emerald-200"
                title="Conectar WhatsApp via QR Code"
              >
                <QrCode size={14} />
                <span>Conectar QR</span>
              </button>
              <button 
                onClick={() => {
                  setLoading(true);
                  fetchMessages();
                }} 
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Atualizar conversas"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <input 
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded-lg text-sm font-normal"
          />
        </div>
        
        {contacts.length === 0 && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 m-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-2">Nenhuma conversa encontrada</h3>
            <p className="text-slate-500 text-sm max-w-xs mb-6">
              Não encontramos mensagens no banco de dados. Verifique se o seu número está conectado ou tente atualizar.
            </p>
            
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button 
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <QrCode size={18} />
                Conectar WhatsApp (QR Code)
              </button>

              <button 
                onClick={() => fetchMessages()}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Atualizar Mensagens
              </button>
              
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-left">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Diagnóstico</h4>
                <ul className="text-[10px] space-y-1 text-slate-500 font-mono">
                  <li>• Mensagens carregadas: {messages.length}</li>
                  <li>• Filtro atual: {searchTerm || 'Nenhum'}</li>
                  <li>• Sessão: {supabase.auth.getSession() ? 'Verificando...' : 'Inativa'}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {contacts.filter(c => (c.phone || '').includes(searchTerm) || (c.normPhone || '').includes(searchTerm)).map(contact => (
          <div 
            key={contact.phone}
            onClick={() => setSelectedPhone(contact.phone)}
            className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${normalizePhone(selectedPhone) === normalizePhone(contact.phone) ? 'bg-blue-50' : ''}`}
          >
            <div className="font-semibold text-sm">{contact.phone}</div>
            <div className="text-xs text-slate-500 truncate">
              {cleanMessageText(contact.lastMessage.mensagem) || contact.displayType}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Individual */}
      <div className={`flex-1 flex flex-col ${selectedPhone ? 'w-full' : 'hidden md:flex items-center justify-center text-slate-400'}`}>
        {selectedPhone ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <button onClick={() => setSelectedPhone(null)} className="md:hidden"><ArrowLeft size={20}/></button>
              <div className="flex-1">
                <div className="flex gap-4 mb-2 justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <button onClick={() => setActiveTab('chat')} className={`font-bold text-sm ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Chat</button>
                    <button onClick={() => setActiveTab('history')} className={`font-bold text-sm ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Histórico</button>
                    <button 
                      onClick={() => {
                        setLoading(true);
                        fetchMessages();
                      }} 
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Atualizar mensagens"
                    >
                      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <button 
                    onClick={() => onSchedule(patientHistory[0]?.paciente_nome_completo || selectedPhone || '', selectedPhone || '')}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Agendar
                  </button>
                </div>
                {activeTab === 'chat' && (
                  <>
                    <h2 className="font-bold text-slate-800">{patientHistory[0]?.paciente_nome_completo || selectedPhone}</h2>
                    {patientHistory.length > 0 && (
                      <p className="text-xs text-slate-500">CPF: {patientHistory[0].paciente_cpf || 'Não informado'}</p>
                    )}
                  </>
                )}
              </div>
            </div>
            {activeTab === 'chat' ? (
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
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
                  
                  let isImage = mTipo.includes('image') || mTipo.includes('imagem');
                  let isAudio = mTipo.includes('audio') || mTipo.includes('ptt');
                  let isDocument = mTipo.includes('document') || mTipo.includes('pdf') || mTipo.includes('application');
                  let isCall = mTipo.includes('call') || mTipo.includes('missed') || msgText.includes('chamada') || msgText.includes('ligação');

                  // Fallback para detecção de mídia (especialmente base64 sem prefixo)
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
                      // Se for base64 e não identificou, tenta pelo cabeçalho
                      if (mUrl.startsWith('iVBORw0KGgo') || mUrl.startsWith('/9j/')) isImage = true;
                      else if (mUrl.startsWith('JVBERi0')) isDocument = true; // PDF base64 magic number
                      else if (mUrl.length > 500) isAudio = true; // Heurística: áudios costumam ser maiores que ícones mas menores que fotos HD
                    }
                  }

                  // Fallback por texto
                  if (!isAudio && mUrl && (msgText.includes('áudio') || msgText.includes('audio') || mTipo.includes('audio'))) isAudio = true;

                  return (
                    <div key={msg.id} className={`p-3 rounded-lg text-sm max-w-[80%] ${msg.direcao === 'recebida' ? 'bg-blue-100 self-start' : 'bg-slate-100 self-end ml-auto'}`}>
                      {isCall ? (
                        <div className="flex items-center gap-2 text-red-600 font-bold py-1">
                          <Activity size={16} />
                          <span>Chamada {msgText.includes('missed') || mTipo.includes('missed') ? 'Perdida' : 'Recebida'}</span>
                          {msg.mensagem && <span className="text-[10px] font-normal text-slate-500">({msg.mensagem})</span>}
                        </div>
                      ) : mUrl && isImage ? (
                        <div className="flex flex-col gap-2">
                          <img 
                            src={formatMediaUrl(mUrl, 'image')} 
                            alt="" 
                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity min-h-[100px] bg-slate-200 flex items-center justify-center"
                            onClick={() => window.open(formatMediaUrl(mUrl, 'image'), '_blank')}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Imagem+Indispon%C3%ADvel';
                            }}
                          />
                          {cleanMessageText(msg.mensagem) && (
                            <p>{cleanMessageText(msg.mensagem)}</p>
                          )}
                        </div>
                      ) : mUrl && isDocument ? (
                        <div className="flex flex-col gap-2">
                          <a 
                            href={formatMediaUrl(mUrl, 'document')} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white/50 p-2 rounded hover:bg-white/80 transition-colors border border-slate-200"
                          >
                            <FileText size={20} className="text-blue-600 shrink-0" />
                            <span className="truncate max-w-[200px] font-medium">{msg.mensagem && msg.mensagem !== '[Documento]' ? msg.mensagem : 'Documento / PDF'}</span>
                          </a>
                        </div>
                      ) : isAudio && mUrl && (mUrl.startsWith('http') || mUrl.length > 100) ? (
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <audio 
                            src={formatMediaUrl(mUrl, 'audio')} 
                            controls 
                            className="w-full h-10"
                            preload="metadata"
                          >
                            Seu navegador não suporta o player de áudio.
                          </audio>
                          <div className="flex justify-between items-center">
                            {cleanMessageText(msg.mensagem) && <p className="text-[10px] opacity-70 italic">{cleanMessageText(msg.mensagem)}</p>}
                          </div>
                        </div>
                      ) : (
                        cleanMessageText(msg.mensagem)
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {patientHistory.length > 0 ? (
                  patientHistory.map(record => (
                    <div key={record.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-clinical-blue/20 transition-colors">
                      <div className="font-bold text-sm text-slate-800">
                        {record.data_consulta ? new Date(record.data_consulta).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}) : 'Sem data'} - {record.especialidade}
                      </div>
                      <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
                        <Stethoscope size={12} />
                        Médico: {record.profiles?.full_name || record.profissional_responsavel || 'Não informado'}
                      </div>
                      <div className="text-xs text-slate-600 space-y-2">
                        {record.resumo_formatado && (
                          <p className="font-medium bg-white/60 p-2 rounded border border-slate-100 whitespace-pre-wrap">{record.resumo_formatado}</p>
                        )}
                        {record.hipotese_diagnostica && (
                          <p className="text-indigo-700 bg-indigo-50/50 p-2 rounded border border-indigo-100/30"><b>Hipótese:</b> {record.hipotese_diagnostica}</p>
                        )}
                        {record.sugestao_conduta && (
                          <p className="text-emerald-700 bg-emerald-50/50 p-2 rounded border border-emerald-100/30"><b>Conduta:</b> {record.sugestao_conduta}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhum histórico encontrado.</p>
                )}
              </div>
            )}
            <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
              {pendingMedia && (
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg">
                  {pendingMedia.type === 'image' ? (
                    <img src={`data:image/jpeg;base64,${pendingMedia.base64}`} alt="Preview" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                      <FileText size={20} />
                    </div>
                  )}
                  <span className="text-xs text-slate-600 flex-1 truncate">{pendingMedia.name}</span>
                  <button onClick={() => setPendingMedia(null)} className="text-slate-500 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <div className="flex items-center">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSendingMedia}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 disabled:opacity-50"
                    title="Anexar arquivo ou imagem"
                  >
                    {isSendingMedia ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={handleSendMedia}
                  />
                </div>
                
                {isRecordingAudio ? (
                  <div className="flex-1 flex items-center gap-3 bg-red-50 p-2 rounded-lg border border-red-100">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-600 font-bold flex-1">Gravando: {formatTime(recordingTime)}</span>
                    <button onClick={stopRecordingAudio} className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                      <Square size={14} fill="currentColor" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReply(selectedPhone)}
                      className="flex-1 p-2 border rounded-lg text-sm"
                      placeholder="Responder..."
                    />
                    <button 
                      onClick={startRecordingAudio}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                      title="Gravar áudio"
                    >
                      <Mic size={20} />
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => handleReply(selectedPhone)} 
                  disabled={isSendingMessage || isSendingMedia || isRecordingAudio || (!replyText.trim() && !pendingMedia)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(isSendingMessage || isSendingMedia) ? <Loader2 size={16} className="animate-spin" /> : 'Enviar'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <MessageSquare size={48} className="mx-auto text-slate-300 mb-2" />
            <p>Selecione uma conversa</p>
          </div>
        )}
      </div>

      <WhatsAppQRModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
    </div>
  );
}
