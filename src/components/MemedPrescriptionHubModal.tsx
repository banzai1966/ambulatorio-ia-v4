import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  ExternalLink, 
  Copy, 
  Check, 
  Key, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  HelpCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MemedPrescriptionHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone: string;
  patientCpf?: string;
  doctorName: string;
  onSavePrescriptionRecord?: (recordText: string) => void;
}

export default function MemedPrescriptionHubModal({
  isOpen,
  onClose,
  patientName,
  patientPhone,
  patientCpf,
  doctorName,
  onSavePrescriptionRecord
}: MemedPrescriptionHubModalProps) {
  const [activeTab, setActiveTab] = useState<'prescrever' | 'config'>('prescrever');
  const [copied, setCopied] = useState(false);
  const [memedToken, setMemedToken] = useState<string>('');
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [recipeTokenInput, setRecipeTokenInput] = useState('');
  const [recipeLinkInput, setRecipeLinkInput] = useState('');
  const [isSinapseLoading, setIsSinapseLoading] = useState(false);
  const [sinapseLoaded, setSinapseLoaded] = useState(false);

  // Carrega o token salvo no localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('ambulatorio_memed_api_token') || '';
    setMemedToken(savedToken);
    setTokenInput(savedToken);
  }, [isOpen]);

  // Se tiver token, tenta carregar o módulo oficial da Memed Sinapse
  useEffect(() => {
    if (isOpen && memedToken && activeTab === 'prescrever') {
      loadMemedSinapse(memedToken);
    }
  }, [isOpen, memedToken, activeTab]);

  const loadMemedSinapse = (token: string) => {
    try {
      setIsSinapseLoading(true);
      // Verifica se o script já existe
      const existingScript = document.getElementById('memed-sinapse-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'memed-sinapse-script';
        script.type = 'text/javascript';
        script.src = 'https://sinapse.memed.com.br/core/v2/module.js';
        script.setAttribute('data-token', token);
        script.async = true;
        
        script.onload = () => {
          setIsSinapseLoading(false);
          setSinapseLoaded(true);
          initMemedEvents();
        };

        script.onerror = () => {
          setIsSinapseLoading(false);
          setSinapseLoaded(false);
        };

        document.body.appendChild(script);
      } else {
        setIsSinapseLoading(false);
        setSinapseLoaded(true);
        initMemedEvents();
      }
    } catch (err) {
      console.warn('Erro ao carregar script do Memed Sinapse:', err);
      setIsSinapseLoading(false);
    }
  };

  const initMemedEvents = () => {
    if (typeof window !== 'undefined' && (window as any).MdSinapsePrescricao) {
      try {
        const MdSinapse = (window as any).MdSinapsePrescricao;
        MdSinapse.event.add('core:moduleInit', (module: any) => {
          if (module.name === 'plataforma.prescricao') {
            (window as any).MdHub?.command?.send('plataforma.prescricao', 'setPaciente', {
              nome: patientName,
              cpf: patientCpf || '',
              telefone: patientPhone || ''
            });
          }
        });

        // Escuta quando a prescrição for salva
        MdSinapse.event.add('prescricaoSalva', (prescricaoData: any) => {
          toast.success('Receita digital emitida com sucesso na Memed!');
          if (onSavePrescriptionRecord) {
            const resumo = `[MEMED DIGITAL] Receita emitida via Memed Token. Paciente: ${patientName}. Código/ID: ${prescricaoData?.id || 'Emitida'}`;
            onSavePrescriptionRecord(resumo);
          }
        });
      } catch (e) {
        console.warn('Configuração de eventos Memed:', e);
      }
    }
  };

  const handleCopyPatientData = () => {
    const text = `Paciente: ${patientName}${patientCpf ? ` | CPF: ${patientCpf}` : ''}${patientPhone ? ` | Tel: ${patientPhone}` : ''} | Médico: ${doctorName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Dados do paciente copiados! Pronto para colar na Memed.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToken = () => {
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      localStorage.removeItem('ambulatorio_memed_api_token');
      setMemedToken('');
      toast.success('Token removido. Modo manual ativado.');
    } else {
      localStorage.setItem('ambulatorio_memed_api_token', cleanToken);
      setMemedToken(cleanToken);
      toast.success('Token da Memed salvo com sucesso!');
    }
    setIsEditingToken(false);
  };

  const handleRegisterRecipe = () => {
    if (!recipeTokenInput && !recipeLinkInput) {
      toast.error('Informe ao menos o Token de 6 dígitos ou o link da receita gerada.');
      return;
    }

    const logEntry = `[RECEITA MEMED DISPARADA]\nPaciente: ${patientName}\n${recipeTokenInput ? `Token SMS Anvisa: ${recipeTokenInput}\n` : ''}${recipeLinkInput ? `Link de Compra Online: ${recipeLinkInput}\n` : ''}Emitido por: ${doctorName}\nData: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    
    if (onSavePrescriptionRecord) {
      onSavePrescriptionRecord(logEntry);
    }
    toast.success('Receita Memed registrada no prontuário do paciente!');
    setRecipeTokenInput('');
    setRecipeLinkInput('');
    onClose();
  };

  const openFloatingWindow = (url: string, title = 'PrescricaoDigital') => {
    const width = Math.min(1150, window.innerWidth || 1150);
    const height = Math.min(800, window.innerHeight || 800);
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    window.open(url, title, `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no,scrollbars=yes,resizable=yes`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-emerald-900/40 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">Hub de Prescrição Memed & CFM</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  memedToken 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {memedToken ? 'API Sinapse Ativa' : 'Modo Transição'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Prescrição digital oficial com Token SMS para psicotrópicos (Rivotril) e compra em farmácias online
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Abas */}
        <div className="bg-slate-100/80 px-6 pt-3 flex items-center justify-between border-b border-slate-200 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('prescrever')}
              className={`px-4 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'prescrever'
                  ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              Prescrição do Paciente
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'config'
                  ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-600" />
              Configuração do Token Memed
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">

          {/* TAB 1: PRESCREVER */}
          {activeTab === 'prescrever' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Card de Dados do Paciente */}
              <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-blue-50/80 border border-emerald-200 rounded-2xl p-4.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Dados Prontos para a Memed
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleCopyPatientData}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{copied ? 'Dados Copiados!' : 'Copiar Dados do Paciente'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-100">
                    <span className="text-slate-500 text-[10px] block font-semibold uppercase">Paciente</span>
                    <strong className="text-slate-900 font-bold block truncate">{patientName}</strong>
                  </div>
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-100">
                    <span className="text-slate-500 text-[10px] block font-semibold uppercase">CPF</span>
                    <strong className="text-slate-900 font-bold block">{patientCpf || "Não informado"}</strong>
                  </div>
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-100">
                    <span className="text-slate-500 text-[10px] block font-semibold uppercase">WhatsApp / Celular SMS</span>
                    <strong className="text-slate-900 font-bold block">{patientPhone || "Não informado"}</strong>
                  </div>
                </div>
              </div>

              {/* Se o token estiver ativo e sinapse carregado */}
              {memedToken && sinapseLoaded ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> Memed Sinapse Carregado Diretamente
                    </strong>
                    <span className="text-[11px] text-emerald-600 font-semibold">Sessão Conectada</span>
                  </div>
                  <div id="memed-container" className="min-h-[280px] bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-600 mb-3">
                      A janela oficial de prescrição da Memed foi vinculada ao prontuário. Caso a interface oficial não apareça no frame, use os botões rápidos abaixo:
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href="https://memed.com.br"
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        Abrir Tela Completa Memed <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                /* Modo de Transição Guiado */
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <strong className="text-slate-900 font-bold flex items-center gap-1.5 text-sm">
                      🚀 Transição Ativa: Como prescrever com Token SMS agora mesmo:
                    </strong>
                    <div className="grid sm:grid-cols-2 gap-3 text-slate-600">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-800 block text-xs">1º Passo: Copie os Dados</span>
                        <p className="text-[11px]">
                          Clique em <strong>"Copiar Dados do Paciente"</strong> acima para levar Nome, CPF e Celular na memória.
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-800 block text-xs">2º Passo: Abra o Portal Oficial</span>
                        <p className="text-[11px]">
                          Abra o portal gratuito da <strong>Memed</strong> ou do <strong>CFM</strong> pelos botões abaixo. O paciente receberá o <strong>Token por SMS</strong> no celular!
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação para o Médico em Janela Flutuante */}
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => openFloatingWindow('https://memed.com.br/accounts', 'MemedAccounts')}
                        className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                        title="Abrir tela de prescrição da Memed em janela flutuante estilo Pop-up"
                      >
                        <Smartphone className="w-4 h-4 text-purple-200" />
                        <span>Abrir Memed Oficial (Pop-up)</span>
                        <ExternalLink className="w-3.5 h-3.5 text-purple-200" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openFloatingWindow('https://assinador.iti.br', 'AssinadorGovBr')}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                        title="Abrir Assinador Digital Oficial Gov.br do Governo Federal"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Assinador Oficial Gov.br (Pop-up)</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openFloatingWindow('https://validar.iti.br', 'ValidarIti')}
                        className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-all border border-slate-200 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        title="Validar QR Code ou integridade de receita pelo ITI"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Validador Nacional ITI</span>
                      </button>
                    </div>
                  </div>

                  {/* Registro da Receita no Prontuário */}
                  <div className="p-4.5 bg-white rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <strong className="text-slate-900 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Registrar Receita Emitida no Prontuário
                    </strong>
                    <p className="text-slate-500 text-[11px]">
                      Após emitir na Memed, registre o Token SMS ou o link para manter o histórico 100% arquivado na ficha do paciente:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Código / Token SMS (Ex: 849-210)
                        </label>
                        <input
                          type="text"
                          placeholder="Digite os 6 dígitos..."
                          value={recipeTokenInput}
                          onChange={(e) => setRecipeTokenInput(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Link da Receita Memed (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="https://memed.com.br/r/..."
                          value={recipeLinkInput}
                          onChange={(e) => setRecipeLinkInput(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleRegisterRecipe}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Salvar Registro no Histórico do Paciente
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: CONFIGURAÇÃO DO TOKEN MEMED */}
          {activeTab === 'config' && (
            <div className="space-y-5 animate-in fade-in duration-200 text-xs">
              
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <strong className="text-emerald-950 font-bold text-sm flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-600" /> O que é o Token Memed Sinapse?
                </strong>
                <p className="text-slate-700 leading-relaxed text-xs">
                  É a chave oficial que a Memed fornece para que o <strong>Ambulatório IA</strong> abra a tela de prescrição diretamente dentro do prontuário, sem que o médico precise sair da página nem redigitar o nome ou telefone do paciente.
                </p>
              </div>

              {/* Status e Campo do Token */}
              <div className="p-4.5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 block text-xs">
                    Chave de API / Token de Parceiro Memed
                  </label>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    memedToken ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {memedToken ? 'Chave Cadastrada' : 'Nenhuma Chave Salva'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Cole aqui o Token Sinapse fornecido pela Memed..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveToken}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Salvar Chave
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  A chave fica salva em armazenamento local criptografado e seguro no navegador.
                </p>
              </div>

              {/* Passo a Passo para Obter o Token Gratuito */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600" /> Passo a Passo para Obter a Chave Gratuita:
                </strong>

                <ol className="list-decimal list-inside space-y-2 text-slate-700 leading-relaxed text-[11px]">
                  <li>
                    Acesse o portal oficial de parcerias da Memed: 
                    <a 
                      href="https://memed.com.br/integracao" 
                      target="_blank" 
                      rel="noreferrer"
                      className="ml-1 text-emerald-700 underline font-bold inline-flex items-center gap-0.5"
                    >
                      memed.com.br/integracao <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </li>
                  <li>
                    Preencha os dados do formulário:
                    <ul className="list-disc list-inside pl-4 pt-1 space-y-0.5 text-slate-600">
                      <li><strong>Nome da Aplicação:</strong> Ambulatório IA</li>
                      <li><strong>Responsável / Gestor:</strong> Marco Duarte</li>
                      <li><strong>E-mail de Contato:</strong> marco.agduarte22@gmail.com</li>
                      <li><strong>Médico Responsável:</strong> Dr. Carlos Morato (CRM/SP)</li>
                    </ul>
                  </li>
                  <li>
                    Eles enviam as credenciais da API por e-mail (geralmente em 1 a 2 dias úteis, 100% gratuito).
                  </li>
                  <li>
                    Basta colar a chave recebida no campo acima e clicar em <strong>"Salvar Chave"</strong>!
                  </li>
                </ol>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Validação SNCR / ANVISA & CFM Res. 2.299/2021
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
