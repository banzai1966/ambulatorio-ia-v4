import React, { useState } from 'react';
import { NeurologicalExamData } from '../types/neurologicalExam';
import { cn } from '../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  data: NeurologicalExamData;
  onChange: (data: NeurologicalExamData) => void;
}

export default function NeurologicalExamForm({ data, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const updateRecursive = (obj: any, pathKeys: string[]): any => {
      const [currentKey, ...remainingKeys] = pathKeys;
      if (remainingKeys.length === 0) return { ...obj, [currentKey]: value };
      return { ...obj, [currentKey]: updateRecursive(obj[currentKey] || {}, remainingKeys) };
    };
    onChange(updateRecursive(data || {}, keys));
  };

  const RadioGroup = ({ path, options, label }: { path: string, options: string[], label?: string }) => {
    const value = path.split('.').reduce((acc: any, key) => acc?.[key], data) as string;
    return (
      <div className="flex items-center gap-3">
        {label && <span className="font-bold text-slate-800">{label}</span>}
        <div className="flex items-center gap-4">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700">
              <input 
                type="radio" 
                name={path} 
                value={opt} 
                checked={value === opt} 
                onChange={(e) => updateField(path, e.target.value)}
                className="w-4 h-4 text-slate-800 border-slate-300 focus:ring-slate-800"
              />
              <span className="capitalize">{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-clinical-border rounded-[2rem] shadow-sm max-w-[1200px] mx-auto overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="text-left">
          <h2 className="text-lg font-bold text-slate-800">Checklist Neurológico</h2>
          <p className="text-xs text-slate-500 mt-0.5">Clique aqui para abrir ou fechar o roteiro de exame neurológico detalhado.</p>
        </div>
        <div className="p-1.5 bg-slate-100 rounded-full text-slate-600">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-slate-100 text-sm space-y-4 mt-4 animate-in slide-in-from-top-4 fade-in duration-300">
          {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
        <RadioGroup path="fascia" label="Fascies" options={['atípica', 'típica']} />
        <RadioGroup path="atitude" label="Atitude" options={['ativa', 'passiva']} />
        <RadioGroup path="dominancia" label="Dominância" options={['D', 'E']} />
        <RadioGroup path="marcha" label="Marcha" options={['normal', 'alterada']} />
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Glasgow:</span>
          <input 
            type="number" 
            value={data?.escala_glasgow || ''} 
            onChange={(e) => updateField('escala_glasgow', Number(e.target.value))} 
            className="w-12 border-b border-slate-300 outline-none text-center bg-transparent text-slate-800 font-bold"
            min={3} max={15}
          />
          <span className="text-slate-500 text-xs">/15</span>
        </div>
      </div>

      {/* Força Muscular */}
      <div>
        <h3 className="text-center font-bold text-slate-800 mb-3">Força Muscular</h3>
        <table className="w-full text-center border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-slate-300 p-2 font-bold text-slate-800 w-32">Região</th>
              <th className="border border-slate-300 p-2 font-bold text-slate-700">Tônus</th>
              <th className="border border-slate-300 p-2 font-bold text-slate-700">Trofismo</th>
              <th className="border border-slate-300 p-2 font-bold text-slate-700">Mov. Anormais</th>
              <th className="border border-slate-300 p-2 font-bold text-slate-700">Deformidades</th>
              <th className="border border-slate-300 p-2 font-bold text-slate-700">Fatigabilidade</th>
            </tr>
          </thead>
          <tbody>
            {['Face', 'Lingua', 'MSD', 'MSE', 'MID', 'MIE', 'Coluna'].map((regiao) => {
              const k = regiao.toLowerCase();
              return (
                <tr key={regiao} className="hover:bg-slate-50/50">
                  <td className="border border-slate-300 p-1.5 font-bold text-slate-700">{regiao}</td>
                  {['tonus', 'trofismo', 'mov_anormais', 'deformidades', 'fatigabilidade'].map(col => (
                    <td key={col} className="border border-slate-300 p-0">
                      <input 
                        type="text" 
                        value={(data?.forca_muscular as any)?.[k]?.[col] || ''}
                        onChange={(e) => updateField(`forca_muscular.${k}.${col}`, e.target.value)}
                        className="w-full h-full p-2 outline-none text-center bg-transparent"
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-[1fr,320px] gap-4 items-start">
        {/* Sensibilidade */}
        <div>
          <h3 className="font-bold text-slate-800 mb-2 uppercase text-[10px] pt-1">SENSIBILIDADE D/E</h3>
          <table className="w-full text-center border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-300 p-1 font-bold text-slate-800">Região</th>
                <th className="border border-slate-300 p-1 font-bold text-slate-700">Proprio</th>
                <th className="border border-slate-300 p-1 font-bold text-slate-700">Vibrat</th>
                <th className="border border-slate-300 p-1 font-bold text-slate-700">Temp</th>
                <th className="border border-slate-300 p-1 font-bold text-slate-700">Dor</th>
                <th className="border border-slate-300 p-1 font-bold text-slate-700">Toque</th>
              </tr>
            </thead>
            <tbody>
              {['Cabeca', 'Torax', 'MMSS', 'Abdome', 'MMII'].map((regiao) => {
                const k = regiao.toLowerCase();
                return (
                  <tr key={regiao} className="hover:bg-slate-50/50">
                    <td className="border border-slate-300 p-1 font-bold text-slate-700">{regiao}</td>
                    {['proprio', 'vibrat', 'temp', 'dor', 'toque'].map(col => (
                      <td key={col} className="border border-slate-300 p-0">
                        <input 
                          type="text" 
                          value={(data?.sensibilidade as any)?.[k]?.[col] || ''}
                          onChange={(e) => updateField(`sensibilidade.${k}.${col}`, e.target.value)}
                          className="w-full h-full p-1 outline-none text-center bg-transparent"
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Coordenação */}
        <div>
          <h3 className="font-bold text-slate-800 mb-2 text-xs">Coordenação</h3>
          <div className="border border-slate-300 rounded p-2 text-xs space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" checked={!!data?.coordenacao?.status} onChange={(e) => updateField('coordenacao.status', e.target.checked ? 'normal' : null)} className="w-4 h-4 border-slate-300 rounded text-slate-800 focus:ring-slate-800" />
              Normal
            </label>
            <div className="flex items-center gap-3 pl-1">
              <span className="text-slate-700">Alterado:</span>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700"><input type="checkbox" checked={data?.coordenacao?.lado === 'D'} onChange={(e) => updateField('coordenacao.lado', e.target.checked ? 'D' : null)} className="w-4 h-4 rounded text-slate-800"/> D</label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700"><input type="checkbox" checked={data?.coordenacao?.lado === 'E'} onChange={(e) => updateField('coordenacao.lado', e.target.checked ? 'E' : null)} className="w-4 h-4 rounded text-slate-800"/> E</label>
            </div>
            {['index_nariz', 'romberg', 'calcanhar_joelho', 'diadococinesia'].map(k => (
              <label key={k} className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input type="checkbox" checked={!!(data?.coordenacao as any)?.[k]} onChange={(e) => updateField(`coordenacao.${k}`, e.target.checked)} className="w-4 h-4 border-slate-300 rounded text-slate-800 focus:ring-slate-800" />
                {k.replace('_', '-').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Nervos Cranianos */}
      <div className="border border-slate-300 rounded p-3 pb-4 text-xs">
        <h3 className="font-bold text-slate-800 mb-3 text-xs">Nervos Cranianos</h3>
        <div className="flex justify-between items-center px-2 mb-4 relative">
           {/* Connecting line */}
           <div className="absolute top-6 left-2 right-2 h-[1px] bg-slate-300 -z-10" />
           {['II', 'III', 'IV', 'VI', 'V', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(n => (
             <div key={n} className="flex flex-col items-center gap-1 bg-white px-1">
               <span className="font-bold text-slate-800 text-[10px]">{n}</span>
               <input 
                 type="text" 
                 value={(data?.nervos_cranianos as any)?.[n.toLowerCase()] || ''}
                 onChange={(e) => updateField(`nervos_cranianos.${n.toLowerCase()}`, e.target.value)}
                 className="w-10 border-b border-slate-300 outline-none text-center text-slate-700 bg-transparent focus:border-slate-800 text-xs py-0.5"
               />
             </div>
           ))}
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100">
           <div className="flex items-center gap-1.5">
             <span className="font-bold text-slate-800">Pupilas:</span>
             <span className="text-slate-700 ml-1">D</span>
             <input type="text" value={data?.nervos_cranianos?.pupilas_d || ''} onChange={(e) => updateField('nervos_cranianos.pupilas_d', e.target.value)} className="w-16 border-b border-slate-300 outline-none px-1 text-slate-700"/>
             <span className="ml-2 text-slate-700">E</span>
             <input type="text" value={data?.nervos_cranianos?.pupilas_e || ''} onChange={(e) => updateField('nervos_cranianos.pupilas_e', e.target.value)} className="w-16 border-b border-slate-300 outline-none px-1 text-slate-700"/>
           </div>

           <div className="w-[1px] h-6 bg-slate-200" />

           <div className="flex items-center gap-3">
             <span className="font-bold text-slate-800">Fundo Olho:</span>
             <label className="flex items-center gap-2 cursor-pointer text-slate-700"><input type="checkbox" checked={data?.nervos_cranianos?.fundo_olho === 'normal'} onChange={(e) => updateField('nervos_cranianos.fundo_olho', e.target.checked ? 'normal' : null)} className="w-4 h-4 rounded text-slate-800"/> Normal</label>
             <label className="flex items-center gap-2 cursor-pointer text-slate-700"><input type="checkbox" checked={data?.nervos_cranianos?.fundo_olho === 'alterado'} onChange={(e) => updateField('nervos_cranianos.fundo_olho', e.target.checked ? 'alterado' : null)} className="w-4 h-4 rounded text-slate-800"/> Alterado</label>
           </div>

           <div className="w-[1px] h-6 bg-slate-200" />

           <div className="flex items-center gap-2 flex-1 max-w-sm">
             <span className="font-bold text-slate-800 whitespace-nowrap">Campo:</span>
             <input type="text" value={data?.nervos_cranianos?.campo || ''} onChange={(e) => updateField('nervos_cranianos.campo', e.target.value)} className="flex-1 border-b border-slate-300 outline-none px-1 text-slate-700"/>
           </div>
        </div>
      </div>

      {/* Cognitivo */}
      <div className="grid grid-cols-[1fr,200px] gap-4 items-start pb-2">
        <div>
          <h3 className="font-bold text-slate-800 mb-2 text-xs">Cognitivo</h3>
          <table className="w-full text-center border-collapse border border-slate-300">
             <thead>
               <tr className="bg-slate-50">
                 <th className="border border-slate-300 p-1 font-bold text-slate-700 text-[10px]">Orient Temp</th>
                 <th className="border border-slate-300 p-1 font-bold text-slate-700 text-[10px]">Orient Esp</th>
                 <th className="border border-slate-300 p-1 font-bold text-slate-700 text-[10px]">Mem Imed</th>
                 <th className="border border-slate-300 p-1 font-bold text-slate-700 text-[10px]">Cálculo</th>
                 <th className="border border-slate-300 p-1 font-bold text-slate-700 text-[10px]">Mem Evoc</th>
                 <th className="border border-slate-300 p-1 font-bold text-slate-700 text-[10px]">Nomeação</th>
                 <th className="border border-slate-300 p-1 font-bold text-slate-700 text-[10px]">Repetição</th>
                 <th className="border border-slate-300 p-1 font-bold text-slate-700 text-[10px]">Leitura</th>
                 <th className="border border-slate-300 p-1 font-bold text-slate-700 text-[10px]">Comando</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 {['orient_temp', 'orient_esp', 'mem_imed', 'calculo', 'mem_evoc', 'nomeacao', 'repeticao', 'leitura', 'comando'].map(col => (
                    <td key={col} className="border border-slate-300 p-0 h-6">
                      <input 
                        type="text" 
                        value={(data?.cognitivo as any)?.[col] || ''}
                        onChange={(e) => updateField(`cognitivo.${col}`, e.target.value)}
                        className="w-full h-full p-1 outline-none text-center bg-transparent text-xs"
                      />
                    </td>
                 ))}
               </tr>
             </tbody>
          </table>
          <div className="flex justify-end items-center gap-1.5 mt-2 p-1">
             <span className="font-bold text-slate-800 text-xs">Total:</span>
             <input type="text" value={data?.cognitivo?.total_score || ''} onChange={(e) => updateField('cognitivo.total_score', e.target.value)} className="w-12 border-b border-slate-400 outline-none text-center text-slate-800 font-bold bg-transparent text-xs" />
             <span className="font-bold text-slate-800 text-xs">/30</span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 mb-2 text-xs">Fluência Verbal</h3>
          <div className="border border-slate-300 rounded p-2 space-y-1.5 text-xs">
             {['0-15', '15-30', '30-45', '45-60'].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input 
                     type="radio" 
                     name="fluencia_verbal" 
                     value={opt}
                     checked={data?.fluencia_verbal === opt}
                     onChange={(e) => updateField('fluencia_verbal', e.target.value)}
                     className="w-3.5 h-3.5 border-slate-300 text-slate-800 focus:ring-slate-800" 
                  />
                  {opt}
                </label>
             ))}
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
