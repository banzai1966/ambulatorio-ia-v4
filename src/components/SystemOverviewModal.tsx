import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Stethoscope, 
  Mic, 
  MessageSquare, 
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
  Users, 
  UserCheck, 
  DollarSign, 
  History, 
  BookOpen,
  ArrowRight,
  TrendingUp,
  Key,
  Database,
  Lock
} from 'lucide-react';
import DoctorSettings from './DoctorSettings';

interface SystemOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function SystemOverviewModal({ isOpen, onClose, userId }: SystemOverviewModalProps) {
  const [activeTab, setActiveTab] = useState<'menus' | 'fluxo' | 'financeiro-equipe' | 'especialidades' | 'whatsapp' | 'faq' | 'config'>('menus');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-2 sm:p-5 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="bg-white rounded-[32px] max-w-5xl w-full shadow-2xl relative max-h-[94vh] flex flex-col overflow-hidden border border-slate-100"
          >
            {/* Header com Visual Clínico Premium */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 sm:p-7 text-white relative shrink-0">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all cursor-pointer"
                title="Fechar Manual"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 shrink-0 border border-blue-400/30">
                  <BookOpen size={30} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/30 mb-1">
                    <ShieldCheck size={12} /> Manual de Instruções Oficial • Versão 3.2
                  </div>
                  <h2 className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Manual de Instruções do Sistema
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    Guia operacional completo para Médicos, Administradores e Equipe de Atendimento
                  </p>
                </div>
              </div>

              {/* Barra de Abas do Manual */}
              <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                <button
                  onClick={() => setActiveTab('menus')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'menus' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <Activity size={14} /> 1. Menus da Barra Lateral
                </button>
                <button
                  onClick={() => setActiveTab('fluxo')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'fluxo' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <Zap size={14} /> 2. Fluxo da Consulta & Agenda
                </button>
                <button
                  onClick={() => setActiveTab('financeiro-equipe')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'financeiro-equipe' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <DollarSign size={14} /> 3. Financeiro & Prontuários
                </button>
                <button
                  onClick={() => setActiveTab('especialidades')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'especialidades' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <Brain size={14} /> 4. Odonto, Neuro & Radiologia
                </button>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'whatsapp' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <MessageSquare size={14} /> 5. WhatsApp & Automações
                </button>
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'faq' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <HelpCircle size={14} /> 6. Dúvidas & Treinamento
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'config' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <Settings size={14} /> 7. Configurações & CRM
                </button>
              </div>
            </div>

            {/* Conteúdo das Abas */}
            <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6 text-slate-600 bg-slate-50/50">

              {/* ABA 1: TODOS OS MENUS DA BARRA LATERAL */}
              {activeTab === 'menus' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                        <Activity size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Guia de Cada Menu da Barra Lateral</h3>
                        <p className="text-xs text-slate-500">Conheça exatamente a finalidade e o que você encontra em cada seção do sistema</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
                      {/* Dashboard Geral */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="p-1.5 bg-blue-600 text-white rounded-lg"><Activity size={14} /></span>
                          1. Dashboard Geral
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>O que é:</strong> Painel de comando com visão panorâmica do ambulatório.<br />
                          <strong>O que você faz:</strong> Acompanha o total de pacientes do dia, gráficos de especialidades atendidas (Odonto, Neuro, Integrativa), fila de espera ativa e avisos do copiloto de segurança.
                        </p>
                      </div>

                      {/* Atendimento Clínico */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="p-1.5 bg-blue-600 text-white rounded-lg"><Mic size={14} /></span>
                          2. Atendimento Clínico (Consultório)
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>O que é:</strong> O coração clínico do médico e dentista durante a consulta.<br />
                          <strong>O que você faz:</strong> Grava a consulta por voz (IA transcreve no padrão SOAP), preenche odontograma anatômico 3D ou exame neurológico Wexler/dermátomos, emite receituários Anvisa e laudos radiológicos.
                        </p>
                      </div>

                      {/* Agenda Médica */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="p-1.5 bg-blue-600 text-white rounded-lg"><Calendar size={14} /></span>
                          3. Agenda Médica & Horários
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>O que é:</strong> Grade de agendamentos organizada por profissional (Dra. Lucy e Dr. Carlos).<br />
                          <strong>O que você faz:</strong> Cadastra novos pacientes com busca rápida de CEP por 8 dígitos, define horários de cirurgias ou retornos e dispara confirmações automáticas com link de pré-anamnese.
                        </p>
                      </div>

                      {/* Mensagens & WhatsApp */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="p-1.5 bg-blue-600 text-white rounded-lg"><MessageSquare size={14} /></span>
                          4. Mensagens & WhatsApp
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>O que é:</strong> Central de comunicação e disparos automáticos para os pacientes.<br />
                          <strong>O que você faz:</strong> Envia confirmações de consulta com ficha de pré-anamnese rápida, envia receitas médicas em PDF com QR Code oficial e emite comprovantes de pagamento timbrados.
                        </p>
                      </div>

                      {/* Histórico de Prontuários */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="p-1.5 bg-blue-600 text-white rounded-lg"><History size={14} /></span>
                          5. Histórico de Prontuários (Dossiê)
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>O que é:</strong> Arquivo clínico perpétuo e seguro da clínica.<br />
                          <strong>O que você faz:</strong> Busca qualquer paciente instantaneamente por Nome, CPF ou Data de Nascimento. Abre a linha do tempo cronológica com todas as consultas anteriores, fotos e laudos de tomografia.
                        </p>
                      </div>

                      {/* Financeiro & Caixa */}
                      <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                        <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                          <span className="p-1.5 bg-emerald-600 text-white rounded-lg"><DollarSign size={14} /></span>
                          6. Financeiro & Caixa
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed">
                          <strong>O que é:</strong> Controle de fluxo de caixa, receitas e despesas operacionais.<br />
                          <strong>O que você faz:</strong> Lança entradas por Pix, Cartão, Dinheiro ou Convênio, gera recibos timbrados com CRO/CRM do profissional atendente, acompanha saldo líquido e controla custos de insumos.
                        </p>
                      </div>

                      {/* Equipe Médica */}
                      <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-2">
                        <div className="font-bold text-purple-950 text-sm flex items-center gap-2">
                          <span className="p-1.5 bg-purple-600 text-white rounded-lg"><Users size={14} /></span>
                          7. Equipe Médica & Acessos
                        </div>
                        <p className="text-xs text-purple-900 leading-relaxed">
                          <strong>O que é:</strong> Gerenciamento dos profissionais e secretárias da clínica.<br />
                          <strong>O que você faz:</strong> Cadastra novos usuários, define papéis de acesso (Administrador, Médico, Dentista, Recepcionista), aprova cadastros pendentes e configura números de CRM/CRO.
                        </p>
                      </div>

                      {/* Configurações da Clínica */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="p-1.5 bg-slate-700 text-white rounded-lg"><Settings size={14} /></span>
                          8. Configurações & WhatsApp API
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>O que é:</strong> Configuração geral da clínica e integrações de tecnologia.<br />
                          <strong>O que você faz:</strong> Personaliza o nome da clínica, logotipo, endereço dos impressos e conecta o WhatsApp oficial via Evolution API com leitura de QR Code.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Instalação no Computador e Celular */}
                  <div className="bg-blue-50/70 p-6 rounded-3xl border border-blue-200 space-y-3">
                    <div className="flex items-center gap-3 text-blue-900">
                      <Laptop size={22} className="text-blue-600" />
                      <h3 className="text-lg font-bold">Como Instalar no Computador, Tablet ou Celular (PWA)</h3>
                    </div>
                    <p className="text-xs text-blue-950 leading-relaxed">
                      O sistema foi construído com tecnologia PWA de ponta: não precisa baixar arquivos pesados e roda com desempenho nativo:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 pt-1">
                      <div className="bg-white p-4 rounded-2xl border border-blue-100 space-y-1.5 shadow-2xs">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                          <Laptop size={16} className="text-blue-600" /> No Computador (Chrome, Edge ou Mac)
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Na barra de endereços do Google Chrome ou Edge, clique no ícone de <strong>Monitor com uma seta para baixo</strong> ou no botão <strong>"+"</strong> e clique em <strong>"Instalar"</strong>. O ícone do Ambulatório IA aparecerá na sua Área de Trabalho.
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-blue-100 space-y-1.5 shadow-2xs">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                          <Smartphone size={16} className="text-purple-600" /> No Celular ou iPad / Tablet
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>No Android (Google Chrome):</strong> Toque nos 3 pontinhos no topo e selecione <em>"Instalar aplicativo"</em>.<br />
                          <strong>No iPhone / iPad (Safari):</strong> Toque no botão Compartilhar e selecione <em>"Adicionar à Tela de Início"</em>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: FLUXO COMPLETO DA CONSULTA & AGENDA */}
              {activeTab === 'fluxo' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                        <Zap size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Fluxo Ponta a Ponta: Do Agendamento ao Término da Consulta</h3>
                        <p className="text-xs text-slate-500">O passo a passo exato de como a secretária e o profissional clínico trabalham integrados</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-1">
                      {/* Passo 1 */}
                      <div className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</span>
                        <div className="text-xs space-y-1">
                          <strong className="text-slate-900 text-sm">Criar o Agendamento com Preenchimento Automático de CEP:</strong>
                          <p className="text-slate-600 leading-relaxed">
                            Na aba <strong>"Agenda Médica"</strong>, clique em <strong>"+ Novo Agendamento"</strong>. Ao digitar os 8 dígitos do CEP do paciente, o endereço completo (Rua, Bairro e Cidade) é preenchido na hora. Escolha o profissional (Dra. Lucy ou Dr. Carlos), data, horário e tipo de procedimento.
                          </p>
                        </div>
                      </div>

                      {/* Passo 2 */}
                      <div className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</span>
                        <div className="text-xs space-y-1">
                          <strong className="text-slate-900 text-sm">Envio Automático de Confirmação & Pré-Anamnese no WhatsApp:</strong>
                          <p className="text-slate-600 leading-relaxed">
                            Clique no ícone de <strong>WhatsApp</strong> na linha do paciente agendado. O sistema dispara a mensagem oficial com data, horário, endereço da clínica e instruções prévias. Na recepção, a foto do paciente pode ser capturada na hora com a webcam do balcão para identificação no prontuário.
                          </p>
                        </div>
                      </div>

                      {/* Passo 3 */}
                      <div className="flex items-start gap-3.5 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                        <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</span>
                        <div className="text-xs space-y-1">
                          <strong className="text-emerald-950 text-sm">Chegada do Paciente, Recepção & Baixa no Caixa:</strong>
                          <p className="text-slate-600 leading-relaxed">
                            Quando o paciente chega à clínica, a secretária clica em <strong>"Check-in / Receber"</strong>. Seleciona a forma de pagamento (Pix, Cartão, Dinheiro ou Convênio) e confirma. O status atualiza para <strong>"🟢 Pago / Aguardando Atendimento"</strong> e o paciente entra na fila de espera do médico.
                          </p>
                        </div>
                      </div>

                      {/* Passo 4 */}
                      <div className="flex items-start gap-3.5 p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">4</span>
                        <div className="text-xs space-y-1">
                          <strong className="text-blue-950 text-sm">Atendimento no Consultório & Escuta por Voz com Inteligência Artificial:</strong>
                          <p className="text-slate-600 leading-relaxed">
                            Na aba <strong>"Atendimento Clínico"</strong>, o profissional abre o paciente que está na fila. Basta clicar no botão do <strong>Microfone</strong> e conversar normalmente com o paciente. A IA médica transcreve e organiza a conversa em tempo real dividindo em: <em>Subjetivo (Queixa Principal), Objetivo (Exame Físico/Odontograma), Avaliação (Hipótese Diagnóstica) e Plano (Conduta e Prescrição)</em>.
                          </p>
                        </div>
                      </div>

                      {/* Passo 5 */}
                      <div className="flex items-start gap-3.5 p-4 bg-purple-50/70 rounded-2xl border border-purple-200">
                        <span className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">5</span>
                        <div className="text-xs space-y-1">
                          <strong className="text-purple-950 text-sm">Prescrição Timbrada Anvisa & Envio do PDF para o WhatsApp:</strong>
                          <p className="text-slate-600 leading-relaxed">
                            Ao finalizar o atendimento, clique em <strong>"Evoluir Prontuário"</strong> para salvar na nuvem e em <strong>"Gerar Receituário Anvisa"</strong>. O documento sai timbrado com os dados do médico (CRM/CRO), QR Code de autenticação e pode ser impresso ou enviado diretamente para o WhatsApp do paciente com 1 clique.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: FINANCEIRO, EQUIPE & HISTÓRICO DE PRONTUÁRIOS */}
              {activeTab === 'financeiro-equipe' && (
                <div className="space-y-6">
                  {/* Módulo Financeiro em Detalhes */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                        <DollarSign size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">1. Gestão Financeira & Controle de Caixa</h3>
                        <p className="text-xs text-slate-500">Como registrar receitas, despesas, emitir recibos e acompanhar faturamento</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3.5 pt-1">
                      <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5">
                        <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                          <CreditCard size={15} className="text-emerald-700" /> Registro de Receitas & Formas
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Ao clicar em <strong>"+ Novo Lançamento"</strong>, informe o paciente, valor, data e método: <em>Pix, Cartão de Crédito/Débito, Dinheiro ou Convênio</em>. O valor soma automaticamente no caixa do dia.
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5">
                        <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                          <TrendingUp size={15} className="text-emerald-700" /> Controle de Despesas & Insumos
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Registre custos com anestésicos, implantes de zircônia, kits cirúrgicos ou contas da clínica. O painel calcula o <strong>Saldo Líquido Real</strong> em tempo real.
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5">
                        <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                          <FileText size={15} className="text-emerald-700" /> Emissão de Recibo Timbrado
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Ao confirmar a receita, o sistema gera o recibo com cabeçalho oficial do consultório da <strong>Dra. Lucy (CRO-SP 69246)</strong> ou do <strong>Dr. Carlos (CRM/SP 145.892)</strong> pronto para impressão ou WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Histórico Completo de Pacientes (Dossiê) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                        <History size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">2. Histórico de Prontuários & Dossiê Clínico Perpétuo</h3>
                        <p className="text-xs text-slate-500">Como localizar qualquer paciente e consultar a evolução completa ao longo do tempo</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                      <p>
                        No menu <strong>"Histórico de Prontuários"</strong>, você pesquisa qualquer paciente com filtros instantâneos:
                      </p>
                      <div className="grid sm:grid-cols-3 gap-2.5 font-bold text-slate-800">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">🔤 Busca por Nome</div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">🔢 Busca por CPF</div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">📅 Data de Nascimento</div>
                      </div>
                      <p>
                        Ao abrir o paciente, você tem acesso ao <strong>Dossiê Completo</strong>:
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 pl-1">
                        <li><strong>Linha do Tempo:</strong> Todas as consultas anteriores organizadas por data e especialidade.</li>
                        <li><strong>Comparativo de Odontograma / Neurologia:</strong> Visualize como o paciente chegou e como evoluiu.</li>
                        <li><strong>Galeria de Anexos:</strong> Fotos de antes e depois, tomografias CBCT, radiografias panorâmicas e exames laboratoriais.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Gestão da Equipe Médica */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                        <Users size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">3. Gestão da Equipe Médica & Perfis de Acesso</h3>
                        <p className="text-xs text-slate-500">Segurança de dados e níveis de permissão para administradores, médicos e recepção</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="p-1.5 bg-purple-600 text-white rounded-lg"><UserCheck size={16} /></span>
                        <div className="text-xs space-y-1">
                          <strong className="text-slate-900 text-sm">Controle de Perfis (Admin, Médico, Secretária):</strong>
                          <p className="text-slate-600 leading-relaxed">
                            O administrador mestre (<strong>Marco Duarte</strong>) e os doutores têm visão completa. Médicos acessam suas consultas e laudos. Secretárias gerenciam a recepção, agendamentos e emissão de comprovantes de pagamento.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="p-1.5 bg-purple-600 text-white rounded-lg"><CheckCircle2 size={16} /></span>
                        <div className="text-xs space-y-1">
                          <strong className="text-slate-900 text-sm">Aprovação de Novos Cadastros:</strong>
                          <p className="text-slate-600 leading-relaxed">
                            Caso um novo colaborador crie login, ele fica retido até que um administrador aprove seu acesso na aba <strong>"Equipe Médica"</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: ODONTOLOGIA BIOLÓGICA, NEUROLOGIA & RADIOLOGIA */}
              {activeTab === 'especialidades' && (
                <div className="space-y-6">
                  {/* Negatoscópio Digital */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                        <Image size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Negatoscópio Digital & Laudo de Imagens</h3>
                        <p className="text-xs text-slate-500">Recursos de alta precisão para avaliação de Raio-X, Tomografias CBCT e Fotos Clínicas</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          🔍 Super Zoom 400%
                        </div>
                        <p className="text-xs text-slate-600">Aproxime imagens de radiologia para identificar microfraturas, cavitações NICO e detalhes ósseos.</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          🌓 Contraste Radiológico
                        </div>
                        <p className="text-xs text-slate-600">Inverte os tons de preto e branco para leitura nítida de chapas radiográficas na tela do computador.</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          ✏️ Estúdio de Anotações
                        </div>
                        <p className="text-xs text-slate-600">Desenhe setas, círculos e anote lesões diretamente sobre o exame antes de salvar no prontuário.</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          🔒 Vínculo Seguro
                        </div>
                        <p className="text-xs text-slate-600">Cada imagem fica selada ao CPF do paciente com garantia de integridade médica.</p>
                      </div>
                    </div>
                  </div>

                  {/* Odonto Biológica vs Neurologia */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 space-y-2.5">
                      <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                        <Sparkles size={18} className="text-emerald-700" />
                        Módulo Dra. Lucy (Odontologia Biológica)
                      </h4>
                      <ul className="text-xs text-emerald-950 space-y-1.5 list-disc list-inside leading-relaxed">
                        <li><strong>Odontograma FDI (11 a 48):</strong> Clique direto nos dentes para indicar amálgama, implante de zircônia, NICO/FDOK e canal.</li>
                        <li><strong>Protocolo SMART IAOMT:</strong> Checklist de paramentação segura para remoção de metais pesados.</li>
                        <li><strong>Meridianos Dente-Órgão:</strong> Correlação automática de cada dente com órgãos e vértebras do corpo.</li>
                        <li><strong>Presets Cirúrgicos:</strong> Protocolos de Terapia Neural e Ozonioterapia pré/pós-operatórios.</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50/70 p-5 rounded-3xl border border-blue-200 space-y-2.5">
                      <h4 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                        <Brain size={18} className="text-blue-700" />
                        Módulo Dr. Carlos (Neurologia & Integrativa)
                      </h4>
                      <ul className="text-xs text-blue-950 space-y-1.5 list-disc list-inside leading-relaxed">
                        <li><strong>Diagrama de Dermátomos C2-S5:</strong> Marcação anatômica de hipoestesia, dor e parestesia.</li>
                        <li><strong>Reflexos de Wexler:</strong> Boneco interativo com notas de 0 a 4+ em 8 pontos anatômicos.</li>
                        <li><strong>Checklist Integrativo:</strong> Mapeamento de 40+ suplementos, minerais e patógenos crônicos.</li>
                        <li><strong>Lousa Cognitiva MEEM:</strong> Aplicação do mini-exame do estado mental na tela.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 5: WHATSAPP & INTEGRAÇÕES */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                        <MessageSquare size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Automação de WhatsApp Oficial (Evolution API)</h3>
                        <p className="text-xs text-slate-500">Como conectar o WhatsApp da clínica e disparar mensagens automáticas</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed pt-1">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <strong className="text-slate-900 font-bold text-sm flex items-center gap-2">
                          📲 1. Como Conectar o WhatsApp da Clínica:
                        </strong>
                        <p>
                          Acesse o menu <strong>"Configurações & WhatsApp"</strong>. Digite o nome da instância desejada e clique em <em>"Gerar QR Code"</em>. Abra o WhatsApp no celular da clínica, vá em <em>Aparelhos Conectados &gt; Conectar um Aparelho</em> e aponte a câmera para a tela do computador.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <strong className="text-slate-900 font-bold text-sm flex items-center gap-2">
                          📋 2. O Que o Sistema Dispara Automaticamente:
                        </strong>
                        <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-700">
                          <li><strong>Confirmação de Consulta:</strong> Mensagem cordial com data, hora, endereço e o link da pré-anamnese.</li>
                          <li><strong>Receituários & Atestados em PDF:</strong> Envio imediato do documento oficial com link seguro para o paciente abrir na farmácia.</li>
                          <li><strong>Comprovante de Pagamento / Recibo:</strong> Recibo timbrado com os dados do consultório enviado na hora em que o caixa é baixado.</li>
                          <li><strong>Orientações Pós-Operatórias:</strong> Orientações de cuidados após cirurgias odontológicas ou procedimentos neurológicos.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 6: PERGUNTAS FREQUENTES (FAQ) & TREINAMENTO */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      1. O médico ou secretária precisam fazer backup manual todo dia?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Não!</strong> Toda vez que qualquer atendimento ou agendamento é salvo, o sistema grava automaticamente na nuvem criptografada. O botão <em>"Backup JSON (Admin)"</em> na barra lateral é apenas uma garantia extra caso o administrador queira salvar um arquivo no pendrive pessoal.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      2. A secretária na recepção e os médicos no consultório podem usar ao mesmo tempo?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Sim!</strong> O sistema é multiusuário e sincroniza em tempo real. Quando a secretária dá check-in em um paciente na recepção, ele surge na fila da sala do médico na mesma hora.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      3. E se a internet da clínica cair durante o atendimento?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      O sistema conta com <strong>Modo Offline (PWA)</strong>. O atendimento continua sendo registrado localmente no navegador e, assim que a conexão retornar, tudo é sincronizado automaticamente com a nuvem.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      4. Como emitir recibos separados para a Dra. Lucy e para o Dr. Carlos?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      O sistema detecta automaticamente o profissional selecionado no atendimento/receita e aplica o cabeçalho correspondente: CRO da Dra. Lucy para procedimentos odontológicos ou CRM do Dr. Carlos para procedimentos neurológicos.
                    </p>
                  </div>
                </div>
              )}

              {/* ABA 7: CONFIGURAÇÕES DO MÉDICO & CRM */}
              {activeTab === 'config' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                        <Settings size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Dados do Profissional & Timbre de Receituário</h3>
                        <p className="text-xs text-slate-500">Configure seu Nome Completo, CRM/CRO, Especialidade e Assinatura Digital para sair em todos os documentos impressos e em PDF</p>
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
                💡 Dica: Você pode reabrir este manual a qualquer momento clicando em <strong>"Manual de Instruções"</strong> no menu lateral.
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
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
