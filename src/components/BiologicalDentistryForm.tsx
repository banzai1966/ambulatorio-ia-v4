import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Check, 
  Info, 
  RefreshCw,
  FileText,
  Award,
  CircleDot,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Printer
} from 'lucide-react';
import { cn } from '../lib/utils';
import InteractiveOdontogram, { OdontogramData, ToothRecord, TOOTH_METADATA } from './InteractiveOdontogram';
import BiologicalDossierModal from './BiologicalDossierModal';

export interface BiologicalDentistryData {
  // Odontograma Interativo
  odontograma?: OdontogramData;

  // Implantes Metal-Free Zircônia
  implante_zirconia_ativo?: boolean;
  implante_elementos?: string;
  implante_tipo_sistema?: string;
  implante_estagio?: string;
  implante_prf_ienxerto?: boolean;
  implante_cirurgia_guiada?: boolean;
  implante_biocompatibilidade?: string;

  // Remoção Amálgama / SMART Protocol
  amalgama_ativo?: boolean;
  amalgama_elementos?: string;
  smart_dique_nitrilo?: boolean;
  smart_oxigenio_nasal?: boolean;
  smart_exaustor_vapor?: boolean;
  smart_irrigacao_alta?: boolean;
  smart_carvao_chlorella?: boolean;
  smart_quelacao_vitc?: boolean;

  // Focos Inflamatórios & Cavitações
  focos_cavitacao_ativo?: boolean;
  focos_descricao?: string;
  focos_tomografia_cbct?: string;
  focos_grau_inflamatorio?: string;

  // Terapia Neural, Ozônio & Laser
  terapia_neural_ativo?: boolean;
  terapia_neural_locais?: string;
  ozonioterapia_ativo?: boolean;
  ozonio_modalidades?: string[];
  laserterapia_ilib?: boolean;

  // ATM & Bruxismo
  atm_bruxismo_ativo?: boolean;
  atm_sintomas?: string[];
  atm_conduta?: string;

  // Suplementação Pré/Pós Cirúrgica (Dra. Lucy Protocol)
  suplemento_vit_d3_k2?: boolean;
  suplemento_vit_c?: boolean;
  suplemento_zinco_mg?: boolean;
  suplemento_arnica_homeo?: boolean;
  suplemento_coenzima_q10?: boolean;

  // Observações livres
  observacoes_odonto_biologica?: string;

  // Chaves legadas para retrocompatibilidade
  presenca_amalgama?: boolean;
  focos_interferencia?: string;
  dor_atm_bruxismo?: boolean;
  terapia_neural_odontologica?: boolean;
  [key: string]: any;
}

interface Props {
  data: BiologicalDentistryData;
  onChange: (data: BiologicalDentistryData) => void;
  patientName?: string;
  patientPhone?: string;
  patientCpf?: string;
  patientDob?: string;
  clinicInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    cnpj?: string;
  };
}

