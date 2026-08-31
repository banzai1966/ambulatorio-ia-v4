import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Stethoscope, 
  Sparkles, 
  Brain, 
  Activity, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  FileText, 
  Award, 
  Layers, 
  HelpCircle, 
  BookOpen, 
  ArrowRight, 
  ChevronRight, 
  Download, 
  Clock, 
  Mic, 
  Search, 
  Image as ImageIcon, 
  Check, 
  Flame, 
  Smile, 
  Pill, 
  Droplets,
  Calendar,
  DollarSign,
  Users,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ManualClinicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProfile?: 'dr_carlos' | 'dra_lucy';
}

export default function ManualClinicoModal({ isOpen, onClose, defaultProfile = 'dr_carlos' }: ManualClinicoModalProps) {
  const [selectedManual, setSelectedManual] = useState<'dr_carlos' | 'dra_lucy'>(defaultProfile);
  const isLucy = selectedManual === 'dra_lucy';
  
  const [activeSection, setActiveSection] = useState<string>(
    defaultProfile === 'dra_lucy' ? 'lucy_visao_geral' : 'carlos_visao_geral'
  );

  // Sincroniza o perfil quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      setSelectedManual(defaultProfile);
      setActiveSection(defaultProfile === 'dra_lucy' ? 'lucy_visao_geral' : 'carlos_visao_geral');
    }
  }, [isOpen, defaultProfile]);

  const handleSwitchManual = (profile: 'dr_carlos' | 'dra_lucy') => {
    setSelectedManual(profile);
    setActiveSection(profile === 'dra_lucy' ? 'lucy_visao_geral' : 'carlos_visao_geral');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-[28px] sm:rounded-[36px] max-w-6xl w-full shadow-2xl relative max-h-[94vh] flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Top Header Dedicado e Exclusivo do Profissional */}
            <div className={cn(
              "p-5 sm:p-7 text-white relative shrink-0 border-b transition-colors duration-300",
              isLucy 
                ? "bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 border-emerald-900/60" 
                : "bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border-blue-900/60"
            )}>
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all cursor-pointer z-10"
                title="Fechar Manual"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-12">
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 border border-white/20",
                    isLucy 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25" 
                      : "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/25"
                  )}>
                    {isLucy ? <Sparkles size={26} /> : <Brain size={26} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold border",
                        isLucy 
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" 
                          : "bg-blue-500/20 text-blue-300 border-blue-400/30"
                      )}>
                        <BookOpen size={11} /> 
                        {isLucy 
                          ? "Manual Clínico Exclusivo • Dra. Lucy Morata" 
                          : "Manual Clínico Exclusivo • Dr. Carlos Morato"}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {isLucy 
                        ? "Manual de Odontologia Biológica & Cirurgia" 
                        : "Manual de Medicina, Neurologia & Integrativa"}
                    </h2>
                    <p className="text-xs text-slate-300 font-medium">
                      {isLucy 
                        ? "Guia de Odontograma 3D, Remoção Segura de Amálgama (SMART), Implantes Zircônia, PRF e Ozonioterapia" 
                        : "Guia de Consulta por Voz com IA, Exame Neurológico (Wexler, Dermátomos, MEEM) e Prescrição Anvisa"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Interno: Sidebar de Capítulos + Área de Leitura Extensa */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 min-h-0">
              
              {/* Sidebar de Navegação de Capítulos */}
              <aside className="w-full md:w-76 bg-white border-r border-slate-200 p-3 sm:p-4 overflow-y-auto shrink-0 flex flex-col gap-1.5">
                <div className={cn(
                  "px-2 py-1 text-[11px] font-black uppercase tracking-wider",
                  isLucy ? "text-emerald-800" : "text-blue-800"
                )}>
                  {isLucy ? "Capítulos • Dra. Lucy" : "Capítulos • Dr. Carlos"}
                </div>

                {/* Capítulos do Dr. Carlos */}
                {!isLucy && (
                  <>
                    <button
                      onClick={() => setActiveSection('carlos_visao_geral')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'carlos_visao_geral'
                          ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Activity size={15} className="text-blue-600 shrink-0" />
                        1. Visão Geral & Filosofia
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('carlos_consulta_ia')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'carlos_consulta_ia'
                          ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Mic size={15} className="text-blue-600 shrink-0" />
                        2. Consulta por Voz S.O.A.P.
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('carlos_exame_neuro')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'carlos_exame_neuro'
                          ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Brain size={15} className="text-purple-600 shrink-0" />
                        3. Exame Neuro (Wexler, Dermátomos, MEEM)
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('carlos_integrativa')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'carlos_integrativa'
                          ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Pill size={15} className="text-teal-600 shrink-0" />
                        4. Checklist Integrativo (40+ Itens)
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('carlos_bodymap_sinais')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'carlos_bodymap_sinais'
                          ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Layers size={15} className="text-indigo-600 shrink-0" />
                        5. Mapeamento Corporal & Sinais
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('carlos_receituario_pdf')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'carlos_receituario_pdf'
                          ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <FileText size={15} className="text-emerald-600 shrink-0" />
                        6. Receituário Anvisa & PDF
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('carlos_agenda_rotina')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'carlos_agenda_rotina'
                          ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Calendar size={15} className="text-blue-600 shrink-0" />
                        7. Agenda, Fila & WhatsApp
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>
                  </>
                )}

                {/* Capítulos da Dra. Lucy */}
                {isLucy && (
                  <>
                    <button
                      onClick={() => setActiveSection('lucy_visao_geral')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_visao_geral'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles size={15} className="text-emerald-600 shrink-0" />
                        1. Visão Geral da Odontologia Biológica
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('lucy_odontograma')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_odontograma'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Smile size={15} className="text-emerald-600 shrink-0" />
                        2. Odontograma 3D & Meridianos
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('lucy_zirconia_prf')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_zirconia_prf'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Award size={15} className="text-blue-600 shrink-0" />
                        3. Zircônia & Protocolos PRF / L-PRF
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('lucy_smart_amalgama')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_smart_amalgama'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck size={15} className="text-amber-600 shrink-0" />
                        4. Remoção de Amálgama (SMART/IAOMT)
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('lucy_cavitacoes_terapia')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_cavitacoes_terapia'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Zap size={15} className="text-purple-600 shrink-0" />
                        5. Cavitações NICO & Ozonioterapia
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('lucy_presets_rapidos')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_presets_rapidos'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Flame size={15} className="text-rose-600 shrink-0" />
                        6. Presets Clínicos Rápidos
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('lucy_agenda_rotina')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_agenda_rotina'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Calendar size={15} className="text-emerald-600 shrink-0" />
                        7. Agenda, Fila & Recibos
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>
                  </>
                )}
              </aside>

              {/* Área Central de Conteúdo Detalhado */}
              <main className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-6">
                
                {/* ========================================================= */}
                {/* CONTEÚDO MANUAL DR. CARLOS (MEDICINA, NEURO & INTEGRATIVA) */}
                {/* ========================================================= */}

                {selectedManual === 'dr_carlos' && activeSection === 'carlos_visao_geral' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                          <Activity size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Manual Médico Oficial</span>
                          <h3 className="text-xl font-extrabold text-slate-900">1. Visão Geral da Prática Clínica do Dr. Carlos</h3>
                          <p className="text-xs text-slate-500">Filosofia de atendimento de alta precisão aliando Neurologia Clínica e Medicina Integrativa.</p>
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
                        <p>
                          O módulo do <strong>Dr. Carlos</strong> foi projetado para médicos que realizam avaliações neurológicas aprofundadas e investigações metabólicas completas. Ele elimina digitação mecânica repetitiva através da transcrição por voz com Inteligência Artificial, gerando o formato clínico padrão <strong>S.O.A.P.</strong> (Subjetivo, Objetivo, Avaliação e Plano).
                        </p>
                        
                        <div className="grid sm:grid-cols-3 gap-3 pt-2">
                          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-1.5">
                            <strong className="text-blue-950 font-bold text-xs flex items-center gap-1.5">
                              <Brain size={16} className="text-blue-600" /> Neurologia Clínica
                            </strong>
                            <p className="text-xs text-slate-600">
                              Exame de pares cranianos, reflexos de Wexler, dermátomos medulares de dor e teste cognitivo MEEM interativo.
                            </p>
                          </div>

                          <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200/80 space-y-1.5">
                            <strong className="text-teal-950 font-bold text-xs flex items-center gap-1.5">
                              <Pill size={16} className="text-teal-600" /> Saúde Integrativa
                            </strong>
                            <p className="text-xs text-slate-600">
                              Checklist de mais de 40 fitoterápicos, vitaminas, neurotransmissores, biorregulação mitocondrial e patógenos crônicos.
                            </p>
                          </div>

                          <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/80 space-y-1.5">
                            <strong className="text-purple-950 font-bold text-xs flex items-center gap-1.5">
                              <Layers size={16} className="text-purple-600" /> Prontuário Completo
                            </strong>
                            <p className="text-xs text-slate-600">
                              Linha do tempo permanente do paciente, comparação de consultas anteriores e emissão de receituários digitais Anvisa.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dr_carlos' && activeSection === 'carlos_consulta_ia' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                          <Mic size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Passo a Passo da Consulta</span>
                          <h3 className="text-xl font-extrabold text-slate-900">2. Como Realizar a Consulta por Voz & Estruturação S.O.A.P.</h3>
                          <p className="text-xs text-slate-500">Roteiro operacional exato desde a entrada do paciente até a gravação final do prontuário.</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                          <div className="text-xs sm:text-sm space-y-1">
                            <strong className="text-slate-900 font-bold">Seleção do Paciente e Modo de Exame:</strong>
                            <p className="text-slate-600 leading-relaxed">
                              Na aba <strong>"Atendimento Clínico"</strong>, clique no nome do paciente agendado ou busque por Nome/CPF no topo. Certifique-se de que a especialidade está definida como <em>"Neurologia"</em> ou <em>"Medicina Integrativa"</em> para carregar as ferramentas corretas.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                          <div className="text-xs sm:text-sm space-y-1">
                            <strong className="text-slate-900 font-bold">Gravação de Voz com a IA Médica:</strong>
                            <p className="text-slate-600 leading-relaxed">
                              Clique no botão circular com o <strong>Microfone Azul</strong>. Você pode deixar o microfone ligado durante o diálogo com o paciente ou ditar uma síntese ao final. O motor de transcrição inteligente capta terminologia médica técnica com alta fidelidade.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                          <div className="text-xs sm:text-sm space-y-1">
                            <strong className="text-slate-900 font-bold">Parada e Processamento Automático S.O.A.P.:</strong>
                            <p className="text-slate-600 leading-relaxed">
                              Ao clicar em <strong>"Parar Gravação"</strong>, a IA processa o áudio e distribui instantaneamente as informações em 4 blocos clínicos:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 space-y-1 pt-1 pl-2">
                              <li><strong>S (Subjetivo / Queixa Principal):</strong> Histórico da moléstia atual e sintomas relatados.</li>
                              <li><strong>O (Objetivo / Exame Físico):</strong> Dados do exame clínico, reflexos e sinais observados.</li>
                              <li><strong>A (Avaliação / Hipótese Diagnóstica):</strong> Raciocínio clínico e códigos CID sugeridos.</li>
                              <li><strong>P (Plano / Conduta Terapêutica):</strong> Exames complementares solicitados e orientações.</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                          <div className="text-xs sm:text-sm space-y-1">
                            <strong className="text-emerald-950 font-bold">Salvar / Evoluir Prontuário:</strong>
                            <p className="text-slate-600 leading-relaxed">
                              Revise o texto gerado, faça ajustes manuais se desejar e clique no botão verde <strong>"Evoluir / Salvar Prontuário"</strong>. Os dados são gravados com carimbo de data, hora e assinatura digital na nuvem protegida.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dr_carlos' && activeSection === 'carlos_exame_neuro' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                          <Brain size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Protocolos Neurológicos</span>
                          <h3 className="text-xl font-extrabold text-slate-900">3. Exame Neurológico Completo & Diagramas Anatômicos</h3>
                          <p className="text-xs text-slate-500">Uso interativo dos dermátomos, escala de Wexler e desenho cognitivo do MEEM.</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                            <Layers size={16} className="text-purple-600" />
                            Mapa de Dermátomos C2 a S5
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Diagrama anatômico frontal e dorsal. Clique sobre o dermátomo correspondente (ex: L4, L5, S1 para ciatalgias ou C6/C7 para radiculopatias cervicais) para registrar áreas de hiperestesia, hipoestesia ou alodinia.
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                            <Activity size={16} className="text-purple-600" />
                            Escala de Reflexos de Wexler
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Graduação de 0 a 4+ (0: Abolido, 1+: Hipoativo, 2+: Normal, 3+: Hiperativo, 4+: Hiperativo com Clônus) para os reflexos Bicipital, Tricipital, Patelar e Aquileu em ambos os hemicorpos.
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                            <Sparkles size={16} className="text-purple-600" />
                            Canvas Interativo do MEEM
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Prancha digital para o paciente desenhar com o dedo ou mouse a cópia dos dois pentágonos sobrepostos e o teste do relógio, ficando a imagem arquivada no histórico do prontuário.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dr_carlos' && activeSection === 'carlos_integrativa' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
                          <Pill size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider">Protocolos de Saúde Integrativa</span>
                          <h3 className="text-xl font-extrabold text-slate-900">4. Checklist de Fitoterapia, Suplementação & Patógenos</h3>
                          <p className="text-xs text-slate-500">Mapeamento metabólico de mais de 40 substâncias ativas e rastreio de carga infecciosa crônica.</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <p>
                          No modo <strong>"Medicina Integrativa"</strong>, o Dr. Carlos tem acesso à tabela de marcação rápida de suplementos e nutracêuticos dividida em 5 pilares funcionais:
                        </p>

                        <div className="grid sm:grid-cols-2 gap-3 pt-2">
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <strong className="text-slate-800 text-xs flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-teal-600" /> 1. Biorregulação & Neurotransmissores
                            </strong>
                            <p className="text-xs text-slate-500">
                              Coenzima Q10, Ácido Alfa-Lipóico, Melatonina, 5-HTP, Fenilalanina, DMAE, Fosfatidilserina, Vinpocetina e DHEA.
                            </p>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <strong className="text-slate-800 text-xs flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-teal-600" /> 2. Fitoterapia & Modulação
                            </strong>
                            <p className="text-xs text-slate-500">
                              Artemísia D3, Chlorella D9, Mulateiro, Neurexan, Florais de Bach, Artemisia, Quercetina e Silimarina.
                            </p>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <strong className="text-slate-800 text-xs flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-teal-600" /> 3. Minerais & Vitaminas
                            </strong>
                            <p className="text-xs text-slate-500">
                              Vitamina D3, Vitamina K2 (MK-7), Selênio, Zinco quelato, Magnésio dimalato, Lugol e Picolinato de Cromo.
                            </p>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <strong className="text-slate-800 text-xs flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-teal-600" /> 4. Carga Infecciosa Crônica
                            </strong>
                            <p className="text-xs text-slate-500">
                              Rastreio de Candida Albicans, Borrelia Burgdorferi, Chlamydia Pneumoniae, Herpes HSV-1/2, Zóster e Citomegalovírus (CMV).
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dr_carlos' && activeSection === 'carlos_bodymap_sinais' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                          <Layers size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Mapeamento Visual</span>
                          <h3 className="text-xl font-extrabold text-slate-900">5. Mapeamento Corporal de Dores & Sinais Vitais</h3>
                          <p className="text-xs text-slate-500">Localização anatômica de pontos de gatilho miofasciais e registro de sinais vitais.</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <p>
                          O <strong>BodyMap 2D/3D</strong> permite ao Dr. Carlos clicar diretamente na silhueta do corpo humano para marcar pontos de dor crônica, queimação, parestesia ou irradiação lombar/cervical, com escala EVA de 0 a 10.
                        </p>
                        <p>
                          No painel de <strong>Sinais Vitais</strong>, insira Pressão Arterial (PA), Frequência Cardíaca (FC), Saturação de Oxigênio (SpO2), Temperatura e Glicemia. O sistema gera alertas visuais imediatos se houver desvios significativos dos padrões fisiológicos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dr_carlos' && activeSection === 'carlos_receituario_pdf' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                          <FileText size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Prescrição & Exportação</span>
                          <h3 className="text-xl font-extrabold text-slate-900">6. Receituário Médico Anvisa & Exportação PDF</h3>
                          <p className="text-xs text-slate-500">Geração de documentos em formato A4 timbrado e envio direto via WhatsApp.</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <p>
                          Ao clicar em <strong>"Gerar Receituário Anvisa"</strong> ou <strong>"Baixar PDF"</strong> no prontuário do paciente:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 font-medium">
                          <li>O documento sai com o cabeçalho timbrado da clínica e dados do médico (CRM, especialidade e assinatura digital).</li>
                          <li>A prescrição separa com clareza a posologia de medicamentos convencionais, fórmulas manipuladas e nutracêuticos integrativos.</li>
                          <li>Com 1 clique, você pode enviar o arquivo PDF gerado diretamente para o WhatsApp do paciente, sem necessidade de baixar manualmente no computador.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dr_carlos' && activeSection === 'carlos_agenda_rotina' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Rotina de Atendimento & Agenda</span>
                          <h3 className="text-xl font-extrabold text-slate-900">7. Agenda do Dr. Carlos, Fila de Espera & WhatsApp</h3>
                          <p className="text-xs text-slate-500">Como funciona o fluxo do agendamento à consulta e contato com o paciente.</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <Calendar size={15} className="text-blue-600" /> Grade de Horários & Consultório
                            </strong>
                            <p className="text-xs text-slate-600">
                              Na aba <strong>"Agenda Médica"</strong>, o Dr. Carlos pode visualizar seus pacientes do dia, horários confirmados, encaixes e tempo médio de cada consulta neurológica.
                            </p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <Activity size={15} className="text-emerald-600" /> Fila de Espera & Chamada
                            </strong>
                            <p className="text-xs text-slate-600">
                              Ao chegar na clínica, a recepção coloca o paciente na fila como <em>"Aguardando Médico"</em>. Quando o Dr. Carlos abre o prontuário no consultório, o status muda automaticamente para <em>"Em Atendimento"</em>.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-2">
                          <strong className="text-blue-950 font-bold text-xs flex items-center gap-1.5">
                            <MessageSquare size={16} className="text-blue-600" /> Disparo de WhatsApp & Pré-Anamnese
                          </strong>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            O sistema pode enviar lembretes automáticos com as instruções prévias da consulta (trazer exames de imagem anteriores, ressonâncias e lista de medicações em uso). Ao terminar a consulta, o receituário em PDF pode ser enviado com 1 clique.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* ========================================================= */}
                {/* CONTEÚDO MANUAL DRA. LUCY (ODONTOLOGIA BIOLÓGICA & PRF)   */}
                {/* ========================================================= */}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_visao_geral' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Manual Odontológico Biológico</span>
                          <h3 className="text-xl font-extrabold text-slate-900">1. Visão Geral da Odontologia Biológica (Dra. Lucy)</h3>
                          <p className="text-xs text-slate-500">Filosofia clínica integrativa, conexão dente-órgão e cirurgia regenerativa metal-free.</p>
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
                        <p>
                          O módulo da <strong>Dra. Lucy</strong> é um ecossistema completo para a prática de <strong>Odontologia Biológica e Saúde Integrativa</strong>. Ele integra odontograma com notação internacional FDI (elementos 11 a 48), mapeamento de meridianos da Medicina Tradicional Chinesa, remoção segura de amálgamas (SMART/IAOMT) e planejamento cirúrgico de implantes cerâmicos em zircônia com concentrados sanguíneos PRF.
                        </p>

                        <div className="grid sm:grid-cols-3 gap-3 pt-2">
                          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1.5">
                            <strong className="text-emerald-950 font-bold text-xs flex items-center gap-1.5">
                              <Smile size={16} className="text-emerald-700" /> Odontograma & Meridianos
                            </strong>
                            <p className="text-xs text-slate-600">
                              Cada dente possui correlação anatômica e energética com órgãos, vértebras e padrões emocionais sistêmicos.
                            </p>
                          </div>

                          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-1.5">
                            <strong className="text-blue-950 font-bold text-xs flex items-center gap-1.5">
                              <Award size={16} className="text-blue-600" /> Zircônia & PRF Cirúrgico
                            </strong>
                            <p className="text-xs text-slate-600">
                              Implantes cerâmicos metal-free, membranas de L-PRF, fibrina injetável i-PRF e enxertos biológicos Sticky Bone.
                            </p>
                          </div>

                          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1.5">
                            <strong className="text-amber-950 font-bold text-xs flex items-center gap-1.5">
                              <ShieldCheck size={16} className="text-amber-600" /> Protocolo SMART & NICO
                            </strong>
                            <p className="text-xs text-slate-600">
                              Barreira de proteção contra mercúrio, exaustão de vapores, ozonioterapia cavitacional e terapia neural.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_odontograma' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                          <Smile size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Odontograma Interativo</span>
                          <h3 className="text-xl font-extrabold text-slate-900">2. Odontograma Interativo (11 a 48) & Meridianos Sistêmicos</h3>
                          <p className="text-xs text-slate-500">Como registrar estados dentários, achados tomográficos CBCT e correlações de órgãos.</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        <p>
                          O odontograma exibe a arcada superior (18 a 28) e inferior (48 a 38). Ao clicar em qualquer dente:
                        </p>

                        <div className="space-y-3">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                            <strong className="text-slate-900 font-bold">1. Status Biológico do Dente:</strong>
                            <p className="text-slate-600">
                              Você pode definir o dente como: <strong>Saudável</strong>, <strong>Amálgama Metálico</strong>, <strong>Implante Zircônia</strong>, <strong>Implante Titânio</strong>, <strong>Endodonticamente Tratado (Canal)</strong>, <strong>Cavitação NICO/FDOK</strong>, <strong>Ausente/Extraído</strong> ou <strong>Cárie</strong>.
                            </p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                            <strong className="text-slate-900 font-bold">2. Janela de Meridiano e Órgão Correspondente:</strong>
                            <p className="text-slate-600">
                              O sistema exibe automaticamente o órgão vinculado. Exemplo: dentes 11/21 e 41/31 correlacionam-se com os meridianos de <em>Rim e Bexiga / Coluna Lombar</em>. Os molares 16/26 com <em>Estômago e Baço-Pâncreas</em>.
                            </p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                            <strong className="text-slate-900 font-bold">3. Tomografia Cone Beam (CBCT) & Planejamento:</strong>
                            <p className="text-slate-600">
                              Campo específico para registrar achados radiográficos (ex: espessura óssea residual, proximidade do seio maxilar ou nervo alveolar inferior).
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_zirconia_prf' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                          <Award size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Protocolo Cirúrgico</span>
                          <h3 className="text-xl font-extrabold text-slate-900">3. Implantes Zircônia, PRF / L-PRF, i-PRF & Cirurgia Guiada</h3>
                          <p className="text-xs text-slate-500">Técnicas cirúrgicas biológicas avançadas com concentrados plaquetários autólogos.</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        <p>
                          A Dra. Lucy conta com campos específicos e presets cirúrgicos completos para registrar o planejamento operatório:
                        </p>

                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/80 space-y-2">
                            <strong className="text-rose-950 font-bold text-xs flex items-center gap-1.5">
                              <Droplets size={16} className="text-rose-600" /> Concentrados Sanguíneos (PRF)
                            </strong>
                            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                              <li><strong>L-PRF (Fibrina Rica em Plaquetas e Leucócitos):</strong> Confecção de membranas para fechamento de alvéolo pós-exodontia e recobrimento de implantes.</li>
                              <li><strong>i-PRF (Fibrina Líquida Injetável):</strong> Para infiltração tecidual e aglutinação de enxertos particulados.</li>
                              <li><strong>Sticky Bone (Enxerto Biológico Aglutinado):</strong> Mistura de biomaterial mineralizado com i-PRF para estabilização volumétrica óssea.</li>
                            </ul>
                          </div>

                          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-2">
                            <strong className="text-blue-950 font-bold text-xs flex items-center gap-1.5">
                              <Award size={16} className="text-blue-600" /> Implantes Cerâmicos de Zircônia
                            </strong>
                            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                              <li><strong>Sistemas:</strong> Seleção entre Zircônia Monobloco (corpo único) ou Two-Piece (duas peças / bi-componente).</li>
                              <li><strong>Cirurgia Guiada 3D:</strong> Uso de guia cirúrgico prototipado a partir de Tomografia CBCT e escaneamento intraoral.</li>
                              <li><strong>Corte Piezoelétrico:</strong> Osteotomia ultrassônica atérmica preservando o periósteo e feixes neurovasculares.</li>
                            </ul>
                          </div>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                          <strong className="text-emerald-950 font-bold text-xs flex items-center gap-1.5">
                            <CheckCircle2 size={15} className="text-emerald-600" /> Suplementação Pré e Pós-Operatória Recomendada
                          </strong>
                          <p className="text-xs text-slate-600">
                            Protocolo Dra. Lucy: Vitamina D3 (alcançar &gt; 50 ng/mL) + Vitamina K2 (MK-7), Vitamina C 1g/dia para síntese de colágeno, Zinco 30mg e Arnica Montana homeopática para controle de edema.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_smart_amalgama' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Protocolo de Segurança</span>
                          <h3 className="text-xl font-extrabold text-slate-900">4. Remoção Segura de Amálgama (SMART / IAOMT)</h3>
                          <p className="text-xs text-slate-500">Checklist completo de proteção biológica do paciente, da dentista e do ambiente.</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <p>
                          A remoção de restaurações de amálgama metálico gera pico de vapores de mercúrio tóxico. O protocolo <strong>SMART (Safe Mercury Amalgam Removal Technique)</strong> deve ser rigorosamente seguido e registrado no prontuário:
                        </p>

                        <div className="grid sm:grid-cols-2 gap-3 pt-2 font-medium">
                          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Dique de Borracha Nitrílico:</strong> Isolamento absoluto sem látex para evitar ingestão de partículas.</span>
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Oxigênio Nasal Independente:</strong> Paciente respira oxigênio puro via cânula nasal durante o corte.</span>
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Exaustor de Alta Sucção & Filtro:</strong> Sistema de captação de vapores posicionado a 10cm da boca.</span>
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Irrigação Copiosa e Broca Nova:</strong> Corte em blocos para não aquecer nem volatizar o mercúrio.</span>
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Bochecho com Carvão Ativado / Chlorella:</strong> Antes e após o procedimento para quelação local.</span>
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Suporte Antioxidante de Quelação:</strong> Vitamina C injetável ou oral + Selênio e Glutationa.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_cavitacoes_terapia' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                          <Zap size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Campos Interferentes & Biorregulação</span>
                          <h3 className="text-xl font-extrabold text-slate-900">5. Cavitações NICO/FDOK, Ozonioterapia & Terapia Neural</h3>
                          <p className="text-xs text-slate-500">Diagnóstico de osteonecrose assintomática e neutralização de campos de interferência.</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                          <strong className="text-purple-950 font-bold text-xs flex items-center gap-1.5">
                            <Zap size={16} className="text-purple-600" /> Cavitações Ósseas NICO / FDOK
                          </strong>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Áreas de osteonecrose cavitacional isquêmica em regiões de dentes extraídos (especialmente 3º molares 18, 28, 38, 48). Produzem mediadores inflamatórios sistêmicos como <strong>RANTES/CCL5</strong>. O sistema permite marcar a área hipodensa detectada na Tomografia Cone Beam e planejar a curetagem biológica.
                          </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <Droplets size={15} className="text-blue-600" /> Ozonioterapia Odontológica
                            </strong>
                            <p className="text-xs text-slate-600">
                              Aplicação de gás ozônio médico (O3) para desinfecção cavitacional, água ozonizada para irrigação cirúrgica e óleo ozonizado para cicatrização de tecidos moles.
                            </p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <Activity size={15} className="text-emerald-600" /> Terapia Neural Odontológica
                            </strong>
                            <p className="text-xs text-slate-600">
                              Infiltração de Cloridrato de Procaína a 0,5% ou 1% em cicatrizes, polos interferentes, retro-molares ou pontos gatilho da ATM para desbloqueio do sistema nervoso autônomo.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_presets_rapidos' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                          <Flame size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Agilidade em Consultório</span>
                          <h3 className="text-xl font-extrabold text-slate-900">6. Botões de Preenchimento Rápido (Presets de 1 Clique)</h3>
                          <p className="text-xs text-slate-500">Como automatizar o preenchimento de protocolos recorrentes na sala de cirurgia.</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <p>
                          No topo do formulário da <strong>Dra. Lucy</strong>, existem 3 botões de preenchimento instantâneo para economizar tempo durante o atendimento:
                        </p>

                        <div className="space-y-3 pt-2">
                          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 flex items-start gap-3">
                            <span className="p-2 bg-blue-600 text-white rounded-xl font-bold text-xs shrink-0">💎 Preset Zircônia</span>
                            <div className="text-xs space-y-0.5">
                              <strong className="text-blue-950 text-sm">Implante Zircônia + L-PRF:</strong>
                              <p className="text-slate-600">
                                Marca automaticamente os elementos no odontograma, ativa cirurgia guiada 3D, membranas de L-PRF, terapia neural e suplementação de Vitamina D3+K2 e Arnica.
                              </p>
                            </div>
                          </div>

                          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-start gap-3">
                            <span className="p-2 bg-amber-600 text-white rounded-xl font-bold text-xs shrink-0">🛡️ Preset SMART</span>
                            <div className="text-xs space-y-0.5">
                              <strong className="text-amber-950 text-sm">Remoção Segura de Amálgama:</strong>
                              <p className="text-slate-600">
                                Marca elementos com amálgama, ativa todo o checklist de proteção (dique nitrílico, oxigênio, exaustor, carvão vegetal e quelação) com 1 clique.
                              </p>
                            </div>
                          </div>

                          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-start gap-3">
                            <span className="p-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shrink-0">⚡ Preset NICO</span>
                            <div className="text-xs space-y-0.5">
                              <strong className="text-emerald-950 text-sm">Tratamento de Cavitações:</strong>
                              <p className="text-slate-600">
                                Preenche achados tomográficos de 38/48, ativa ozonioterapia cavitacional, infiltração de procaína e suporte anti-inflamatório.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_agenda_rotina' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Rotina do Consultório Odontológico</span>
                          <h3 className="text-xl font-extrabold text-slate-900">7. Agenda da Dra. Lucy, Fila Cirúrgica & Recibos</h3>
                          <p className="text-xs text-slate-500">Como funciona o fluxo do agendamento, atendimento cirúrgico e emissão de orçamentos.</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <Calendar size={15} className="text-emerald-600" /> Grade de Horários & Cirurgias
                            </strong>
                            <p className="text-xs text-slate-600">
                              Na aba <strong>"Agenda Médica"</strong>, a Dra. Lucy pode filtrar exclusivamente seus pacientes odontológicos, diferenciando avaliações iniciais, cirurgias de implante de zircônia e sessões de ozonioterapia.
                            </p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <Sparkles size={15} className="text-blue-600" /> Fila em Tempo Real
                            </strong>
                            <p className="text-xs text-slate-600">
                              Quando o paciente chega ao consultório e é marcado na recepção, a Dra. Lucy vê o alerta na tela. Ao iniciar o procedimento, o prontuário sincroniza em tempo real.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                          <strong className="text-emerald-950 font-bold text-xs flex items-center gap-1.5">
                            <FileText size={16} className="text-emerald-600" /> Orçamentos, Orientações Pós-Op & WhatsApp
                          </strong>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Após o planejamento do odontograma (ex: remoção de amálgama ou implante cerâmico), o sistema gera o plano de tratamento detalhado com valores e orientações pré/pós-operatórias, que podem ser enviados diretamente para o WhatsApp do paciente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </main>
            </div>

            {/* Footer do Modal */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Manuais Clínicos sincronizados • Ambulatório IA v4.6</span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Fechar Manual
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
