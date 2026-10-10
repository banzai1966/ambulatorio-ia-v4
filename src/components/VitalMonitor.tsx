import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Activity, 
  Droplets, 
  Heart, 
  HelpCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  Clock, 
  Plus, 
  Minus, 
  Edit3, 
  Save, 
  FileText, 
  Sparkles, 
  Stethoscope, 
  ShieldAlert, 
  Info,
  Thermometer,
  Zap,
  FastForward
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface VitalMonitorProps {
  bpm?: number;
  spo2?: number;
  resp?: number;
  pressao?: string;
  temp?: number;
  glicemia?: number;
  soroName?: string;
  soroRate?: string;
  soroVolume?: number;
  resumo_clinico?: string;
  className?: string;
  examMode?: string;
  onUpdateVitals?: (vitals: {
    bpm: number;
    spo2: number;
    resp: number;
    pressao: string;
    temp: number;
    glicemia: number;
    soroName?: string;
    soroRate?: string;
    soroVolume?: number;
  }) => void;
  onAppendClinicalNote?: (note: string) => void;
  onClose?: () => void;
}

// Soluções padrão para Medicina Integrativa e Cirurgias Odontológicas
const PRESET_SOLUTIONS = [
  { name: 'Soro Fisiológico 0.9%', volume: 500, rate: '21 gotas/min • 63 mL/h', gotas: 21, ind: 'Hidratação & Diluição' },
  { name: 'Myer\'s Cocktail Integrativo (Vitaminas + Minerais)', volume: 250, rate: '28 gotas/min • 84 mL/h', gotas: 28, ind: 'Fadiga, Imunidade & Enxaqueca' },
  { name: 'Vitamina C Alta Dose + Magnésio', volume: 500, rate: '21 gotas/min • 63 mL/h', gotas: 21, ind: 'Antioxidante & Regeneração' },
  { name: 'Glutationa Lipossomal & Ácido Alfa-Lipóico', volume: 100, rate: '14 gotas/min • 42 mL/h', gotas: 14, ind: 'Detox Mitocondrial & Neuroproteção' },
  { name: 'Ringer Lactato c/ Eletrólitos', volume: 500, rate: '28 gotas/min • 84 mL/h', gotas: 28, ind: 'Cirurgias Odonto & Expansor' },
  { name: 'Quelação EDTA / DMSO', volume: 500, rate: '21 gotas/min • 63 mL/h', gotas: 21, ind: 'Detox de Metais Pesados' },
];

