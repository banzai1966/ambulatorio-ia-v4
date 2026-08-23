import React, { useState } from 'react';
import { NeurologicalExamData } from '../types/neurologicalExam';
import { cn } from '../lib/utils';
import { ChevronDown, ChevronUp, PenTool, Activity, Eye, Brain } from 'lucide-react';
import WexlerReflexDiagram from './neurology/WexlerReflexDiagram';
import DermatomeMapDiagram from './neurology/DermatomeMapDiagram';
import PentagonDrawingCanvas from './neurology/PentagonDrawingCanvas';
import InteractiveNeurologicalSheetModal from './neurology/InteractiveNeurologicalSheetModal';

interface Props {
  data: NeurologicalExamData;
  onChange: (data: NeurologicalExamData) => void;
}

export default function NeurologicalExamForm({ data, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="p-2 bg-blue-50 border border-blue-200/60 rounded-xl text-blue-700">
            <Brain size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Exame Neurológico Completo & Diagramas Anatômicos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Roteiro clínico oficial com esquemas de dermátomos, reflexos de Wexler e canvas de desenho do MEEM.</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <PenTool size={15} />
            Anotação Livre na Prancha
          </button>

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 pt-4 border-t border-slate-100 text-sm space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-200">
            <RadioGroup path="fascia" label="Fáscies" options={['atípica', 'típica']} />
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

          {/* Força Muscular Table */}
          <div>
            <h3 className="font-bold text-slate-800 mb-2 text-sm flex items-center gap-2">
              <Activity size={16} className="text-blue-600" />
              Força Muscular, Tônus e Trofismo
            </h3>
            <table className="w-full text-center border-collapse border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-300 p-2 font-bold w-32 text-xs">Região</th>
                  <th className="border border-slate-300 p-2 font-bold text-slate-700 text-xs">Tônus</th>
                  <th className="border border-slate-300 p-2 font-bold text-slate-700 text-xs">Trofismo</th>
                  <th className="border border-slate-300 p-2 font-bold text-slate-700 text-xs">Mov. Anormais</th>
                  <th className="border border-slate-300 p-2 font-bold text-slate-700 text-xs">Deformidades</th>
                  <th className="border border-slate-300 p-2 font-bold text-slate-700 text-xs">Fatigabilidade</th>
                </tr>
              </thead>
              <tbody>
                {['Face', 'Lingua', 'MSD', 'MSE', 'MID', 'MIE', 'Coluna'].map((regiao) => {
                  const k = regiao.toLowerCase();
                  return (
                    <tr key={regiao} className="hover:bg-slate-50/80">
                      <td className="border border-slate-300 p-1.5 font-bold text-slate-700 bg-slate-50 text-xs">{regiao}</td>
                      {['tonus', 'trofismo', 'mov_anormais', 'deformidades', 'fatigabilidade'].map(col => (
                        <td key={col} className="border border-slate-300 p-0">
                          <input 
                            type="text" 
                            value={(data?.forca_muscular as any)?.[k]?.[col] || ''}
                            onChange={(e) => updateField(`forca_muscular.${k}.${col}`, e.target.value)}
                            className="w-full h-full p-1.5 outline-none text-center bg-transparent text-xs focus:bg-blue-50/50"
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Wexler Reflexes Vector Stickman Diagram */}
          <WexlerReflexDiagram
            data={data?.reflexos_wexler}
            onChange={(path, val) => updateField(path, val)}
            onBatchChange={(newMap) => updateField('reflexos_wexler', newMap)}
          />

          {/* Dermatomes Anatomical Map */}
          <DermatomeMapDiagram
            data={data?.dermatomos_marcardos}
            onChange={(dermatome, status) => updateField(`dermatomos_marcardos.${dermatome}`, status)}
            onBatchChange={(newMap) => updateField('dermatomos_marcardos', newMap)}
          />

          {/* Sensibilidade & Coordenação */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,300px] gap-4 items-start">
            {/* Sensibilidade */}
            <div>
              <h3 className="font-bold text-slate-800 mb-2 uppercase text-[10px] tracking-wide">SENSIBILIDADE D/E (Avaliador Clínico)</h3>
              <table className="w-full text-center border-collapse border border-slate-300 text-xs rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-100">
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
                        <td className="border border-slate-300 p-1 font-bold text-slate-700 bg-slate-50">{regiao}</td>
                        {['proprio', 'vibrat', 'temp', 'dor', 'toque'].map(col => {
                          const val = (data?.sensibilidade as any)?.[k]?.[col] || '';
                          return (
                            <td key={col} className="border border-slate-300 p-0 relative">
                              <input 
                                type="text" 
                                value={val}
                                title={val || 'Clique para preencher'}
                                onChange={(e) => updateField(`sensibilidade.${k}.${col}`, e.target.value)}
                                className="w-full h-full p-1 outline-none text-center bg-transparent text-[11px] font-medium focus:bg-blue-50/50"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Coordenação */}
            <div>
              <h3 className="font-bold text-slate-800 mb-2 text-xs">Coordenação Motora</h3>
              <div className="border border-slate-300 rounded-xl p-3 text-xs space-y-2 bg-slate-50">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input type="checkbox" checked={!!data?.coordenacao?.status} onChange={(e) => updateField('coordenacao.status', e.target.checked ? 'normal' : null)} className="w-4 h-4 border-slate-300 rounded text-blue-600 focus:ring-blue-600" />
                  Coordenação Normal
                </label>
                <div className="flex items-center gap-3 pl-1 pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-medium">Lado Alterado:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-bold"><input type="checkbox" checked={data?.coordenacao?.lado === 'D'} onChange={(e) => updateField('coordenacao.lado', e.target.checked ? 'D' : null)} className="w-4 h-4 rounded text-blue-600"/> D</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-bold"><input type="checkbox" checked={data?.coordenacao?.lado === 'E'} onChange={(e) => updateField('coordenacao.lado', e.target.checked ? 'E' : null)} className="w-4 h-4 rounded text-blue-600"/> E</label>
                </div>
                {['index_nariz', 'romberg', 'calcanhar_joelho', 'diadococinesia'].map(k => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                    <input type="checkbox" checked={!!(data?.coordenacao as any)?.[k]} onChange={(e) => updateField(`coordenacao.${k}`, e.target.checked)} className="w-4 h-4 border-slate-300 rounded text-blue-600 focus:ring-blue-600" />
                    {k.replace('_', '-').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Nervos Cranianos */}
          <div className="border border-slate-300 rounded-2xl p-4 text-xs bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <Eye size={16} className="text-blue-600" />
              Nervos Cranianos (I a XII), Pupilas & Campo Visual
            </h3>
            <div className="flex justify-between items-center px-2 mb-4 relative overflow-x-auto pb-2">
               {/* Connecting line */}
               <div className="absolute top-6 left-2 right-2 h-[1px] bg-slate-300 -z-10" />
               {['II', 'III', 'IV', 'VI', 'V', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(n => (
                 <div key={n} className="flex flex-col items-center gap-1 bg-white px-1 rounded border border-slate-200 shadow-2xs">
                   <span className="font-bold text-slate-800 text-[10px]">{n}</span>
                   <input 
                     type="text" 
                     value={(data?.nervos_cranianos as any)?.[n.toLowerCase()] || ''}
                     onChange={(e) => updateField(`nervos_cranianos.${n.toLowerCase()}`, e.target.value)}
                     className="w-10 outline-none text-center text-slate-700 bg-transparent focus:border-blue-600 text-xs py-0.5"
                   />
                 </div>
               ))}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-200 bg-white p-3 rounded-xl border">
               <div className="flex items-center gap-1.5">
                 <span className="font-bold text-slate-800">Pupilas:</span>
                 <span className="text-slate-700 ml-1 font-bold">D</span>
                 <input type="text" value={data?.nervos_cranianos?.pupilas_d || ''} onChange={(e) => updateField('nervos_cranianos.pupilas_d', e.target.value)} className="w-16 border-b border-slate-300 outline-none px-1 text-slate-700 font-medium"/>
                 <span className="ml-2 text-slate-700 font-bold">E</span>
                 <input type="text" value={data?.nervos_cranianos?.pupilas_e || ''} onChange={(e) => updateField('nervos_cranianos.pupilas_e', e.target.value)} className="w-16 border-b border-slate-300 outline-none px-1 text-slate-700 font-medium"/>
               </div>

               <div className="w-[1px] h-6 bg-slate-200" />

               <div className="flex items-center gap-3">
                 <span className="font-bold text-slate-800">Fundo de Olho:</span>
                 <label className="flex items-center gap-1.5 cursor-pointer text-slate-700"><input type="checkbox" checked={data?.nervos_cranianos?.fundo_olho === 'normal'} onChange={(e) => updateField('nervos_cranianos.fundo_olho', e.target.checked ? 'normal' : null)} className="w-4 h-4 rounded text-blue-600"/> Normal</label>
                 <label className="flex items-center gap-1.5 cursor-pointer text-slate-700"><input type="checkbox" checked={data?.nervos_cranianos?.fundo_olho === 'alterado'} onChange={(e) => updateField('nervos_cranianos.fundo_olho', e.target.checked ? 'alterado' : null)} className="w-4 h-4 rounded text-blue-600"/> Alterado</label>
               </div>

               <div className="w-[1px] h-6 bg-slate-200" />

               <div className="flex items-center gap-2 flex-1 max-w-sm">
                 <span className="font-bold text-slate-800 whitespace-nowrap">Campo Visual:</span>
                 <input type="text" value={data?.nervos_cranianos?.campo || ''} onChange={(e) => updateField('nervos_cranianos.campo', e.target.value)} className="flex-1 border-b border-slate-300 outline-none px-1 text-slate-700 font-medium"/>
               </div>
            </div>
          </div>

          {/* Cognitivo (MEEM) & Pentagon Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6 items-start pb-2 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 mb-3 text-xs flex items-center gap-2">
                <Brain size={16} className="text-blue-600" />
                Avaliação Cognitiva (MEEM - Mini-Exame do Estado Mental)
              </h3>
              <table className="w-full text-center border-collapse border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                 <thead>
                   <tr className="bg-slate-100 text-[10px]">
                     <th className="border border-slate-300 p-1 font-bold text-slate-700">Orient Temp</th>
                     <th className="border border-slate-300 p-1 font-bold text-slate-700">Orient Esp</th>
                     <th className="border border-slate-300 p-1 font-bold text-slate-700">Mem Imed</th>
                     <th className="border border-slate-300 p-1 font-bold text-slate-700">Cálculo</th>
                     <th className="border border-slate-300 p-1 font-bold text-slate-700">Mem Evoc</th>
                     <th className="border border-slate-300 p-1 font-bold text-slate-700">Nomeação</th>
                     <th className="border border-slate-300 p-1 font-bold text-slate-700">Repetição</th>
                     <th className="border border-slate-300 p-1 font-bold text-slate-700">Leitura</th>
                     <th className="border border-slate-300 p-1 font-bold text-slate-700">Comando</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr>
                     {['orient_temp', 'orient_esp', 'mem_imed', 'calculo', 'mem_evoc', 'nomeacao', 'repeticao', 'leitura', 'comando'].map(col => (
                        <td key={col} className="border border-slate-300 p-0 h-8">
                          <input 
                            type="text" 
                            value={(data?.cognitivo as any)?.[col] || ''}
                            onChange={(e) => updateField(`cognitivo.${col}`, e.target.value)}
                            className="w-full h-full p-1 outline-none text-center bg-transparent text-xs font-bold text-blue-900"
                          />
                        </td>
                     ))}
                   </tr>
                 </tbody>
              </table>

              <div className="flex justify-between items-center mt-3 p-2 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-800">Fluência Verbal:</span>
                  {['0-15', '15-30', '30-45', '45-60'].map(opt => (
                    <label key={opt} className="flex items-center gap-1 cursor-pointer text-slate-700">
                      <input 
                        type="radio" 
                        name="fluencia_verbal" 
                        value={opt}
                        checked={data?.fluencia_verbal === opt}
                        onChange={(e) => updateField('fluencia_verbal', e.target.value)}
                        className="w-3.5 h-3.5 border-slate-300 text-blue-600 focus:ring-blue-600" 
                      />
                      {opt}s
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                   <span className="font-bold text-slate-800 text-xs">Score Total:</span>
                   <input type="text" value={data?.cognitivo?.total_score || ''} onChange={(e) => updateField('cognitivo.total_score', e.target.value)} className="w-12 border-b-2 border-blue-600 outline-none text-center text-blue-900 font-extrabold bg-transparent text-sm" />
                   <span className="font-bold text-slate-800 text-xs">/30</span>
                </div>
              </div>
            </div>

            {/* Pentagon Drawing Canvas Overlay */}
            <div>
              <PentagonDrawingCanvas
                initialImage={data?.desenho_pentagonos}
                onSave={(base64) => updateField('desenho_pentagonos', base64)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Interactive Sheet Annotation Modal */}
      <InteractiveNeurologicalSheetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        savedAnnotation={data?.anotacao_diagrama_imagem}
        onSaveAnnotation={(base64) => updateField('anotacao_diagrama_imagem', base64)}
      />
    </div>
  );
}

