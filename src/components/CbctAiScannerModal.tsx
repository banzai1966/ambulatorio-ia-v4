import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Scan, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Activity, 
  Cpu, 
  FileText, 
  Check, 
  RotateCw,
  Eye,
  ShieldCheck,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ToothStatus } from './InteractiveOdontogram';

export interface CbctDetectedTooth {
  toothNumber: number;
  status: ToothStatus;
  finding: string;
  recommendation: string;
  estimatedGalvanismMv?: number;
  neuralTherapySuggested?: boolean;
}

export interface CbctScanResult {
  generalFindings: string;
  biologicalRiskLevel: 'Baixo' | 'Moderado' | 'Alto';
  detectedTeeth: CbctDetectedTooth[];
  systemicWarning: string;
  recommendedBiologicalProtocol: string;
  source?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: {
    id: string;
    title: string;
    url: string;
    type: string;
  } | null;
  patientName: string;
  onApplyFindings: (detectedTeeth: CbctDetectedTooth[], generalFindings: string) => void;
}

const SCAN_STEPS = [
  'Inicializando matriz radiológica e cortes axiais/coronais...',
  'Segmentando densidades radiopacas e microinfiltrações de amálgama...',
  'Rastreando áreas hipodensas trabeculares e cavitações NICO/FDOK...',
  'Calculando potencial galvânico estimado e sobrecarga dos meridianos...'
];

