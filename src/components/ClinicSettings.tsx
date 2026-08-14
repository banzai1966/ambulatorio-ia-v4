import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Save, Building2, MapPin, Phone, Mail, Globe, Loader2, QrCode, MessageSquare, CheckCircle2 } from 'lucide-react';
import WhatsAppQRModal from './WhatsAppQRModal';

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  slogan: string;
}

export const defaultClinicInfo: ClinicInfo = {
  name: 'Ambulatório IA - Gestão de Saúde',
  address: 'Rua Exemplo, 123 - Centro - Cidade/UF',
  phone: '(00) 0000-0000',
  email: 'contato@ambulatorioia.com',
  website: 'www.ambulatorioia.com',
  slogan: 'Suporte à Decisão Clínica e Neurológica'
};

export default function ClinicSettings({ onClose }: { onClose: () => void }) {
  const [info, setInfo] = useState<ClinicInfo>(defaultClinicInfo);
  const [loading, setLoading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    const saved = localStorage.getItem('clinic_info');
    if (saved) {
      try {
        setInfo(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar info da clínica:", e);
      }
    }

    // Checar status do WhatsApp
    fetch('/api/whatsapp/status')
      .then(res => res.json())
      .then(data => {
        setWhatsappStatus(data.connected ? 'connected' : 'disconnected');
      })
      .catch(() => setWhatsappStatus('disconnected'));
  }, []);

  const handleSave = () => {
    setLoading(true);
    try {
      localStorage.setItem('clinic_info', JSON.stringify(info));
      toast.success("Configurações da clínica salvas com sucesso!");
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
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              WhatsApp da Clínica
              {whatsappStatus === 'connected' ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-300">
                  <CheckCircle2 size={12} /> Conectado
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold border border-amber-300">
                  Desconectado
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Conecte o celular do consultório escaneando o QR Code abaixo sem precisar enviar seu número.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsQrModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <QrCode size={16} />
          Conectar / Ver QR Code
        </button>
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
        * Estas informações aparecerão no cabeçalho e rodapé dos PDFs gerados (Receituários e Prontuários).
      </p>

      {/* Modal de Conexão WhatsApp por QR Code */}
      <WhatsAppQRModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          // Re-checar status ao fechar o modal
          fetch('/api/whatsapp/status')
            .then(res => res.json())
            .then(data => setWhatsappStatus(data.connected ? 'connected' : 'disconnected'))
            .catch(() => {});
        }}
      />
    </div>
  );
}