export default function BiologicalDentistryForm({ 
  data = {}, 
  onChange,
  patientName = '',
  patientPhone = '',
  patientCpf = '',
  patientDob = '',
  clinicInfo
}: Props) {
  const [showDossierModal, setShowDossierModal] = useState(false);

  const update = (patch: Partial<BiologicalDentistryData>) => {
    onChange({ ...data, ...patch });
  };

  const toggleArrayItem = (key: 'ozonio_modalidades' | 'atm_sintomas', item: string) => {
    const list = data[key] || [];
    if (list.includes(item)) {
      update({ [key]: list.filter((i: string) => i !== item) });
    } else {
      update({ [key]: [...list, item] });
    }
  };

  // Presets Rápidos
  const applyPresetZirconia = () => {
    update({
      odontograma: {
        teeth: {
          11: { id: 11, status: 'zirconia_implant', cbctFindings: 'Planejamento de implante cerâmico Zircônia', biologicalPlan: 'Cirurgia guiada 3D + PRF' },
          21: { id: 21, status: 'zirconia_implant', cbctFindings: 'Reabilitação metal-free anterior', biologicalPlan: 'Implante cerâmico Zircônia' }
        }
      },
      implante_zirconia_ativo: true,
      implante_elementos: '11, 21',
      implante_tipo_sistema: 'Zircônia Monobloco / Cerâmica Pura',
      implante_estagio: 'Cirurgia Instalada / Osteointegração',
      implante_prf_ienxerto: true,
      implante_cirurgia_guiada: true,
      implante_biocompatibilidade: 'Excelente (Teste Cerâmico Negativo para Alergias)',
      terapia_neural_ativo: true,
      terapia_neural_locais: 'Infiltração Procaína 0.5% retro-molar e cicatriz cirúrgica',
      laserterapia_ilib: true,
      suplemento_vit_d3_k2: true,
      suplemento_vit_c: true,
      suplemento_zinco_mg: true,
      suplemento_arnica_homeo: true,
    });
  };

  const applyPresetSMARTAmalgam = () => {
    update({
      odontograma: {
        teeth: {
          16: { id: 16, status: 'amalgam', notes: 'Amálgama oclusal com microinfiltração', biologicalPlan: 'Troca Segura Protocolo SMART (IAOMT)' },
          26: { id: 26, status: 'amalgam', notes: 'Amálgama classe II MOD', biologicalPlan: 'Troca Segura Protocolo SMART' },
          37: { id: 37, status: 'amalgam', notes: 'Amálgama antigo metálico', biologicalPlan: 'Troca Segura Protocolo SMART' },
          47: { id: 47, status: 'amalgam', notes: 'Amálgama antigo metálico', biologicalPlan: 'Troca Segura Protocolo SMART' }
        }
      },
      amalgama_ativo: true,
      presenca_amalgama: true,
      amalgama_elementos: '16, 26, 37, 47',
      smart_dique_nitrilo: true,
      smart_oxigenio_nasal: true,
      smart_exaustor_vapor: true,
      smart_irrigacao_alta: true,
      smart_carvao_chlorella: true,
      smart_quelacao_vitc: true,
      suplemento_vit_c: true,
      suplemento_zinco_mg: true,
    });
  };

  const applyPresetCavitationNico = () => {
    update({
      odontograma: {
        teeth: {
          38: { id: 38, status: 'cavitation_nico', cbctFindings: 'Área hipodensa trabecular em região de 38 extraído (NICO/FDOK)', biologicalPlan: 'Curetagem biológica + Ozonioterapia + Terapia Neural', neuralTherapy: true },
          48: { id: 48, status: 'cavitation_nico', cbctFindings: 'Foco osteonecrótico isquêmico detectado na tomografia CBCT', biologicalPlan: 'Insuflação cavitacional ozônio', neuralTherapy: true }
        }
      },
      focos_cavitacao_ativo: true,
      focos_grau_inflamatorio: 'Moderada / Foco Interferente',
      focos_tomografia_cbct: 'Área hipodensa em região de siso extraído (38/48) / NICO detectado em Tomografia Cone Beam',
      terapia_neural_ativo: true,
      terapia_neural_locais: 'Infiltração de Procaína no polo interferente e ganglio estelar',
      ozonioterapia_ativo: true,
      ozonio_modalidades: ['Insuflação Cavitacional', 'Água Ozonizada (Irrigação)'],
      suplemento_vit_d3_k2: true,
      suplemento_arnica_homeo: true,
    });
  };

  const resetForm = () => {
    if (window.confirm('Deseja limpar os campos de Odontologia Biológica?')) {
      onChange({});
    }
  };

  // Handler ao selecionar/atualizar dentes no Odontograma
  const handleOdontogramChange = (odontoData: OdontogramData) => {
    const teeth = odontoData.teeth || {};
    const amalgams = Object.values(teeth).filter(t => t.status === 'amalgam').map(t => t.id).join(', ');
    const zirconias = Object.values(teeth).filter(t => t.status === 'zirconia_implant').map(t => t.id).join(', ');
    const nicos = Object.values(teeth).filter(t => t.status === 'cavitation_nico').map(t => t.id).join(', ');

    update({
      odontograma: odontoData,
      ...(amalgams ? { amalgama_ativo: true, amalgama_elementos: amalgams } : {}),
      ...(zirconias ? { implante_zirconia_ativo: true, implante_elementos: zirconias } : {}),
      ...(nicos ? { focos_cavitacao_ativo: true } : {})
    });
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-5 md:p-6 rounded-3xl border border-blue-100 space-y-6 shadow-xs animate-in fade-in duration-300">
      {/* Header do Módulo Dra. Lucy */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1">
              <Sparkles size={12} /> Dra. Lucy
            </span>
            <h3 className="text-base font-extrabold text-slate-900">
              Odontologia Biológica
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Planejamento integrativo de implantes cerâmicos, remoção segura de amálgama (SMART), cavitações NICO, odontograma e terapia neural.
          </p>
        </div>

        {/* Botoes de Preenchimento Rápido / Presets & Dossiê */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowDossierModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-[11px] font-black tracking-tight transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Gerar Dossiê de Odontologia Biológica em 2 Páginas (PDF / Impressão)"
          >
            <Printer size={13} className="text-blue-200" />
            <span>✨ Dossiê Biológico (2 Págs)</span>
          </button>
          <button
            type="button"
            onClick={applyPresetZirconia}
            className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
            title="Preencher protocolo de Implante Cerâmico Zircônia"
          >
            💎 Implante Zircônia
          </button>
          <button
            type="button"
            onClick={applyPresetSMARTAmalgam}
            className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
            title="Preencher protocolo de Remoção SMART de Amálgama"
          >
            🛡️ Remoção SMART
          </button>
          <button
            type="button"
            onClick={applyPresetCavitationNico}
            className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
            title="Preencher protocolo de Cavitação/NICO"
          >
            ⚡ Foco/NICO
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
            title="Limpar formulário"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ODONTOGRAMA INTERATIVO CENTRAL (FDI 11 a 48) */}
      <div>
        <InteractiveOdontogram
          data={data.odontograma || {}}
          onChange={handleOdontogramChange}
        />
      </div>

      {/* BLOCO 1: IMPLANTES METAL-FREE EM ZIRCÔNIA */}
      <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Award size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Implantes Metal-Free em Zircônia</h4>
              <p className="text-[11px] text-slate-500">Substituição biocompatível cerâmica sem contaminação metálica</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => update({ implante_zirconia_ativo: true })}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                data.implante_zirconia_ativo === true ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => update({ implante_zirconia_ativo: false })}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                data.implante_zirconia_ativo === false ? "bg-slate-300 text-slate-700" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Não
            </button>
          </div>
        </div>

        {data.implante_zirconia_ativo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Elementos Dentários (Ex: 11, 21, 36, 46)</label>
              <input
                type="text"
                value={data.implante_elementos || ''}
                onChange={(e) => update({ implante_elementos: e.target.value })}
                placeholder="Ex: Elementos 11, 21, 36 (Região estética / posterior)"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Sistema de Implante Cerâmico</label>
              <select
                value={data.implante_tipo_sistema || ''}
                onChange={(e) => update({ implante_tipo_sistema: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione o tipo...</option>
                <option value="Zircônia Monobloco / Cerâmica Pura">Zircônia Monobloco (Corpo Único)</option>
                <option value="Zircônia Two-Piece / Duas Peças (Bi-componente)">Zircônia Two-Piece / Duas Peças</option>
                <option value="Implante Y-TZP de Alta Resistência">Implante Zircônia Y-TZP</option>
                <option value="Avaliação Biocompatibilidade / Pré-Cirúrgico">Avaliação Pré-Cirúrgica</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Estágio do Tratamento</label>
              <select
                value={data.implante_estagio || ''}
                onChange={(e) => update({ implante_estagio: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione o estágio...</option>
                <option value="Planejamento Tomográfico CBCT">1. Planejamento Tomográfico CBCT</option>
                <option value="Cirurgia Instalada / Osteointegração">2. Cirurgia Instalada (Em Osteointegração)</option>
                <option value="Prótese Cerâmica Finalizada">3. Prótese Cerâmica Finalizada</option>
                <option value="Acompanhamento Periódico">4. Acompanhamento Periódico</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Biocompatibilidade & Testes</label>
              <input
                type="text"
                value={data.implante_biocompatibilidade || ''}
                onChange={(e) => update({ implante_biocompatibilidade: e.target.value })}
                placeholder="Ex: Teste MELISA negativo / Sem reatividade"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity size={14} className="text-rose-600" />
                  Protocolos Cirúrgicos & Concentrados Sanguíneos (PRF / L-PRF)
                </span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Cirurgia Biológica & Fibrina
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                <label
                  onClick={() => update({ implante_prf_ienxerto: !data.implante_prf_ienxerto })}
                  className={cn(
                    "cursor-pointer p-2.5 rounded-xl border text-xs font-semibold flex flex-col gap-1 transition-all select-none",
                    data.implante_prf_ienxerto ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">L-PRF / Membranas</span>
                    {data.implante_prf_ienxerto ? <CheckCircle2 size={14} className="text-rose-600" /> : <CircleDot size={14} className="text-slate-400" />}
                  </div>
                  <span className="text-[10px] font-normal text-slate-500">Plugs e membranas ricas em plaquetas e leucócitos</span>
                </label>

                <label
                  onClick={() => update({ implante_iprf_sticky: !(data as any).implante_iprf_sticky })}
                  className={cn(
                    "cursor-pointer p-2.5 rounded-xl border text-xs font-semibold flex flex-col gap-1 transition-all select-none",
                    (data as any).implante_iprf_sticky ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">i-PRF / Sticky Bone</span>
                    {(data as any).implante_iprf_sticky ? <CheckCircle2 size={14} className="text-rose-600" /> : <CircleDot size={14} className="text-slate-400" />}
                  </div>
                  <span className="text-[10px] font-normal text-slate-500">Fibrina líquida injetável com enxerto mineralizado</span>
                </label>

                <label
                  onClick={() => update({ implante_cirurgia_guiada: !data.implante_cirurgia_guiada })}
                  className={cn(
                    "cursor-pointer p-2.5 rounded-xl border text-xs font-semibold flex flex-col gap-1 transition-all select-none",
                    data.implante_cirurgia_guiada ? "bg-blue-50 border-blue-300 text-blue-900" : "bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Cirurgia Guiada 3D</span>
                    {data.implante_cirurgia_guiada ? <CheckCircle2 size={14} className="text-blue-600" /> : <CircleDot size={14} className="text-slate-400" />}
                  </div>
                  <span className="text-[10px] font-normal text-slate-500">Guia prototipado via Tomografia CBCT</span>
                </label>

                <label
                  onClick={() => update({ implante_piezo: !(data as any).implante_piezo })}
                  className={cn(
                    "cursor-pointer p-2.5 rounded-xl border text-xs font-semibold flex flex-col gap-1 transition-all select-none",
                    (data as any).implante_piezo ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Piezoelétrico / Ósseo</span>
                    {(data as any).implante_piezo ? <CheckCircle2 size={14} className="text-amber-600" /> : <CircleDot size={14} className="text-slate-400" />}
                  </div>
                  <span className="text-[10px] font-normal text-slate-500">Corte ultrassônico atérmico para preservação óssea</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BLOCO 2: REMOÇÃO SEGURA DE AMÁLGAMA (PROTOCOLO SMART / IAOMT) */}
      <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Remoção Segura de Amálgama (SMART / IAOMT)</h4>
              <p className="text-[11px] text-slate-500">Proteção biológica contra vapores de mercúrio e contaminação sistêmica</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => update({ amalgama_ativo: true, presenca_amalgama: true })}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                (data.amalgama_ativo || data.presenca_amalgama) ? "bg-amber-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => update({ amalgama_ativo: false, presenca_amalgama: false })}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                (!data.amalgama_ativo && !data.presenca_amalgama) ? "bg-slate-300 text-slate-700" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Não
            </button>
          </div>
        </div>

        {(data.amalgama_ativo || data.presenca_amalgama) && (
          <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Dentes com Amálgama / Restaurações Metálicas</label>
              <input
                type="text"
                value={data.amalgama_elementos || ''}
                onChange={(e) => update({ amalgama_elementos: e.target.value })}
                placeholder="Ex: Dentes 16, 26, 37, 47 (Restaurados com amálgama antigo)"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Checklist de Proteção Protocolo SMART</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: 'smart_dique_nitrilo', label: 'Dique Borracha Nitrilo' },
                  { key: 'smart_oxigenio_nasal', label: 'Oxigênio Nasal Filtro' },
                  { key: 'smart_exaustor_vapor', label: 'Exaustor Vapor Mercúrio' },
                  { key: 'smart_irrigacao_alta', label: 'Abundante Irrigação Água' },
                  { key: 'smart_carvao_chlorella', label: 'Chlorella / Carvão Pré-Op' },
                  { key: 'smart_quelacao_vitc', label: 'Vit C Altas Doses Pré/Pós' },
                ].map((item) => {
                  const active = !!data[item.key as keyof BiologicalDentistryData];
                  return (
                    <label
                      key={item.key}
                      onClick={() => update({ [item.key]: !active })}
                      className={cn(
                        "cursor-pointer p-2 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all select-none",
                        active ? "bg-amber-50 border-amber-300 text-amber-900 font-bold" : "bg-slate-50 border-slate-200 text-slate-600"
                      )}
                    >
                      {active ? <CheckCircle2 size={13} className="text-amber-600 shrink-0" /> : <CircleDot size={13} className="text-slate-400 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BLOCO 3: FOCOS INFLAMATÓRIOS, CANAIS E CAVITAÇÕES (NICO/FDOK) */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Activity size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Focos Inflamatórios, Canais & Cavitações (NICO/FDOK)</h4>
              <p className="text-[11px] text-slate-500">Mapeamento de interferências silenciosas no osso alveolar e dentes despolpados</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => update({ focos_cavitacao_ativo: true })}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                data.focos_cavitacao_ativo === true ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => update({ focos_cavitacao_ativo: false })}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                data.focos_cavitacao_ativo === false ? "bg-slate-300 text-slate-700" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Não
            </button>
          </div>
        </div>

        {data.focos_cavitacao_ativo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição dos Focos / Endodontias Antigas</label>
              <input
                type="text"
                value={data.focos_descricao || data.focos_interferencia || ''}
                onChange={(e) => update({ focos_descricao: e.target.value, focos_interferencia: e.target.value })}
                placeholder="Ex: Tratamento de canal no dente 26 com lesão periapical"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Achados Tomografia CBCT / Raio-X</label>
              <input
                type="text"
                value={data.focos_tomografia_cbct || ''}
                onChange={(e) => update({ focos_tomografia_cbct: e.target.value })}
                placeholder="Ex: Cavitação osteoncrótica em região de 38 extraído há 5 anos"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* BLOCO 4: TERAPIA NEURAL, OZÔNIO & LASERTERAPIA */}
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Zap size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Terapia Neural, Ozônio & Fotobiomodulação</h4>
              <p className="text-[11px] text-slate-500">Repolarização do sistema nervoso vegetativo e estimulação tecidual</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => update({ terapia_neural_ativo: true, terapia_neural_odontologica: true })}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                (data.terapia_neural_ativo || data.terapia_neural_odontologica) ? "bg-purple-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => update({ terapia_neural_ativo: false, terapia_neural_odontologica: false })}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                (!data.terapia_neural_ativo && !data.terapia_neural_odontologica) ? "bg-slate-300 text-slate-700" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Não
            </button>
          </div>
        </div>

        {(data.terapia_neural_ativo || data.terapia_neural_odontologica) && (
          <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Locais de Aplicação Procaína 0.5% - 1%</label>
              <input
                type="text"
                value={data.terapia_neural_locais || ''}
                onChange={(e) => update({ terapia_neural_locais: e.target.value })}
                placeholder="Ex: Polo amigdalino direito, cicatriz cirúrgica elemento 38, retro-molar"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Insuflação Ozônio Cavitacional', value: 'Insuflação Cavitacional' },
                { label: 'Irrigação Água Ozonizada', value: 'Água Ozonizada (Irrigação)' },
                { label: 'Laser Infravermelho Bioestimulante', value: 'Laser Infravermelho' },
                { label: 'Terapia ILIB Sistêmica', value: 'ILIB' },
              ].map((opt) => {
                const list = data.ozonio_modalidades || [];
                const isChecked = list.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    onClick={() => toggleArrayItem('ozonio_modalidades', opt.value)}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all select-none",
                      isChecked ? "bg-purple-50 border-purple-300 text-purple-900" : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                  >
                    {isChecked ? <CheckCircle2 size={14} className="text-purple-600" /> : <CircleDot size={14} className="text-slate-400" />}
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* BLOCO 5: SUPLEMENTAÇÃO CIRÚRGICA & SISTÊMICA INTEGRATIVA */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Preparo & Suplementação Sistêmica Integrativa</h4>
            <p className="text-[11px] text-slate-500">Otimização de terreno biológico para osteointegração rápida e cicatrização sem complicações</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
          {[
            { key: 'suplemento_vit_d3_k2', label: 'Vit D3 + K2 (MK-7) [>60ng/mL]' },
            { key: 'suplemento_vit_c', label: 'Vitamina C Altas Doses' },
            { key: 'suplemento_zinco_mg', label: 'Zinco + Magnésio Bisglicinato' },
            { key: 'suplemento_arnica_homeo', label: 'Homeopatia / Arnica Montana' },
            { key: 'suplemento_coenzima_q10', label: 'Coenzima Q10 + Probióticos' },
          ].map((sup) => {
            const active = !!data[sup.key as keyof BiologicalDentistryData];
            return (
              <label
                key={sup.key}
                onClick={() => update({ [sup.key]: !active })}
                className={cn(
                  "cursor-pointer p-2.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all select-none",
                  active ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-600"
                )}
              >
                {active ? <CheckCircle2 size={14} className="text-indigo-600 shrink-0" /> : <CircleDot size={14} className="text-slate-400 shrink-0" />}
                <span className="truncate">{sup.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* BLOCO 6: OBSERVAÇÕES & PLANO CIRÚRGICO */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
          <FileText size={14} className="text-blue-600" />
          Observações & Conduta do Módulo Dra. Lucy
        </label>
        <textarea
          rows={3}
          value={data.observacoes_odonto_biologica || ''}
          onChange={(e) => update({ observacoes_odonto_biologica: e.target.value })}
          placeholder="Digite observações sobre o plano cirúrgico, osteointegração dos implantes cerâmicos, protocolo de remoção de amálgama ou conduta integrativa..."
          className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white shadow-xs"
        />
      </div>

      {/* Dossiê Odontológico Biológico Modal (2 Páginas) */}
      <BiologicalDossierModal
        isOpen={showDossierModal}
        onClose={() => setShowDossierModal(false)}
        patientName={patientName || 'Paciente'}
        patientPhone={patientPhone}
        patientCpf={patientCpf}
        patientDob={patientDob}
        data={data}
        clinicInfo={clinicInfo}
      />
    </div>
  );
}
