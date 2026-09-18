import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
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
  MessageSquare,
  Printer,
  Camera,
  Radio,
  Waves,
  Loader2,
  Cpu,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { generateManualClinicoPDF } from '../lib/manualPdfGenerator';

interface ManualClinicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProfile?: 'dr_carlos' | 'dra_lucy';
}

export default function ManualClinicoModal({ isOpen, onClose, defaultProfile = 'dr_carlos' }: ManualClinicoModalProps) {
  const [selectedManual, setSelectedManual] = useState<'dr_carlos' | 'dra_lucy'>(defaultProfile);
  const isLucy = selectedManual === 'dra_lucy';
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
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

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    const toastId = toast.loading('Gerando PDF oficial do Manual Clínico completo...', { id: 'manual-pdf-gen' });
    
    // Pequeno timeout para permitir que a UI atualize e o toast renderize
    setTimeout(() => {
      try {
        generateManualClinicoPDF(selectedManual);
        toast.success(
          isLucy 
            ? 'Manual da Dra. Lucy Morata baixado em PDF com sucesso!' 
            : 'Manual do Dr. Carlos Morato baixado em PDF com sucesso!',
          { id: 'manual-pdf-gen' }
        );
      } catch (error: any) {
        console.error('Erro ao gerar PDF do manual:', error);
        toast.error('Erro ao gerar PDF: ' + (error?.message || 'Tente novamente.'), { id: 'manual-pdf-gen' });
      } finally {
        setIsExportingPDF(false);
      }
    }, 150);
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
              <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/80 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-400/40 shadow-sm disabled:opacity-50"
                  title="Baixar Manual Clínico Completo em PDF"
                >
                  {isExportingPDF ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Download size={15} />
                  )}
                  <span className="hidden sm:inline">
                    {isExportingPDF ? 'Gerando PDF...' : 'Baixar PDF Oficial'}
                  </span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all cursor-pointer"
                  title="Fechar Manual"
                >
                  <X size={20} />
                </button>
              </div>

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
                        7. Agenda, Pré-Anamnese & WhatsApp
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('carlos_escuta_ambiental')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'carlos_escuta_ambiental'
                          ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Radio size={15} className="text-purple-600 shrink-0" />
                        8. Escuta Ambiental (30-40 min)
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
                        7. Agenda, Pré-Anamnese & WhatsApp
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('lucy_dsd_tomografia')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_dsd_tomografia'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Camera size={15} className="text-indigo-600 shrink-0" />
                        8. DSD, Sorriso 3D & Galeria CBCT
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('lucy_cbct_scanner_galvanismo')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_cbct_scanner_galvanismo'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Cpu size={15} className="text-emerald-600 shrink-0" />
                        9. Scanner IA (CBCT) & Galvanismo por Voz
                      </span>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSection('lucy_escuta_ambiental')}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        activeSection === 'lucy_escuta_ambiental'
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Radio size={15} className="text-teal-600 shrink-0" />
                        10. Escuta Ambiental Odonto (30-40 min)
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
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Recepção Inteligente & Automação Completa</span>
                          <h3 className="text-xl font-extrabold text-slate-900">7. Recepção Inteligente, Agenda Automatizada & Pré-Anamnese via WhatsApp</h3>
                          <p className="text-xs text-slate-500">Agendamento de consultas com disparo automático de pré-anamnese no WhatsApp, triagem e controle de faltas.</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-1.5">
                            <strong className="text-blue-950 font-bold text-xs flex items-center gap-1.5">
                              <MessageSquare size={15} className="text-blue-600" /> Disparo Automático de Pré-Anamnese no WhatsApp
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Assim que a recepção ou o médico agenda o paciente, o sistema dispara no WhatsApp um link interativo. O paciente responde queixa principal, sintomas, histórico médico e medicações direto no celular antes da consulta.
                            </p>
                          </div>

                          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1.5">
                            <strong className="text-emerald-950 font-bold text-xs flex items-center gap-1.5">
                              <Check size={15} className="text-emerald-600" /> Carga Automática no Prontuário (Ganha 20 min)
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Quando o Dr. Carlos abre o prontuário no consultório, todos os dados respondidos pelo paciente no WhatsApp já aparecem preenchidos e organizados, liberando o médico para focar no exame neurológico e integrativo.
                            </p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <Calendar size={15} className="text-indigo-600" /> Grade Dinâmica & Confirmação de Presença
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Lembretes automáticos com orientações para o paciente trazer exames de imagem anteriores (RMN/TC), exames de sangue e receitas em uso, com botão de confirmação ativa que reduz drasticamente faltas (*no-show*).
                            </p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <Activity size={15} className="text-rose-600" /> Fila de Espera & Status em Tempo Real
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Ao chegar na clínica, o paciente entra no status <em>"Aguardando Médico"</em>. Ao iniciar a consulta, muda para <em>"Em Atendimento"</em> e ao finalizar gera o envio da receita em PDF com 1 clique no WhatsApp.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dr_carlos' && activeSection === 'carlos_escuta_ambiental' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                          <Radio size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Inteligência Artificial de Escuta Contínua</span>
                          <h3 className="text-xl font-extrabold text-slate-900">8. Escuta Ambiental de Longa Duração (30 a 40 Minutos)</h3>
                          <p className="text-xs text-slate-500">Tecnologia exclusiva de escuta passiva, diarização clínica e filtragem acústica profunda.</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-1.5">
                            <strong className="text-purple-950 font-bold text-xs flex items-center gap-1.5">
                              <Waves size={15} className="text-purple-600" /> Captação de Longo Alcance & Filtro Acústico
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              O microfone do notebook ou tablet fica ligado durante toda a sessão (30 a 40 minutos). O sistema ativa cancelamento de eco, ganho automático e supressão de ruídos de ar-condicionado e tráfego.
                            </p>
                          </div>

                          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-1.5">
                            <strong className="text-blue-950 font-bold text-xs flex items-center gap-1.5">
                              <Brain size={15} className="text-blue-600" /> Filtragem Semântica & Descarte de Ruído
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              A IA descarta automaticamente barulhos de teclado, folhas de papel e conversas sociais da chegada (*"como estava o trânsito?"*), focando exclusivamente nos termos neurológicos e integrativos.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                            <Sparkles size={16} className="text-emerald-600" /> Preenchimento Clínico Multidimensional em 1 Clique
                          </strong>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Ao finalizar a consulta e clicar em <strong>"Parar Gravação"</strong>, a IA não cria apenas um texto: ela <strong>marca o Boneco de Wexler</strong> (reflexos 0 a 4+), <strong>pinta os Dermátomos C2-S5</strong>, preenche o <strong>Checklist Integrativo</strong>, gera o <strong>S.O.A.P.</strong> estruturado e já elabora a <strong>Prescrição Médica</strong> pronta para assinatura.
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
                          <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Recepção Inteligente & Automação Odontológica</span>
                          <h3 className="text-xl font-extrabold text-slate-900">7. Recepção Inteligente, Agenda Automatizada & Pré-Anamnese via WhatsApp</h3>
                          <p className="text-xs text-slate-500">Agendamento de cirurgias e avaliações com disparo imediato da pré-anamnese biológica no WhatsApp.</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-1.5">
                            <strong className="text-teal-950 font-bold text-xs flex items-center gap-1.5">
                              <MessageSquare size={15} className="text-teal-600" /> Disparo da Pré-Anamnese Biológica no WhatsApp
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Ao agendar a consulta cirúrgica ou avaliação, o WhatsApp envia automaticamente um link para o paciente preencher no celular seu histórico de restaurações de amálgama, implantes prévios, alergias e queixas sistêmicas.
                            </p>
                          </div>

                          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1.5">
                            <strong className="text-emerald-950 font-bold text-xs flex items-center gap-1.5">
                              <Check size={15} className="text-emerald-600" /> Carga Direta no Prontuário da Dra. Lucy
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Quando a Dra. Lucy abre o prontuário no consultório, todo o histórico biológico já está pré-carregado, economizando 15 a 20 minutos de digitação e permitindo foco total no Odontograma 3D e exame intraoral.
                            </p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <Calendar size={15} className="text-emerald-600" /> Bloqueio de Blocos Cirúrgicos & Confirmação
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Grade inteligente para diferenciar consultas breves de blocos cirúrgicos longos (SMART, Zircônia e PRF de 2 a 3h), com confirmação ativa no WhatsApp que minimiza faltas (*no-show*).
                            </p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                              <FileText size={15} className="text-blue-600" /> Orçamentos, Pós-Operatório & Recibos
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Geração imediata do plano de tratamento com valores discriminados, orientações pré e pós-operatórias ilustradas e envio de recibos com 1 clique diretamente para o WhatsApp do paciente.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_dsd_tomografia' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                          <Camera size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Estética Biológica & Diagnóstico por Imagem</span>
                          <h3 className="text-xl font-extrabold text-slate-900">8. Simulador de Sorriso Digital (DSD) & Tomografia CBCT</h3>
                          <p className="text-xs text-slate-500">Tecnologia visual integrada que outros softwares cobram à parte em módulos caros e isolados.</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-1.5">
                            <strong className="text-indigo-950 font-bold text-xs flex items-center gap-1.5">
                              <Smile size={15} className="text-indigo-600" /> Simulador de Sorriso Digital (DSD / Smile Design)
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Permite carregar a foto do rosto/sorriso do paciente, calibrar proporções de largura/altura dos dentes anteriores (linha média, zênite gengival, proporção áurea) e simular facetas de porcelana e coroas cerâmicas antes de iniciar o desgaste ou cirurgia.
                            </p>
                          </div>

                          <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-1.5">
                            <strong className="text-purple-950 font-bold text-xs flex items-center gap-1.5">
                              <ImageIcon size={15} className="text-purple-600" /> Tomografia Cone Beam (CBCT) & Panorâmica
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Área dedicada para anexar e visualizar cortes tomográficos de cavitações ósseas NICO/FDOK, medição de tábua óssea para implantes de zircônia, proximidade do canal mandibular e laudo radiológico integrado ao prontuário.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                            <Sparkles size={16} className="text-emerald-600" /> Diferencial Competitivo Único
                          </strong>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Enquanto softwares tradicionais exigem a contratação de 3 a 4 plataformas separadas (um odontograma simples, um software caro de DSD, um visualizador DICOM e uma prescrição comum), o <strong>Ambulatório IA</strong> une tudo em uma única tela fluida e intuitiva para a <strong>Dra. Lucy Morata</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_cbct_scanner_galvanismo' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                      
                      {/* Cabeçalho do Capítulo */}
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                          <Cpu size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Visão Computacional Multimodal & Bioeletricidade Oral</span>
                          <h3 className="text-xl font-extrabold text-slate-900">9. Scanner Tomográfico IA (CBCT), Precisão Diagnóstica & Galvanismo por Voz</h3>
                          <p className="text-xs text-slate-500">Leitura multimodal por IA, limites reais da visão computacional, mitos do 100% e protocolo hands-free de microvoltagem oral.</p>
                        </div>
                      </div>

                      {/* Bloco 1: Como Funciona o Scanner Laser */}
                      <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between">
                          <strong className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                            <Sparkles size={16} /> Scanner Tomográfico Cone Beam por IA Multimodal
                          </strong>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            Gemini 2.5 Flash Vision
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          O módulo permite que a <strong>Dra. Lucy</strong> abra qualquer corte tomográfico CBCT ou ortopantomografia digital da paciente e dispare a varredura inteligente com animação laser. A IA examina a imagem pixel a pixel, reconhecendo materiais radiopacos de alta densidade (amálgamas e metais), linhas radiculares obturadas (endodontias) e rarefações ósseas trabeculares radiolúcidas compatíveis com <strong>cavitações NICO/FDOK</strong>.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                            <span className="text-emerald-400 font-bold block mb-1">1. Reconhecimento FDI</span>
                            <span className="text-slate-300 text-[11px]">Identifica elementos dentários específicos (ex: 16, 38, 46).</span>
                          </div>
                          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                            <span className="text-teal-400 font-bold block mb-1">2. Cruzamento Voll</span>
                            <span className="text-slate-300 text-[11px]">Mapeia órgãos e meridianos bioenergéticos sobrecarregados.</span>
                          </div>
                          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                            <span className="text-amber-400 font-bold block mb-1">3. Carga no Odontograma</span>
                            <span className="text-slate-300 text-[11px]">Transfere os achados com 1 clique para o odontograma 3D.</span>
                          </div>
                        </div>
                      </div>

                      {/* Bloco 2: Tabela de Taxas Reais de Precisão */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Gauge size={18} className="text-emerald-600" />
                          <h4 className="text-sm font-extrabold text-slate-900">Taxas Reais de Precisão da IA em Exames Radiológicos</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          A visão computacional médica atual apresenta índices de acerto variáveis de acordo com o contraste radiográfico e a densidade física do tecido:
                        </p>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Estrutura Radiológica</th>
                                <th className="p-3 text-center">Taxa de Acerto</th>
                                <th className="p-3">Comportamento Óptico & Clínico</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-600">
                              <tr className="hover:bg-slate-50/70">
                                <td className="p-3 font-bold text-slate-900">Metais, Amálgamas e Implantes</td>
                                <td className="p-3 text-center font-extrabold text-emerald-600 bg-emerald-50/50">~90% a 95%</td>
                                <td className="p-3 text-[11px]">Altíssimo contraste radiopaco (branco puro óptico que absorve o feixe de raios-X).</td>
                              </tr>
                              <tr className="hover:bg-slate-50/70">
                                <td className="p-3 font-bold text-slate-900">Tratamentos de Canal (Endodontia)</td>
                                <td className="p-3 text-center font-extrabold text-teal-600 bg-teal-50/50">~85% a 90%</td>
                                <td className="p-3 text-[11px]">Linha nítida do material obturador radiopaco preenchendo o canal radicular.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/70">
                                <td className="p-3 font-bold text-slate-900">Dentes Ausentes / Edentulismo</td>
                                <td className="p-3 text-center font-extrabold text-blue-600 bg-blue-50/50">~95%</td>
                                <td className="p-3 text-[11px]">Reconhecimento anatômico evidente de espaço edêntulo na crista alveolar.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/70">
                                <td className="p-3 font-bold text-slate-900">Cavitações Ósseas NICO / FDOK</td>
                                <td className="p-3 text-center font-extrabold text-amber-600 bg-amber-50/50">~70% a 80%</td>
                                <td className="p-3 text-[11px]">Rarefações trabeculares radiolúcidas; em imagens 2D há sobreposição óssea que exige cortes finos de CBCT ou CaviTAU.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/70">
                                <td className="p-3 font-bold text-slate-900">Estimativa de Galvanismo (mV)</td>
                                <td className="p-3 text-center font-extrabold text-purple-600 bg-purple-50/50">Predição Teórica</td>
                                <td className="p-3 text-[11px]">Cálculo probabilístico por área de liga metálica; a aferição real definitiva requer voltímetro oral na boca.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Bloco 3: O Mito dos 100% de Acerto (Ciência & Medicina) */}
                      <div className="p-4 sm:p-5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                        <strong className="text-amber-950 font-bold text-xs sm:text-sm flex items-center gap-2">
                          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                          Por que Nenhuma IA no Mundo Atinge 100% de Acerto?
                        </strong>
                        <p className="text-xs text-amber-900 leading-relaxed">
                          Nem os modelos de inteligência artificial de <strong>Elon Musk (xAI/Grok)</strong>, nem do <strong>Google Health</strong>, nem de centros como Harvard atingem 100% de precisão em diagnóstico por imagem médica. Existem limitadores físicos e biológicos inescapáveis:
                        </p>
                        <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc pl-4 pt-1">
                          <li><strong>Artefatos de Refração Metálica (Beam Hardening):**</strong> Restaurações metálicas dispersam os raios-X, gerando halos e faixas brancas/negras que podem mascarar cáries ou simular lesões ósseas inexistentes.</li>
                          <li><strong>Variação Anatômica Humana:**</strong> A posição do forame mentoniano, do canal mandibular e septos no seio maxilar varia entre indivíduos e pode mimetizar patologias.</li>
                          <li><strong>O Papel da IA como Copiloto de Visão Aumentada:**</strong> A IA nunca substitui a dentista; ela serve como uma segunda opinião incansável que economiza 20 minutos de digitação e tria detalhes ocultos. <strong>A validação e decisão clínica final são 100% soberanas da Dra. Lucy Morata.</strong></li>
                        </ul>
                      </div>

                      {/* Bloco 4: Galvanismo Oral e Preenchimento por Voz Hands-Free */}
                      <div className="p-5 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-3">
                        <div className="flex items-center gap-2">
                          <Zap size={18} className="text-teal-600" />
                          <h4 className="text-sm font-extrabold text-teal-950">Aferição Física de Galvanismo Oral & Preenchimento por Voz (Hands-Free)</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          O <strong>galvanismo oral</strong> ocorre quando restaurações de amálgama (mercúrio, prata, estanho), coroas com metal ou pinos interagem com a saliva eletrolítica, funcionando como uma pilha química na boca do paciente e disparando microcorrentes contínuas (+50 mV a mais de +300 mV). Essas correntes podem despolarizar o sistema nervoso autônomo, causar cefaleias, gosto metálico e dores cervicais.
                        </p>
                        
                        <div className="p-4 bg-white rounded-xl border border-teal-200 space-y-2">
                          <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                            <Mic size={15} className="text-teal-600" /> Como a Dra. Lucy usa o microvoltímetro sem contaminar as mãos:
                          </strong>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Durante o exame clínico, a <strong>Dra. Lucy</strong> segura a ponta de prova esterilizada do voltímetro oral com as luvas cirúrgicas. Como não pode tocar no teclado ou mouse para não quebrar a assepsia, ela simplesmente fala em voz alta:
                          </p>
                          <div className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-xs border border-slate-800">
                            &quot;Dente 16 com amálgama oclusal, medindo duzentos e cinquenta milivolts, indicando sobrecarga bioelétrica no meridiano do estômago.&quot;
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            O microfone com IA do <strong>Ambulatório IA</strong> escuta a frase, reconhece o elemento <strong>FDI 16</strong>, atribui a condição de <strong>Amálgama</strong>, preenche a voltagem de <strong>+250 mV</strong>, aplica a cor no Odontograma 3D e já inclui a remoção segura no <strong>Protocolo SMART (IAOMT)</strong> instantaneamente!
                          </p>
                        </div>
                      </div>

                      {/* Bloco 5: Correlação de Meridianos e Órgãos (Dr. Voll) */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                          <Layers size={16} className="text-indigo-600" /> Correlação Dente-Órgão-Meridiano (Eletroacupuntura de Voll)
                        </strong>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Ao identificar ou ditar um dente com sobrecarga galvânica ou foco NICO, o sistema correlaciona imediatamente com a Medicina Tradicional Chinesa:
                        </p>
                        <div className="grid sm:grid-cols-3 gap-2.5 text-xs text-slate-700 pt-1">
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                            <span className="font-bold text-indigo-700 block">Dentes 16 / 26 / 36 / 46:</span>
                            Meridiano do Estômago, Baço-Pâncreas, Tireoide e vértebras T11-T12.
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                            <span className="font-bold text-rose-700 block">Dentes 18 / 28 / 38 / 48 (Sisos):</span>
                            Meridiano do Coração, Intestino Delgado e Sistema Nervoso Autônomo.
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                            <span className="font-bold text-emerald-700 block">Dentes 11 / 21 / 31 / 41:</span>
                            Meridiano dos Rins, Bexiga, Sistema Urogenital e vértebras L2-L3.
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {selectedManual === 'dra_lucy' && activeSection === 'lucy_escuta_ambiental' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
                          <Radio size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider">Inteligência Artificial de Escuta Contínua Odontológica</span>
                          <h3 className="text-xl font-extrabold text-slate-900">10. Escuta Ambiental Odontológica (30 a 40 Minutos)</h3>
                          <p className="text-xs text-slate-500">Captação contínua da consulta odontológica, descarte de ruídos de instrumentos e preenchimento direto no Odontograma 3D.</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-1.5">
                            <strong className="text-teal-950 font-bold text-xs flex items-center gap-1.5">
                              <Waves size={15} className="text-teal-600" /> Escuta da Avaliação Clínica & Conversa
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              A Dra. Lucy pode deixar o microfone ligado durante toda a primeira consulta ou exame inicial. O sistema isola a voz da dentista e do paciente, mantendo a sensibilidade mesmo a 2 metros de distância da mesa.
                            </p>
                          </div>

                          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1.5">
                            <strong className="text-emerald-950 font-bold text-xs flex items-center gap-1.5">
                              <Smile size={15} className="text-emerald-600" /> Mapeamento Automático do Odontograma (FDI)
                            </strong>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Ao ditar ou conversar: <em>"No 36 temos amálgama com indicação de SMART, no 11 planejaremos implante de zircônia e no 48 há cavitação NICO visível em tomografia"</em>, a IA marca automaticamente os elementos 36, 11 e 48 com as cores e protocolos correspondentes.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                            <ShieldCheck size={16} className="text-amber-600" /> Montagem Automática do Plano Biológico & Prescrição
                          </strong>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            A IA sintetiza o histórico da queixa principal, vincula os dentes aos seus meridianos e órgãos correspondentes, ativa as orientações do Protocolo SMART (IAOMT) e já prepara a receita de suporte cirúrgico (Vitamina D3/K2, Vitamina C e Zinco) para exportação em PDF e envio no WhatsApp.
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isExportingPDF ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Download size={15} />
                  )}
                  <span>{isExportingPDF ? 'Gerando PDF...' : 'Baixar PDF Oficial'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Fechar Manual
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
