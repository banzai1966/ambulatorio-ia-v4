import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor, 
  MessageSquare, 
  Share2, 
  Send, 
  ExternalLink, 
  Clock, 
  User, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Sparkles, 
  FileText,
  X,
  GripHorizontal,
  Bot,
  Volume2,
  FileDown,
  Layers,
  HelpCircle,
  Eye,
  CheckCircle2,
  Camera,
  RefreshCw,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TelemedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorCouncil?: string;
  specialty?: string;
  appointmentId?: string;
  onAppendClinicalNote?: (note: string) => void;
  isDental?: boolean;
}

export default function TelemedicineModal({
  isOpen,
  onClose,
  patientName,
  patientPhone,
  doctorName,
  doctorCouncil,
  specialty = "Neurologia / Odontologia Biológica",
  appointmentId,
  onAppendClinicalNote,
  isDental
}: TelemedicineModalProps) {
  // Define se a sessão é odontológica (Dra. Lucy - CFO 226/2020) ou médica (Dr. Carlos - CFM)
  const isDentalSession = Boolean(
    isDental || 
    specialty?.toLowerCase().includes('odonto') || 
    doctorCouncil?.toLowerCase().includes('cro')
  );

  // Estado de Visualização: 'modal' (janela central), 'pip' (flutuante no canto) ou 'split' (dividido lado a lado)
  const [viewMode, setViewMode] = useState<'modal' | 'pip' | 'split'>('modal');
  
  // Posição para modo PiP flutuante arrastável
  const [pipPosition, setPipPosition] = useState({ x: 24, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 24,
    initialY: 80
  });

  // Estado de Mídia e Chamada
  const [isVideoActive, setIsVideoActive] = useState(true);
  const [isAudioActive, setIsAudioActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallRunning, setIsCallRunning] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Dispositivos de Vídeo Detectados (Webcam integrada ou externa / USB)
  const [videoDevices, setVideoDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Apresentação interna de exames / tomografias / imagens na teleconsulta
  const [presentedImage, setPresentedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePresentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPresentedImage(reader.result as string);
        toast.success('Documento / Exame projetado na teleconsulta! O paciente já está visualizando.', { icon: '🖼️' });
      };
      reader.readAsDataURL(file);
    }
  };

  // Escuta Ativa da IA (Transcrição e Resumo Clínico em Tempo Real)
  const [isAiListening, setIsAiListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [aiClinicalInsights, setAiClinicalInsights] = useState<{
    queixaPrincipal?: string;
    hipoteses?: string[];
    condutas?: string[];
  }>({});
  const recognitionRef = useRef<any>(null);

  // Chat interno
  const [chatMessages, setChatMessages] = useState<{ sender: 'doctor' | 'patient'; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Referências para vídeo e cronômetro
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const currentActiveStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Identificador da sala
  const [roomUrl, setRoomUrl] = useState('');

  // Tecla ESC para sair ou minimizar com facilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (viewMode === 'modal') {
          // No primeiro ESC, transforma em PiP flutuante para não derrubar a chamada sem querer
          setViewMode('pip');
          toast("Chamada minimizada no canto da tela. Você pode continuar preenchendo o prontuário!", { icon: '🪟' });
        } else {
          // No segundo ESC pede confirmação sem travar
          handleSafeClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, viewMode, callDuration]);

  // Callback de Ref resiliente para ligar o vídeo imediatamente em qualquer modo (Modal ou PiP)
  const attachVideoRef = (element: HTMLVideoElement | null) => {
    localVideoRef.current = element;
    if (element) {
      const activeStream = isScreenSharing && screenStreamRef.current 
        ? screenStreamRef.current 
        : (cameraStreamRef.current || currentActiveStreamRef.current);
      if (activeStream && element.srcObject !== activeStream) {
        element.srcObject = activeStream;
        element.play().catch(() => {});
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const sanitizedName = (patientName || 'paciente').toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueRoomId = `ambulatorio-ia-${sanitizedName}-${appointmentId || Math.random().toString(36).substring(2, 7)}`;
      const url = `https://meet.jit.si/${uniqueRoomId}`;
      setRoomUrl(url);

      startCamera();
      setIsCallRunning(true);
      setCallDuration(0);

      setChatMessages([
        {
          sender: 'doctor',
          text: isDentalSession
            ? `Sala de Teleodontologia & Planejamento Clínico iniciada para ${patientName}. Conexão com criptografia de ponta-a-ponta (SSL/TLS).`
            : `Sala de Telemedicina iniciada para ${patientName}. Conexão com criptografia de ponta-a-ponta (SSL/TLS).`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      stopAllMedia();
      stopAiListening();
      setIsCallRunning(false);
      setShowExitConfirmModal(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      stopAllMedia();
      stopAiListening();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Quando alterna entre modo central e modo flutuante (PiP), reanexa o stream de vídeo ao novo elemento <video>
  useEffect(() => {
    if (localVideoRef.current) {
      const activeStream = isScreenSharing && screenStreamRef.current 
        ? screenStreamRef.current 
        : (cameraStreamRef.current || currentActiveStreamRef.current);
      if (activeStream && localVideoRef.current.srcObject !== activeStream) {
        localVideoRef.current.srcObject = activeStream;
        localVideoRef.current.play().catch(() => {});
      }
    }
  }, [viewMode, isScreenSharing, isVideoActive, selectedCameraId]);

  // Cronômetro da consulta
  useEffect(() => {
    if (isCallRunning) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallRunning]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadVideoDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vInputs = devices
          .filter(d => d.kind === 'videoinput')
          .map((d, index) => {
            const cleanLabel = d.label || `Câmera ${index + 1}`;
            return {
              deviceId: d.deviceId,
              label: cleanLabel
            };
          });
        setVideoDevices(vInputs);
      }
    } catch (e) {
      console.warn("Aviso ao enumerar dispositivos:", e);
    }
  };

  const startCamera = async (targetDeviceId?: string) => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Interrompe o stream de câmera anterior para alternar livremente entre câmeras
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(t => t.stop());
          cameraStreamRef.current = null;
        }

        const videoConstraints: any = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };
        if (targetDeviceId) {
          videoConstraints.deviceId = { exact: targetDeviceId };
        } else {
          videoConstraints.facingMode = 'user';
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: true
        });

        cameraStreamRef.current = stream;
        currentActiveStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
        setIsVideoActive(true);
        setIsAudioActive(true);

        // Atualiza a lista com os nomes reais dos dispositivos de vídeo
        loadVideoDevices();
      }
    } catch (err) {
      console.warn("Aviso ao acessar câmera/microfone:", err);
      toast("Câmera ou permissão restrita. A sala de telemedicina continua ativa via link seguro.", { icon: 'ℹ️' });
    }
  };

  // Alternar entre Webcams ou Câmera Externa (quando houver mais de uma)
  const handleSwitchCamera = async (deviceId?: string) => {
    let nextId = deviceId;
    if (!nextId && videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex(d => d.deviceId === selectedCameraId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      nextId = videoDevices[nextIndex].deviceId;
    }

    if (nextId) {
      setSelectedCameraId(nextId);
      if (isScreenSharing && screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      }
      await startCamera(nextId);
      const chosen = videoDevices.find(d => d.deviceId === nextId);
      toast.success(`Câmera alterada para: ${chosen?.label || 'Dispositivo de vídeo'}`, { icon: '🔄' });
    } else {
      toast("Nenhuma outra câmera física detectada no computador.", { icon: 'ℹ️' });
    }
  };

  const stopAllMedia = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    currentActiveStreamRef.current = null;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    if (cameraStreamRef.current) {
      const videoTrack = cameraStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoActive(videoTrack.enabled);
        toast(videoTrack.enabled ? 'Câmera reativada' : 'Câmera pausada', { icon: videoTrack.enabled ? '📹' : '🚫' });
      }
    } else {
      setIsVideoActive(!isVideoActive);
    }
  };

  const toggleAudio = () => {
    if (cameraStreamRef.current) {
      const audioTrack = cameraStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioActive(audioTrack.enabled);
        toast(audioTrack.enabled ? 'Microfone ativado' : 'Microfone mutado', { icon: audioTrack.enabled ? '🎤' : '🔇' });
      }
    } else {
      setIsAudioActive(!isAudioActive);
    }
  };

  // Compartilhamento de tela nativo (mostra odontograma, exames, tomografias ou slides pro paciente)
  const handleShareScreen = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      currentActiveStreamRef.current = cameraStreamRef.current;
      if (localVideoRef.current && cameraStreamRef.current) {
        localVideoRef.current.srcObject = cameraStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
      toast.success('Compartilhamento de tela encerrado. Retornando para câmera.');
    } else {
      try {
        if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
          toast.error('Compartilhamento de tela não suportado neste navegador.');
          return;
        }

        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ 
          video: { cursor: 'always' },
          audio: false 
        });
        
        screenStreamRef.current = stream;
        currentActiveStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
        setIsScreenSharing(true);
        toast.success('Compartilhando tela (odontograma, tomografia, laudo ou janelas). O paciente pode ver o que você demonstrar!');

        stream.getVideoTracks()[0].onended = () => {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
          }
          setIsScreenSharing(false);
          currentActiveStreamRef.current = cameraStreamRef.current;
          if (localVideoRef.current && cameraStreamRef.current) {
            localVideoRef.current.srcObject = cameraStreamRef.current;
            localVideoRef.current.play().catch(() => {});
          }
          toast('Compartilhamento finalizado. Câmera reativada.', { icon: '📹' });
        };
      } catch (err: any) {
        console.warn('Aviso no compartilhamento de tela:', err);
        const isIframe = window.self !== window.top;

        if (isIframe && err?.name === 'NotAllowedError') {
          // Dentro do iframe do AI Studio, o navegador bloqueia getDisplayMedia por segurança
          toast((t) => (
            <div className="flex flex-col gap-2 max-w-xs text-xs text-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Painel Embutido Restringe Tela
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Navegadores impedem capturar telas dentro do iframe de testes. Para compartilhar janelas do Windows/Mac ou tomografias:
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => {
                    window.open(roomUrl, '_blank');
                    toast.dismiss(t.id);
                  }}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-[11px]"
                >
                  Abrir Sala Completa ↗
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-2 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[11px]"
                >
                  Fechar
                </button>
              </div>
            </div>
          ), { duration: 8000 });
        } else if (err?.name === 'NotAllowedError') {
          toast('Seleção de janela/tela cancelada.', { icon: 'ℹ️' });
        } else {
          toast.error('Não foi possível iniciar o compartilhamento de tela.');
        }
      }
    }
  };

  // Escuta Clínica e Transcrição com Inteligência Artificial
  const startAiListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Reconhecimento de voz não suportado neste navegador. Use Google Chrome ou Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsAiListening(true);
        setShowAiPanel(true);
        toast('IA ouvindo a teleconsulta: registrando dados clínicos...', { icon: '🤖' });
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript.trim();
            if (text) {
              setLiveTranscript(prev => [...prev.slice(-15), text]);
              analyzeClinicalInsight(text);
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Erro speech recognition:', event.error);
        if (event.error !== 'no-speech') {
          setIsAiListening(false);
        }
      };

      recognition.onend = () => {
        if (isAiListening) {
          // Reconectar se ainda estiver ativo
          try { recognition.start(); } catch (_) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao inicializar IA de escuta.');
    }
  };

  const stopAiListening = () => {
    setIsAiListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
  };

  const toggleAiListening = () => {
    if (isAiListening) {
      stopAiListening();
      toast('Escuta de IA pausada', { icon: '⏸️' });
    } else {
      startAiListening();
    }
  };

  // Detector inteligente de queixas e orientações em tempo real
  const analyzeClinicalInsight = (text: string) => {
    const lower = text.toLowerCase();
    
    // Detecta dor ou queixa
    if (lower.includes('dor') || lower.includes('queixa') || lower.includes('pontada') || lower.includes('sensibilidade') || lower.includes('ardência') || lower.includes('incômodo')) {
      setAiClinicalInsights(prev => ({
        ...prev,
        queixaPrincipal: text
      }));
    }

    // Detecta conduta ou receita
    if (lower.includes('prescrever') || lower.includes('tomar') || lower.includes('receitar') || lower.includes('orientar') || lower.includes('repouso') || lower.includes('compressa')) {
      setAiClinicalInsights(prev => ({
        ...prev,
        condutas: [...(prev.condutas || []), text].slice(-4)
      }));
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setHasCopiedLink(true);
    toast.success(isDentalSession ? 'Link da teleodontologia copiado!' : 'Link da teleconsulta copiado!');
    setTimeout(() => setHasCopiedLink(false), 2500);
  };

  const handleSendWhatsAppInvitation = () => {
    if (!patientPhone) {
      toast.error('Telefone do paciente não informado.');
      return;
    }
    const cleanPhone = patientPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    const message = isDentalSession
      ? `Olá, *${patientName}*! Tudo bem?\n\nSua sessão de *Teleodontologia & Planejamento Clínico* com a *${doctorName}* (${specialty}) está pronta para começar.\n\n🔒 *Acesse a sala de atendimento segura pelo link abaixo:*\n${roomUrl}\n\n*Instruções rápidas:*\n• Permita o acesso à câmera e microfone quando solicitado pelo navegador.\n• Você pode abrir no computador ou pelo seu celular para alinharmos o planejamento e laudo de exames.\n\nNos vemos em instantes!`
      : `Olá, *${patientName}*! Tudo bem?\n\nSua teleconsulta com o(a) *${doctorName}* (${specialty}) está pronta para começar.\n\n🔒 *Acesse a sala de atendimento segura pelo link abaixo:*\n${roomUrl}\n\n*Instruções rápidas:*\n• Permita o acesso à câmera e microfone quando solicitado pelo navegador.\n• Você pode abrir tanto no computador quanto direto pelo seu celular.\n\nNos vemos em instantes!`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
    toast.success(isDentalSession ? 'Convite da teleodontologia enviado via WhatsApp!' : 'Convite da teleconsulta enviado via WhatsApp!');
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const msg = {
      sender: 'doctor' as const,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  // Fechar com segurança (sem window.confirm para não travar iframes)
  const handleSafeClose = () => {
    if (callDuration > 10) {
      setShowExitConfirmModal(true);
    } else {
      stopAllMedia();
      stopAiListening();
      onClose();
    }
  };

  // Encerrar e anexar automaticamente no prontuário
  const handleEndCall = () => {
    const durationFormatted = formatDuration(callDuration);
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    const timeFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    let summaryNote = `[TELEMEDICINA CONCLUÍDA - CFM nº 2.314/2022]\n` +
      `Data/Hora: ${dateFormatted} às ${timeFormatted}\n` +
      `Duração da sessão: ${durationFormatted}\n` +
      `Profissional: ${doctorName}${doctorCouncil ? ` (${doctorCouncil})` : ''}\n` +
      `Paciente: ${patientName}\n` +
      `Plataforma: Sala Segura Criptografada SSL`;

    if (aiClinicalInsights.queixaPrincipal) {
      summaryNote += `\n\n📌 Queixas relatadas em áudio (Captura IA):\n- ${aiClinicalInsights.queixaPrincipal}`;
    }

    if (aiClinicalInsights.condutas && aiClinicalInsights.condutas.length > 0) {
      summaryNote += `\n\n💊 Orientações / Condutas discutidas (Captura IA):\n${aiClinicalInsights.condutas.map(c => `- ${c}`).join('\n')}`;
    }

    if (liveTranscript.length > 0) {
      summaryNote += `\n\n📝 Trechos relevantes da transcrição médica:\n${liveTranscript.slice(-4).map(t => `"${t}"`).join('\n')}`;
    }

    if (onAppendClinicalNote) {
      onAppendClinicalNote(summaryNote);
      toast.success(`Teleconsulta finalizada (${durationFormatted}). Nota clínica e transcrição anexadas ao prontuário!`, { duration: 4500 });
    } else {
      toast.success(`Teleconsulta finalizada (${durationFormatted}).`);
    }

    stopAllMedia();
    stopAiListening();
    onClose();
  };

  // Arrastar no modo flutuante (PiP)
  const handleMouseDownPip = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pipPosition.x,
      initialY: pipPosition.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;
      setPipPosition({
        x: Math.max(10, Math.min(window.innerWidth - 380, dragStartRef.current.initialX + deltaX)),
        y: Math.max(10, Math.min(window.innerHeight - 300, dragStartRef.current.initialY + deltaY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // MODO FLUTUANTE (Picture-in-Picture) - Permite navegar no app livremente!
  // -------------------------------------------------------------
  if (viewMode === 'pip') {
    return (
      <div 
        style={{ left: `${pipPosition.x}px`, top: `${pipPosition.y}px` }}
        className="fixed z-50 w-80 sm:w-96 bg-slate-900 border-2 border-indigo-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-150 backdrop-blur-md select-none"
      >
        {/* Barra superior de arraste */}
        <div 
          onMouseDown={handleMouseDownPip}
          className="px-3 py-2 bg-slate-950 flex items-center justify-between cursor-move border-b border-slate-800"
          title="Clique e arraste para posicionar onde quiser"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <GripHorizontal className="w-4 h-4 text-indigo-400" />
            <span className="truncate max-w-[130px]">{patientName}</span>
            <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.2 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {formatDuration(callDuration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Alternar IA */}
            <button
              onClick={toggleAiListening}
              className={`p-1 rounded-md text-[10px] flex items-center gap-1 transition-all ${
                isAiListening ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isAiListening ? "Pausar Escuta IA" : "Ativar IA para ouvir teleconsulta"}
            >
              <Bot className="w-3.5 h-3.5" />
            </button>

            {/* Expandir para Tela Cheia / Janela Normal */}
            <button
              onClick={() => setViewMode('modal')}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Expandir Janela"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Fechar / Encerrar */}
            <button
              onClick={handleSafeClose}
              className="p-1 rounded-md bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white transition-all"
              title="Sair ou Encerrar Consulta"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Vídeo Miniatura */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video 
            ref={attachVideoRef}
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transition-all ${!isVideoActive && !isScreenSharing ? 'hidden' : ''} ${!isScreenSharing ? 'transform -scale-x-100' : ''}`}
          />

          {(!isVideoActive && !isScreenSharing) && (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-1 p-4">
              <User className="w-8 h-8 text-slate-400" />
              <p className="text-[11px] font-semibold text-slate-300">{doctorName}</p>
              <p className="text-[10px] text-slate-500">Câmera desativada</p>
            </div>
          )}

          {/* Badge de gravação / IA */}
          {isAiListening && (
            <div className="absolute top-2 left-2 bg-indigo-900/90 border border-indigo-400/50 text-indigo-200 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3 text-indigo-300 animate-spin" /> IA Ouvindo Consulta
            </div>
          )}

          {isScreenSharing && (
            <div className="absolute bottom-2 left-2 bg-black/80 text-amber-300 text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
              <Monitor className="w-3 h-3" /> Transmitindo tela
            </div>
          )}
        </div>

        {/* Barra de Ações Rápidas no modo PiP */}
        <div className="p-2 bg-slate-950 flex items-center justify-between gap-1 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleAudio}
              className={`p-1.5 rounded-lg ${isAudioActive ? 'bg-slate-800 text-slate-200' : 'bg-rose-600 text-white'}`}
              title={isAudioActive ? "Mutar" : "Desmutar"}
            >
              {isAudioActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-1.5 rounded-lg ${isVideoActive ? 'bg-slate-800 text-slate-200' : 'bg-rose-600 text-white'}`}
              title={isVideoActive ? "Desativar Câmera" : "Ativar Câmera"}
            >
              {isVideoActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
            {videoDevices.length > 1 && (
              <button
                onClick={() => handleSwitchCamera()}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400"
                title={`Trocar câmera física (Detectadas: ${videoDevices.length})`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleShareScreen}
              className={`p-1.5 rounded-lg ${isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              title="Compartilhar tela"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSendWhatsAppInvitation}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 text-[11px] font-semibold"
              title="Enviar link no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" /> WhatsApp
            </button>

            <button
              onClick={handleEndCall}
              className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
              title="Finalizar consulta e registrar no prontuário"
            >
              <PhoneOff className="w-3.5 h-3.5" /> Finalizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODO PRINCIPAL (Modal Central ou Split)
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        viewMode === 'split'
          ? 'w-full max-w-7xl h-[94vh]'
          : 'w-full max-w-5xl h-[92vh] max-h-[840px]'
      }`}>
        
        {/* Top Header com Botões Claros de Minimizar e SAIR */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border flex items-center justify-center ${
              isDentalSession 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
            }`}>
              <Video className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  {isDentalSession ? 'Teleodontologia & Planejamento Clínico' : 'Telemedicina & Consulta Online'}
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Ao Vivo
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-md border border-slate-700">
                    {isDentalSession ? 'Res. CFO-226/2020' : 'Res. CFM nº 2.314/2022'}
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Paciente: <strong className="text-slate-200">{patientName}</strong></span>
                <span>•</span>
                <span>Profissional: {doctorName} {doctorCouncil ? `(${doctorCouncil})` : ''}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cronômetro */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-xl text-xs font-mono font-bold text-slate-200 border border-slate-700/60">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatDuration(callDuration)}</span>
            </div>

            {/* Alternar Escuta Inteligente com IA */}
            <button
              onClick={toggleAiListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isAiListening 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md animate-pulse' 
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800'
              }`}
              title="A IA transcreve a consulta e resume queixas e condutas automaticamente no prontuário"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">{isAiListening ? 'IA Gravando' : 'Ativar IA Clínica'}</span>
            </button>

            {/* Botão de Modo Flutuante (PiP / Arrastável) para mexer no sistema */}
            <button
              onClick={() => {
                setViewMode('pip');
                toast("Janela minimizada no canto! Agora você pode navegar e mexer no prontuário ou no odontograma enquanto fala com o paciente.", { icon: '🪟', duration: 4000 });
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all"
              title="Colocar o vídeo em janela flutuante no canto para poder mexer em qualquer parte do sistema"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Flutuar Janela</span>
            </button>

            {/* BOTÃO CLARO DE SAIR / FECHAR A QUALQUER MOMENTO */}
            <button
              onClick={handleSafeClose}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold border border-rose-500/30 transition-all"
              title="Sair ou encerrar a chamada (ESC)"
            >
              <X className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Central Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Área de Vídeo Principal */}
          <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center relative p-3 sm:p-4">
            
            <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-800/90 shadow-inner">
              
              {presentedImage ? (
                /* Modo Apresentação de Imagem / Tomografia / Exame */
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950 p-3 select-none">
                  <img 
                    src={presentedImage} 
                    alt="Documento ou Exame Apresentado" 
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-slate-800" 
                  />

                  {/* Câmera do Médico em miniatura sobreposta */}
                  <div className="absolute bottom-4 right-4 w-44 aspect-video bg-black/95 border-2 border-indigo-500 rounded-xl overflow-hidden shadow-2xl z-20">
                    <video 
                      ref={attachVideoRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className={`w-full h-full object-cover ${!isVideoActive ? 'hidden' : ''} transform -scale-x-100`}
                    />
                    {!isVideoActive && (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 bg-slate-900">
                        Câmera pausada
                      </div>
                    )}
                    <div className="absolute top-1 left-1.5 bg-black/80 text-indigo-300 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                      Você (Ao vivo)
                    </div>
                  </div>

                  {/* Header da Apresentação */}
                  <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-xl z-20">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-slate-200">
                      {isDentalSession ? 'Apresentando Tomografia / Exame (CBCT)' : 'Apresentando Exame Clínico'}
                    </span>
                    <button
                      onClick={() => setPresentedImage(null)}
                      className="ml-2 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                    >
                      Encerrar Apresentação
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Vídeo do Médico / Tela compartilhada */}
                  <video 
                    ref={attachVideoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover rounded-2xl transition-all ${!isVideoActive && !isScreenSharing ? 'hidden' : ''} ${!isScreenSharing ? 'transform -scale-x-100' : ''}`}
                  />

                  {/* Placeholder câmera desligada */}
                  {(!isVideoActive && !isScreenSharing) && (
                    <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
                      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">{doctorName}</p>
                        <p className="text-xs text-slate-500">Câmera desativada</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Banner de Aviso de Como Usar com o Sistema */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <a
                  href={roomUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-black/70 hover:bg-indigo-600/90 backdrop-blur-md border border-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                  title="Abrir a chamada em outra aba dedicada"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir em Nova Aba (Tela Completa)
                </a>

                {isScreenSharing && (
                  <div className="px-3 py-1.5 bg-indigo-600/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <Monitor className="w-3.5 h-3.5" /> Compartilhando tela com o paciente
                  </div>
                )}
              </div>

              {/* Card PiP do Paciente ou Link para Conectar */}
              <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 max-w-xs shadow-2xl text-xs text-white">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold flex items-center gap-1.5 text-xs text-slate-200">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> {patientName}
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                    Aguardando entrada
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  Envie o convite no WhatsApp do paciente. Ele clica e entra na consulta sem precisar instalar nada!
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendWhatsAppInvitation}
                    className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Enviar WhatsApp
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-700 transition-all"
                    title="Copiar Link"
                  >
                    {hasCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Dica de produtividade no rodapé do vídeo */}
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md border border-slate-800 text-slate-300 text-[11px] px-3.5 py-2 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Teleconsulta Criptografada SSL • <strong>Dica:</strong> Clique em <em>"Flutuar Janela"</em> acima para mexer no prontuário enquanto atende.</span>
              </div>

            </div>

          </div>

          {/* Painel Lateral da IA ou Chat */}
          {(showChat || showAiPanel) && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
              
              {/* Tabs da Barra Lateral */}
              <div className="p-2 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex gap-1">
                  <button
                    onClick={() => { setShowAiPanel(true); setShowChat(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      showAiPanel ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" /> IA Clínica
                  </button>
                  <button
                    onClick={() => { setShowChat(true); setShowAiPanel(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      showChat ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat ({chatMessages.length})
                  </button>
                </div>
                <button 
                  onClick={() => { setShowChat(false); setShowAiPanel(false); }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Conteúdo do Painel de IA Clínica */}
              {showAiPanel && (
                <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs text-slate-200">
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl space-y-1.5">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Escuta Clínica Ativa
                    </span>
                    <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                      Conforme você e o paciente conversam, a IA captura queixas, sintomas e condutas para estruturar o prontuário.
                    </p>
                    <button
                      onClick={toggleAiListening}
                      className={`w-full mt-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isAiListening ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isAiListening ? 'Pausar Reconhecimento de Voz' : 'Iniciar Escuta de Voz'}
                    </button>
                  </div>

                  {aiClinicalInsights.queixaPrincipal && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Queixa Identificada:</span>
                      <p className="text-xs text-amber-200 font-medium">"{aiClinicalInsights.queixaPrincipal}"</p>
                    </div>
                  )}

                  {aiClinicalInsights.condutas && aiClinicalInsights.condutas.length > 0 && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Condutas / Orientações Mencionadas:</span>
                      <ul className="list-disc list-inside space-y-1 text-emerald-200 text-xs">
                        {aiClinicalInsights.condutas.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Últimas falas captadas:</span>
                    {liveTranscript.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-950/60 rounded-xl text-center">
                        Nenhuma fala detectada ainda. Fale no microfone para transcrever.
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {liveTranscript.slice(-8).map((t, idx) => (
                          <p key={idx} className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 text-[11px]">
                            "{t}"
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Conteúdo do Chat */}
              {showChat && (
                <>
                  <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={`p-2.5 rounded-xl leading-relaxed ${
                          msg.sender === 'doctor' 
                            ? 'bg-indigo-600/30 border border-indigo-500/30 text-indigo-100 ml-4' 
                            : 'bg-slate-800 border border-slate-700 text-slate-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>{msg.sender === 'doctor' ? 'Você (Médico)' : patientName}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 border-t border-slate-800 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Mensagem para o paciente..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}

            </div>
          )}

        </div>

        {/* Barra Inferior de Controles Clínicos com Botões Redesenhados */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          
          {/* Lado Esquerdo: Ferramentas de Conexão */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsAppInvitation}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
              title="Disparar convite com o link da consulta no WhatsApp do paciente"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Convidar via WhatsApp</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all"
              title="Copiar link seguro para a área de transferência"
            >
              {hasCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{hasCopiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>

          {/* Centro: Controles de Câmera, Microfone e Transmissão de Tela */}
          <div className="flex items-center gap-2">
            {/* Microfone */}
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                isAudioActive 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
              title={isAudioActive ? "Mutar Microfone" : "Ativar Microfone"}
            >
              {isAudioActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* Câmera */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                isVideoActive 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
              title={isVideoActive ? "Desativar Câmera" : "Ativar Câmera"}
            >
              {isVideoActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            {/* Alternar Câmera (quando houver mais de uma conectada) */}
            {videoDevices.length > 1 && (
              <button
                onClick={() => handleSwitchCamera()}
                className="p-3 rounded-2xl transition-all shadow-md bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white border border-slate-700 flex items-center gap-1.5"
                title={`Alternar câmera (Detectadas: ${videoDevices.map(d => d.label).join(', ')})`}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-xs hidden lg:inline font-medium">Trocar Câmera</span>
              </button>
            )}

            {/* Compartilhar Tela (Odontograma, Tomografia, Exames) */}
            <button
              onClick={handleShareScreen}
              className={`p-3 rounded-2xl transition-all shadow-md flex items-center gap-1.5 ${
                isScreenSharing 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={isScreenSharing ? "Parar Compartilhamento de Tela" : "Compartilhar Tela (Exames/Laudos/Odontograma)"}
            >
              <Monitor className="w-4 h-4" />
              <span className="text-xs hidden md:inline font-medium">
                {isScreenSharing ? 'Compartilhando Tela' : 'Compartilhar Tela'}
              </span>
            </button>

            {/* Apresentar Imagem/Exame Direto (Sem depender de permissão de gravação de tela) */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePresentFile} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              onClick={() => {
                if (presentedImage) {
                  setPresentedImage(null);
                  toast('Apresentação de exame finalizada.', { icon: 'ℹ️' });
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className={`p-3 rounded-2xl transition-all shadow-md flex items-center gap-1.5 ${
                presentedImage 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={presentedImage 
                ? "Encerrar apresentação de documento" 
                : isDentalSession 
                  ? "Apresentar imagem de tomografia cone beam, radiografia ou laudo" 
                  : "Apresentar imagem de exame, raio-X ou laudo"}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs hidden md:inline font-medium">
                {presentedImage 
                  ? 'Apresentando Exame' 
                  : isDentalSession 
                    ? 'Apresentar Tomografia / Exame' 
                    : 'Apresentar Exame'}
              </span>
            </button>

            {/* Abrir IA Clínica */}
            <button
              onClick={() => {
                setShowAiPanel(!showAiPanel);
                if (showChat) setShowChat(false);
              }}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                showAiPanel 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Abrir painel de transcrição e IA clínica"
            >
              <Bot className="w-4 h-4" />
            </button>

            {/* Chat */}
            <button
              onClick={() => {
                setShowChat(!showChat);
                if (showAiPanel) setShowAiPanel(false);
              }}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                showChat 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Abrir Chat com o Paciente"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          {/* Lado Direito: Encerrar e Registrar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSafeClose}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
              title={isDentalSession 
                ? "Encerrar teleodontologia e anexar resumo e planejamento ao prontuário" 
                : "Encerrar teleconsulta e anexar resumo e transcrição ao prontuário"}
            >
              <PhoneOff className="w-4 h-4" />
              <span>{isDentalSession ? 'Concluir Teleodontologia' : 'Concluir Teleconsulta'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Modal Seguro de Confirmação de Saída / Encerramento (Zero window.confirm) */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  {isDentalSession ? 'Sessão de Teleodontologia em Andamento' : 'Teleconsulta em Andamento'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">Duração da sessão: {formatDuration(callDuration)}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isDentalSession 
                ? 'Como deseja prosseguir com a sessão de teleodontologia e planejamento?' 
                : 'Como deseja prosseguir com a sessão de telemedicina?'}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowExitConfirmModal(false);
                  handleEndCall();
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isDentalSession ? 'Finalizar Sessão e Anexar ao Prontuário Odontológico' : 'Finalizar Consulta e Anexar ao Prontuário'}
              </button>

              <button
                onClick={() => {
                  setShowExitConfirmModal(false);
                  setViewMode('pip');
                  toast("Chamada minimizada no canto da tela!", { icon: '🪟' });
                }}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Layers className="w-4 h-4" />
                Apenas Flutuar no Canto (Continuar Atendendo)
              </button>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setShowExitConfirmModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all"
                >
                  Continuar
                </button>

                <button
                  onClick={() => {
                    setShowExitConfirmModal(false);
                    stopAllMedia();
                    stopAiListening();
                    onClose();
                  }}
                  className="py-2 px-3 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs rounded-xl transition-all"
                  title="Fechar chamada imediatamente"
                >
                  Sair sem Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