export default function CbctAiScannerModal({
  isOpen,
  onClose,
  mediaItem,
  patientName,
  onApplyFindings
}: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [result, setResult] = useState<CbctScanResult | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (isOpen && mediaItem && !result && !isScanning) {
      startScan();
    }
  }, [isOpen, mediaItem]);

  const startScan = async () => {
    if (!mediaItem) return;
    setIsScanning(true);
    setProgress(15);
    setCurrentStepIndex(0);
    setResult(null);
    setApplied(false);

    // Passo 1
    const t1 = setTimeout(() => {
      setProgress(40);
      setCurrentStepIndex(1);
    }, 1200);

    // Passo 2
    const t2 = setTimeout(() => {
      setProgress(70);
      setCurrentStepIndex(2);
    }, 2400);

    // Passo 3
    const t3 = setTimeout(() => {
      setProgress(90);
      setCurrentStepIndex(3);
    }, 3600);

    try {
      const response = await fetch('/api/analyze-cbct-tomography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: mediaItem.url,
          patientName,
          examType: mediaItem.type,
          clinicalNotes: mediaItem.title
        })
      });

      const data = await response.json();

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setProgress(100);

      setTimeout(() => {
        setIsScanning(false);
        if (data && data.detectedTeeth) {
          setResult(data);
          toast.success('Laudo tomográfico gerado com sucesso pela IA!');
        } else {
          toast.error('Não foi possível estruturar o laudo tomográfico.');
        }
      }, 600);
    } catch (err: any) {
      console.error('Erro na análise tomográfica:', err);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsScanning(false);
      toast.error('Erro ao conectar ao motor de visão do Gemini.');
    }
  };

  const handleApply = () => {
    if (!result || !result.detectedTeeth) return;
    onApplyFindings(result.detectedTeeth, result.generalFindings);
    setApplied(true);
    toast.success('Achados tomográficos integrados ao Odontograma 3D!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!isOpen || !mediaItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Superior Estilo DICOM / Cyber-Clinical */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Scan size={22} className={isScanning ? "animate-spin" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-wide">
                  Scanner Tomográfico Cone Beam & IA Biológica
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Dra. Lucy &bull; IAOMT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detecção inteligente de Amálgamas, Condutos, NICO/FDOK e Galvanismo em <span className="text-slate-200 font-semibold">{patientName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isScanning && (
              <button
                type="button"
                onClick={startScan}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                title="Re-escanear imagem"
              >
                <RotateCw size={13} />
                <span>Re-escanear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar-emerald space-y-6">
          
          {/* Se estiver escaneando, exibe HUD com animação de varredura laser */}
          {isScanning && (
            <div className="space-y-4 py-4">
              <div className="relative mx-auto max-w-lg aspect-4/3 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-black shadow-2xl flex items-center justify-center">
                <img 
                  src={mediaItem.url} 
                  alt="Escaneando" 
                  className="w-full h-full object-contain opacity-60"
                  referrerPolicy="no-referrer"
                />

                {/* Linha laser de varredura */}
                <div 
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse"
                  style={{
                    animation: 'scannerMove 2s infinite ease-in-out',
                    top: `${progress}%`,
                    transition: 'top 0.4s ease-out'
                  }}
                />

                {/* Overlay com grid e mira */}
                <div className="absolute inset-0 pointer-events-none border border-emerald-500/20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-emerald-500/40 text-center">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Cpu size={14} className="animate-spin text-teal-400" />
                      Analisando cortes tomográficos...
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">
                    {SCAN_STEPS[currentStepIndex]}
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="max-w-lg mx-auto w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Resultado do Laudo Tomográfico */}
          {!isScanning && result && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
              
              {/* Coluna Esquerda: Imagem com Badge de Risco */}
              <div className="lg:col-span-4 space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-lg">
                  <img 
                    src={mediaItem.url} 
                    alt={mediaItem.title} 
                    className="w-full max-h-[280px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider bg-slate-900/90 text-slate-200 border border-slate-700">
                    {mediaItem.type.toUpperCase()}
                  </div>
                </div>

                {/* Nível de Risco Biológico */}
                <div className={`p-3.5 rounded-2xl border ${
                  result.biologicalRiskLevel === 'Alto'
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    : result.biologicalRiskLevel === 'Moderado'
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                }`}>
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <AlertCircle size={14} />
                      Risco Biológico Tomográfico
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-black/40 border border-white/10 font-mono">
                      {result.biologicalRiskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                    Presença de {result.detectedTeeth.length} polos biológicos que requerem intervenção ou acompanhamento integrativo.
                  </p>
                </div>

                {/* Alerta Sistêmico dos Meridianos */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
                    <Activity size={13} />
                    <span>Correlação Sistêmica & Meridianos</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.systemicWarning}
                  </p>
                </div>
              </div>

              {/* Coluna Direita: Laudo Estruturado e Dentes Detectados */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Achados Gerais */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <FileText size={14} className="text-emerald-400" />
                    <span>Parecer Descritivo da Maxila & Mandíbula</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.generalFindings}
                  </p>
                </div>

                {/* Dentes e Polos Detectados */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" />
                      Polos Identificados para o Odontograma ({result.detectedTeeth.length})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Notação FDI (11 a 48)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.detectedTeeth.map((tooth) => {
                      const isAmalgam = tooth.status === 'amalgam';
                      const isNico = tooth.status === 'cavitation_nico';
                      const isEndo = tooth.status === 'endodontic';

                      return (
                        <div 
                          key={tooth.toothNumber}
                          className="p-3 bg-slate-950/90 border border-slate-800 hover:border-emerald-500/60 rounded-2xl space-y-2 transition-all shadow-md group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-mono text-xs flex items-center justify-center shadow-xs">
                                {tooth.toothNumber}
                              </span>
                              <span>Dente {tooth.toothNumber}</span>
                            </span>

                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border font-mono ${
                              isAmalgam ? 'bg-slate-800 text-slate-200 border-slate-600' :
                              isNico ? 'bg-rose-950/80 text-rose-300 border-rose-700' :
                              isEndo ? 'bg-orange-950/80 text-orange-300 border-orange-700' :
                              'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                            }`}>
                              {tooth.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 leading-snug">
                            <strong className="text-slate-400">Achado:</strong> {tooth.finding}
                          </div>

                          <div className="text-[11px] text-emerald-300 leading-snug bg-emerald-950/30 p-2 rounded-xl border border-emerald-900/40">
                            <strong className="text-emerald-400">Conduta:</strong> {tooth.recommendation}
                          </div>

                          {/* Se houver galvanismo sugerido */}
                          {tooth.estimatedGalvanismMv !== undefined && (
                            <div className="flex items-center justify-between text-[10px] font-mono px-2 py-1 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-300 font-bold">
                              <span className="flex items-center gap-1">
                                <Zap size={11} className="text-amber-400" />
                                Galvanismo Estimado:
                              </span>
                              <span>+{tooth.estimatedGalvanismMv} mV</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Protocolo Recomendado */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-800/60 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Award size={13} />
                    <span>Plano Cirúrgico Biológico Recomendado</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {result.recommendedBiologicalProtocol}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>Laudo gerado sob diretrizes biológicas de IAOMT e Medicina Integrativa</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {!isScanning && result && (
              <button
                type="button"
                onClick={handleApply}
                disabled={applied}
                className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {applied ? (
                  <>
                    <Check size={16} />
                    <span>Achados Aplicados no Odontograma!</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-300" />
                    <span>✨ Aplicar Achados no Odontograma 3D</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
