import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Stethoscope, 
  Mic, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Calendar, 
  FileText, 
  Activity, 
  Settings, 
  Laptop, 
  Smartphone, 
  Search, 
  Download, 
  CheckCircle2, 
  FolderOpen, 
  Image, 
  Sparkles, 
  CreditCard, 
  HelpCircle, 
  Brain, 
  FileCheck, 
  Printer, 
  Share2, 
  UserCheck, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import DoctorSettings from './DoctorSettings';

interface SystemOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function SystemOverviewModal({ isOpen, onClose, userId }: SystemOverviewModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'passo-a-passo' | 'especialidades' | 'faq' | 'config'>('manual');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="bg-white rounded-[32px] max-w-5xl w-full shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden border border-slate-100"
          >
            {/* Header com Visual Clínico de Alta Fidelidade */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white relative shrink-0">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all cursor-pointer"
                title="Fechar Manual"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 shrink-0 border border-blue-400/30">
                  <Stethoscope size={32} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 mb-1">
                    <BookOpen size={12} /> Manual Oficial de Operação do Sistema • V3.2
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Ambulatório IA — Guia do Médico e Recepção
                  </h2>
                  <p className="text-sm text-slate-300 font-medium">
                    Manual passo a passo para utilizar todos os recursos sem complicações
                  </p>
                </div>
              </div>

              {/* Barra de Abas do Manual */}
              <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'manual' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <BookOpen size={14} /> 1. Apresentação & Fluxo Geral
                </button>
                <button
                  onClick={() => setActiveTab('passo-a-passo')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'passo-a-passo' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <Zap size={14} /> 2. Passo a Passo da Consulta
                </button>
                <button
                  onClick={() => setActiveTab('especialidades')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'especialidades' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <Brain size={14} /> 3. Exames & Negatoscópio
                </button>
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'faq' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <HelpCircle size={14} /> 4. Dúvidas Frequentes (FAQ)
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'config' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <Settings size={14} /> 5. Configurar Médico
                </button>
              </div>
            </div>

            {/* Conteúdo Dinâmico com Rolagem Fluida */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8 text-slate-600 bg-slate-50/50">

              {/* ABA 1: MANUAL & FLUXO GERAL */}
              {activeTab === 'manual' && (
                <div className="space-y-6">
                  {/* Resumo dos 5 Pilares */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">O que o Médico Precisa Saber (Os 5 Pilares)</h3>
                        <p className="text-xs text-slate-500">Desenvolvido para que o médico atenda com velocidade máxima sem perder tempo digitando</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                        <div className="text-blue-600 font-black text-sm flex items-center gap-1.5">
                          <Mic size={16} /> 1. Copiloto de Voz (IA)
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Converse normalmente ou dite a consulta. A IA preenche a queixa, hipótese, conduta e prescrição em segundos.
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200/70 space-y-1">
                        <div className="text-purple-700 font-black text-sm flex items-center gap-1.5">
                          <Brain size={16} /> 2. Exames Especializados
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Dermátomos interativos, Reflexos de Wexler, MEEM cognitivo, Medicina Integrativa e Odontologia Biológica.
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 space-y-1">
                        <div className="text-emerald-700 font-black text-sm flex items-center gap-1.5">
                          <Image size={16} /> 3. Negatoscópio Digital
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Abra raios-X e tomografias em tela cheia com zoom de 400%, contraste negativo para radiologia e caneta para laudos.
                        </p>
                      </div>

                      <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-1">
                        <div className="text-amber-700 font-black text-sm flex items-center gap-1.5">
                          <FileText size={16} /> 4. Receituário Anvisa & QR
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Emita receitas timbradas com posologia cronobiológica, QR Code de autenticidade para farmácias e envio no WhatsApp.
                        </p>
                      </div>

                      <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200/70 space-y-1">
                        <div className="text-teal-700 font-black text-sm flex items-center gap-1.5">
                          <ShieldCheck size={16} /> 5. Nuvem Automática
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Tudo é salvo no banco de dados na nuvem a cada clique em "Salvar". Zero risco de perda e sem backups manuais.
                        </p>
                      </div>

                      <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/70 space-y-1">
                        <div className="text-blue-700 font-black text-sm flex items-center gap-1.5">
                          <CreditCard size={16} /> 6. Caixa Sem Gateway
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Baixa imediata na recepção por Pix, Maquininha de Cartão, Dinheiro ou Convênio sincronizado com o financeiro.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Instalação PWA */}
                  <div className="bg-blue-50/70 p-6 rounded-3xl border border-blue-200 space-y-3">
                    <div className="flex items-center gap-3 text-blue-900">
                      <Laptop size={22} className="text-blue-600" />
                      <h3 className="text-lg font-bold">Como Instalar no Computador, Celular ou iPad</h3>
                    </div>
                    <p className="text-xs text-blue-950 leading-relaxed">
                      O sistema roda como um aplicativo nativo e leve através de tecnologia PWA, sem necessidade de arquivos pesados de instalação:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 pt-1">
                      <div className="bg-white p-4 rounded-2xl border border-blue-100 space-y-1.5 shadow-2xs">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                          <Laptop size={16} className="text-blue-600" /> No Computador (Windows ou Mac)
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          No Google Chrome ou Edge, clique no ícone de <strong>Monitor com uma seta para baixo</strong> ou no sinal <strong>"+"</strong> no lado direito da barra de endereço e clique em <strong>"Instalar"</strong>. Um ícone aparecerá na sua Área de Trabalho.
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-blue-100 space-y-1.5 shadow-2xs">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                          <Smartphone size={16} className="text-purple-600" /> No Celular ou iPad / Tablet
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>No Android (Chrome):</strong> Toque nos 3 pontinhos e escolha <em>"Instalar aplicativo"</em>.<br />
                          <strong>No iPhone / iPad (Safari):</strong> Toque em Compartilhar e escolha <em>"Adicionar à Tela de Início"</em>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: PASSO A PASSO DA CONSULTA E RECEPÇÃO */}
              {activeTab === 'passo-a-passo' && (
                <div className="space-y-6">
                  {/* Fluxograma da Recepção */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">1. Fluxo da Recepção & Agenda Inteligente</h3>
                        <p className="text-xs text-slate-500">Como a secretária cadastra, envia lembrete no WhatsApp e dá baixa no pagamento</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                        <div className="text-xs space-y-1">
                          <strong className="text-slate-800 text-sm">Criar o Agendamento com Busca de CEP:</strong>
                          <p className="text-slate-600 leading-relaxed">
                            Na aba <strong>"Agenda Médica"</strong>, clique em <strong>"+ Novo Agendamento"</strong>. Ao preencher os 8 dígitos do CEP, a rua, bairro e cidade são inseridos automaticamente. Escolha o médico, data, hora e convênio/valor.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                        <div className="text-xs space-y-1">
                          <strong className="text-slate-800 text-sm">Disparo de Confirmação no WhatsApp:</strong>
                          <p className="text-slate-600 leading-relaxed">
                            Ao clicar no botão do <strong>WhatsApp</strong> na linha do agendamento, o sistema envia a mensagem oficial com a data, hora, nome do médico e o link da <strong>Ficha Pré-Cadastro com Selfie</strong> para o paciente preencher antes de sair de casa.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/70">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                        <div className="text-xs space-y-1">
                          <strong className="text-emerald-950 text-sm">Baixa Rápida no Caixa (Sem Gateway):</strong>
                          <p className="text-slate-600 leading-relaxed">
                            Na chegada do paciente, clique no botão <strong>"Receber"</strong>. Escolha como ele pagou: <strong>[PIX]</strong>, <strong>[Crédito]</strong>, <strong>[Débito]</strong>, <strong>[Dinheiro]</strong> ou <strong>[Convênio]</strong> e clique em <em>"Confirmar & Enviar Recibo WhatsApp"</em>. O status muda para <strong>"🟢 Pago"</strong> na hora e o recibo é enviado ao paciente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fluxograma do Médico na Sala */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">2. Como o Médico Atende na Sala (Passo a Passo)</h3>
                        <p className="text-xs text-slate-500">Rotina simplificada de atendimento clínico por voz</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">A</span>
                          Selecione o Paciente & Especialidade
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Na aba <strong>"Atendimento Clínico"</strong>, clique no paciente na lista de espera ou digite o nome/CPF. Escolha a especialidade (Geral, Neuro, Integrativa, Pediatria, etc.).
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">B</span>
                          Ligue o Microfone (IA)
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Clique no <strong>Microfone</strong> e converse normalmente com o paciente ou dite o resumo clínico. Ao clicar em <strong>"Parar"</strong>, a IA preenche queixa, diagnóstico e conduta na hora.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">C</span>
                          Salvar Prontuário (Nuvem)
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Clique em <strong>"Evoluir / Salvar Prontuário"</strong>. O atendimento fica registrado com data, hora e histórico anterior preservado de forma segura na nuvem.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">D</span>
                          Emitir Receituário Anvisa / PDF
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Clique em <strong>"Gerar Receituário Anvisa"</strong> para imprimir em A4 ou enviar no WhatsApp com QR Code oficial de verificação para farmácias.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: EXAMES ESPECIALIZADOS & NEGATOSCÓPIO */}
              {activeTab === 'especialidades' && (
                <div className="space-y-6">
                  {/* Negatoscópio Digital */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                        <Image size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Negatoscópio Digital & Laudo de Imagens</h3>
                        <p className="text-xs text-slate-500">Recursos de alta precisão para avaliação de Raio-X, Tomografias e Fotos Clínicas</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          🔍 Super Zoom 400%
                        </div>
                        <p className="text-xs text-slate-600">Aproxime imagens de radiologia para identificar microfraturas e detalhes ósseos.</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          🌓 Contraste Radiológico
                        </div>
                        <p className="text-xs text-slate-600">Inverte os tons de preto e branco para leitura nítida de chapas radiográficas na tela.</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          ✏️ Estúdio de Anotações
                        </div>
                        <p className="text-xs text-slate-600">Desenhe setas, círculos e anote lesões diretamente sobre o exame antes de salvar.</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          🔒 Vínculo Seguro
                        </div>
                        <p className="text-xs text-slate-600">Cada imagem fica selada ao CPF do paciente, sem risco de troca de prontuários.</p>
                      </div>
                    </div>
                  </div>

                  {/* Exame Neurológico & Integrativo */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-purple-50/70 p-5 rounded-3xl border border-purple-200/80 space-y-2">
                      <h4 className="font-bold text-purple-900 text-sm flex items-center gap-2">
                        <Brain size={18} className="text-purple-600" />
                        Módulo Neurológico Interativo
                      </h4>
                      <ul className="text-xs text-purple-950 space-y-1.5 list-disc list-inside leading-relaxed">
                        <li><strong>Diagrama de Dermátomos:</strong> Mapa anatômico clicável de C2 a S5 com marcação de hipoestesia e dor.</li>
                        <li><strong>Reflexos de Wexler:</strong> Escala de 0 a 4+ para reflexos bicipital, tricipital, patelar e aquileu.</li>
                        <li><strong>Lousa MEEM:</strong> Área digital para o paciente desenhar e copiar os pentágonos cognitivos na tela.</li>
                      </ul>
                    </div>

                    <div className="bg-teal-50/70 p-5 rounded-3xl border border-teal-200/80 space-y-2">
                      <h4 className="font-bold text-teal-900 text-sm flex items-center gap-2">
                        <Stethoscope size={18} className="text-teal-600" />
                        Medicina Integrativa & Odonto Biológica
                      </h4>
                      <ul className="text-xs text-teal-950 space-y-1.5 list-disc list-inside leading-relaxed">
                        <li><strong>Checklist Integrativo:</strong> 40+ suplementos e minerais (Coenzima Q10, DHEA, Vitamina D3, K2, Lugol).</li>
                        <li><strong>Focos Crônicos & Patógenos:</strong> Mapeamento de cândida, borrelia, zóster e imunologia.</li>
                        <li><strong>Radar Metabólico:</strong> Gráficos visuais de sono, estresse, nutrição e energia vital.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: PERGUNTAS FREQUENTES (FAQ) */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      1. O médico precisa fazer backup todo dia ou apertar para salvar arquivos?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Não!</strong> Toda vez que o médico clica em <strong>"Evoluir / Salvar Prontuário"</strong>, o sistema grava tudo automaticamente no banco de dados na nuvem criptografada. O botão <em>"Backup JSON"</em> no menu é apenas um recurso extra caso você queira guardar uma cópia física no seu pendrive pessoal.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      2. A secretária e o médico podem usar ao mesmo tempo em computadores diferentes?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Sim!</strong> O sistema é 100% sincronizado em tempo real. Quando a secretária dá baixa no pagamento na recepção, o status atualiza instantaneamente para "Pago" na sala do médico.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      3. Como funciona a baixa no caixa se a clínica não tem gateway conectado?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      O sistema funciona como o <strong>Livro-Caixa e Gestor Oficial da Clínica</strong>. A cobrança passa na maquininha de cartão física da clínica ou no Pix da conta da clínica, e a secretária apenas clica em <em>[Pix]</em> ou <em>[Cartão]</em> no sistema para dar baixa, liberar o check-in do médico e gerar o relatório contábil.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      4. Como encontrar atendimentos e receitas de meses atrás?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Basta acessar a aba <strong>"Histórico de Prontuários"</strong> e digitar o Nome, CPF ou Data de Nascimento do paciente. Abre-se o <strong>Dossiê Completo</strong> com todas as consultas, comparativo de evolução e imagens arquivadas.
                    </p>
                  </div>
                </div>
              )}

              {/* ABA 5: CONFIGURAÇÕES DO MÉDICO */}
              {activeTab === 'config' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                        <Settings size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Dados do Médico & Timbre de Receituário</h3>
                        <p className="text-xs text-slate-500">Configure seu Nome Completo, CRM, Especialidade e Assinatura Digital para sair em todos os PDFs</p>
                      </div>
                    </div>
                    <DoctorSettings userId={userId} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                💡 Dica: Você pode reabrir este manual a qualquer momento no menu <strong>"Sobre o Sistema"</strong>.
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
              >
                Fechar Manual & Começar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
