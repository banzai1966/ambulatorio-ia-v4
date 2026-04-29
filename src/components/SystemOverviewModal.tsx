import { motion, AnimatePresence } from 'motion/react';
import { X, Stethoscope, Mic, MessageSquare, Clock, ShieldCheck, Zap, Calendar, FileText, Activity, Settings } from 'lucide-react';
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
            className="bg-white rounded-[32px] p-8 max-w-3xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} className="text-slate-500" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-clinical-blue rounded-2xl flex items-center justify-center text-white shadow-xl shadow-clinical-blue/20">
                <Stethoscope size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Seu Ambulatório Digital</h2>
                <p className="text-slate-500">Gestão profissional e comunicação direta com seus pacientes</p>
              </div>
            </div>

            <div className="space-y-8 text-slate-600">
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <Settings className="text-clinical-blue" />
                  <h3 className="text-xl font-semibold text-slate-800">Configurações do Médico</h3>
                </div>
                <DoctorSettings userId={userId} />
              </section>
              
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="text-clinical-blue" />
                  <h3 className="text-xl font-semibold text-slate-800">Dashboard de Gestão</h3>
                </div>
                <p>
                  Tenha uma visão panorâmica do seu ambulatório. O <strong>Dashboard</strong> mostra em tempo real quantos pacientes novos chegaram, seus agendamentos confirmados e quem precisa de um retorno urgente, tudo em uma interface limpa e profissional.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3">
                  <Mic className="text-clinical-blue" />
                  <h3 className="text-xl font-semibold text-slate-800">Transcrição e Documentação Clínica</h3>
                </div>
                <p>
                  <strong>Para o Médico:</strong> Esqueça o teclado durante a consulta. Fale com seu paciente e deixe que o sistema transforme sua fala em notas clínicas estruturadas automáticas. O sistema conta com recursos avançados como:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-2">
                  <li><strong>Mapeamento Corporal Interativo:</strong> A IA identifica não apenas a queixa, mas "plota" dores e sintomas diretamente em um modelo anatômico visual (boneco autoclicável) na interface.</li>
                  <li><strong>Cronobiologia (Receituário por Períodos):</strong> Dite horários para suplementos ou medicamentos, e a IA organizará a receita estruturada cronologicamente (ex: 🌅 Pela Manhã, 🌙 À Noite), gerando um layout lindo e livre de erros.</li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="text-amber-500" />
                  <h3 className="text-xl font-semibold text-slate-800">Copiloto IA & Alertas de Sinergia</h3>
                </div>
                <p>
                  A Inteligência Artificial atua como um verdadeiro <strong>Anjo da Guarda Metabólico</strong> nos bastidores. Na Medicina Integrativa, onde muitos ativos são prescritos simultaneamente, a IA monitora sua prescrição médica em tempo real. Se detectar interações arrsicadas (como D3 em alta dose sem K2, ou excesso de Zinco sem Cobre), ela exibirá um alerta visual discreto e dispensável para apoiar sua tomada de decisão clínica.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="text-clinical-blue" />
                  <h3 className="text-xl font-semibold text-slate-800">Atendimento Humanizado via WhatsApp</h3>
                </div>
                <p>
                  Centralize o atendimento via WhatsApp. Agora o sistema foca no <strong>atendimento humano direto</strong>, permitindo que você ou sua equipe respondam pessoalmente a cada paciente, garantindo um cuidado mais próximo e acolhedor.
                </p>
                <p className="mt-2">
                  O sistema suporta o <strong>recebimento de imagens e áudios</strong>, permitindo visualizar exames e ouvir relatos sem sair do aplicativo, com limpeza automática de ruídos técnicos nas mensagens.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="text-clinical-blue" />
                  <h3 className="text-xl font-semibold text-slate-800">Agenda e Lembretes Automáticos</h3>
                </div>
                <p>
                  Mantenha sua agenda organizada e reduza faltas. O sistema identifica consultas agendadas e envia lembretes personalizados via WhatsApp, marcando automaticamente quem já foi notificado para evitar mensagens duplicadas.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="text-clinical-blue" />
                  <h3 className="text-xl font-semibold text-slate-800">Gestão de Prontuários e Prescrições</h3>
                </div>
                <p>
                  Todos os prontuários são salvos de forma estruturada, permitindo buscas rápidas por nome ou CPF. Além disso, você pode exportar os dados para CSV ou gerar PDFs estruturados e profissionais dos prontuários clínicos, neurológicos e do novo <strong>Checklist de Saúde Integrativa</strong> com um único clique.
                </p>
                <p className="mt-2 text-sm bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-800">
                  <span className="font-black">NOVIDADE V3.2 - REFORMA INTEGRATIVA:</span><br/>
                  • <strong>Tabela Multi-Coluna:</strong> Visualize a evolução do paciente comparando os últimos dois atendimentos com o atual na mesma linha.<br/>
                  • <strong>Mapa Corporal Interativo:</strong> Sinalize campos interferentes clicando diretamente no boneco anatômico (frente e costas).<br/>
                  • <strong>Rigidez Clínica:</strong> Suporte preciso para unidades de medida (mcg, pg, ug) e símbolos de bio-ressonância (ex: 5 &gt; 100).<br/>
                  • <strong>Cálculo de Idade Preciso:</strong> Lógica clínica que considera dia/mês para idade exata do paciente.
                </p>

                <p className="mt-4 text-sm bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-indigo-800">
                  <span className="font-black">ROTEIRO PARA TESTE (MODO NEUROLÓGICO):</span><br/><br/>
                  <span className="italic select-all cursor-pointer">"O Paciente chama-se Carlos de Souza, 45 anos. No exame neurológico ele apresenta fácies típica, atitude ativa e dominância destra. A marcha é normal. A fluência verbal é da classe 30 a 45. O teste cognitivo apresentou orientação temporal e espacial normais, memória imediata e repetição preservadas, atingindo um total de 28 na pontuação.<br/><br/>
                  Na avaliação dos nervos cranianos, as pupilas direita e esquerda reagem normalmente e o fundo de olho está alterado. O teste de coordenação index-nariz obteve status normal, e o reflexo de romberg também normal.<br/><br/>
                  Para a força muscular da face, o tônus e trofismo são normais, sem deformidades. Sensibilidade de toque na cabeça preservada.<br/><br/>
                  Sobre a área de dores do mapeamento, o paciente manifesta uma dor aguda no ombro direito, fisgada forte no joelho esquerdo anterior e uma dor persistente na região lombar posterior.<br/><br/>
                  Hipótese: Cervicalgia tensional. Conduta: Administrar anti-inflamatório. Prescrição: Ibuprofeno 400mg, 1 comprimido pela manhã."</span>
                </p>
                
                <p className="mt-4">
                  <strong>Especialidades (Pediatria, Cardiologia e Psiquiatria):</strong> Agora o sistema conta com módulos dedicados. A IA identifica automaticamente dados como peso/altura (Pediatria), pressão/frequência (Cardiologia) ou humor/sono/medicação (Psiquiatria).
                </p>
                <p className="mt-2">
                  <strong>Módulo Integrativo e Mesclagem Inteligente:</strong> Permite o registro de suplementos, vitaminas e biomarcadores. O sistema agora <strong>mescla</strong> o seu preenchimento manual com a detecção da IA, garantindo que nada que você marcou seja apagado.
                </p>
                <p className="mt-2">
                  <strong>Documentos Dinâmicos:</strong> Os PDFs de Prontuário e Receituário agora adaptam seus títulos, slogans e gramática automaticamente de acordo com a especialidade selecionada.
                </p>
                <p className="mt-2">
                  <strong>Prescrições:</strong> Você também pode gerar prescrições médicas em PDF diretamente do resumo clínico gerado pela IA. Basta clicar no botão "Gerar Receita PDF" no painel de resumo.
                </p>
              </section>

              <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="text-amber-500" />
                  <h3 className="text-lg font-semibold text-slate-800">Compartilhe o App</h3>
                </div>
                <p className="text-sm mb-4">
                  Envie o link abaixo para que outras pessoas possam conhecer o sistema. Elas poderão criar uma conta ou usar o acesso de demonstração.
                </p>
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <code className="flex-1 text-xs text-slate-500 truncate">https://ais-pre-cct4qcca3jzfgibsrmqhtl-51327969358.us-east1.run.app</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('https://ais-pre-cct4qcca3jzfgibsrmqhtl-51327969358.us-east1.run.app');
                      toast.success('Link copiado!');
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg text-clinical-blue transition-colors"
                    title="Copiar Link"
                  >
                    <Activity size={18} />
                  </button>
                </div>
              </section>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-10 bg-clinical-blue text-white py-4 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Começar a usar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