const VitalMonitor: React.FC<VitalMonitorProps> = ({ 
  bpm = 75, 
  spo2 = 98, 
  resp = 16,
  pressao = '120/80',
  temp = 36.5,
  glicemia = 95,
  soroName = 'Soro Fisiológico 0.9%',
  soroRate = '21 gotas/min • 63 mL/h',
  soroVolume = 500,
  resumo_clinico,
  className = '',
  examMode,
  onUpdateVitals,
  onAppendClinicalNote,
  onClose
}) => {
  // Modo de exibição: 'triagem' (limpo, cards interativos de consulta) vs 'procedimento' (ondas contínuas + soroterapia)
  const [activeTab, setActiveTab] = useState<'triagem' | 'procedimento'>(
    examMode === 'integrative' ? 'procedimento' : 'triagem'
  );

  // Modal de ajuda didática sobre o uso real
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Fecha o modal no teclado (Esc) e trava o overflow do body
  useEffect(() => {
    if (!showHelpModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHelpModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelpModal]);

  // Estados locais dos sinais vitais
  const [currentBpm, setCurrentBpm] = useState<number>(bpm || 75);
  const [currentSpo2, setCurrentSpo2] = useState<number>(spo2 || 98);
  const [currentResp, setCurrentResp] = useState<number>(resp || 16);
  const [currentPressao, setCurrentPressao] = useState<string>(pressao || '120/80');
  const [currentTemp, setCurrentTemp] = useState<number>(temp || 36.5);
  const [currentGlicemia, setCurrentGlicemia] = useState<number>(glicemia || 95);

  // Modo de edição rápida de sinais vitais
  const [isEditingVitals, setIsEditingVitals] = useState(false);
  const [editPaSistolica, setEditPaSistolica] = useState<number>(120);
  const [editPaDiastolica, setEditPaDiastolica] = useState<number>(80);

  // Sincroniza props iniciais
  useEffect(() => {
    if (bpm) setCurrentBpm(bpm);
    if (spo2) setCurrentSpo2(spo2);
    if (resp) setCurrentResp(resp);
    if (pressao) {
      setCurrentPressao(pressao);
      const parts = pressao.split('/');
      if (parts.length === 2) {
        setEditPaSistolica(parseInt(parts[0]) || 120);
        setEditPaDiastolica(parseInt(parts[1]) || 80);
      }
    }
    if (temp) setCurrentTemp(temp);
    if (glicemia) setCurrentGlicemia(glicemia);
  }, [bpm, spo2, resp, pressao, temp, glicemia]);

  // Estados da Soroterapia & Infusão IV
  const [selectedSolution, setSelectedSolution] = useState(soroName || PRESET_SOLUTIONS[0].name);
  const [volumeTotalMl, setVolumeTotalMl] = useState<number>(soroVolume || 500);
  const [gotasPorMin, setGotasPorMin] = useState<number>(21);
  const [isInfusionRunning, setIsInfusionRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [infusionStartTime, setInfusionStartTime] = useState<Date | null>(null);

  // Canvas Refs para as ondas contínuas no modo procedimento
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const spo2CanvasRef = useRef<HTMLCanvasElement>(null);
  const respCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fórmula clínica de cálculo de tempo de infusão:
  // Gotas/min = Volume (mL) / (Tempo em horas * 3) -> Tempo (horas) = Volume / (Gotas * 3)
  // Tempo em minutos = (Volume / (Gotas * 3)) * 60 = (Volume * 20) / Gotas
  const totalEstimatedMinutes = useMemo(() => {
    if (!gotasPorMin || gotasPorMin <= 0) return 60;
    return Math.round((volumeTotalMl * 20) / gotasPorMin);
  }, [volumeTotalMl, gotasPorMin]);

  const totalEstimatedSeconds = totalEstimatedMinutes * 60;

  // Volume infundido calculado
  const currentInfundedMl = useMemo(() => {
    if (!totalEstimatedSeconds || totalEstimatedSeconds <= 0) return 0;
    const ratio = Math.min(1, elapsedSeconds / totalEstimatedSeconds);
    return Math.round(volumeTotalMl * ratio);
  }, [elapsedSeconds, totalEstimatedSeconds, volumeTotalMl]);

  const infusionProgressPercent = useMemo(() => {
    if (!totalEstimatedSeconds || totalEstimatedSeconds <= 0) return 0;
    return Math.min(100, Math.round((elapsedSeconds / totalEstimatedSeconds) * 100));
  }, [elapsedSeconds, totalEstimatedSeconds]);

  // Toca chime sutil ao finalizar ou aos 90%
  const playAlertSound = (isFinish = false) => {
    if (isSoundMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinish ? 880 : 587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isFinish ? 1046.5 : 880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  };

  // Timer da infusão
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isInfusionRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          if (next >= totalEstimatedSeconds) {
            setIsInfusionRunning(false);
            playAlertSound(true);
            toast.success("Bolsa de soro finalizada! Checar paciente.", { icon: '💉', duration: 8000 });
            return totalEstimatedSeconds;
          }
          // Alerta nos 90%
          if (next === Math.round(totalEstimatedSeconds * 0.9)) {
            playAlertSound(false);
            toast("Atenção: Infusão em 90% (faltam poucos minutos)!", { icon: '⏱️' });
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInfusionRunning, totalEstimatedSeconds, isSoundMuted]);

  // Desenho das ondas contínuas no Canvas (Modo Procedimento)
  useEffect(() => {
    if (activeTab !== 'procedimento') return;

    const ecgCanvas = ecgCanvasRef.current;
    const spo2Canvas = spo2CanvasRef.current;
    const respCanvas = respCanvasRef.current;
    if (!ecgCanvas || !spo2Canvas || !respCanvas) return;

    const ecgCtx = ecgCanvas.getContext('2d');
    const spo2Ctx = spo2Canvas.getContext('2d');
    const respCtx = respCanvas.getContext('2d');
    if (!ecgCtx || !spo2Ctx || !respCtx) return;

    let animationFrameId: number;
    let x = 0;
    const step = 2;

    const draw = () => {
      const width = ecgCanvas.width;
      const height = ecgCanvas.height;

      // Motion Blur / Fade
      ecgCtx.fillStyle = 'rgba(10, 15, 29, 0.08)';
      ecgCtx.fillRect(x, 0, 16, height);
      spo2Ctx.fillStyle = 'rgba(10, 15, 29, 0.08)';
      spo2Ctx.fillRect(x, 0, 16, height);
      respCtx.fillStyle = 'rgba(10, 15, 29, 0.08)';
      respCtx.fillRect(x, 0, 16, height);

      let yEcgStart = height / 2;
      let yEcgEnd = height / 2;
      let ySpo2Start = height / 2 + 15;
      let ySpo2End = height / 2 + 15;
      let yRespStart = height / 2;
      let yRespEnd = height / 2;

      if (currentBpm > 0) {
        const speedMultiplier = Math.max(0.6, Math.min(2.5, currentBpm / 60));
        const periodX = 180 / speedMultiplier;
        const phaseStart = (x % periodX) / periodX;
        const phaseEnd = ((x + step) % periodX) / periodX;

        // Onda ECG P-Q-R-S-T
        const getEcgY = (phase: number) => {
          if (phase > 0.05 && phase < 0.1) return -12; // Onda P
          if (phase > 0.15 && phase < 0.17) return 8;   // Q
          if (phase >= 0.17 && phase < 0.20) return -55; // Pico R
          if (phase >= 0.20 && phase < 0.23) return 18;  // S
          if (phase > 0.35 && phase < 0.45) return -16;  // T
          return 0;
        };
        yEcgStart = height / 2 + getEcgY(phaseStart);
        yEcgEnd = height / 2 + getEcgY(phaseEnd);

        // Plethysmografia SpO2
        const getSpo2Y = (phase: number) => {
          if (phase < 0.25) return 24 - (phase / 0.25) * 44;
          if (phase < 0.45) return -18 + ((phase - 0.25) / 0.2) * 16;
          if (phase < 0.6) return -2 - Math.sin(((phase - 0.45) / 0.15) * Math.PI) * 8;
          return ((phase - 0.6) / 0.4) * 24;
        };
        ySpo2Start = height / 2 + getSpo2Y(phaseStart);
        ySpo2End = height / 2 + getSpo2Y(phaseEnd);
      }

      // Onda Respiratória
      const respFreq = currentResp > 0 ? currentResp : 16;
      const respPeriodX = 600 / (respFreq / 10);
      yRespStart = height / 2 + Math.sin((x * Math.PI * 2) / respPeriodX) * 25;
      yRespEnd = height / 2 + Math.sin(((x + step) * Math.PI * 2) / respPeriodX) * 25;

      // Traçado ECG (Verde Esmeralda)
      ecgCtx.beginPath();
      ecgCtx.strokeStyle = '#10b981';
      ecgCtx.lineWidth = 2;
      ecgCtx.shadowColor = '#10b981';
      ecgCtx.shadowBlur = 4;
      ecgCtx.moveTo(x, yEcgStart);
      ecgCtx.lineTo(x + step, yEcgEnd);
      ecgCtx.stroke();

      // Traçado SpO2 (Ciano Brilhante)
      spo2Ctx.beginPath();
      spo2Ctx.strokeStyle = '#06b6d4';
      spo2Ctx.lineWidth = 2;
      spo2Ctx.shadowColor = '#06b6d4';
      spo2Ctx.shadowBlur = 4;
      spo2Ctx.moveTo(x, ySpo2Start);
      spo2Ctx.lineTo(x + step, ySpo2End);
      spo2Ctx.stroke();

      // Traçado RESP (Âmbar Suave)
      respCtx.beginPath();
      respCtx.strokeStyle = '#f59e0b';
      respCtx.lineWidth = 2;
      respCtx.shadowColor = '#f59e0b';
      respCtx.shadowBlur = 3;
      respCtx.moveTo(x, yRespStart);
      respCtx.lineTo(x + step, yRespEnd);
      respCtx.stroke();

      x += step;
      if (x > width) {
        x = 0;
        ecgCtx.clearRect(0, 0, width, height);
        spo2Ctx.clearRect(0, 0, width, height);
        respCtx.clearRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeTab, currentBpm, currentResp]);

  // Classificação Clínica da Pressão Arterial (Diretrizes Brasileiras de Hipertensão)
  const bpAnalysis = useMemo(() => {
    const parts = currentPressao.split('/');
    if (parts.length !== 2) return { text: 'Classificação N/D', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    const sist = parseInt(parts[0]);
    const diast = parseInt(parts[1]);
    if (isNaN(sist) || isNaN(diast)) return { text: 'Classificação N/D', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };

    if (sist < 90 || diast < 60) {
      return { text: 'Hipotensão Arterial', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    }
    if (sist < 120 && diast < 80) {
      return { text: 'Pressão Ótima / Ideal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }
    if (sist <= 129 && diast < 80) {
      return { text: 'Pressão Normal', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' };
    }
    if ((sist >= 130 && sist <= 139) || (diast >= 80 && diast <= 89)) {
      return { text: 'Pré-Hipertensão', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    if ((sist >= 140 && sist <= 159) || (diast >= 90 && diast <= 99)) {
      return { text: 'Hipertensão Estágio 1', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
    }
    return { text: 'Hipertensão Estágio 2 / Alerta', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse' };
  }, [currentPressao]);

  // Classificação da Frequência Cardíaca
  const hrAnalysis = useMemo(() => {
    if (currentBpm < 60) return { text: 'Bradicardia', color: 'text-amber-400' };
    if (currentBpm <= 100) return { text: 'Normocárdico', color: 'text-emerald-400' };
    return { text: 'Taquicardia', color: 'text-rose-400' };
  }, [currentBpm]);

  // Classificação de SpO2
  const spo2Analysis = useMemo(() => {
    if (currentSpo2 >= 95) return { text: 'Adequada (≥95%)', color: 'text-cyan-400' };
    if (currentSpo2 >= 91) return { text: 'Atenção (91-94%)', color: 'text-amber-400' };
    return { text: 'Dessaturação / Hipóxia', color: 'text-rose-400 animate-pulse' };
  }, [currentSpo2]);

  // Salva edições manuais
  const handleSaveVitalsEdit = () => {
    const newPa = `${editPaSistolica}/${editPaDiastolica}`;
    setCurrentPressao(newPa);
    setIsEditingVitals(false);

    if (onUpdateVitals) {
      onUpdateVitals({
        bpm: currentBpm,
        spo2: currentSpo2,
        resp: currentResp,
        pressao: newPa,
        temp: currentTemp,
        glicemia: currentGlicemia,
        soroName: selectedSolution,
        soroRate: `${gotasPorMin} gotas/min`,
        soroVolume: volumeTotalMl
      });
    }
    toast.success("Sinais vitais atualizados no prontuário!");
  };

  // Copia resumo de sinais vitais para a conduta / exame físico
  const handleCopyVitalsToNote = () => {
    const summary = `SINAIS VITAIS AFERIDOS:\n• Pressão Arterial: ${currentPressao} mmHg (${bpAnalysis.text})\n• Frequência Cardíaca: ${currentBpm} bpm (${hrAnalysis.text})\n• Saturação de O2: ${currentSpo2}% (${spo2Analysis.text})\n• Frequência Respiratória: ${currentResp} rpm\n• Temperatura Axilar: ${currentTemp} °C\n• Glicemia Capilar (HGT): ${currentGlicemia} mg/dL`;
    if (onAppendClinicalNote) {
      onAppendClinicalNote(summary);
    } else {
      navigator.clipboard.writeText(summary);
      toast.success("Sinais vitais copiados para a área de transferência!");
    }
  };

  // Controles da Soroterapia
  const handleStartInfusion = () => {
    setIsInfusionRunning(true);
    if (!infusionStartTime) {
      setInfusionStartTime(new Date());
    }
    toast.success(`Infusão de ${selectedSolution} iniciada a ${gotasPorMin} gotas/min!`);
  };

  const handlePauseInfusion = () => {
    setIsInfusionRunning(false);
    toast("Infusão em pausa.");
  };

  const handleResetInfusion = () => {
    setIsInfusionRunning(false);
    setElapsedSeconds(0);
    setInfusionStartTime(null);
    toast("Cronômetro da infusão zerado.");
  };

  const handleSimulateFastForward = () => {
    // Avança 10 minutos para demonstração rápida
    setElapsedSeconds(prev => Math.min(totalEstimatedSeconds, prev + 600));
    toast.success("Avançado 10 minutos na simulação da infusão!");
  };

  // Registra o procedimento no prontuário
  const handleRegisterInfusionProcedure = () => {
    const now = new Date();
    const horaInicioStr = infusionStartTime 
      ? infusionStartTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
      : 'Início da sessão';
    const horaFimStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const note = `PROCEDIMENTO DE SOROTERAPIA / INFUSÃO PARENTERAL:\n• Protocolo: ${selectedSolution} (${volumeTotalMl} mL)\n• Taxa de Gotejamento: ${gotasPorMin} gotas/min (~${Math.round(gotasPorMin * 3)} mL/h)\n• Volume Infundido: ${currentInfundedMl} mL de ${volumeTotalMl} mL (${infusionProgressPercent}%)\n• Duração / Horário: ${horaInicioStr} às ${horaFimStr} (${Math.round(elapsedSeconds / 60)} min decorridos)\n• Monitoramento Hemodinâmico: PA ${currentPressao} mmHg, FC ${currentBpm} bpm, SpO2 ${currentSpo2}%\n• Tolerância: Boa tolerância clínica pelo paciente, sem queixas álgicas locais ou sinais de hipersensibilidade. Punção venosa pérvia e sítio limpo.`;

    if (onAppendClinicalNote) {
      onAppendClinicalNote(note);
    } else {
      navigator.clipboard.writeText(note);
      toast.success("Nota do procedimento copiada!");
    }
  };

  const formatMinutesSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-slate-950 text-white border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-xl ${className}`}>
      
      {/* Luz ambiente sutil de fundo */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* CABEÇALHO DO MONITOR */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        
        {/* Identificação e Título */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-tight flex items-center gap-2">
                Painel Clínico de Sinais Vitais & Procedimentos
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Tempo Real
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {activeTab === 'triagem' 
                ? 'Triagem ambulatorial, classificação de risco & aferições rápidas' 
                : 'Monitoramento cirúrgico contínuo, sedação & soroterapia parenteral'}
            </p>
          </div>
        </div>

        {/* Controles de Navegação & Ajuda */}
        <div className="flex items-center gap-2">
          
          {/* Seletor de Modo */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('triagem')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'triagem'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Consulta & Triagem</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('procedimento')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'procedimento'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Soro & Sedação</span>
            </button>
          </div>

          {/* Botão Guia Didático */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition-all shadow-xs"
            title="Como usar na vida real? (Guia Clínico)"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Como usar na vida real?</span>
          </button>

          {/* Fechar / Recolher */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
              title="Fechar Monitor"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO: MODO 1 - CONSULTA & TRIAGEM RÁPIDA */}
      {activeTab === 'triagem' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {/* Grid de 5 Parâmetros Vitais Clínicos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* 1. Pressão Arterial */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">Pressão (PA)</span>
                <span className="text-[10px] text-slate-500">mmHg</span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {currentPressao}
                </span>
              </div>
              <div className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block ${bpAnalysis.color}`}>
                {bpAnalysis.text}
              </div>

              {/* Botões rápidos de ajuste */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const [s, d] = currentPressao.split('/').map(n => parseInt(n) || 0);
                      const np = `${Math.max(60, s - 5)}/${Math.max(40, d - 5)}`;
                      setCurrentPressao(np);
                      if (onUpdateVitals) onUpdateVitals({ bpm: currentBpm, spo2: currentSpo2, resp: currentResp, pressao: np, temp: currentTemp, glicemia: currentGlicemia });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="-5 mmHg"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const [s, d] = currentPressao.split('/').map(n => parseInt(n) || 0);
                      const np = `${s + 5}/${d + 5}`;
                      setCurrentPressao(np);
                      if (onUpdateVitals) onUpdateVitals({ bpm: currentBpm, spo2: currentSpo2, resp: currentResp, pressao: np, temp: currentTemp, glicemia: currentGlicemia });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="+5 mmHg"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingVitals(true)}
                  className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>Digitar</span>
                </button>
              </div>
            </div>

            {/* 2. Frequência Cardíaca */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-400 flex items-center gap-1">
                  <Heart className="w-3 h-3 animate-pulse text-rose-400" />
                  Frequência (FC)
                </span>
                <span className="text-[10px] text-slate-500">bpm</span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                  {currentBpm}
                </span>
              </div>
              <div className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block bg-slate-800/80 border-slate-700 ${hrAnalysis.color}`}>
                {hrAnalysis.text}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nb = Math.max(30, currentBpm - 5);
                      setCurrentBpm(nb);
                      if (onUpdateVitals) onUpdateVitals({ bpm: nb, spo2: currentSpo2, resp: currentResp, pressao: currentPressao, temp: currentTemp, glicemia: currentGlicemia });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="-5 bpm"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nb = currentBpm + 5;
                      setCurrentBpm(nb);
                      if (onUpdateVitals) onUpdateVitals({ bpm: nb, spo2: currentSpo2, resp: currentResp, pressao: currentPressao, temp: currentTemp, glicemia: currentGlicemia });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="+5 bpm"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">60-100</span>
              </div>
            </div>

            {/* 3. Saturação de Oxigênio (SpO2) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-cyan-400">Oxigenação (SpO2)</span>
                <span className="text-[10px] text-slate-500">%</span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 tracking-tight">
                  {currentSpo2}%
                </span>
              </div>
              <div className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block bg-slate-800/80 border-slate-700 ${spo2Analysis.color}`}>
                {spo2Analysis.text}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const ns = Math.max(70, currentSpo2 - 1);
                      setCurrentSpo2(ns);
                      if (onUpdateVitals) onUpdateVitals({ bpm: currentBpm, spo2: ns, resp: currentResp, pressao: currentPressao, temp: currentTemp, glicemia: currentGlicemia });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="-1%"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ns = Math.min(100, currentSpo2 + 1);
                      setCurrentSpo2(ns);
                      if (onUpdateVitals) onUpdateVitals({ bpm: currentBpm, spo2: ns, resp: currentResp, pressao: currentPressao, temp: currentTemp, glicemia: currentGlicemia });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="+1%"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">≥ 95%</span>
              </div>
            </div>

            {/* 4. Temperatura */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400 flex items-center gap-1">
                  <Thermometer className="w-3 h-3" />
                  Temperatura
                </span>
                <span className="text-[10px] text-slate-500">°C</span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                  {currentTemp.toFixed(1)}°
                </span>
              </div>
              <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block bg-slate-800/80 border-slate-700 text-slate-300">
                {currentTemp < 37.3 ? 'Afebril (Normal)' : currentTemp < 37.8 ? 'Subfebril' : 'Estado Febril'}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nt = parseFloat((currentTemp - 0.2).toFixed(1));
                      setCurrentTemp(nt);
                      if (onUpdateVitals) onUpdateVitals({ bpm: currentBpm, spo2: currentSpo2, resp: currentResp, pressao: currentPressao, temp: nt, glicemia: currentGlicemia });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="-0.2 °C"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nt = parseFloat((currentTemp + 0.2).toFixed(1));
                      setCurrentTemp(nt);
                      if (onUpdateVitals) onUpdateVitals({ bpm: currentBpm, spo2: currentSpo2, resp: currentResp, pressao: currentPressao, temp: nt, glicemia: currentGlicemia });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="+0.2 °C"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Axilar</span>
              </div>
            </div>

            {/* 5. Glicemia Capilar (HGT) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden group hover:border-slate-700 transition-all col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-purple-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Glicemia (HGT)
                </span>
                <span className="text-[10px] text-slate-500">mg/dL</span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-purple-300 tracking-tight">
                  {currentGlicemia}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block bg-slate-800/80 border-slate-700 text-purple-300">
                {currentGlicemia < 100 ? 'Jejum Normal' : currentGlicemia <= 125 ? 'Tolerância Alterada' : 'Glicemia Elevada'}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const ng = Math.max(40, currentGlicemia - 5);
                      setCurrentGlicemia(ng);
                      if (onUpdateVitals) onUpdateVitals({ bpm: currentBpm, spo2: currentSpo2, resp: currentResp, pressao: currentPressao, temp: currentTemp, glicemia: ng });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="-5 mg/dL"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ng = currentGlicemia + 5;
                      setCurrentGlicemia(ng);
                      if (onUpdateVitals) onUpdateVitals({ bpm: currentBpm, spo2: currentSpo2, resp: currentResp, pressao: currentPressao, temp: currentTemp, glicemia: ng });
                    }}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    title="+5 mg/dL"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Capilar</span>
              </div>
            </div>

          </div>

          {/* Barra de Ações Rápidas da Triagem */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>
                <strong>Dica de Produtividade:</strong> O profissional pode apenas ditar na gravação de voz: 
                <span className="text-slate-300 italic"> "Pressão 120 por 80, batimentos 72, saturação 98"</span> e a IA atualiza automaticamente.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyVitalsToNote}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Copiar para o Exame Físico / Evolução</span>
              </button>
            </div>
          </div>

          {/* Modal Inline de Edição Direta de Valores */}
          {isEditingVitals && (
            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Digitar Aferição Precisa de Sinais Vitais
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingVitals(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">PA Sistólica (Máx)</label>
                  <input
                    type="number"
                    value={editPaSistolica}
                    onChange={(e) => setEditPaSistolica(parseInt(e.target.value) || 120)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">PA Diastólica (Mín)</label>
                  <input
                    type="number"
                    value={editPaDiastolica}
                    onChange={(e) => setEditPaDiastolica(parseInt(e.target.value) || 80)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">FC (bpm)</label>
                  <input
                    type="number"
                    value={currentBpm}
                    onChange={(e) => setCurrentBpm(parseInt(e.target.value) || 75)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={currentSpo2}
                    onChange={(e) => setCurrentSpo2(parseInt(e.target.value) || 98)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-cyan-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveVitalsEdit}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Aferição</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* CONTEÚDO: MODO 2 - PROCEDIMENTO, SOROTERAPIA & SEDAÇÃO CIRÚRGICA */}
      {activeTab === 'procedimento' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          
          {/* PAINEL SUPERIOR: ONDAS CONTÍNUAS (ECG, SpO2 PLETH, RESP) + VALORES */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Traçados Gráficos em Tempo Real */}
            <div className="lg:col-span-3 space-y-2 bg-slate-950/80 rounded-2xl p-3 sm:p-4 border border-slate-800/90 relative overflow-hidden shadow-inner">
              
              {/* Onda ECG */}
              <div className="relative">
                <div className="flex items-center justify-between absolute top-1 left-2 right-2 pointer-events-none">
                  <span className="text-[10px] text-emerald-400 font-bold font-mono tracking-widest uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    II - ELETROCARDIOGRAMA (ECG AMBULATORIAL)
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold">
                    {currentBpm} bpm
                  </span>
                </div>
                <canvas ref={ecgCanvasRef} width={600} height={80} className="w-full h-16 sm:h-18 bg-transparent" />
              </div>

              {/* Onda SpO2 Pleth */}
              <div className="relative border-t border-slate-800/60 pt-2">
                <div className="flex items-center justify-between absolute top-2 left-2 right-2 pointer-events-none">
                  <span className="text-[10px] text-cyan-400 font-bold font-mono tracking-widest uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    SpO2 - PLETISMOGRAFIA DE PULSO
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono font-bold">
                    {currentSpo2}%
                  </span>
                </div>
                <canvas ref={spo2CanvasRef} width={600} height={80} className="w-full h-16 sm:h-18 bg-transparent" />
              </div>

              {/* Onda Respiratória */}
              <div className="relative border-t border-slate-800/60 pt-2">
                <div className="flex items-center justify-between absolute top-2 left-2 right-2 pointer-events-none">
                  <span className="text-[10px] text-amber-400 font-bold font-mono tracking-widest uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    RESP - MECÂNICA RESPIRATÓRIA
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono font-bold">
                    {currentResp} rpm
                  </span>
                </div>
                <canvas ref={respCanvasRef} width={600} height={80} className="w-full h-16 sm:h-18 bg-transparent" />
              </div>

            </div>

            {/* Painel Numérico Lateral */}
            <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-2.5">
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">FC (bpm)</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 mt-0.5">
                  {currentBpm}
                </span>
                <span className="text-[10px] text-slate-400">{hrAnalysis.text}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">SpO2 (%)</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-400 mt-0.5">
                  {currentSpo2}%
                </span>
                <span className="text-[10px] text-slate-400">{spo2Analysis.text}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">PA (mmHg)</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
                  {currentPressao}
                </span>
                <span className={`text-[10px] font-semibold ${bpAnalysis.color.split(' ')[0]}`}>{bpAnalysis.text}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">RESP (rpm)</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-0.5">
                  {currentResp}
                </span>
                <span className="text-[10px] text-slate-400">Eupneico</span>
              </div>

            </div>

          </div>

          {/* MÓDULO ATIVO DE SOROTERAPIA & INFUSÃO PARENTERAL */}
          <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/40 border border-blue-500/20 rounded-2xl p-4 sm:p-5 shadow-xl">
            
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-blue-400 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Controle de Soroterapia Parenteral & Sedação
                    {isInfusionRunning && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                        INFUSÃO ATIVA
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Calculador de vazão em gotas/minuto, cronômetro regressivo com alerta sonoro e registro em prontuário
                  </p>
                </div>
              </div>

              {/* Botão Mudo/Som */}
              <button
                type="button"
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
                title={isSoundMuted ? "Ativar alertas sonoros" : "Silenciar alertas sonoros"}
              >
                {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="text-[11px]">{isSoundMuted ? 'Mudo' : 'Som Ativo'}</span>
              </button>
            </div>

            {/* Presets de Soluções Clínicas */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Selecione o Protocolo de Soro / Injetável:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PRESET_SOLUTIONS.map((sol) => (
                  <button
                    key={sol.name}
                    type="button"
                    onClick={() => {
                      setSelectedSolution(sol.name);
                      setVolumeTotalMl(sol.volume);
                      setGotasPorMin(sol.gotas);
                      setElapsedSeconds(0);
                      setIsInfusionRunning(false);
                      setInfusionStartTime(null);
                    }}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      selectedSolution === sol.name
                        ? 'bg-blue-600/20 border-blue-400 text-white shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{sol.name}</span>
                      <span className="text-[10px] text-blue-400 font-mono">{sol.volume}ml</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{sol.ind}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parâmetros da Infusão (Volume + Gotas/min) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Volume da Bolsa</label>
                <div className="flex gap-1">
                  {[100, 250, 500, 1000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVolumeTotalMl(v)}
                      className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-all ${
                        volumeTotalMl === v ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {v}ml
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Gotejamento (Gotas/min)</label>
                <div className="flex gap-1">
                  {[14, 21, 28, 42].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGotasPorMin(g)}
                      className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-all ${
                        gotasPorMin === g ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {g} gts
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tempo Previsto de Infusão</label>
                <div className="py-1 px-2.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-emerald-300 font-bold flex items-center justify-between">
                  <span>~{totalEstimatedMinutes} minutos</span>
                  <span className="text-[10px] text-slate-400">({Math.round(gotasPorMin * 3)} mL/h)</span>
                </div>
              </div>
            </div>

            {/* BARRA DE PROGRESSO & CONTADORES */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Tempo Decorrido: <strong>{formatMinutesSeconds(elapsedSeconds)}</strong> / {formatMinutesSeconds(totalEstimatedSeconds)}
                </span>
                <span className="text-emerald-400 font-bold">
                  {currentInfundedMl} mL infundidos ({infusionProgressPercent}%)
                </span>
              </div>

              {/* Barra Animada */}
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    infusionProgressPercent >= 90
                      ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                      : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400'
                  }`}
                  style={{ width: `${infusionProgressPercent}%` }}
                />
              </div>
            </div>

            {/* BOTÕES DE CONTROLE DA INFUSÃO */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {!isInfusionRunning ? (
                  <button
                    type="button"
                    onClick={handleStartInfusion}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar Infusão</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseInfusion}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/30"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pausar Infusão</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetInfusion}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
                  title="Zerar Cronômetro"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Zerar</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateFastForward}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-medium transition-all"
                  title="Simular Avanço de 10 min para teste"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>+10 min (Teste)</span>
                </button>
              </div>

              {/* Botão Gravar no Prontuário */}
              <button
                type="button"
                onClick={handleRegisterInfusionProcedure}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
              >
                <FileText className="w-4 h-4" />
                <span>📋 Gravar Procedimento na Evolução</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* RODAPÉ INFORMATIVO */}
      {resumo_clinico && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="italic">{resumo_clinico}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Ambulatório IA • Protocolo Clínico
          </span>
        </div>
      )}

      {/* MODAL DIDÁTICO: "COMO USAR NA VIDA REAL?" (Renderizado via Portal no document.body para nunca ficar preso) */}
      {showHelpModal && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHelpModal(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Header com botão fechar bem evidente e fixo */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Guia Prático: Como usar este Módulo na Vida Real?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Entenda onde e como este painel resolve demandas clínicas reais na rotina diária e em procedimentos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-semibold transition-all border border-slate-700 hover:border-rose-500/40 shrink-0 ml-3 cursor-pointer"
                title="Fechar Guia (ou pressione Esc)"
              >
                <X className="w-4 h-4" />
                <span>Fechar</span>
              </button>
            </div>

            {/* Conteúdo com scroll interno garantido */}
            <div className="p-5 space-y-4 text-xs text-slate-300 leading-relaxed overflow-y-auto flex-1">
              {/* Cenário 1: Soroterapia Integrativa */}
              <div className="bg-slate-950/70 border border-blue-500/30 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-blue-300 flex items-center gap-2 mb-1.5">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  1. Na Soroterapia & Protocolos Injetáveis (Medicina & Terapias Integrativas)
                </h4>
                <p className="text-slate-300">
                  Nas salas de procedimentos integrativos, o paciente senta na poltrona para receber infusão de soro com vitaminas, glutationa, quelantes ou eletrólitos.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400 pl-1">
                  <li>Selecione o soro na lista (ex: <em>Myer's Cocktail 250ml</em> a <em>28 gotas/min</em>).</li>
                  <li>Clique em <strong>"Iniciar Infusão"</strong>: o cronômetro começa a contar o tempo regressivo.</li>
                  <li>Quando a bolsa atinge 90%, o sistema emite um alerta visual e aviso sonoro discreto para checagem da punção.</li>
                  <li>Ao terminar, clique em <strong>"Gravar Procedimento na Evolução"</strong> e o sistema gera o laudo da infusão com data, horários, volume e tolerância clínica automaticamente!</li>
                </ul>
              </div>

              {/* Cenário 2: Odontologia Biológica & Procedimentos Cirúrgicos */}
              <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2 mb-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  2. Em Cirurgias, Implantes & Sedação Consciente (Procedimentos Cirúrgicos & Odontologia)
                </h4>
                <p className="text-slate-300">
                  Em cirurgias ambulatoriais, remoção de amálgama ou colocação de implantes sob sedação inalatória (óxido nitroso) ou oral:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400 pl-1">
                  <li>O paciente fica monitorado com oxímetro no dedo e manguito no braço.</li>
                  <li>A equipe afere e atualiza com um clique nos botões rápidos (+ / -).</li>
                  <li>Se a saturação cair abaixo de 92% ou a pressão passar de 150/95 mmHg, o indicador emite aviso visual de atenção imediata.</li>
                  <li>Garante respaldo ético e conformidade com diretrizes regulatórias (Conselhos de Classe/Anvisa) para sedação ambulatorial.</li>
                </ul>
              </div>

              {/* Cenário 3: Consulta Rápida & IA */}
              <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  3. Na Consulta de Rotina (Alimentado por Voz ou 1 Clique)
                </h4>
                <p className="text-slate-300">
                  Você não precisa preencher formulários lentos. Enquanto o médico examina o paciente, basta falar:
                </p>
                <div className="my-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-purple-300">
                  "Pressão cento e vinte por oitenta, frequência setenta e quatro, saturação noventa e nove por cento."
                </div>
                <p className="text-slate-400">
                  A IA preenche os números grandes na hora e classifica se a pressão é Ótima, Normal ou Hipertensão pelas Diretrizes Brasileiras.
                </p>
              </div>
            </div>

            {/* Footer fixo com botão fechar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Dica: Pressione</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">Esc</kbd>
                <span>ou clique fora para sair</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Entendi, voltar ao painel</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default VitalMonitor;
