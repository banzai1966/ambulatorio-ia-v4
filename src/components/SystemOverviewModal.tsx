import { motion, AnimatePresence } from 'motion/react';
import { X, Stethoscope, Mic, MessageSquare, Clock, ShieldCheck, Zap, Calendar, FileText, Activity, Settings, Laptop, Smartphone, Search, Save, Download, CheckCircle, FolderOpen, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import DoctorSettings from './DoctorSettings';

interface SystemOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function SystemOverviewModal({ isOpen, onClose, userId }: SystemOverviewModalProps) {
  console.log("SystemOverviewModal isOpen:", isOpen, "userId:", userId);
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} className="text-slate-500" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-clinical-blue rounded-2xl flex items-center justify-center text-white shadow-xl shadow-clinical-blue/20 flex-shrink-0">
                <Stethoscope size={30} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Sobre o Ambulatório IA</h2>
                <p className="text-sm text-slate-500 font-medium">Guia completo e simplificado de funcionamento do aplicativo</p>
              </div>
            </div>

            <div className="space-y-8 text-slate-600">
              {/* Doctor Profile Settings */}
              <section className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80">
                <div className="flex items-center gap-3 mb-3">
                  <Settings className="text-clinical-blue" size={22} />
                  <h3 className="text-xl font-bold text-slate-800">Configurações do Médico / Profissional</h3>
                </div>
                <DoctorSettings userId={userId} />
              </section>

              {/* Cloud Connection & Automatic Backup Explanation */}
              <section className="bg-emerald-50/80 p-6 rounded-3xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center gap-3 text-emerald-900">
                  <ShieldCheck size={22} className="text-emerald-600" />
                  <h3 className="text-xl font-bold">Status "Conectado (Nuvem)" & O Botão "Backup JSON"</h3>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                  <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                    <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      O Doutor Precisa Apertar Algum Botão para Salvar ou Fazer Backup?
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      <strong>NÃO! Absolutamente nada.</strong> Toda vez que você atende um paciente e clica no botão verde <strong>"Evoluir / Salvar Prontuário"</strong>, o sistema grava automaticamente todas as informações, exames e receitas direto no banco de dados da nuvem em tempo real.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Download size={16} className="text-clinical-blue" />
                      Para Que Serve o Botão "Backup JSON" no Canto do Menu?
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      O botão <strong>"Backup JSON"</strong> é apenas uma garantia extra de segurança pessoal para o médico. Se um dia você quiser baixar um arquivo físico com a cópia de todos os seus prontuários no seu próprio pendrive ou computador para guardar em gaveta, basta clicar nele. <strong>É um recurso 100% opcional</strong> — o sistema já cuida de tudo sozinho na nuvem.
                    </p>
                  </div>
                </div>
              </section>

              {/* PWA Installation Step by Step */}
              <section className="bg-blue-50/70 p-6 rounded-3xl border border-blue-200">
                <div className="flex items-center gap-3 mb-3 text-blue-900">
                  <Laptop size={24} className="text-blue-600" />
                  <h3 className="text-xl font-bold">Como Instalar o Aplicativo no Computador ou Celular</h3>
                </div>
                <p className="text-sm text-blue-950 mb-4 leading-relaxed">
                  Você não precisa baixar instaladores complicados ou arquivos `.exe`. O sistema utiliza a tecnologia <strong>PWA (Progressive Web App)</strong>, permitindo que ele rode direto na tela do seu computador ou celular como um programa nativo!
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Laptop size={18} className="text-clinical-blue" />
                      No Computador (Windows / Mac)
                    </h4>
                    <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                      <li>Abra o link do sistema no <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.</li>
                      <li>Olhe para a <strong>barra de endereço</strong> (onde você digita o site na parte superior).</li>
                      <li>Procure o ícone de um <strong>monitor com uma seta para baixo</strong> ou o sinal de <strong>"+" (Instalar)</strong> no lado direito da barra.</li>
                      <li>Clique em <strong>Instalar</strong>. Pronto! O aplicativo criará um ícone direto na sua <strong>Área de Trabalho</strong> e abrirá em uma janela própria sem barras de navegação.</li>
                    </ol>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-2xs space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Smartphone size={18} className="text-purple-600" />
                      No Celular ou Tablet (Android / iPhone)
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                      <li><strong>Android (Chrome):</strong> Abra o link, toque nos 3 pontinhos do topo direito e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à Tela inicial"</strong>.</li>
                      <li><strong>iPhone / iPad (Safari):</strong> Abra o link no Safari, toque no botão <strong>Compartilhar</strong> (quadrado com seta pra cima) e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Step by Step Record Creation */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Zap className="text-amber-500" size={22} />
                  <h3 className="text-xl font-bold text-slate-800">Passo a Passo: Como Atender e Gerar Prontuários</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  O sistema foi desenhado para economizar tempo do médico. Você não precisa ficar digitando tudo enquanto fala com o paciente:
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="w-7 h-7 rounded-full bg-clinical-blue text-white flex items-center justify-center text-xs font-black mb-2">1</span>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Selecione a Especialidade</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Escolha entre Geral/Padrão, Neurológico, Integrativo, Pediatria, Cardiologia ou Psiquiatria para ativar os campos específicos.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="w-7 h-7 rounded-full bg-clinical-blue text-white flex items-center justify-center text-xs font-black mb-2">2</span>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Identifique o Paciente</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Digite Nome, CPF e Data de Nascimento nos campos ou fale em voz alta durante o relato da consulta.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="w-7 h-7 rounded-full bg-clinical-blue text-white flex items-center justify-center text-xs font-black mb-2">3</span>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Gravador de Voz por IA</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Clique no botão do <strong>Microfone</strong> e dite a consulta em tom natural. Fale sobre queixas, dores, sintomas, exames e receitas. Ao clicar em Parar, a IA preenche os campos automaticamente em segundos!</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black mb-2">4</span>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Salvar e Evoluir Prontuário</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Clique no botão <strong>"Evoluir / Salvar Prontuário"</strong>. O atendimento ficará salvo no banco de dados com a data e hora do dia. Se o paciente retornar em meses, a história antiga continua intacta e uma nova consulta é adicionada.</p>
                  </div>
                </div>
              </section>

              {/* How Searching Works */}
              <section className="bg-emerald-50/70 p-6 rounded-3xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-3 text-emerald-900">
                  <Search size={22} className="text-emerald-600" />
                  <h3 className="text-xl font-bold">Como Buscar Pacientes e Prontuários Salvos</h3>
                </div>
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                  Na aba <strong>"Histórico de Prontuários"</strong> (menu esquerdo), você tem um campo de busca inteligente. Você pode pesquisar por:
                </p>
                <div className="grid sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900">
                    👤 <strong>Nome do Paciente:</strong> Ex: "Carlos Silva"
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900">
                    🪪 <strong>CPF do Paciente:</strong> Ex: "123.456.789-00"
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900">
                    📅 <strong>Data de Nascimento:</strong> Ex: "15/04/1985"
                  </div>
                </div>
                <p className="text-xs text-emerald-800 pt-1">
                  Ao clicar em qualquer paciente na lista, abre-se o <strong>Dossiê Completo</strong> com todas as consultas passadas, imagens anexadas, exames e a opção de gerar PDF.
                </p>
              </section>

              {/* System Features Overview */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <FolderOpen className="text-clinical-blue" size={22} />
                  <h3 className="text-xl font-bold text-slate-800">Tudo o que Você Pode Acessar no Sistema</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Activity size={16} className="text-clinical-blue" />
                      Dashboard Geral
                    </h4>
                    <p className="text-xs text-slate-500">Visão panorâmica em tempo real com estatísticas de consultas do dia, status de agendamentos e atalhos rápidos.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Stethoscope size={16} className="text-clinical-blue" />
                      Atendimento Clínico & Especialidades
                    </h4>
                    <p className="text-xs text-slate-500">Tela de consulta com gravação por IA, Boneco Anatômico Interativo de dores (Body Map) e suporte a 6 especialidades médicas.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Calendar size={16} className="text-clinical-blue" />
                      Agenda Médica & Lembretes
                    </h4>
                    <p className="text-xs text-slate-500">Organize os horários de atendimento e envie lembretes automáticos para o WhatsApp do paciente para confirmar presença.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <MessageSquare size={16} className="text-clinical-blue" />
                      Mensagens & WhatsApp
                    </h4>
                    <p className="text-xs text-slate-500">Conversas diretas com pacientes. Receba fotos de exames (raios-X, ultrassons), áudios e registro de chamadas diretamente no chat.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Image size={16} className="text-clinical-blue" />
                      Anexos & Exames de Imagem (X-Ray / TC)
                    </h4>
                    <p className="text-xs text-slate-500">Galeria no dossiê do paciente para guardar radiografias, tomografias, laudos e fotos do tratamento organizado por data.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <FileText size={16} className="text-clinical-blue" />
                      Configuração de PDF & Impressão
                    </h4>
                    <p className="text-xs text-slate-500">Personalize o logotipo da clínica, nome do médico, CRM e endereço para imprimir prontuários e receitas profissionais em PDF A4.</p>
                  </div>
                </div>
              </section>

              {/* System Features Overview */}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 bg-clinical-blue text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-clinical-blue/20"
            >
              Entendido! Começar a Usar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

