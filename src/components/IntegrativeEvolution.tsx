import React from 'react';
import { motion } from 'motion/react';
import { Activity, TrendingUp, AlertCircle, Crosshair } from 'lucide-react';
import { cn } from '../lib/utils';

interface Point {
  x: number;
  y: number;
  label?: string;
  side: 'front' | 'back';
}

export default function IntegrativeEvolution({ currentData, bodyMapData = [], historyRecords = [] }: { currentData: any, bodyMapData?: Point[], historyRecords?: any[] }) {
  // Simulação de visualização de evolução baseada no checklist
  const getMarkedCount = (data: any) => {
    if (!data) return 0;
    let count = 0;
    Object.values(data).forEach((section: any) => {
      if (typeof section === 'object' && section !== null) {
        Object.values(section).forEach(val => {
          if (val && val !== '' && val !== 'false' && val !== 'null' && val !== 'undefined') {
            const strVal = String(val).trim().toLowerCase();
            const noise = ['null', 'undefined', 'false', 'nan', 'rejeitado', 'não citado', 'pendente', 'rejeitado.'];
            if (!noise.includes(strVal)) count++;
          }
        });
      }
    });
    return count;
  };

  const currentCount = getMarkedCount(currentData);
  const previousCount = historyRecords.length > 0 ? getMarkedCount(historyRecords[0].checklist_integrativo) : 0;
  const diff = currentCount - previousCount;

  // Modelo Anatômico Detalhado (Sincronizado com BodyMap)
  const EvolutionSilhouette = ({ side }: { side: 'front' | 'back' }) => (
    <svg viewBox="0 0 100 200" className="h-full w-full max-h-40 mx-auto text-slate-300 fill-current drop-shadow-sm">
      <path d="M50 10 Q53 10 56 12 Q59 15 58 20 Q57 25 54 27 L54 30 Q65 32 70 40 Q75 50 78 70 Q80 90 75 95 Q70 100 68 85 L65 55 L62 90 L60 140 L65 185 Q68 195 60 195 L52 195 L51 145 L50 145 L49 145 L48 195 L40 195 Q32 195 35 185 L40 140 L38 90 L35 55 L32 85 Q30 100 25 95 Q20 90 22 70 Q25 50 30 40 Q35 32 46 30 L46 27 Q43 25 42 20 Q41 15 44 12 Q47 10 50 10 Z" className="fill-slate-50 stroke-slate-200 stroke-[0.3]" />
      <g stroke="currentColor" strokeWidth="0.2" fill="none" opacity="0.4">
        <path d="M40 45 Q50 42 60 45 M50 35 L50 95 M45 65 h10 M45 75 h10 M35 40 Q30 40 28 45 M65 40 Q70 40 72 45" />
      </g>
    </svg>
  );

  return (
    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-clinical-blue/10 rounded-xl flex items-center justify-center text-clinical-blue">
            <TrendingUp size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Evolução Integrativa</h4>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Análise de Marcadores</p>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1",
          diff <= 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        )}>
          {diff <= 0 ? <Activity size={12} /> : <AlertCircle size={12} />}
          {diff === 0 ? 'ESTÁVEL' : diff < 0 ? 'MELHORA' : 'ALERTA'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Marcadores Atuais</p>
          <p className="text-2xl font-black text-slate-800">{currentCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Anterior</p>
          <p className="text-2xl font-black text-slate-500">{previousCount}</p>
        </div>
      </div>

      {bodyMapData && bodyMapData.length > 0 ? (
        <div className="relative h-48 bg-white rounded-2xl border border-slate-100 overflow-hidden flex divide-x divide-slate-100">
          {['anterior', 'posterior'].map((side) => {
            const sidePoints = bodyMapData.filter(p => p.side === side || (side === 'anterior' && p.side === 'front') || (side === 'posterior' && p.side === 'back'));
            return (
              <div key={side} className="flex-1 relative pt-4 pb-2">
                <span className="absolute top-2 left-2 text-[9px] font-bold text-slate-400 uppercase">{side === 'anterior' ? 'Frente' : 'Costas'}</span>
                <div className="relative h-full w-full max-w-[80px] mx-auto">
                  <EvolutionSilhouette side={side as any} />
                  {sidePoints.map((point, i) => (
                    <div 
                      key={i}
                      style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                    >
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative h-48 bg-white rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center">
             <Activity size={120} className="text-clinical-blue animate-pulse" />
          </div>
          <div className="z-10 text-center space-y-2">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 20 }}
                  animate={{ height: Math.random() * 40 + 20 }}
                  transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse', delay: i * 0.2 }}
                  className={cn(
                    "w-2 rounded-full",
                    currentCount > 10 ? "bg-amber-400" : "bg-clinical-blue"
                  )}
                />
              ))}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem Pontos Físicos Mapeados</p>
          </div>
        </div>
      )}
    </div>
  );
}
