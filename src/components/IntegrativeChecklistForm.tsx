import React, { useState } from 'react';
import { IntegrativeChecklistData, initialIntegrativeData } from '../types/integrativeChecklist';
import { Search, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  data: IntegrativeChecklistData;
  onChange: (data: IntegrativeChecklistData) => void;
  historyRecords?: any[];
  currentDate?: string;
}

// v2 - Mapeamento completo para fidelidade ao PDF
const LABEL_MAPPING: Record<string, string> = {
  // Suplementos
  astragalus: "Astragallus 100, 200 mg",
  dhea: "DHEA mg",
  epa_dha: "EPA+DHA 1000 mg",
  mix_pro: "MIX(Pro, Co, AV, TO, AS, MG) gt",
  coriandrum: "Coriandrum s. glic gt",
  propolis: "Própolis glic gts",
  propco: "PropCo 4:1 3:1 gts",
  mix_d9: "Mix D9",
  ginger: "Ginger 100 200 mg",
  acido_caprilico: "Acido Caprilico 200 mg D9",
  bitter_mellon: "Bitter mellon 200 mg D9",
  arnica: "Arnica (Comp)",
  myosothis: "Myosothis (Comp)",
  hip_perfuratum: "Hip Perfuratum 300 mg",
  neurexan: "Neurexan/Marac/Pasa",
  floral_bach: "Floral Bach ( R + E ) gts",
  acido_folico: "Ácido Fólico 200 ug",
  vit_b3_b6: "Vit B3/Vit B6 25 mg",
  pregne: "Pregne 30mg/Boro 1mg",
  heteropterys: "Heteropterys a mg",
  arcalion: "Arcalion/Forten",
  vinpocetina: "Vinpocetina 10 mg",
  fosfatidilserina: "Fosfatidilserina mg",
  fosfatidilcolina: "Fosfatidilcolina mg",
  dmae: "DMAE 130 mg 250 mg",
  colina: "Colina mg",
  hidroxi_triptofano: "5-Hidróxi-Triptofano mg",
  fenilalanina: "Fenilalanina mg",
  melatonina: "Melatonina 3 mg, 1 mg",
  ac_alfa_lipoico: "Ac. Alfa lipoico 100 mg",
  semente_uva: "Semente uva 100 140",
  coenzima_q10: "Coenzima Q10 50 100 mg",
  
  // Fitoterápicos
  organo_gt: "Organo gt",
  dna_rna_ch: "DNA/RNA CH",
  organo_gt_2: "Organo gt (2)",
  dna_rna_ch_2: "DNA/RNA CH (2)",
  organo_gt_3: "Organo gt (3)",
  dna_rna_ch_3: "DNA/RNA CH (3)",
  artemisia: "Artemísia D3 gt",
  phaffia: "Phaffia panic D3 gt",
  chlorella: "Chlorella cps D9",
  acai: "Açai cps D9",
  mulateiro: "Mulateiro gt",
  cmc: "CMC 5 10 mg CH5 gt",
  formula_onco_vo: "Formula onco VO gt",
  formula_onco_inalat: "Formula onco inalat ml",
  vovo_meca: "Vovo Meca gt",
  euphorbia: "Euphorbia Hetero D6",
  zedoaria: "Zedoaria 200 mg",
  naltrex: "Naltrex 1,5 3,0 4,5 mg",
  nootropil: "Nootropil 400 800 mg",
  
  // Vitaminas & Minerais
  silimarina: "Silimarina 70 mg",
  quercetina: "Quercetina mg",
  saw_palmetto: "Saw Palmetto mg",
  pygeum: "Pygeum africanus mg",
  tribulus: "Tribulus terrestris mg",
  litio: "Litio orotato 5 mg",
  cardiopeptase: "Cardiopeptase 5mg",
  betaina: "Betaina 500/pepsina 150",
  taurina: "Taurina mg",
  vit_d3: "Vit D3 UI",
  ca_mg_zn: "Ca/Mg/Zn cp",
  vit_k2: "Vit K2 100 ug",
  selenio: "Selenio ug",
  manganes: "Manganes 10 mg",
  cu: "Cu mg",
  cromo: "Cromo picolonato mg",
  lugol: "Lugol gt",

  // Biomarcadores
  telomero: "Telomero",
  sirtuina: "Sirtuina 1",
  integrin: "Integrin a5 B1",
  thromboxane: "Thromboxane B2",
  crisotila: "Crisotila-Asbestos",
  hg: "Hg",
  pb: "Pb",
  al: "Al",
  
  // Neurotransmissores
  acetylcholine: "Acetylcholine",
  serotonin: "Serotonin",
  dopamine: "Dopamine",
  cortisol: "Cortisol",
  substance_p: "Substance P",
  b_amyloid: "B Amyloid",
  homocystine: "Homocystine",
  troponin: "Troponin",
  c_fos: "C-fos, ab - 2",

  // Patógenos
  candida: "Candida Albicans",
  c_trachomatis: "C Trachomatis",
  b_burgdorferi: "B Burgdorferi",
  c_pneumoniae: "C Pneumoniae",
  mycobact_tbc: "Mycobact Tbc",
  mycobact_avium: "Mycobact Avium",
  hsv_type_1: "HSV Type 1",
  hsv_type_2: "HSV Type 2",
  zoster_virus: "Zoster Vírus 3",
  cmv_5: "CMV 5",
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function IntegrativeChecklistForm({ data, onChange, historyRecords = [], currentDate }: Props) {
  
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-slate-500 font-medium">Aguardando dados do checklist...</p>
      </div>
    );
  }

  const formattedCurrentDate = currentDate ? (() => {
    const d = new Date(currentDate);
    return !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
  })() : '';

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    suplementos: true,
    fitoterapicos_especiais: true,
    vitaminas_minerais: true,
    biomarcadores: true,
    neurotransmissores_hormonios: true,
    patogenos: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const safeStringifyItem = (val: any): string => {
    // Se for objeto (como medicamento), processa primeiro com verificações de segurança
    if (typeof val === 'object' && val !== null) {
      try {
        if ('Medicamento' in val || 'medicamento' in val) {
          return `${val.Medicamento || val.medicamento || ''} ${val.dosagem || ''} ${val.unidade || ''}`.trim();
        }
        // Se for um objeto que não conhecemos a estrutura, evitamos JSON.stringify catastrófico
        return Object.values(val).filter(v => typeof v !== 'object').join(' ');
      } catch (e) {
        return '';
      }
    }

    // Se for string ou numero e não for apenas um true/false, retorna o valor
    if (val !== true && val !== false && val !== null && val !== undefined && val !== '' && val !== 'null') {
      const strVal = String(val).trim().toLowerCase();
      // Filtra termos de ruído da IA
      if (['null', 'undefined', 'false', 'nan', 'rejeitado', 'não citado', 'pendente', 'rejeitado.'].includes(strVal)) {
        return '';
      }
      return String(val);
    }
    
    // Só retorna Sinalizado se for explicitamente true
    if (val === true || val === 'true') return 'Sinalizado';
    
    return '';
  };

  const updateField = (section: keyof IntegrativeChecklistData, field: string, value: string) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;
    
    const newData = { ...data };
    const sectionData = { ...(newData[section] || {}) };
    
    sectionData[field] = String(value);
    
    newData[section] = sectionData as any;
    
    onChange(newData);
  };

  const sections = [
    { id: 'suplementos', title: 'Suplementos & Nutracêuticos', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { id: 'fitoterapicos_especiais', title: 'Fitoterápicos & Fórmulas Especiais', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { id: 'vitaminas_minerais', title: 'Vitaminas & Minerais', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { id: 'biomarcadores', title: 'Biomarcadores & Metais', color: 'bg-slate-50 text-slate-700 border-slate-100' },
    { id: 'neurotransmissores_hormonios', title: 'Neurotransmissores & Hormônios', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { id: 'patogenos', title: 'Patógenos & Infecções', color: 'bg-red-50 text-red-700 border-red-100' },
  ];

  const formatLabel = (key: string) => {
    const mapped = LABEL_MAPPING[key];
    if (mapped) return mapped;
    
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace('Vit ', 'Vitamina ')
      .replace('Ac ', 'Ácido ');
  };

  const historyToDisplay = historyRecords
    .filter(h => h && h.checklist_integrativo)
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.data_consulta || 0).getTime();
      const dateB = new Date(b.created_at || b.data_consulta || 0).getTime();
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    })
    .slice(0, 2)
    .reverse();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar item no checklist (ex: Cortisol, Vitamina D)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-clinical-blue focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section) => {
          try {
            const aiSectionData = (data && typeof data === 'object' && !Array.isArray(data)) 
              ? ((data as any)[section.id] || {})
              : {};
              
            const defaultSectionData = initialIntegrativeData[section.id as keyof IntegrativeChecklistData] || {};
            
            const sectionData = { ...defaultSectionData, ...aiSectionData };
            
            if (!sectionData || typeof sectionData !== 'object' || Array.isArray(sectionData)) {
              return null;
            }
            
            const fields = Object.keys(defaultSectionData).filter(key => 
              formatLabel(key).toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (fields.length === 0 && searchTerm) return null;

            const isExpanded = expandedSections[section.id];

            return (
              <div key={section.id} className={`rounded-2xl border transition-all ${section.color} overflow-hidden shadow-sm`}>
                <button 
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 flex justify-between items-center font-bold text-sm uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-current opacity-50"></div>
                    {section.title}
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/50">
                      {Object.values(sectionData).filter(v => v !== '' && v !== 'false').length} valores
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">Ativo/BIOMARCADOR</th>
                          <th className="p-3 text-[10px] font-black text-clinical-blue uppercase tracking-widest border-l border-clinical-blue/10 min-w-[120px] text-left bg-clinical-blue/5">
                            Valor {formattedCurrentDate ? `(${formattedCurrentDate})` : 'Atual'}
                          </th>
                          {historyToDisplay.map((h, i) => {
                            const dateVal = h.data_consulta || h.created_at;
                            const dateObj = dateVal ? new Date(dateVal) : null;
                            const isValidDate = dateObj && !isNaN(dateObj.getTime());
                            
                            return (
                              <th key={h.id || i} className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100 min-w-[100px] text-left">
                                Histórico ({isValidDate ? dateObj!.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Ant.'})
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {fields.map((field) => (
                          <tr key={field} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <span className="text-xs font-bold text-slate-700 block">{formatLabel(field)}</span>
                            </td>
                            <td className="p-3 border-l border-clinical-blue/10 bg-clinical-blue/5">
                              <input 
                                type="text"
                                value={safeStringifyItem((sectionData as any)[field])}
                                onChange={(e) => updateField(section.id as keyof IntegrativeChecklistData, field, e.target.value)}
                                placeholder="Ponto/Valor"
                                className="w-full bg-transparent border-none focus:ring-0 text-xs font-black text-clinical-blue text-left placeholder:text-slate-300 p-0"
                              />
                            </td>
                            {historyToDisplay.map((h, i) => {
                              let histVal = h.checklist_integrativo?.[section.id]?.[field] || '';
                              
                              // Force-use the safeStringifyItem logic to remain consistent
                              const displayVal: string = safeStringifyItem(histVal);
                               
                              const dateVal = h.data_consulta || h.created_at;
                              const dateObj = dateVal ? new Date(dateVal) : null;
                              const isValidDate = dateObj && !isNaN(dateObj.getTime());
                              const dateStr = isValidDate ? dateObj!.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Ant.';
                              
                              return (
                                <td key={h.id || i} className="p-3 border-l border-slate-100 text-left">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded min-w-[40px] inline-flex items-center gap-2 whitespace-nowrap",
                                      (displayVal !== '' && displayVal !== 'false' && displayVal !== 'undefined') ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400 opacity-50"
                                    )}>
                                      <span className="text-[8px] opacity-70 tracking-wider">[{dateStr}]</span>
                                      <span>{displayVal !== '' ? displayVal : '-'}</span>
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          } catch (err) {
            console.error(`Erro ao renderizar seção ${section.id}:`, err);
            return null;
          }
        })}
      </div>
    </div>
  );
}
