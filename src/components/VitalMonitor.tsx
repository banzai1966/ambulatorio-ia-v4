import React, { useEffect, useRef, useState } from 'react';

interface VitalMonitorProps {
  bpm?: number;
  spo2?: number;
  resp?: number;
  pressao?: string;
  resumo_clinico?: string;
  className?: string;
}

const VitalMonitor: React.FC<VitalMonitorProps> = ({ 
  bpm = 0, 
  spo2 = 0, 
  resp = 0,
  pressao,
  resumo_clinico,
  className 
}) => {
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const spo2CanvasRef = useRef<HTMLCanvasElement>(null);
  const respCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentBpm, setCurrentBpm] = useState(bpm);

  useEffect(() => {
    setCurrentBpm(bpm || 0);
  }, [bpm]);

  useEffect(() => {
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
    const step = 2; // Velocidade da varredura

    const draw = () => {
      const width = ecgCanvas.width;
      const height = ecgCanvas.height;

      // Efeito de "rastro" (Motion Blur)
      ecgCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ecgCtx.fillRect(x, 0, 20, height);
      spo2Ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      spo2Ctx.fillRect(x, 0, 20, height);
      respCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      respCtx.fillRect(x, 0, 20, height);

      // --- Variáveis de Desenho ---
      let yEcgStart = height / 2;
      let yEcgEnd = height / 2;
      let ySpo2Start = height / 2 + 20;
      let ySpo2End = height / 2 + 20;
      let yRespStart = height / 2;
      let yRespEnd = height / 2;

      if (currentBpm && currentBpm > 0) {
        const speedMultiplier = currentBpm / 60;
        const periodX = 180 / speedMultiplier; // Pixels per beat (adjusted for better visual scale)
        
        const phaseStart = (x % periodX) / periodX;
        const phaseEnd = ((x + step) % periodX) / periodX;

        // ECG Wave logic
        const getEcgY = (phase: number) => {
            if (phase > 0.05 && phase < 0.1) return -15; // P
            if (phase > 0.15 && phase < 0.17) return 10;  // Q
            if (phase >= 0.17 && phase < 0.20) return -70; // R
            if (phase >= 0.20 && phase < 0.23) return 20;  // S
            if (phase > 0.35 && phase < 0.45) return -20;  // T
            return 0;
        };
        
        yEcgStart = height / 2 + getEcgY(phaseStart);
        yEcgEnd = height / 2 + getEcgY(phaseEnd);

        // SpO2 (Pleth) Wave logic
        const getSpo2Y = (phase: number) => {
            if (phase < 0.25) return 30 - (phase / 0.25) * 50; // Systolic rise
            if (phase < 0.45) return -20 + ((phase - 0.25) / 0.2) * 20; // Fall to dicrotic notch
            if (phase < 0.6) return 0 - Math.sin(((phase - 0.45) / 0.15) * Math.PI) * 10; // Dicrotic notch bump
            return ((phase - 0.6) / 0.4) * 30; // Diastolic fall
        };

        ySpo2Start = height / 2 + getSpo2Y(phaseStart);
        ySpo2End = height / 2 + getSpo2Y(phaseEnd);
      }
      
      // Respiratória (Onda mais lenta)
      const respFreq = resp > 0 ? resp : 16;
      const respPeriodX = 600 / (respFreq / 10); // Lenta
      yRespStart = height / 2 + Math.sin(x * Math.PI * 2 / respPeriodX) * 35;
      yRespEnd = height / 2 + Math.sin((x + step) * Math.PI * 2 / respPeriodX) * 35;


      // --- Desenho ECG ---
      ecgCtx.beginPath();
      ecgCtx.strokeStyle = '#4ade80'; // Verde brilhante
      ecgCtx.lineWidth = 2;
      ecgCtx.moveTo(x, yEcgStart);
      ecgCtx.lineTo(x + step, yEcgEnd);
      ecgCtx.stroke();

      // --- Desenho SpO2 ---
      spo2Ctx.beginPath();
      spo2Ctx.strokeStyle = '#22d3ee'; // Ciano
      spo2Ctx.lineWidth = 2;
      spo2Ctx.moveTo(x, ySpo2Start);
      spo2Ctx.lineTo(x + step, ySpo2End);
      spo2Ctx.stroke();

      // --- Desenho RESP ---
      respCtx.beginPath();
      respCtx.strokeStyle = '#facc15'; // Amarelo
      respCtx.lineWidth = 2;
      // Se não tem dados de respiração, traça linha reta ou onda padrão, nós usamos padrão lenta
      if (resp === 0 && !currentBpm) {
          respCtx.moveTo(x, height / 2);
          respCtx.lineTo(x + step, height / 2);
      } else {
          respCtx.moveTo(x, yRespStart);
          respCtx.lineTo(x + step, yRespEnd);
      }
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
  }, [currentBpm, resp]);

  return (
    <div className={`bg-gray-950/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${className}`}>
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-white/40 font-mono text-sm tracking-widest uppercase flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Monitor Multiparamétrico IA
        </h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Gráficos em tempo real */}
        <div className="lg:col-span-3 space-y-3 bg-black/60 rounded-2xl p-4 border border-white/5">
          <div className="relative">
            <span className="absolute top-0 left-0 text-[10px] text-green-500 font-bold tracking-widest uppercase">II - ECG</span>
            <canvas ref={ecgCanvasRef} width={600} height={100} className="w-full h-16 sm:h-20 bg-transparent" />
          </div>
          <div className="relative border-t border-white/5 pt-3">
            <span className="absolute top-3 left-0 text-[10px] text-cyan-500 font-bold tracking-widest uppercase">SpO2 - Pleth</span>
            <canvas ref={spo2CanvasRef} width={600} height={100} className="w-full h-16 sm:h-20 bg-transparent" />
          </div>
          <div className="relative border-t border-white/5 pt-3">
            <span className="absolute top-3 left-0 text-[10px] text-yellow-500 font-bold tracking-widest uppercase">Resp</span>
            <canvas ref={respCanvasRef} width={600} height={100} className="w-full h-16 sm:h-20 bg-transparent" />
          </div>
        </div>

        {/* Valores Numéricos */}
        <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4 py-2 content-around">
          
          <div className="group transition-all text-center lg:text-left bg-black/40 lg:bg-transparent rounded-xl lg:rounded-none p-3 lg:p-0">
            <p className="text-green-500 text-[10px] sm:text-xs font-bold tracking-tighter uppercase">FC <span className="opacity-50 lowercase">bpm</span></p>
            <h2 className={`text-4xl sm:text-5xl xl:text-6xl font-black text-green-400 font-mono drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] ${currentBpm === 0 || !currentBpm ? 'opacity-20' : 'animate-pulse'}`}>
              {currentBpm && currentBpm > 0 ? currentBpm : '--'}
            </h2>
          </div>

          <div className="group transition-all text-center lg:text-left bg-black/40 lg:bg-transparent rounded-xl lg:rounded-none p-3 lg:p-0">
            <p className="text-cyan-500 text-[10px] sm:text-xs font-bold tracking-tighter uppercase">SpO2 <span className="opacity-50 lowercase">%</span></p>
            <h2 className={`text-4xl sm:text-5xl xl:text-6xl font-black text-cyan-400 font-mono drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] ${!spo2 ? 'opacity-20' : ''}`}>
              {spo2 ? spo2 : '--'}
            </h2>
          </div>

          <div className="group transition-all text-center lg:text-left bg-black/40 lg:bg-transparent rounded-xl lg:rounded-none p-3 lg:p-0">
            <p className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-tighter uppercase">FR <span className="opacity-50 lowercase">rpm</span></p>
            <h2 className={`text-4xl sm:text-5xl xl:text-6xl font-black text-yellow-400 font-mono drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] ${!resp ? 'opacity-20' : ''}`}>
              {resp ? resp : '--'}
            </h2>
          </div>

          <div className="group transition-all text-center lg:text-left bg-black/40 lg:bg-transparent rounded-xl lg:rounded-none p-3 lg:p-0">
            <p className="text-white/70 text-[10px] sm:text-xs font-bold tracking-tighter uppercase">PNI <span className="opacity-50 lowercase">mmHg</span></p>
            <h2 className={`text-2xl sm:text-3xl xl:text-4xl font-black text-white/90 font-mono mt-2 ${!pressao ? 'opacity-20' : ''}`}>
              {pressao ? pressao : '--/--'}
            </h2>
          </div>

        </div>

      </div>
      
      {/* Resumo Clínico Inferior */}
      {resumo_clinico && (
        <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2">
           <p className="text-white/80 text-xs sm:text-sm italic font-medium tracking-wide flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
             {resumo_clinico}
           </p>
        </div>
      )}
    </div>
  );
};

export default VitalMonitor;
