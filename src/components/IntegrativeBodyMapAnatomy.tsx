import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Map, Pin, Trash2, Crosshair, HelpCircle, Zap } from 'lucide-react';

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
  const [activeSide, setActiveSide] = useState<'anterior' | 'posterior'>('anterior');
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Normalize side names to ensure compatibility
  const normalizedData = (data || []).map(p => ({
    ...p,
    side: (p.side === 'front' || p.side === 'anterior') ? 'anterior' : 'posterior'
  })) as Point[];

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoint: Point = { x, y, side: activeSide };
    onChange([...normalizedData, newPoint]);
  };

  const removePoint = (index: number) => {
    const newData = [...normalizedData];
    newData.splice(index, 1);
    onChange(newData);
  };

  // Modelo Anatômico Detalhado (SVG Músculo-Esquelético) - v4.4 HD
  const BodySilhouette = ({ side, points, onMapClick }: { side: 'anterior' | 'posterior', points: Point[], onMapClick: (e: React.MouseEvent<HTMLDivElement>, s: 'anterior' | 'posterior') => void }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    return (
      <div className="flex flex-col items-center group w-full max-w-[600px] mx-auto transition-all duration-500 gap-4">
        <div className="bg-slate-900 border border-white/20 text-white text-[12px] px-5 py-2 rounded-full font-black uppercase tracking-[0.2em] shadow-xl">
          {side === 'anterior' ? 'VISTA ANTERIOR' : 'VISTA POSTERIOR'}
        </div>
        
        <div 
          ref={componentRef}
          onClick={(e) => onMapClick(e, side)}
          className="relative w-full aspect-[1/2.2] bg-white rounded-[60px] border-4 border-slate-200 cursor-crosshair shadow-2xl overflow-hidden transition-all hover:border-black hover:shadow-black/20 bg-gradient-to-tr from-slate-50 to-white"
        >
          {/* Grid de Fundo para Precisão */}
          <div className="absolute inset-0 opacity-[0.03] clinical-grid pointer-events-none" />
          
          <svg viewBox="10 0 80 200" className="w-full h-full text-black fill-current drop-shadow-2xl transition-all duration-700 pointer-events-none">
            {/* Contorno Geral - PRETO ABSOLUTO E DEFINIDO */}
            <path 
              d="M50 10 Q53 10 56 12 Q59 15 58 20 Q57 25 54 27 L54 30 Q65 32 70 40 Q75 50 78 70 Q80 90 75 95 Q70 100 68 85 L65 55 L62 90 L60 140 L65 185 Q68 195 60 195 L52 195 L51 145 L50 145 L49 145 L48 195 L40 195 Q32 195 35 185 L40 140 L38 90 L35 55 L32 85 Q30 100 25 95 Q20 90 22 70 Q25 50 30 40 Q35 32 46 30 L46 27 Q43 25 42 20 Q41 15 44 12 Q47 10 50 10 Z" 
              className="fill-slate-50 stroke-black stroke-[1.2]" 
            />
            
            {/* Detalhes Anatômicos Sincronizados - ALTA DEFINIÇÃO */}
            <g stroke="black" strokeWidth="0.8" fill="none" opacity="1">
              {side === 'anterior' ? (
                <>
                  <path d="M38 45 Q50 42 62 45 M38 52 Q50 49 62 52" strokeWidth="1" />
                  <path d="M43 65 h14 M43 73 h14 M43 81 h14" strokeWidth="0.6" />
                  <path d="M40 32 Q50 35 60 32" strokeWidth="1.2" />
                </>
              ) : (
                <>
                  <path d="M50 32 L50 95" strokeWidth="1.5" strokeDasharray="3 3" className="text-black/30" />
                  <path d="M36 42 Q42 45 48 42 M52 42 Q58 45 64 42" strokeWidth="1" />
                  <path d="M38 95 Q50 108 62 95" strokeWidth="0.8" />
                </>
              )}
              <path d="M35 40 Q30 40 28 45 M65 40 Q70 40 72 45" strokeWidth="1" />
              <path d="M28 50 L25 75 M72 50 L75 75" strokeWidth="0.8" />
              <path d="M44 100 L41 140 M56 100 L59 140" strokeWidth="0.8" />
              <circle cx="41" cy="140" r="2.5" fill="black" stroke="none" />
              <circle cx="59" cy="140" r="2.5" fill="black" stroke="none" />
            </g>

            {/* Sombreamento Muscular Sutil */}
            <defs>
              <linearGradient id="bodyShadeV44" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.05)" />
                <stop offset="50%" stopColor="transparent" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
              </linearGradient>
            </defs>
            <path d="M40 40 Q50 35 60 40 L58 80 Q50 85 42 80 Z" fill="url(#bodyShadeV44)" opacity="0.6" />
          </svg>
          
          {/* Active Points */}
          {points.map((point, index) => {
            const isPointOnThisSide = (point.side === side) || (point.side === 'front' && side === 'anterior') || (point.side === 'back' && side === 'posterior');
            if (!isPointOnThisSide) return null;
            
            // Offset logic for multiple points in the same coordinate
            const sameCoords = points.slice(0, index).filter(p => p.x === point.x && p.y === point.y && ((p.side === side) || (p.side === 'front' && side === 'anterior') || (p.side === 'back' && side === 'posterior'))).length;
            const offset = (sameCoords % 5) * 6;
            const yOffset = Math.floor(sameCoords / 5) * 6;

            return (
            <motion.div 
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              key={`${index}-${point.x}-${point.y}`}
              style={{ 
                left: `${point.x}%`, 
                top: `${point.y}%`,
                transform: `translate(calc(-50% + ${offset}px), calc(-50% + ${yOffset}px))`
              }}
              className="absolute pointer-events-auto group/point z-40 cursor-help"
            >
              <div className="w-12 h-12 bg-red-600/40 rounded-full flex items-center justify-center animate-ping absolute -translate-x-1/2 -translate-y-1/2" />
              <div className="w-8 h-8 bg-black rounded-full border-4 border-red-600 shadow-2xl flex items-center justify-center text-[11px] text-white font-black z-10 hover:scale-110 transition-transform">
                {index + 1}
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-white/10">
                <span className="font-bold text-red-400 capitalize">{point.label}</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </div>
            </motion.div>
          )})}

          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-900/5 to-transparent" />
        </div>
      </div>
    );
  };

  const handleGlobalMapClick = (e: React.MouseEvent<HTMLDivElement>, side: 'anterior' | 'posterior') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoint: Point = { x, y, side: side };
    onChange([...normalizedData, newPoint]);
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-4 md:p-6 space-y-6 mt-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
            <Crosshair size={28} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xl md:text-2xl uppercase tracking-tighter leading-none mb-1">SCANNER VISUAL 360°</h3>
            <p className="text-[10px] md:text-xs text-clinical-blue font-bold uppercase tracking-[0.2em] opacity-80">Mapeamento de Biointerferência</p>
          </div>
        </div>
        
        <div className="hidden xl:flex bg-slate-900 p-1.5 rounded-xl gap-2 shadow-inner">
          <div className="px-4 py-2 bg-white/10 rounded-lg text-[10px] font-bold text-white tracking-widest uppercase border border-white/10">
            Modo Integrativo v4.4 HD
          </div>
        </div>
      </div>

      <div className="flex flex-col 2xl:flex-row gap-6 items-start">
        {/* Bonecos de Alta Definição */}
        <div className="w-full 2xl:flex-1 overflow-x-auto no-scrollbar rounded-3xl bg-slate-50 border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-center gap-8 min-w-fit mx-auto">
            <BodySilhouette side="anterior" points={normalizedData} onMapClick={handleGlobalMapClick} />
            <BodySilhouette side="posterior" points={normalizedData} onMapClick={handleGlobalMapClick} />
          </div>
        </div>

        {/* Console de Registros Lateral */}
        <div className="w-full 2xl:w-[450px] flex flex-col gap-6 shrink-0">
          <div className="bg-slate-950 rounded-[45px] p-8 text-white shadow-2xl flex flex-col h-full max-h-[600px] border-b-4 border-red-600/50">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
              <div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1 block">Status do Scan</span>
                <p className="text-2xl font-black tracking-tight">{data.length} Pontos Detectados</p>
              </div>
              <div className="w-14 h-14 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-500 border border-red-600/30">
                <Pin size={28} />
              </div>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
              {data.length === 0 ? (
                <div className="text-center py-20 px-8 border-2 border-dashed border-white/5 rounded-[35px] bg-white/[0.02]">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-white/20">
                    <Crosshair size={32} />
                  </div>
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Aguardando Entrada Visual</p>
                </div>
              ) : (
                data.map((point, index) => (
                  <motion.div 
                    layout
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={index}
                    className="flex items-center justify-between bg-white/[0.03] p-4 rounded-3xl border border-white/5 hover:bg-white/[0.08] hover:border-red-600/30 transition-all group/item cursor-default"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[12px] font-black shadow-2xl border-2 ${(point.side === 'front' || point.side === 'anterior') ? 'bg-emerald-600 border-emerald-400/50 ring-4 ring-emerald-600/10' : 'bg-indigo-600 border-indigo-400/50 ring-4 ring-indigo-600/10'}`}>
                        {(point.side === 'front' || point.side === 'anterior') ? 'ANT' : 'POST'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={point.label || ''}
                          onChange={(e) => {
                            const newData = [...data];
                            newData[index] = { ...newData[index], label: e.target.value };
                            onChange(newData);
                          }}
                          className="bg-transparent border-none text-[13px] font-black text-white uppercase tracking-tight w-full outline-none focus:ring-0 p-0 mb-1 placeholder-white/40 overflow-ellipsis"
                          placeholder="DESCREVER QUEIXA..."
                        />
                        <p className="text-[10px] text-white/40 font-bold font-mono tracking-widest">COORD: {point.x.toFixed(0)}:{point.y.toFixed(0)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removePoint(index)}
                      className="p-3 text-white/10 hover:text-white hover:bg-red-600 rounded-2xl transition-all shadow-lg active:scale-95"
                    >
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-[35px] border-2 border-red-100 flex gap-4 text-red-900 shadow-xl shadow-red-900/5 animate-pulse">
            <Zap size={28} className="shrink-0 text-red-600" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1">Alerta Bioenergético</p>
              <p className="text-[11px] font-bold leading-relaxed opacity-80 uppercase italic">
                Sinalize com precisão as áreas de maior voltagem detectadas pela biorresonância.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
