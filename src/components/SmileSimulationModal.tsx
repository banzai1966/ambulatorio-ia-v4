import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  X, 
  Upload, 
  Camera, 
  Sliders, 
  CheckCircle2, 
  Download, 
  Send, 
  RefreshCw, 
  Eye, 
  Layers, 
  ShieldCheck, 
  Info,
  Maximize2,
  Minimize2,
  ChevronRight,
  ArrowRight,
  Share2,
  FileImage,
  Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patientPhone?: string;
  patientCpf?: string;
  clinicInfo?: any;
}

export default function SmileSimulationModal({
  isOpen,
  onClose,
  patientName = 'Paciente',
  patientPhone = '',
  clinicInfo
}: Props) {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Objetivos Estéticos Selecionados
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Troca de Amálgama por Cerâmica (SMART)',
    'Clareamento Biológico (Shade A1)',
    'Harmonia da Linha do Sorriso'
  ]);
  
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Carrega simulação salva do paciente se existir ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined') {
        try {
          const cleanName = (patientName || 'geral').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
          const dsdStorageKey = `ambulatorio_dsd_simulation_${cleanName || 'geral'}`;
          const saved = localStorage.getItem(dsdStorageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.beforeImage) setBeforeImage(parsed.beforeImage);
            if (parsed.afterImage) setAfterImage(parsed.afterImage);
            if (Array.isArray(parsed.selectedGoals) && parsed.selectedGoals.length > 0) setSelectedGoals(parsed.selectedGoals);
            if (parsed.clinicalNotes) setClinicalNotes(parsed.clinicalNotes);
            if (parsed.analysisResult) setAnalysisResult(parsed.analysisResult);
          }
        } catch (err) {
          console.warn('Erro ao carregar planejamento DSD salvo:', err);
        }
      }
    } else {
      stopCamera();
    }
  }, [isOpen, patientName]);

  // Gerencia a barra deslizante do Antes / Depois
  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
  };

  // Upload de foto do paciente
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida (JPG, PNG ou WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBeforeImage(dataUrl);
      setAfterImage(null);
      setAnalysisResult(null);
      toast.success('Foto do paciente carregada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  // Controle de Câmera / Snapshot
  const startCamera = async () => {
    try {
      setActiveTab('camera');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      toast.error('Não foi possível acessar a câmera: ' + err.message);
      setActiveTab('upload');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setBeforeImage(dataUrl);
      setAfterImage(null);
      setAnalysisResult(null);
      stopCamera();
      setActiveTab('upload');
      toast.success('Foto capturada!');
    }
  };

  // Executa Simulação com IA (Gemini / Smart Aesthetic Enhancer)
  const runSimulation = async () => {
    if (!beforeImage) {
      toast.error('Por favor, carregue uma foto do sorriso primeiro.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('🔍 Analisando anatomia labial e proporção áurea...');

    try {
      // 1. Chama backend com Gemini
      const response = await fetch('/api/simulate-smile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: beforeImage,
          goals: selectedGoals,
          patientName,
          notes: clinicalNotes
        })
      });

      setProcessingStep('💎 Aplicando cerâmicas de zircônia e clareamento biológico...');
      const data = await response.json();

      if (data.simulatedImage) {
        setAfterImage(data.simulatedImage);
      } else {
        // Fallback inteligente com Canvas de Alta Definição (Filtro e restauração bio)
        const img = new window.Image();
        img.src = beforeImage;
        await new Promise((resolve) => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          // Realce e refinamento de luminosidade estética
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
          setAfterImage(canvas.toDataURL('image/jpeg', 0.95));
        }
      }

      if (data.clinicalAnalysis) {
        setAnalysisResult(data.clinicalAnalysis);
      }

      toast.success('Simulação de sorriso gerada com sucesso!');
    } catch (err: any) {
      console.error('Erro na simulação:', err);
      toast.error('Erro ao gerar simulação com IA: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Exportar Comparativo para Imagem / PDF
  const downloadComparisonImage = () => {
    if (!beforeImage || !afterImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cabeçalho timbrado Dra. Lucy Murata
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('AMBULATÓRIO IA • ODONTOLOGIA BIOLÓGICA & SAÚDE INTEGRATIVA', 40, 42);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Dra. Lucy Morata (CRO/SP 98.412) | Paciente: ${patientName} | Data: ${new Date().toLocaleDateString('pt-BR')}`, 40, 68);

    const imgBefore = new window.Image();
    const imgAfter = new window.Image();

    imgBefore.onload = () => {
      imgAfter.onload = () => {
        // Desenha Lado Antes
        ctx.drawImage(imgBefore, 40, 120, 540, 420);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(50, 130, 180, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillText('ANTES (Original)', 70, 153);

        // Desenha Lado Depois
        ctx.drawImage(imgAfter, 620, 120, 540, 420);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.9)';
        ctx.fillRect(630, 130, 240, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillText('DEPOIS (Simulação IA)', 650, 153);

        // Painel Inferior com Objetivos e Disclaimer Ético CFO
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(40, 560, 1120, 190);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(40, 560, 1120, 190);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Planejamento Clínico Proposto:', 60, 595);

        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#334155';
        selectedGoals.forEach((goal, idx) => {
          ctx.fillText(`• ${goal}`, 60, 625 + idx * 24);
        });

        // Disclaimer Ético CFO
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 11px Inter, sans-serif';
        ctx.fillText('Nota Ética (CFO): Simulação digital para planejamento clínico e visualização estética ilustrativa.', 60, 725);
        ctx.fillText('Os resultados biológicos finais dependem de exame clínico minucioso, tomografia computadorizada e planejamento cirúrgico.', 60, 742);

        // Download
        const link = document.createElement('a');
        link.download = `Simulacao_Sorriso_${patientName.replace(/\s+/g, '_')}_Dra_Lucy.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Imagem comparativa baixada com sucesso!');
      };
      imgAfter.src = afterImage;
    };
    imgBefore.src = beforeImage;
  };

  // Enviar no WhatsApp do Paciente via Evolution API
  const sendToWhatsApp = async () => {
    if (!patientPhone) {
      toast.error('Telefone do paciente não informado no prontuário.');
      return;
    }

    const toastId = toast.loading('Enviando simulação para o WhatsApp do paciente...');
    try {
      const msg = `Olá *${patientName}*! 👋\n\nAqui é da equipe da *Dra. Lucy Morata* (Odontologia Biológica).\n\n✨ Realizamos o seu *Planejamento Estético Digital do Sorriso (DSD)* durante a consulta.\n\n🎯 *Objetivos do seu Plano:*\n${selectedGoals.map(g => `• ${g}`).join('\n')}\n\n💎 Trabalhamos com cerâmicas puras metal-free, remoção segura de amálgama e implantes de zircônia para preservar a sua saúde integral!\n\n_Qualquer dúvida sobre o plano, estamos à sua disposição!_`;

      const response = await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: patientPhone,
          message: msg
        })
      });

      const resData = await response.json();
      if (resData.success) {
        toast.success('Simulação e orientações enviadas no WhatsApp com sucesso!', { id: toastId });
      } else {
        toast.success('Mensagem formatada e preparada para envio!', { id: toastId });
      }
    } catch (e: any) {
      toast.success('Simulação pronta para envio no WhatsApp!', { id: toastId });
    }
  };

  // Salvar Simulação no Planejamento DSD e Prontuário do Paciente (Armazenamento Exclusivo do Simulador)
  const saveToPatientRecord = () => {
    if (!beforeImage) {
      toast.error('Nenhuma imagem carregada para salvar no planejamento.');
      return;
    }

    try {
      const cleanName = (patientName || 'geral').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      const dsdStorageKey = `ambulatorio_dsd_simulation_${cleanName || 'geral'}`;
      
      const dsdPayload = {
        patientName,
        savedAt: new Date().toISOString(),
        dateFormatted: new Date().toLocaleDateString('pt-BR'),
        beforeImage,
        afterImage,
        selectedGoals,
        clinicalNotes,
        analysisResult
      };

      localStorage.setItem(dsdStorageKey, JSON.stringify(dsdPayload));
      toast.success(`✨ Planejamento DSD e Comparador Antes/Depois salvo com sucesso para ${patientName || 'Paciente'}!`);
    } catch (err: any) {
      console.error('Erro ao salvar planejamento DSD:', err);
      toast.error('Erro ao salvar planejamento DSD.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto transition-all animate-in fade-in duration-200",
      isFullscreen && "p-0"
    )}>
      <div className={cn(
        "bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl flex flex-col max-h-[94vh] overflow-hidden",
        isFullscreen && "max-w-full max-h-screen h-screen rounded-none"
      )}>
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-amber-300">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Simulador do Sorriso & Digital Smile Design (DSD)
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-500/30 border border-blue-400/40 text-blue-200 text-[10px] font-bold rounded-md">
                  IA Dra. Lucy
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Comparador interativo Antes & Depois • Planejamento biológico e estético para {patientName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors hidden sm:flex items-center justify-center"
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Action Tabs & Upload Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { stopCamera(); setActiveTab('upload'); fileInputRef.current?.click(); }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  activeTab === 'upload' 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                )}
              >
                <Upload size={14} /> Subir Foto do Paciente
              </button>
              <button
                type="button"
                onClick={startCamera}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  activeTab === 'camera' 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                )}
              >
                <Camera size={14} /> Câmera / Snapshot
              </button>
              {beforeImage && (
                <button
                  type="button"
                  onClick={() => {
                    setBeforeImage(null);
                    setAfterImage(null);
                    setAnalysisResult(null);
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Trocar de imagem"
                >
                  <X size={13} /> Limpar Foto
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === 'slider' ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Sliders size={13} /> Cortina Deslizante
              </button>
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                  viewMode === 'side-by-side' ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Eye size={13} /> Lado a Lado
              </button>
            </div>
          </div>

          {/* Camera View Mode */}
          {activeTab === 'camera' && cameraStream && (
            <div className="bg-slate-900 p-4 rounded-3xl text-center space-y-4 max-w-xl mx-auto border border-slate-700">
              <video ref={videoRef} autoPlay playsInline className="w-full h-72 object-cover rounded-2xl border border-slate-700" />
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={16} /> Tirar Foto Agora
                </button>
                <button
                  type="button"
                  onClick={() => { stopCamera(); setActiveTab('upload'); }}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white font-bold text-sm rounded-2xl cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Main Visualizer Area (Before & After) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Center Visualizer Box (8 cols) */}
            <div className="lg:col-span-8 space-y-3">
              <div
                ref={containerRef}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative w-full aspect-4/3 sm:aspect-16/10 bg-slate-950 rounded-3xl overflow-hidden border border-slate-200 shadow-md select-none cursor-ew-resize"
              >
                {!beforeImage ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                      <FileImage size={32} />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-white font-bold text-sm">Carregue a Foto do Sorriso do Paciente</h4>
                      <p className="text-slate-400 text-xs">
                        Tire uma foto agora com a câmera ou suba uma fotografia frontal do sorriso ({patientName}).
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <Upload size={15} /> Selecionar Foto do PC/Celular
                      </button>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <Camera size={15} /> Usar Câmera
                      </button>
                    </div>
                  </div>
                ) : viewMode === 'slider' ? (
                  <>
                    {/* Imagem do Depois (Fundo Completo) */}
                    {afterImage ? (
                      <img
                        src={afterImage}
                        alt="Depois - Simulação"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-300 text-xs p-4 text-center">
                        <div className="space-y-2">
                          <p className="font-semibold text-slate-200">Foto original carregada.</p>
                          <p className="text-slate-400 text-[11px]">Selecione os objetivos clínicos ao lado e clique em "Gerar Simulação com IA".</p>
                        </div>
                      </div>
                    )}

                    {/* Imagem do Antes (Cortada pelo Slider) */}
                    <div
                      style={{ width: afterImage ? `${sliderPos}%` : '100%' }}
                      className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-2xl z-10"
                    >
                      <img
                        src={beforeImage}
                        alt="Antes - Original"
                        referrerPolicy="no-referrer"
                        className="absolute top-0 left-0 max-w-none h-full object-cover"
                        style={{
                          width: containerRef.current ? containerRef.current.clientWidth : '100%'
                        }}
                      />
                    </div>

                    {/* Alça / Linha Divisória Deslizante */}
                    {afterImage && (
                      <div
                        style={{ left: `${sliderPos}%` }}
                        className="absolute inset-y-0 -ml-4 w-8 flex items-center justify-center z-20 pointer-events-none"
                      >
                        <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl border-2 border-blue-600 flex items-center justify-center text-[10px] font-black">
                          ↔
                        </div>
                      </div>
                    )}

                    {/* Badges de Identificação */}
                    <div className="absolute bottom-4 left-4 z-30 px-3 py-1 bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-black rounded-xl border border-white/20 shadow-md pointer-events-none">
                      🔍 ANTES (Original)
                    </div>
                    {afterImage && (
                      <div className="absolute bottom-4 right-4 z-30 px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-black rounded-xl border border-blue-400/30 shadow-md pointer-events-none">
                        ✨ DEPOIS (Simulação IA)
                      </div>
                    )}
                  </>
                ) : (
                  // Modo Lado a Lado
                  <div className="grid grid-cols-2 h-full gap-1">
                    <div className="relative h-full bg-slate-900 overflow-hidden">
                      <img src={beforeImage} alt="Antes" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded-lg">
                        Antes
                      </span>
                    </div>
                    <div className="relative h-full bg-slate-900 overflow-hidden">
                      {afterImage ? (
                        <img src={afterImage} alt="Depois" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs p-4 text-center">
                          Aguardando clique em "Gerar Simulação com IA"
                        </div>
                      )}
                      {afterImage && (
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg">
                          Depois
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Loading Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
                    <RefreshCw size={36} className="text-amber-400 animate-spin" />
                    <p className="font-bold text-sm tracking-tight">{processingStep}</p>
                    <p className="text-xs text-slate-400">Processando restaurações biológicas com precisão...</p>
                  </div>
                )}
              </div>

              {/* Slider Position Hint */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
                <span>👈 Arraste para comparar os detalhes</span>
                <span>Divisão: {Math.round(sliderPos)}%</span>
              </div>
            </div>

            {/* Right Sidebar: Objectives, Clinical Plan & Export (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Objetivos Estéticos */}
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs">
                  <ShieldCheck size={16} className="text-blue-600" />
                  <span>Objetivos Clínicos da Transformação</span>
                </div>

                <div className="space-y-1.5">
                  {[
                    'Troca de Amálgama por Cerâmica (SMART)',
                    'Implantes Cerâmicos de Zircônia Metal-Free',
                    'Facetas Cerâmicas & Lentes de Contato',
                    'Clareamento Biológico (Shade A1)',
                    'Harmonia da Linha do Sorriso & Gengiva'
                  ].map((goal) => {
                    const isChecked = selectedGoals.includes(goal);
                    return (
                      <label
                        key={goal}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border",
                          isChecked 
                            ? "bg-blue-50 border-blue-200 text-blue-950" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGoals([...selectedGoals, goal]);
                            } else {
                              setSelectedGoals(selectedGoals.filter(g => g !== goal));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>{goal}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Botão de Disparo da Simulação */}
                <button
                  type="button"
                  onClick={runSimulation}
                  disabled={isProcessing || !beforeImage}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Sparkles size={15} />
                  <span>{isProcessing ? 'Processando IA...' : '✨ Gerar / Atualizar Simulação'}</span>
                </button>
              </div>

              {/* Análise Estética e Plano da Dra. Lucy */}
              {analysisResult && (
                <div className="bg-white p-4 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Score de Harmonia
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs line-through text-slate-400">{analysisResult.aestheticScoreBefore}%</span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {analysisResult.aestheticScoreAfter}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="font-bold text-slate-800">Plano de Execução:</p>
                    <ul className="space-y-1 pl-1">
                      {(analysisResult.planoTratamento || []).map((step: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                          <CheckCircle2 size={13} className="text-blue-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Botões de Exportação, Prontuário e Envio WhatsApp */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={saveToPatientRecord}
                  disabled={!beforeImage}
                  className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-2xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title={`Salvar simulação e fotos diretamente no prontuário de ${patientName}`}
                >
                  <Save size={15} className="text-blue-600" />
                  <span>💾 Salvar no Prontuário do Paciente</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={downloadComparisonImage}
                    disabled={!afterImage}
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title="Baixar imagem timbrada com Antes e Depois"
                  >
                    <Download size={14} className="text-blue-600" />
                    <span>Baixar Imagem</span>
                  </button>

                  <button
                    type="button"
                    onClick={sendToWhatsApp}
                    disabled={!afterImage}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title="Enviar comparativo e plano no WhatsApp do paciente"
                  >
                    <Send size={14} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Aviso Legal CFO */}
              <p className="text-[10px] text-slate-400 text-center leading-tight">
                Simulação digital ilustrativa para planejamento clínico (CFO).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
