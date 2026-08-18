import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Save, Building2, MapPin, Phone, Mail, Globe, Loader2, QrCode, MessageSquare, CheckCircle2, Key, Link2, Server, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import WhatsAppQRModal from './WhatsAppQRModal';

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  slogan: string;
  // Configuração Evolution API personalizada para multi-instância / multi-médico
  evolution_url?: string;
  evolution_instance?: string;
  evolution_apikey?: string;
}

export const defaultClinicInfo: ClinicInfo = {
  name: 'Ambulatório IA - Gestão de Saúde',
  address: 'Rua Exemplo, 123 - Centro - Cidade/UF',
  phone: '(00) 0000-0000',
  email: 'contato@ambulatorioia.com',
  website: 'www.ambulatorioia.com',
  slogan: 'Suporte à Decisão Clínica e Neurológica',
  evolution_url: 'https://api.makprojetosmake.com.br',
  evolution_instance: 'ambulatorio',
  evolution_apikey: 'E6247913DB92-48B4-8B54-5C7449EA639B'
};

export default function ClinicSettings({ onClose }: { onClose: () => void }) {
  const [info, setInfo] = useState<ClinicInfo>(defaultClinicInfo);
  const [loading, setLoading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [showAdvancedWhatsapp, setShowAdvancedWhatsapp] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const checkStatus = (currentInfo?: ClinicInfo) => {
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

  useEffect(() => {
    const saved = localStorage.getItem('clinic_info');
    let loadedInfo = defaultClinicInfo;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loadedInfo = {
          ...defaultClinicInfo,
          ...parsed,
          evolution_url: parsed.evolution_url || defaultClinicInfo.evolution_url,
          evolution_instance: parsed.evolution_instance || defaultClinicInfo.evolution_instance,
          evolution_apikey: parsed.evolution_apikey || defaultClinicInfo.evolution_apikey
        };
        setInfo(loadedInfo);
      } catch (e) {
        console.error("Erro ao carregar info da clínica:", e);
      }
    }

    checkStatus(loadedInfo);
  }, []);

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
        toast.success(`Instância "${instance}" conectada com sucesso no WhatsApp!`);
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
      localStorage.setItem('clinic_info', JSON.stringify(info));
      toast.success("Configurações da clínica e WhatsApp salvas com sucesso!");
      window.dispatchEvent(new Event('clinic_info_updated'));
      setTimeout(onClose, 500);
    } catch (err) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CARD DE CONEXÃO WHATSAPP */}
      <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                WhatsApp da Clínica
                {whatsappStatus === 'connected' ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-300">
                    <CheckCircle2 size={12} /> Conectado
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold border border-amber-300">
                    Desconectado
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instância ativa: <strong className="font-mono text-emerald-700">{info.evolution_instance || 'ambulatorio'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
            >
              <QrCode size={16} />
              Conectar / Ver QR Code
            </button>
          </div>
        </div>

        {/* Botão de Toggle para Configuração Avançada da API (URL, Instância e API Key) */}
        <div className="border-t border-emerald-200/70 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvancedWhatsapp(!showAdvancedWhatsapp)}
            className="text-xs text-emerald-800 font-bold flex items-center justify-between w-full hover:text-emerald-950 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Server size={14} className="text-emerald-600" />
              Configurações da Evolution API (URL, Nome da Instância e API Key)
            </span>
            {showAdvancedWhatsapp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvancedWhatsapp && (
            <div className="mt-3.5 space-y-3 bg-white/90 p-4 rounded-2xl border border-emerald-200 animate-in fade-in duration-150">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <HelpCircle size={13} className="text-blue-600" /> Onde encontrar esses dados na Evolution API?
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                  <li><strong>URL da API:</strong> O link do seu servidor Evolution (ex: <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">https://api.makprojetosmake.com.br</code>).</li>
                  <li><strong>Nome da Instância:</strong> O nome que você deu ao criar o card (ex: <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">drcarlos</code> ou <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">ambulatorio</code>).</li>
                  <li><strong>API Key (Global/Instância):</strong> Sua chave secreta de autenticação para autorizar disparos.</li>
                </ul>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Link2 size={13} className="text-slate-400" />
                    URL da Evolution API
                  </label>
                  <input 
                    type="text"
                    value={info.evolution_url || ''}
                    onChange={(e) => setInfo({ ...info, evolution_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-mono"
                    placeholder="https://api.makprojetosmake.com.br"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Server size={13} className="text-slate-400" />
                      Nome da Instância (Instance Name)
                    </label>
                    <input 
                      type="text"
                      value={info.evolution_instance || ''}
                      onChange={(e) => setInfo({ ...info, evolution_instance: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-mono font-bold text-slate-800"
                      placeholder="drcarlos"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Key size={13} className="text-slate-400" />
                      API Key / Token
                    </label>
                    <input 
                      type="password"
                      value={info.evolution_apikey || ''}
                      onChange={(e) => setInfo({ ...info, evolution_apikey: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-mono"
                      placeholder="E6247913DB92-48B4..."
                    />
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {testingConnection ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} className="text-emerald-600" />}
                    Testar Conexão desta Instância
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Building2 size={16} className="text-slate-400" />
            Nome da Clínica/Instituição
          </label>
          <input 
            type="text"
            value={info.name}
            onChange={(e) => setInfo({...info, name: e.target.value})}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-clinical-blue/20 outline-none text-sm"
            placeholder="Ex: Clínica Santa Maria"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Globe size={16} className="text-slate-400" />
            Slogan ou Subtítulo
          </label>
          <input 
            type="text"
            value={info.slogan}
            onChange={(e) => setInfo({...info, slogan: e.target.value})}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-clinical-blue/20 outline-none text-sm"
            placeholder="Ex: Excelência em Atendimento"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" />
            Endereço Completo
          </label>
          <input 
            type="text"
            value={info.address}
            onChange={(e) => setInfo({...info, address: e.target.value})}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-clinical-blue/20 outline-none text-sm"
            placeholder="Rua, Número, Bairro, Cidade - UF"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Phone size={16} className="text-slate-400" />
              Telefone
            </label>
            <input 
              type="text"
              value={info.phone}
              onChange={(e) => setInfo({...info, phone: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-clinical-blue/20 outline-none text-sm"
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Mail size={16} className="text-slate-400" />
              E-mail
            </label>
            <input 
              type="email"
              value={info.email}
              onChange={(e) => setInfo({...info, email: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-clinical-blue/20 outline-none text-sm"
              placeholder="contato@clinica.com"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button 
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-clinical-blue text-white rounded-xl font-bold hover:bg-clinical-blue-hover transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salvar Alterações
        </button>
      </div>
      
      <p className="text-[10px] text-slate-400 text-center italic">
        * As informações clínicas aparecerão nos PDFs gerados e as credenciais do WhatsApp serão utilizadas para conexões e disparos automáticos.
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
