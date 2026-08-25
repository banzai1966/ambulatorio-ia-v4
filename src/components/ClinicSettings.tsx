import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Save, Building2, MapPin, Phone, Mail, Globe, Loader2, QrCode, MessageSquare, CheckCircle2, Key, Link2, Server, HelpCircle, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles, Brain, Stethoscope, Shield } from 'lucide-react';
import WhatsAppQRModal from './WhatsAppQRModal';
import { 
  CLINIC_PROFILES_CONFIG, 
  ClinicProfileConfig, 
  getActiveClinicConfig, 
  saveActiveClinicConfig, 
  resolveDoctorKey 
} from '../constants/clinicProfiles';

export type ClinicInfo = ClinicProfileConfig;
export const defaultClinicInfo = CLINIC_PROFILES_CONFIG.dra_lucy;

interface ClinicSettingsProps {
  onClose: () => void;
  currentUser?: any;
  defaultDoctorKey?: string;
}

export default function ClinicSettings({ onClose, currentUser, defaultDoctorKey }: ClinicSettingsProps) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'clinic'>('whatsapp');
  
  // Marco Duarte é o Administrador Mestre exclusivo
  const isMasterAdmin = useMemo(() => {
    const email = (currentUser?.email || '').toLowerCase().trim();
    const id = currentUser?.id || '';
    return email === 'marco.agduarte22@gmail.com' || id === 'master-admin-marco';
  }, [currentUser]);

  // Perfil selecionado (Dra. Lucy, Dr. Carlos ou Marco Duarte)
  const initialDoctorKey = useMemo(() => {
    if (defaultDoctorKey && CLINIC_PROFILES_CONFIG[defaultDoctorKey]) {
      return defaultDoctorKey;
    }
    return resolveDoctorKey(currentUser);
  }, [currentUser, defaultDoctorKey]);

  const [selectedDoctorKey, setSelectedDoctorKey] = useState<string>(initialDoctorKey);
  const [info, setInfo] = useState<ClinicProfileConfig>(() => getActiveClinicConfig(currentUser, initialDoctorKey));
  const [loading, setLoading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [testingConnection, setTestingConnection] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Recarrega configuração sempre que o perfil selecionado mudar
  useEffect(() => {
    const loaded = getActiveClinicConfig(currentUser, selectedDoctorKey);
    setInfo(loaded);
    checkStatus(loaded);
  }, [selectedDoctorKey, currentUser]);

  const checkStatus = (currentInfo?: ClinicProfileConfig) => {
    const activeInfo = currentInfo || info;
    const url = activeInfo.evolution_url || defaultClinicInfo.evolution_url;
    const instance = activeInfo.evolution_instance || defaultClinicInfo.evolution_instance;
    const apikey = activeInfo.evolution_apikey || defaultClinicInfo.evolution_apikey;

    fetch(`/api/whatsapp/status?evolution_url=${encodeURIComponent(url || '')}&evolution_instance=${encodeURIComponent(instance || '')}&evolution_apikey=${encodeURIComponent(apikey || '')}`)
      .then(res => res.json())
      .then(data => {
        setWhatsappStatus(data.connected ? 'connected' : 'disconnected');
      })
      .catch(() => setWhatsappStatus('disconnected'));
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const url = (info.evolution_url || '').trim();
      const instance = (info.evolution_instance || '').trim();
      const apikey = (info.evolution_apikey || '').trim();

      const res = await fetch(`/api/whatsapp/status?evolution_url=${encodeURIComponent(url)}&evolution_instance=${encodeURIComponent(instance)}&evolution_apikey=${encodeURIComponent(apikey)}`);
      const data = await res.json();
      
      if (data.connected) {
        setWhatsappStatus('connected');
        toast.success(`Instância "${instance}" (${info.professional_name}) conectada com sucesso no WhatsApp!`);
      } else {
        setWhatsappStatus('disconnected');
        toast.error(`Instância "${instance}" está desconectada ou aguardando QR Code.`);
      }
    } catch (err: any) {
      toast.error("Erro ao testar conexão: " + err.message);
      setWhatsappStatus('disconnected');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    setLoading(true);
    try {
      const baseDefault = CLINIC_PROFILES_CONFIG[selectedDoctorKey] || defaultClinicInfo;
      const cleanInfo: ClinicProfileConfig = {
        ...info,
        evolution_url: (info.evolution_url || baseDefault.evolution_url).trim(),
        evolution_instance: (info.evolution_instance || baseDefault.evolution_instance).trim(),
        evolution_apikey: (info.evolution_apikey || baseDefault.evolution_apikey).trim(),
      };
      
      saveActiveClinicConfig(cleanInfo, currentUser, selectedDoctorKey);
      setInfo(cleanInfo);
      toast.success(`Configurações de ${cleanInfo.professional_name} (Instância: ${cleanInfo.evolution_instance}) salvas com sucesso!`);
      checkStatus(cleanInfo);
      setTimeout(onClose, 600);
    } catch (err) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  const activeProfileBadge = CLINIC_PROFILES_CONFIG[selectedDoctorKey] || CLINIC_PROFILES_CONFIG.dra_lucy;

  return (
    <div className="space-y-5">
      {/* SELETOR DE PROFISSIONAL (Exclusivo Administrador Mestre Marco Duarte) OU BADGE FIXO DO MÉDICO */}
      {isMasterAdmin ? (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={13} className="text-blue-600" />
              Gerenciando Configuração de:
            </span>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              Modo Administrador Mestre
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedDoctorKey('dra_lucy')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                selectedDoctorKey === 'dra_lucy'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">Dra. Lucy Morata</p>
                <p className="text-[10px] text-emerald-700 font-mono font-medium">Instância: luci</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDoctorKey('dr_carlos')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                selectedDoctorKey === 'dr_carlos'
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 text-blue-950'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                <Brain size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">Dr. Carlos Morato</p>
                <p className="text-[10px] text-blue-700 font-mono font-medium">Instância: drcarlos</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDoctorKey('marco_admin')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                selectedDoctorKey === 'marco_admin'
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                <Building2 size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">Marco Duarte (Geral)</p>
                <p className="text-[10px] text-indigo-700 font-mono font-medium">Instância: ambulatorio</p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        /* CARD INFORMATIVO ELEGANTE PARA O PROFISSIONAL INDIVIDUAL */
        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
          selectedDoctorKey === 'dra_lucy' 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
            : 'bg-blue-50/80 border-blue-200 text-blue-950'
        }`}>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs text-white shrink-0 ${
            selectedDoctorKey === 'dra_lucy' 
              ? 'bg-emerald-600' 
              : 'bg-blue-600'
          }`}>
            {selectedDoctorKey === 'dra_lucy' ? <Sparkles size={22} /> : <Stethoscope size={22} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold truncate">{activeProfileBadge.professional_name}</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                selectedDoctorKey === 'dra_lucy'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-blue-100 border-blue-300 text-blue-800'
              }`}>
                {activeProfileBadge.council_badge}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{activeProfileBadge.specialty_label}</p>
          </div>
        </div>
      )}

      {/* Abas de Navegação */}
      <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'whatsapp'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <MessageSquare size={16} className={activeTab === 'whatsapp' ? 'text-blue-600' : 'text-slate-400'} />
          <span>WhatsApp & Conexão API</span>
          {whatsappStatus === 'connected' ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Instância conectada"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Instância desconectada"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinic')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'clinic'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Building2 size={16} className={activeTab === 'clinic' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Receituário & Dados do Consultório</span>
        </button>
      </div>

      {/* ABA 1: WHATSAPP & EVOLUTION API */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-sm">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Status do WhatsApp
                    {whatsappStatus === 'connected' ? (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-300">
                        <CheckCircle2 size={12} className="text-emerald-600" /> Conectado
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold border border-amber-300">
                        Desconectado / Aguardando QR
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instância ativa: <strong className="font-mono text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded-md">{info.evolution_instance || 'luci'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <QrCode size={16} />
                  Conectar / Ver QR Code
                </button>
              </div>
            </div>

            {/* Configuração da Instância */}
            <div className="border-t border-blue-200/60 pt-4 space-y-3">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <HelpCircle size={13} className="text-blue-600" /> Integração Evolution API ({info.professional_name}):
                </p>
                <p className="text-blue-800">
                  Instância configurada para envio e recebimento de mensagens no WhatsApp deste consultório (ex: <code className="font-mono font-bold bg-blue-100 px-1 py-0.5 rounded">luci</code>, <code className="font-mono font-bold bg-blue-100 px-1 py-0.5 rounded">drcarlos</code> ou <code className="font-mono font-bold bg-blue-100 px-1 py-0.5 rounded">ambulatorio</code>).
                </p>
              </div>

              <div className="grid gap-3 bg-white/95 p-4 rounded-2xl border border-blue-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Link2 size={13} className="text-slate-400" />
                    URL do Servidor Evolution
                  </label>
                  <input 
                    type="text"
                    value={info.evolution_url || ''}
                    onChange={(e) => setInfo({ ...info, evolution_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-mono"
                    placeholder="https://api.makprojetosmake.com.br"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Server size={13} className="text-slate-400" />
                      Nome da Instância Ativa
                    </label>
                    <input 
                      type="text"
                      value={info.evolution_instance || ''}
                      onChange={(e) => setInfo({ ...info, evolution_instance: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-mono font-bold text-slate-800"
                      placeholder="ex: luci ou drcarlos"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Key size={13} className="text-slate-400" />
                        API Key / Token
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                      >
                        {showApiKey ? (
                          <>
                            <EyeOff size={12} /> Ocultar
                          </>
                        ) : (
                          <>
                            <Eye size={12} /> Visualizar
                          </>
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showApiKey ? "text" : "password"}
                        value={info.evolution_apikey || ''}
                        onChange={(e) => setInfo({ ...info, evolution_apikey: e.target.value.trim() })}
                        className="w-full pr-8 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-mono"
                        placeholder="Chave secreta da API"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                        title={showApiKey ? "Ocultar chave" : "Visualizar chave"}
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 flex-wrap gap-2">
                  <span className="text-[11px] text-slate-500">
                    Clique abaixo para testar a comunicação antes de salvar:
                  </span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {testingConnection ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} className="text-blue-600" />}
                    Testar Conexão desta Instância
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: DADOS DA CLÍNICA & RECEITUÁRIO */}
      {activeTab === 'clinic' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl text-xs text-indigo-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-indigo-950 mb-1">
              <Building2 size={15} className="text-indigo-600" /> Cabeçalho Timbrado de Documentos ({info.professional_name})
            </p>
            Estes dados são impressos no cabeçalho dos <strong>Receituários</strong>, <strong>Atestados</strong>, <strong>Pedidos de Exames</strong> e <strong>PDFs de Encaminhamento</strong> emitidos por este profissional.
          </div>

          <div className="grid gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Building2 size={15} className="text-slate-400" />
                Nome do Consultório / Clínica
              </label>
              <input 
                type="text"
                value={info.name}
                onChange={(e) => setInfo({...info, name: e.target.value})}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium"
                placeholder="Ex: Consultório Dra. Lucy Morata"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Globe size={15} className="text-slate-400" />
                Slogan ou Especialidades de Atendimento
              </label>
              <input 
                type="text"
                value={info.slogan}
                onChange={(e) => setInfo({...info, slogan: e.target.value})}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium"
                placeholder="Ex: Odontologia Biológica, Cirurgia Zircônia & Saúde Integrativa"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <MapPin size={15} className="text-slate-400" />
                Endereço Completo do Consultório / Clínica
              </label>
              <input 
                type="text"
                value={info.address}
                onChange={(e) => setInfo({...info, address: e.target.value})}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium"
                placeholder="Ex: Av. Paulista, 1000 - Conjunto 1402 - Bela Vista - São Paulo/SP"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Phone size={15} className="text-slate-400" />
                  Telefone / WhatsApp de Contato
                </label>
                <input 
                  type="text"
                  value={info.phone}
                  onChange={(e) => setInfo({...info, phone: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium"
                  placeholder="(11) 98765-4321"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Mail size={15} className="text-slate-400" />
                  E-mail Oficial
                </label>
                <input 
                  type="email"
                  value={info.email}
                  onChange={(e) => setInfo({...info, email: e.target.value})}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium"
                  placeholder="dra.lucy@ambulatorioia.com"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="pt-2 flex gap-3">
        <button 
          onClick={onClose}
          className="flex-1 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-xs cursor-pointer"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 text-xs cursor-pointer"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar Alterações
        </button>
      </div>
      
      <p className="text-[10px] text-slate-400 text-center italic">
        * As informações clínicas aparecerão nos PDFs gerados e as credenciais do WhatsApp serão utilizadas para conexões e disparos automáticos de {info.professional_name}.
      </p>

      {/* Modal de Conexão WhatsApp por QR Code */}
      <WhatsAppQRModal
        isOpen={isQrModalOpen}
        evolutionConfig={{
          url: info.evolution_url || defaultClinicInfo.evolution_url,
          instance: info.evolution_instance || defaultClinicInfo.evolution_instance,
          apikey: info.evolution_apikey || defaultClinicInfo.evolution_apikey
        }}
        onClose={() => {
          setIsQrModalOpen(false);
          // Re-checar status ao fechar o modal
          checkStatus();
        }}
      />
    </div>
  );
}
