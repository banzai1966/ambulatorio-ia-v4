import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Crosshair, Pin, Trash2, Zap, RotateCcw } from 'lucide-react';

interface Point {
  x: number;
  y: number;
  label?: string;
  side: 'anterior' | 'posterior' | 'front' | 'back';
}

interface Props {
  data: Point[];
  onChange: (data: Point[]) => void;
}

export default function IntegrativeBodyMap({ data = [], onChange }: Props) {
  // Normalize side names to ensure compatibility
  const normalizedData = (data || []).map(p => ({
    ...p,
    side: (p.side === 'front' || p.side === 'anterior') ? 'anterior' : 'posterior'
  })) as Point[];

  const handleGlobalMapClick = (e: React.MouseEvent<HTMLDivElement>, side: 'anterior' | 'posterior') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
    
    const newPoint: Point = { 
      x: Number(x.toFixed(1)), 
      y: Number(y.toFixed(1)), 
      side: side,
      label: `Ponto ${normalizedData.length + 1}`
    };
    onChange([...normalizedData, newPoint]);
  };

  const removePoint = (index: number) => {
    const newData = [...normalizedData];
    newData.splice(index, 1);
    onChange(newData);
  };

  const clearAllPoints = () => {
    onChange([]);
  };

  // Modelo Anatômico SVG Músculo-Esquelético
  const BodySilhouette = ({ 
    side, 
    points, 
    onMapClick 
  }: { 
    side: 'anterior' | 'posterior', 
    points: Point[], 
    onMapClick: (e: React.MouseEvent<HTMLDivElement>, s: 'anterior' | 'posterior') => void 
  }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    return (
      <div className="flex-1 min-w-[200px] max-w-[320px] flex flex-col items-center gap-3">
        <div className="bg-slate-900 text-white text-[11px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-xs">
          {side === 'anterior' ? 'Vista Anterior' : 'Vista Posterior'}
        </div>
        
        <div 
          ref={componentRef}
          onClick={(e) => onMapClick(e, side)}
          className="relative w-full aspect-[1/2.1] bg-white rounded-3xl border-2 border-slate-200 cursor-crosshair shadow-sm overflow-hidden transition-all hover:border-slate-400 hover:shadow-md select-none"
        >
          {/* Grid de Fundo Sutil */}
          <div className="absolute inset-0 opacity-[0.03] clinical-grid pointer-events-none" />
          
          <svg viewBox="10 0 80 200" className="w-full h-full text-slate-900 fill-current drop-shadow-sm pointer-events-none">
            {/* Contorno Geral */}
            <path 
              d="M50 10 Q53 10 56 12 Q59 15 58 20 Q57 25 54 27 L54 30 Q65 32 70 40 Q75 50 78 70 Q80 90 75 95 Q70 100 68 85 L65 55 L62 90 L60 140 L65 185 Q68 195 60 195 L52 195 L51 145 L50 145 L49 145 L48 195 L40 195 Q32 195 35 185 L40 140 L38 90 L35 55 L32 85 Q30 100 25 95 Q20 90 22 70 Q25 50 30 40 Q35 32 46 30 L46 27 Q43 25 42 20 Q41 15 44 12 Q47 10 50 10 Z" 
              className="fill-slate-50/80 stroke-slate-800 stroke-[1.2]" 
            />
            
            {/* Detalhes Anatômicos */}
            <g stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.85">
              {side === 'anterior' ? (
                <>
                  <path d="M38 45 Q50 42 62 45 M38 52 Q50 49 62 52" strokeWidth="0.9" />
                  <path d="M43 65 h14 M43 73 h14 M43 81 h14" strokeWidth="0.6" />
                  <path d="M40 32 Q50 35 60 32" strokeWidth="1" />
                </>
              ) : (
                <>
                  <path d="M50 32 L50 95" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" />
                  <path d="M36 42 Q42 45 48 42 M52 42 Q58 45 64 42" strokeWidth="0.9" />
                  <path d="M38 95 Q50 108 62 95" strokeWidth="0.8" />
                </>
              )}
              <path d="M35 40 Q30 40 28 45 M65 40 Q70 40 72 45" strokeWidth="0.9" />
              <path d="M28 50 L25 75 M72 50 L75 75" strokeWidth="0.7" />
              <path d="M44 100 L41 140 M56 100 L59 140" strokeWidth="0.7" />
              <circle cx="41" cy="140" r="2.2" fill="currentColor" stroke="none" />
              <circle cx="59" cy="140" r="2.2" fill="currentColor" stroke="none" />
            </g>
          </svg>
          
          {/* Pontos Marcados */}
          {points.map((point, index) => {
            const isPointOnThisSide = (point.side === side) || (point.side === 'front' && side === 'anterior') || (point.side === 'back' && side === 'posterior');
            if (!isPointOnThisSide) return null;

            return (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={`${index}-${point.x}-${point.y}`}
                style={{ 
                  left: `${point.x}%`, 
                  top: `${point.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="absolute pointer-events-auto group/point z-30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center animate-ping absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 pointer-events-none" />
                <div className="w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-extrabold cursor-pointer hover:scale-125 transition-transform">
                  {index + 1}
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-semibold rounded-lg opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-40 shadow-lg border border-slate-700">
                  <span>{point.label || `Ponto ${index + 1}`}</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              </motion.div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-400 font-medium text-center">Clique para marcar dor/foco</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-5">
      {/* Header do Mapeamento */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Crosshair size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">Mapeamento Anatômico 360°</h3>
            <p className="text-[11px] text-slate-500 font-medium">Pontos de dor, gatilhos miofasciais e focos de biointerferência</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/70">
            {normalizedData.length} {normalizedData.length === 1 ? 'ponto' : 'pontos'}
          </span>
          {normalizedData.length > 0 && (
            <button
              type="button"
              onClick={clearAllPoints}
              className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors font-medium"
              title="Remover todos os pontos marcados"
            >
              <RotateCcw size={12} />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Silhuetas Anatômicas lado a lado */}
      <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4">
        <div className="flex flex-row justify-center items-start gap-4 sm:gap-8 flex-wrap md:flex-nowrap">
          <BodySilhouette side="anterior" points={normalizedData} onMapClick={handleGlobalMapClick} />
          <BodySilhouette side="posterior" points={normalizedData} onMapClick={handleGlobalMapClick} />
        </div>
      </div>

      {/* Lista / Gerenciamento dos Pontos Marcados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Pin size={13} className="text-red-500" />
            Detalhamento dos Pontos ({normalizedData.length})
          </h4>
          <span className="text-[10px] text-slate-400">Clique na descrição para editar</span>
        </div>

        {normalizedData.length === 0 ? (
          <div className="text-center py-6 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
            Nenhum ponto marcado. Clique nas silhuetas acima para registrar locais de dor ou queixas.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {normalizedData.map((point, index) => {
              const isAnt = (point.side === 'front' || point.side === 'anterior');
              return (
                <div 
                  key={index}
                  className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/80 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${isAnt ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {isAnt ? 'Anterior' : 'Posterior'}
                    </span>
                    <input
                      type="text"
                      value={point.label || ''}
                      onChange={(e) => {
                        const newData = [...normalizedData];
                        newData[index] = { ...newData[index], label: e.target.value };
                        onChange(newData);
                      }}
                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-xs font-semibold text-slate-800 w-full outline-none px-1 py-0.5"
                      placeholder="Descrever queixa..."
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removePoint(index)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Excluir ponto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nota Informativa */}
      <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 flex items-start gap-2.5 text-amber-900 text-xs">
        <Zap size={15} className="shrink-0 text-amber-600 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Biointerferência & Terapia Neural:</strong> Registre pontos dolorosos ou focos de interferência para correlação com o plano terapêutico e acompanhamento evolutivo.
        </p>
      </div>
    </div>
  );
}

