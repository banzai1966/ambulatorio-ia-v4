import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Activity, 
  Layers, 
  Heart, 
  Pill, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Phone, 
  FileText, 
  Zap, 
  AlertCircle,
  FileSignature
} from 'lucide-react';
import { TOOTH_METADATA, STATUS_CONFIG, ToothRecord, OdontogramData } from './InteractiveOdontogram';
import { BiologicalDentistryData } from './BiologicalDentistryForm';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone?: string;
  patientCpf?: string;
  patientDob?: string;
  data: BiologicalDentistryData;
  clinicInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    cnpj?: string;
  };
}

export default function BiologicalDossierModal({
  isOpen,
  onClose,
  patientName,
  patientPhone,
  patientCpf,
  patientDob,
  data,
  clinicInfo
}: Props) {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const teethData: Record<number, ToothRecord> = data.odontograma?.teeth || {};
  const identifiedTeeth = Object.values(teethData).filter(t => t && t.status && t.status !== 'healthy');

  // Helper de dentes por status
  const amalgams = identifiedTeeth.filter(t => t.status === 'amalgam');
  const zirconias = identifiedTeeth.filter(t => t.status === 'zirconia_implant');
  const nicos = identifiedTeeth.filter(t => t.status === 'cavitation_nico');
  const endos = identifiedTeeth.filter(t => t.status === 'endodontic');
  const ceramics = identifiedTeeth.filter(t => t.status === 'ceramic_crown');

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!patientPhone) {
      toast.error('Telefone do paciente não informado.');
      return;
    }
    const cleanPhone = patientPhone.replace(/\D/g, '');
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    const msg = `*Dossiê de Odontologia Biológica & Saúde Integrativa*\n` +
      `*Paciente:* ${patientName}\n` +
      `*Profissional:* Dra. Lucy Murata (CRO-SP 69246)\n\n` +
      `Olá! Seu planejamento de Odontologia Biológica está pronto. Elaboramos um cronograma detalhado de tratamento em 4 fases integrativas, remoção segura SMART (IAOMT) e prescrição de suplementação.\n\n` +
      `_Ambulatório IA • Gestão Clínica Integrativa_`;

    const url = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Screen Only) */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 text-[10px] font-black uppercase rounded-md tracking-wider border border-blue-400/30">
                  Dra. Lucy Morata
                </span>
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Dossiê Odontológico Biológico (2 Páginas)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Documento de alto padrão pronto para impressão, PDF e entrega ao paciente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Compartilhar resumo via WhatsApp"
            >
              <Share2 size={15} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95"
              title="Imprimir ou Salvar em PDF"
            >
              <Printer size={15} />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div ref={printContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 space-y-8 print:p-0 print:bg-white print:space-y-0 print:overflow-visible">
          
          {/* ========================================================================= */}
          {/* PÁGINA 1: MAPA INTEGRATIVO & CORRELAÇÃO DENTE-ÓRGÃO                      */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-4xl mx-auto min-h-[1050px] flex flex-col justify-between print:border-none print:shadow-none print:p-8 print:m-0 print:min-h-screen print:page-break-after-always">
            
            <div className="space-y-6">
              {/* Header Timbrado */}
              <div className="flex items-start justify-between border-b-2 border-blue-900/20 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      Consultório Dra. Lucy Murata
                    </h1>
                  </div>
                  <h2 className="text-sm font-bold text-blue-700">
                    Odontologia Biológica & Saúde Integrativa • Reabilitação Metal-Free
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Torre II - Praça Maastricht, 200 - Sl 103, Jardim Sao Jose, Bragança Paulista - SP, 12917-021 • Tel/WhatsApp: (11) 91031-5626
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-right">
                    <p className="text-xs font-extrabold text-blue-900">Dra. Lucy Murata</p>
                    <p className="text-[10px] font-semibold text-blue-700">CRO-SP: 69246 • IAOMT Member</p>
                    <p className="text-[9px] text-slate-500">Odontologia Biológica</p>
                  </div>
                </div>
              </div>

              {/* Banner do Dossiê */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    Dossiê Clínico do Paciente • Página 1 de 2
                  </span>
                  <h3 className="text-lg font-black tracking-tight">
                    Mapa de Correlação Dente-Órgão & Focos Biológicos
                  </h3>
                </div>
                <div className="text-right text-[11px] text-blue-100 shrink-0">
                  <p><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                  <p><strong>Protocolo:</strong> BIO-{Math.floor(100000 + Math.random() * 900000)}</p>
                </div>
              </div>

              {/* Dados do Paciente */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Paciente</span>
                  <span className="font-extrabold text-slate-800 truncate block">{patientName || 'Não Informado'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">CPF</span>
                  <span className="font-semibold text-slate-700">{patientCpf || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nascimento</span>
                  <span className="font-semibold text-slate-700">{patientDob || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Contato</span>
                  <span className="font-semibold text-slate-700">{patientPhone || 'Não informado'}</span>
                </div>
              </div>

              {/* Bloco 1: Odontograma & Elementos Afetados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Award size={16} className="text-blue-600" />
                    <span>1. Mapeamento da Arcada & Cargas Biológicas</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">
                    Notação Dentária Internacional (FDI 11 a 48)
                  </span>
                </div>

                {identifiedTeeth.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {identifiedTeeth.map((tooth) => {
                      const meta = TOOTH_METADATA[tooth.id];
                      const cfg = STATUS_CONFIG[tooth.status] || { label: tooth.status, shortLabel: tooth.status, badgeColor: 'bg-slate-500' };
                      return (
                        <div key={tooth.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                              Elemento #{tooth.id}
                            </span>
                            <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-md ${cfg.badgeColor}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-700 truncate">
                            {meta?.name || `Dente ${tooth.id}`}
                          </p>
                          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                            <span><strong>Meridiano:</strong> {meta?.meridian || 'Geral'}</span>
                            <span className="text-blue-600 font-bold">{meta?.organ || 'Sistêmico'}</span>
                          </div>
                          {tooth.notes && (
                            <p className="text-[10px] text-slate-600 italic bg-slate-50 p-1 rounded">
                              "{tooth.notes}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900">
                    <p className="font-bold">Avaliação Preventiva & Diagnóstica:</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Nenhum foco crítico registrado nesta sessão. Exame de rotina biológica focado na preservação de estruturas hígidas e integridade da barreira oral.
                    </p>
                  </div>
                )}
              </div>

              {/* Bloco 2: Tabela de Correlação Dente-Órgão-Meridiano (Medicina de Voll) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" />
                    <span>2. Correlações Sistêmicas Dente-Órgão (Tabela de Voll)</span>
                  </h4>
                  <span className="text-[10px] font-bold text-blue-600">
                    Impacto nos Órgãos à Distância
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase border-b border-slate-200">
                        <th className="p-2.5">Elemento / Região</th>
                        <th className="p-2.5">Condição Biológica</th>
                        <th className="p-2.5">Órgão & Meridiano Relacionado</th>
                        <th className="p-2.5">Possível Repercussão Sistêmica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {identifiedTeeth.length > 0 ? (
                        identifiedTeeth.slice(0, 5).map((t) => {
                          const meta = TOOTH_METADATA[t.id];
                          const cfg = STATUS_CONFIG[t.status];
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/80">
                              <td className="p-2.5 font-bold text-slate-800">
                                #{t.id} - {meta?.type === 'molar' ? 'Molar' : (meta?.type === 'incisor' ? 'Incisivo' : (meta?.type === 'canine' ? 'Canino' : 'Pré-Molar'))}
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white ${cfg?.badgeColor || 'bg-slate-500'}`}>
                                  {cfg?.label || t.status}
                                </span>
                              </td>
                              <td className="p-2.5 font-semibold text-blue-900">
                                {meta?.organ || 'Geral'} ({meta?.meridian || 'Voll'})
                              </td>
                              <td className="p-2.5 text-slate-600">
                                {meta?.tissue || 'Articulações, coluna vertebral e sistema imunológico'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-500 italic">
                            Arcada sem focos interferentes primários identificados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bloco 3: Resumo dos Focos Inflamatórios & Carga Tóxica */}
              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold">
                  <AlertCircle size={15} />
                  <span>Avaliação de Focos Inflamatórios, NICO & Galvanismo:</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {data.focos_descricao || data.observacoes_odonto_biologica || (
                    data.amalgama_ativo 
                      ? "Presença de ligas metálicas com potencial galvânico e liberação contínua de vapores de mercúrio. Indicada remoção segura através do Protocolo SMART (IAOMT) para cessar o estresse oxidativo celular."
                      : "Planejamento biológico individualizado com foco na biocompatibilidade dos materiais restauradores, integridade da microbiota oral e modulação inflamatória."
                  )}
                </p>
              </div>
            </div>

            {/* Rodapé Página 1 */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>Ambulatório IA • Protocolo Dra. Lucy Morata</span>
              <span>Página 1 de 2 (Continua no verso)</span>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* PÁGINA 2: CRONOGRAMA DE TRATAMENTO & PRESCRIÇÃO SISTÊMICA                 */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-4xl mx-auto min-h-[1050px] flex flex-col justify-between print:border-none print:shadow-none print:p-8 print:m-0 print:min-h-screen">
            
            <div className="space-y-6">
              {/* Header Timbrado Pg 2 */}
              <div className="flex items-start justify-between border-b-2 border-blue-900/20 pb-4">
                <div className="space-y-0.5">
                  <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                    Ambulatório IA • Plano Terapêutico Biológico
                  </h1>
                  <p className="text-xs font-bold text-blue-700">
                    Cronograma Sequencial em 4 Fases & Protocolo de Suplementação
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-extrabold text-slate-800">{patientName}</p>
                  <p className="text-[10px] text-slate-500">Dossiê • Página 2 de 2</p>
                </div>
              </div>

              {/* Bloco 4: Cronograma Sequencial em 4 Fases (Timeline) */}
              <div className="space-y-3">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-blue-600" />
                  <span>3. Cronograma de Tratamento Integrativo (4 Fases)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Fase 1 */}
                  <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">1</span>
                      <span className="font-extrabold text-xs text-blue-900">Preparo Biológico & Imunidade</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      15 a 30 dias de suplementação com Vit D3+K2, Vit C e minerais para otimização do terreno celular e desintoxicação hepática prévia.
                    </p>
                  </div>

                  {/* Fase 2 */}
                  <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-black text-[10px] flex items-center justify-center">2</span>
                      <span className="font-extrabold text-xs text-amber-900">Remoção Segura SMART (IAOMT)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Troca por quadrantes elétricos com dique de nitrilo, oxigênio nasal 100%, exaustor de mercúrio e agentes quelantes (Chlorella).
                    </p>
                  </div>

                  {/* Fase 3 */}
                  <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">3</span>
                      <span className="font-extrabold text-xs text-emerald-900">Cirurgia & Implantes Metal-Free</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Curetagem de cavitações NICO, Ozonioterapia, Terapia Neural com Procaína e instalação de Implante Cerâmico de Zircônia + i-PRF.
                    </p>
                  </div>

                  {/* Fase 4 */}
                  <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center">4</span>
                      <span className="font-extrabold text-xs text-purple-900">Pós-Operatório & Integração</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Fotobiomodulação (Laser ILIB), restaurações definitivas livres de bisfenol e consolidação da saúde sistêmica.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloco 5: Prescrição & Guia de Suplementação Sistêmica Oficial */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Pill size={16} className="text-blue-600" />
                    <h4 className="font-black text-sm text-slate-900">
                      4. Prescrição de Suplementação Sistêmica & Quelação
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded">
                    Uso Oral / Terapêutico
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Item 1 */}
                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-extrabold text-slate-800">1. Vitamina D3 (10.000 UI) + Vitamina K2 MK-7 (100 mcg)</span>
                      <p className="text-[11px] text-slate-500">Tomar 1 cápsula pela manhã com a refeição. (Otimização óssea e mineralização).</p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-extrabold text-slate-800">2. Vitamina C Lipossomal (1.000 mg)</span>
                      <p className="text-[11px] text-slate-500">Tomar 1 dose 2x ao dia. (Poderoso antioxidante e estimulador de colágeno).</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-extrabold text-slate-800">3. Zinco Quelato (30 mg) + Magnésio Dimalato (250 mg)</span>
                      <p className="text-[11px] text-slate-500">Tomar 1 cápsula à noite antes de dormir. (Imunidade e relaxamento muscular).</p>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-extrabold text-slate-800">4. Chlorella Orgânica (500 mg) + Carvão Ativado Vegetal</span>
                      <p className="text-[11px] text-slate-500">Tomar 4 cápsulas de Chlorella 30 min antes e após cada sessão de remoção SMART.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 6: Assinatura e Carimbo Oficial da Dra. Lucy Murata */}
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Orientações Finais:</p>
                  <p className="text-[11px]">Siga rigorosamente as fases de preparo biológico para maximizar a cicatrização e regeneração tecidual.</p>
                </div>

                <div className="text-center sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
                  <div className="inline-block text-center">
                    <div className="w-48 border-b-2 border-slate-800 pb-1 mb-1 mx-auto">
                      <span className="font-serif italic font-bold text-blue-900 text-sm">Dra. Lucy Murata</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 uppercase">Dra. Lucy Murata</p>
                    <p className="text-[10px] font-semibold text-slate-500">CRO-SP: 69246 • Odontologia Biológica</p>
                    <p className="text-[9px] text-emerald-600 font-bold flex items-center justify-center gap-1 mt-0.5">
                      <FileSignature size={10} /> Assinatura Digital ICP-Brasil / IAOMT
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé Página 2 */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>Ambulatório IA • Protocolo Dra. Lucy Murata (CRO-SP 69246)</span>
              <span>Página 2 de 2 • Fim do Documento</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
