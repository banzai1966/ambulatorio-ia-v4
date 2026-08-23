import React from 'react';
import { cn } from '../../lib/utils';
import { RotateCcw } from 'lucide-react';

interface Props {
  data: Record<string, string> | undefined;
  onChange: (path: string, value: string) => void;
  onBatchChange?: (data: Record<string, string>) => void;
}

const WEXLER_SCORES = [
  { value: '0', label: '0 (Arreflexia)', color: 'bg-slate-200 text-slate-700 border-slate-300' },
  { value: '1+', label: '1+ (Hiporreflexia)', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: '2+', label: '2+ (Normorreflexia)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: '3+', label: '3+ (Hiperreflexia)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: '4+', label: '4+ (Clônus)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export default function WexlerReflexDiagram({ data = {}, onChange, onBatchChange }: Props) {
  const getScore = (key: string) => data[key] || '2+';

  const cycleScore = (key: string) => {
    const current = getScore(key);
    const order = ['0', '1+', '2+', '3+', '4+'];
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    onChange(`reflexos_wexler.${key}`, order[nextIdx]);
  };

  const handleClearAll = () => {
    if (onBatchChange) {
      onBatchChange({});
    } else {
      const keys = ['biceps_d', 'biceps_e', 'patelar_d', 'patelar_e', 'aquileu_d', 'aquileu_e', 'axiais_face', 'grasping', 'groping', 'hoffmann', 'palmo_mentoniano', 'wartenberg'];
      keys.forEach(k => onChange(`reflexos_wexler.${k}`, '2+'));
    }
  };

  const getScoreStyle = (score: string) => {
    switch (score) {
      case '0': return 'fill-slate-200 stroke-slate-400 text-slate-700 bg-slate-100';
      case '1+': return 'fill-blue-100 stroke-blue-400 text-blue-800 bg-blue-50';
      case '2+': return 'fill-emerald-200/90 stroke-emerald-500 text-emerald-950 bg-emerald-50';
      case '3+': return 'fill-amber-200 stroke-amber-500 text-amber-900 bg-amber-50';
      case '4+': return 'fill-rose-300 stroke-rose-500 text-rose-950 bg-rose-50';
      default: return 'fill-slate-100 stroke-slate-400 text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div>
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Esquema de Reflexos de Wexler & Reflexos Patológicos
          </h4>
          <p className="text-xs text-slate-500">Clique nos pontos do boneco para alternar o grau de reflexo (0 a 4+)</p>
        </div>

        {/* Legend & Clear Button */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {WEXLER_SCORES.map(s => (
            <span key={s.value} className={cn("px-2 py-0.5 rounded border font-medium", s.color)}>
              {s.value}
            </span>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold flex items-center gap-1 transition-colors cursor-pointer text-xs ml-2"
            title="Restaurar todos os reflexos para o valor padrão (2+ / Ausente)"
          >
            <RotateCcw size={12} />
            Limpar / Resetar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Interactive SVG Stickman */}
        <div className="relative flex justify-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <svg viewBox="0 0 300 380" className="w-full max-w-[280px] h-auto select-none">
            {/* Body Stick Skeleton Lines */}
            {/* Head */}
            <circle cx="150" cy="50" r="22" className="fill-slate-50 stroke-slate-700 stroke-[2]" />
            {/* Face eyes & smile */}
            <circle cx="142" cy="45" r="2" className="fill-slate-700" />
            <circle cx="158" cy="45" r="2" className="fill-slate-700" />
            <path d="M 142 56 Q 150 62 158 56" className="fill-none stroke-slate-700 stroke-[1.5]" />

            {/* Neck to Spine */}
            <line x1="150" y1="72" x2="150" y2="190" className="stroke-slate-700 stroke-[3]" />

            {/* Shoulders */}
            <line x1="90" y1="100" x2="210" y2="100" className="stroke-slate-700 stroke-[3]" />

            {/* Right Arm */}
            <line x1="90" y1="100" x2="60" y2="145" className="stroke-slate-700 stroke-[3]" />
            <line x1="60" y1="145" x2="40" y2="195" className="stroke-slate-700 stroke-[3]" />

            {/* Left Arm */}
            <line x1="210" y1="100" x2="240" y2="145" className="stroke-slate-700 stroke-[3]" />
            <line x1="240" y1="145" x2="260" y2="195" className="stroke-slate-700 stroke-[3]" />

            {/* Pelvis / Hip Line */}
            <line x1="120" y1="190" x2="180" y2="190" className="stroke-slate-700 stroke-[3]" />

            {/* Right Leg */}
            <line x1="120" y1="190" x2="100" y2="265" className="stroke-slate-700 stroke-[3]" />
            <line x1="100" y1="265" x2="80" y2="345" className="stroke-slate-700 stroke-[3]" />

            {/* Left Leg */}
            <line x1="180" y1="190" x2="200" y2="265" className="stroke-slate-700 stroke-[3]" />
            <line x1="200" y1="265" x2="220" y2="345" className="stroke-slate-700 stroke-[3]" />

            {/* REFLEX POINTS (CLICKABLE HOTSPOTS) */}
            {/* Biceps Right (elbow joint) */}
            <g className="cursor-pointer group" onClick={() => cycleScore('biceps_d')}>
              <circle cx="60" cy="145" r="14" className={getScoreStyle(getScore('biceps_d')) + " stroke-[2] transition-transform group-hover:scale-110"} />
              <text x="60" y="149" textAnchor="middle" className="text-[10px] font-bold fill-slate-800 pointer-events-none">
                {getScore('biceps_d')}
              </text>
              <text x="35" y="145" textAnchor="end" className="text-[9px] fill-slate-600 font-medium pointer-events-none">Biceps D</text>
            </g>

            {/* Biceps Left */}
            <g className="cursor-pointer group" onClick={() => cycleScore('biceps_e')}>
              <circle cx="240" cy="145" r="14" className={getScoreStyle(getScore('biceps_e')) + " stroke-[2] transition-transform group-hover:scale-110"} />
              <text x="240" y="149" textAnchor="middle" className="text-[10px] font-bold fill-slate-800 pointer-events-none">
                {getScore('biceps_e')}
              </text>
              <text x="265" y="145" textAnchor="start" className="text-[9px] fill-slate-600 font-medium pointer-events-none">Biceps E</text>
            </g>

            {/* Patelar Right (knee) */}
            <g className="cursor-pointer group" onClick={() => cycleScore('patelar_d')}>
              <circle cx="100" cy="265" r="14" className={getScoreStyle(getScore('patelar_d')) + " stroke-[2] transition-transform group-hover:scale-110"} />
              <text x="100" y="269" textAnchor="middle" className="text-[10px] font-bold fill-slate-800 pointer-events-none">
                {getScore('patelar_d')}
              </text>
              <text x="75" y="265" textAnchor="end" className="text-[9px] fill-slate-600 font-medium pointer-events-none">Patelar D</text>
            </g>

            {/* Patelar Left */}
            <g className="cursor-pointer group" onClick={() => cycleScore('patelar_e')}>
              <circle cx="200" cy="265" r="14" className={getScoreStyle(getScore('patelar_e')) + " stroke-[2] transition-transform group-hover:scale-110"} />
              <text x="200" y="269" textAnchor="middle" className="text-[10px] font-bold fill-slate-800 pointer-events-none">
                {getScore('patelar_e')}
              </text>
              <text x="225" y="265" textAnchor="start" className="text-[9px] fill-slate-600 font-medium pointer-events-none">Patelar E</text>
            </g>

            {/* Aquileu Right (ankle) */}
            <g className="cursor-pointer group" onClick={() => cycleScore('aquileu_d')}>
              <circle cx="80" cy="345" r="13" className={getScoreStyle(getScore('aquileu_d')) + " stroke-[2] transition-transform group-hover:scale-110"} />
              <text x="80" y="348" textAnchor="middle" className="text-[10px] font-bold fill-slate-800 pointer-events-none">
                {getScore('aquileu_d')}
              </text>
              <text x="58" y="345" textAnchor="end" className="text-[9px] fill-slate-600 font-medium pointer-events-none">Aquileu D</text>
            </g>

            {/* Aquileu Left */}
            <g className="cursor-pointer group" onClick={() => cycleScore('aquileu_e')}>
              <circle cx="220" cy="345" r="13" className={getScoreStyle(getScore('aquileu_e')) + " stroke-[2] transition-transform group-hover:scale-110"} />
              <text x="220" y="348" textAnchor="middle" className="text-[10px] font-bold fill-slate-800 pointer-events-none">
                {getScore('aquileu_e')}
              </text>
              <text x="242" y="345" textAnchor="start" className="text-[9px] fill-slate-600 font-medium pointer-events-none">Aquileu E</text>
            </g>
          </svg>
        </div>

        {/* Pathological / Axial Reflexes List */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
          <h5 className="font-bold text-slate-800 border-b pb-1.5 uppercase text-[10px] tracking-wide text-blue-900">Reflexos Patológicos & Axiais</h5>

          {[
            { id: 'axiais_face', label: 'Axiais da Face' },
            { id: 'grasping', label: 'Grasping (Preensão)' },
            { id: 'groping', label: 'Groping' },
            { id: 'hoffmann', label: 'Sinal de Hoffmann' },
            { id: 'palmo_mentoniano', label: 'Palmo-mentoniano' },
            { id: 'wartenberg', label: 'Sinal de Wartenberg' },
          ].map(ref => {
            const val = data[ref.id] || 'Ausente';
            return (
              <div key={ref.id} className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">{ref.label}</span>
                <div className="flex items-center gap-1">
                  {['Ausente', 'Presente'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onChange(`reflexos_wexler.${ref.id}`, opt)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[11px] font-bold transition-all",
                        val === opt
                          ? opt === 'Presente' 
                            ? 'bg-rose-600 text-white shadow-xs' 
                            : 'bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs font-semibold'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
