import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Check, X, Sparkles } from 'lucide-react';

type DermatomeStatus = 'normal' | 'hipoestesia' | 'parestesia' | 'hiperestesia' | 'dor';

interface Props {
  data: Record<string, DermatomeStatus> | undefined;
  onChange: (dermatome: string, status: DermatomeStatus) => void;
  onBatchChange?: (data: Record<string, DermatomeStatus>) => void;
}

const STATUS_COLORS: Record<DermatomeStatus, { bg: string; text: string; border: string; fill: string; stroke: string }> = {
  normal: { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-300', fill: '#10b981', stroke: '#047857' },
  hipoestesia: { bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-400', fill: '#2563eb', stroke: '#1d4ed8' },
  parestesia: { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-300', fill: '#f59e0b', stroke: '#b45309' },
  hiperestesia: { bg: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-300', fill: '#9333ea', stroke: '#6b21a8' },
  dor: { bg: 'bg-rose-600', text: 'text-rose-700', border: 'border-rose-300', fill: '#e11d48', stroke: '#9f1239' },
};

const DERMATOME_GROUPS = [
  { name: 'Cervical', items: ['C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'] },
  { name: 'Torácica', items: ['T1', 'T2', 'T4', 'T6', 'T8', 'T10', 'T12'] },
  { name: 'Lombar', items: ['L1', 'L2', 'L3', 'L4', 'L5'] },
  { name: 'Sacral', items: ['S1', 'S2', 'S3', 'S4', 'S5'] },
];

export default function DermatomeMapDiagram({ data = {}, onChange, onBatchChange }: Props) {
  const [selectedTool, setSelectedTool] = useState<DermatomeStatus>('hipoestesia');
  const [localMap, setLocalMap] = useState<Record<string, DermatomeStatus>>(data || {});

  // Synchronize local state whenever external data changes
  React.useEffect(() => {
    if (data) {
      setLocalMap(data);
    }
  }, [data]);

  const activeData = { ...localMap, ...(data || {}) };

  const getDermatomeStatus = (code: string): DermatomeStatus => activeData[code] || 'normal';

  const getGroupStatus = (items: string[]): DermatomeStatus => {
    for (const item of items) {
      const st = getDermatomeStatus(item);
      if (st !== 'normal') return st;
    }
    return 'normal';
  };

  const handleUpdate = (updates: Record<string, DermatomeStatus>) => {
    const nextData = { ...activeData, ...updates };
    setLocalMap(nextData);
    if (onBatchChange) {
      onBatchChange(nextData);
    } else {
      Object.entries(updates).forEach(([k, v]) => onChange(k, v));
    }
  };

  const handleMultiZoneClick = (items: string[]) => {
    const allMatch = items.every(item => getDermatomeStatus(item) === selectedTool);
    const targetStatus = allMatch ? 'normal' : selectedTool;
    const updates: Record<string, DermatomeStatus> = {};
    items.forEach(item => {
      updates[item] = targetStatus;
    });
    handleUpdate(updates);
  };

  const handleClearAll = () => {
    setLocalMap({});
    if (onBatchChange) {
      onBatchChange({});
    } else {
      Object.keys(activeData).forEach(k => onChange(k, 'normal'));
    }
  };

  const markedItems = Object.entries(activeData).filter(([_, st]) => st && st !== 'normal');

  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            Mapa de Dermátomos & Raízes Nervosas Espinhais
          </h4>
          <p className="text-xs text-slate-500">
            Selecione a alteração clínica abaixo e clique nos segmentos do corpo ou nos botões de raízes (C2 a S5).
          </p>
        </div>

        {/* Selected Tool Picker */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
          {(['normal', 'hipoestesia', 'parestesia', 'hiperestesia', 'dor'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedTool(st)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-bold text-[11px] capitalize flex items-center gap-1.5 transition-all cursor-pointer",
                selectedTool === st 
                  ? `${STATUS_COLORS[st].bg} text-white shadow-sm ring-2 ring-offset-1 ring-slate-400 scale-105`
                  : "hover:bg-slate-100 text-slate-600"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", selectedTool === st ? "bg-white" : STATUS_COLORS[st].bg)} />
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-6 items-start">
        {/* Anatomical Human Vector Dermatomes Figure */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-between gap-4 min-h-[340px]">
          <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-4">
            {/* Anterior View */}
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Visão Anterior</span>
              <svg viewBox="0 0 160 320" className="w-40 h-auto select-none drop-shadow-xs">
                {/* Head & Neck C2/C3 */}
                <g onClick={() => handleMultiZoneClick(['C2', 'C3'])} className="cursor-pointer group">
                  <path 
                    d="M 80 15 C 65 15 55 25 55 40 C 55 55 65 65 80 65 C 95 65 105 55 105 40 C 105 25 95 15 80 15 Z" 
                    fill={STATUS_COLORS[getGroupStatus(['C2', 'C3'])].fill} 
                    stroke={STATUS_COLORS[getGroupStatus(['C2', 'C3'])].stroke}
                    strokeWidth={getGroupStatus(['C2', 'C3']) !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="80" y="42" textAnchor="middle" className="text-[10px] font-extrabold fill-white pointer-events-none drop-shadow-xs">C2/C3</text>
                </g>

                {/* Neck & Shoulders (C4) */}
                <g onClick={() => handleMultiZoneClick(['C4'])} className="cursor-pointer group">
                  <path 
                    d="M 55 65 C 40 70 30 80 25 95 L 135 95 C 130 80 120 70 105 65 Z" 
                    fill={STATUS_COLORS[getDermatomeStatus('C4')].fill} 
                    stroke={STATUS_COLORS[getDermatomeStatus('C4')].stroke}
                    strokeWidth={getDermatomeStatus('C4') !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="80" y="82" textAnchor="middle" className="text-[10px] font-extrabold fill-white pointer-events-none drop-shadow-xs">C4</text>
                </g>

                {/* Chest / Torax (T2-T6) */}
                <g onClick={() => handleMultiZoneClick(['T2', 'T4', 'T6'])} className="cursor-pointer group">
                  <rect 
                    x="35" y="95" width="90" height="35" rx="4" 
                    fill={STATUS_COLORS[getGroupStatus(['T2', 'T4', 'T6'])].fill} 
                    stroke={STATUS_COLORS[getGroupStatus(['T2', 'T4', 'T6'])].stroke}
                    strokeWidth={getGroupStatus(['T2', 'T4', 'T6']) !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="80" y="116" textAnchor="middle" className="text-[10px] font-extrabold fill-white pointer-events-none drop-shadow-xs">T2-T6</text>
                </g>

                {/* Abdomen (T7-T12) */}
                <g onClick={() => handleMultiZoneClick(['T8', 'T10', 'T12'])} className="cursor-pointer group">
                  <rect 
                    x="38" y="130" width="84" height="40" rx="4" 
                    fill={STATUS_COLORS[getGroupStatus(['T8', 'T10', 'T12'])].fill} 
                    stroke={STATUS_COLORS[getGroupStatus(['T8', 'T10', 'T12'])].stroke}
                    strokeWidth={getGroupStatus(['T8', 'T10', 'T12']) !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="80" y="153" textAnchor="middle" className="text-[10px] font-extrabold fill-white pointer-events-none drop-shadow-xs">T7-T12</text>
                </g>

                {/* Pelvis / Inguinal (L1) */}
                <g onClick={() => handleMultiZoneClick(['L1'])} className="cursor-pointer group">
                  <path 
                    d="M 38 170 L 122 170 L 110 200 L 50 200 Z" 
                    fill={STATUS_COLORS[getDermatomeStatus('L1')].fill} 
                    stroke={STATUS_COLORS[getDermatomeStatus('L1')].stroke}
                    strokeWidth={getDermatomeStatus('L1') !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="80" y="188" textAnchor="middle" className="text-[10px] font-extrabold fill-white pointer-events-none drop-shadow-xs">L1</text>
                </g>

                {/* Right Arm C5 */}
                <g onClick={() => handleMultiZoneClick(['C5'])} className="cursor-pointer group">
                  <rect 
                    x="10" y="95" width="22" height="65" rx="8" 
                    fill={STATUS_COLORS[getDermatomeStatus('C5')].fill} 
                    stroke={STATUS_COLORS[getDermatomeStatus('C5')].stroke}
                    strokeWidth={getDermatomeStatus('C5') !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="21" y="130" textAnchor="middle" className="text-[9px] font-extrabold fill-white pointer-events-none drop-shadow-xs">C5</text>
                </g>

                {/* Left Arm C6 */}
                <g onClick={() => handleMultiZoneClick(['C6'])} className="cursor-pointer group">
                  <rect 
                    x="128" y="95" width="22" height="65" rx="8" 
                    fill={STATUS_COLORS[getDermatomeStatus('C6')].fill} 
                    stroke={STATUS_COLORS[getDermatomeStatus('C6')].stroke}
                    strokeWidth={getDermatomeStatus('C6') !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="139" y="130" textAnchor="middle" className="text-[9px] font-extrabold fill-white pointer-events-none drop-shadow-xs">C6</text>
                </g>

                {/* Legs (L2, L3) */}
                <g onClick={() => handleMultiZoneClick(['L2', 'L3'])} className="cursor-pointer group">
                  <rect 
                    x="42" y="200" width="34" height="55" rx="6" 
                    fill={STATUS_COLORS[getGroupStatus(['L2', 'L3'])].fill} 
                    stroke={STATUS_COLORS[getGroupStatus(['L2', 'L3'])].stroke}
                    strokeWidth={getGroupStatus(['L2', 'L3']) !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="59" y="230" textAnchor="middle" className="text-[9px] font-extrabold fill-white pointer-events-none drop-shadow-xs">L2/L3</text>

                  <rect 
                    x="84" y="200" width="34" height="55" rx="6" 
                    fill={STATUS_COLORS[getGroupStatus(['L2', 'L3'])].fill} 
                    stroke={STATUS_COLORS[getGroupStatus(['L2', 'L3'])].stroke}
                    strokeWidth={getGroupStatus(['L2', 'L3']) !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="101" y="230" textAnchor="middle" className="text-[9px] font-extrabold fill-white pointer-events-none drop-shadow-xs">L2/L3</text>
                </g>

                {/* Lower Legs (L4, L5) */}
                <g onClick={() => handleMultiZoneClick(['L4', 'L5'])} className="cursor-pointer group">
                  <rect 
                    x="45" y="255" width="28" height="50" rx="4" 
                    fill={STATUS_COLORS[getGroupStatus(['L4', 'L5'])].fill} 
                    stroke={STATUS_COLORS[getGroupStatus(['L4', 'L5'])].stroke}
                    strokeWidth={getGroupStatus(['L4', 'L5']) !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="59" y="280" textAnchor="middle" className="text-[9px] font-extrabold fill-white pointer-events-none drop-shadow-xs">L4</text>

                  <rect 
                    x="87" y="255" width="28" height="50" rx="4" 
                    fill={STATUS_COLORS[getGroupStatus(['L4', 'L5'])].fill} 
                    stroke={STATUS_COLORS[getGroupStatus(['L4', 'L5'])].stroke}
                    strokeWidth={getGroupStatus(['L4', 'L5']) !== 'normal' ? "3" : "1.5"}
                    className="transition-all duration-200 group-hover:opacity-80" 
                  />
                  <text x="101" y="280" textAnchor="middle" className="text-[9px] font-extrabold fill-white pointer-events-none drop-shadow-xs">L5</text>
                </g>
              </svg>
            </div>
          </div>

          {/* Active Marked Dermatomes Summary Pill List */}
          <div className="w-full pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600" />
                Dermátomos Marcados ({markedItems.length}):
              </span>
              {markedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <X size={12} /> Limpar Todos
                </button>
              )}
            </div>

            {markedItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum dermátomo com alteração. Clique no corpo ou nas raízes para marcar.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {markedItems.map(([code, st]) => (
                  <span
                    key={code}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs text-white",
                      STATUS_COLORS[st].bg
                    )}
                  >
                    <span>{code}</span>
                    <span className="opacity-80 text-[10px] uppercase">({st})</span>
                    <button
                      type="button"
                      onClick={() => handleMultiZoneClick([code])}
                      className="hover:bg-black/20 rounded p-0.5 transition-colors cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Selection Grid for Exact Spinal Segment */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b pb-2">
            <h5 className="font-bold text-slate-800 text-xs">Seleção por Raiz Espinhal</h5>
            <p className="text-[11px] text-slate-500">Clique sobre a raiz para alternar o achado clínico ({selectedTool}).</p>
          </div>

          {DERMATOME_GROUPS.map((grp) => (
            <div key={grp.name} className="space-y-1.5">
              <span className="text-[11px] font-extrabold text-slate-600 block uppercase tracking-wider">{grp.name}</span>
              <div className="flex flex-wrap gap-1.5">
                {grp.items.map((item) => {
                  const st = getDermatomeStatus(item);
                  const isMarked = st !== 'normal';
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleMultiZoneClick([item])}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer",
                        isMarked
                          ? `${STATUS_COLORS[st].bg} text-white border-transparent shadow-xs ring-2 ring-offset-1 ring-slate-300 scale-105`
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300"
                      )}
                    >
                      {item}
                      {isMarked ? (
                        <Check size={12} className="stroke-[3]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
