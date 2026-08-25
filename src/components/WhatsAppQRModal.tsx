import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  LogOut, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  X, 
  Sparkles, 
  MessageSquare, 
  Check, 
  HelpCircle,
  Loader2,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getActiveClinicConfig } from '../constants/clinicProfiles';

interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  evolutionConfig?: {
    url?: string;
    instance?: string;
    apikey?: string;
  };
}

export default function WhatsAppQRModal({ isOpen, onClose, evolutionConfig }: WhatsAppQRModalProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'connecting'>('checking');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [ownerJid, setOwnerJid] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const getEffectiveConfig = () => {
    if (evolutionConfig && (evolutionConfig.instance || evolutionConfig.url)) {
      return evolutionConfig;
    }
    const active = getActiveClinicConfig();
    return {
      url: active.evolution_url,
      instance: active.evolution_instance,
      apikey: active.evolution_apikey
    };
  };

  const getQueryParams = () => {
    const config = getEffectiveConfig();
    const params = new URLSearchParams();
    if (config.url) params.append('evolution_url', config.url);
    if (config.instance) params.append('evolution_instance', config.instance);
    if (config.apikey) params.append('evolution_apikey', config.apikey);
    const str = params.toString();
    return str ? `?${str}` : '';
  };

  const getRequestBody = () => {
    const config = getEffectiveConfig();
    return {
      evolution_url: config.url,
      evolution_instance: config.instance,
      evolution_apikey: config.apikey
    };
  };

  // Verificar status inicial ao abrir
  useEffect(() => {
    if (isOpen) {
      checkConnectionStatus();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isOpen, evolutionConfig?.instance]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      await checkConnectionStatus(true);
    }, 3000);
  };

  const checkConnectionStatus = async (isSilent = false) => {
    if (!isSilent) setIsLoadingQr(true);
    try {
      const res = await fetch(`/api/whatsapp/status${getQueryParams()}`);
      const data = await res.json();
      
      if (data.connected) {
        setStatus('connected');
        setOwnerJid(data.ownerJid || null);
        setQrCodeBase64(null);
        stopPolling();
        if (!isSilent) toast.success(`WhatsApp (${data.instance || evolutionConfig?.instance || 'instância'}) conectado e ativo!`);
      } else {
        if (status === 'connected') {
          setStatus('disconnected');
        } else if (status !== 'connecting') {
          setStatus('disconnected');
        }
      }
    } catch (err) {
      console.error("Erro ao verificar status do WhatsApp:", err);
      setStatus('disconnected');
    } finally {
      if (!isSilent) setIsLoadingQr(false);
    }
  };

  const generateQrCode = async () => {
    setIsLoadingQr(true);
    setStatus('connecting');
    setQrCodeBase64(null);

    try {
      const res = await fetch('/api/whatsapp/connect', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getRequestBody())
      });
      const data = await res.json();

      if (data.connected) {
        setStatus('connected');
        toast.success(`WhatsApp (${data.instance || evolutionConfig?.instance || 'instância'}) já está conectado e pronto!`);
        checkConnectionStatus();
      } else if (data.qrcode) {
        // Garantir prefixo base64 se necessário
        const formattedQr = data.qrcode.startsWith('data:image') 
          ? data.qrcode 
          : `data:image/png;base64,${data.qrcode}`;
        setQrCodeBase64(formattedQr);
        setStatus('connecting');
        toast.success(`QR Code gerado para a instância "${data.instance || evolutionConfig?.instance || 'instância'}"! Aponte a câmera.`);
        startPolling();
      } else {
        toast.error(data.error || "Não foi possível obter o QR Code diretamente.");
        setStatus('disconnected');
      }
    } catch (err: any) {
      toast.error("Erro ao solicitar QR Code: " + err.message);
      setStatus('disconnected');
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleForceReset = async () => {
    setIsLoadingQr(true);
    setQrCodeBase64(null);
    setStatus('connecting');

    try {
      toast("Limpando socket e recriando instância limpa no servidor...", { icon: 'ℹ️' });
      const res = await fetch('/api/whatsapp/force-reset', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getRequestBody())
      });
      const data = await res.json();

      if (data.qrcode) {
        const formattedQr = data.qrcode.startsWith('data:image') 
          ? data.qrcode 
          : `data:image/png;base64,${data.qrcode}`;
        setQrCodeBase64(formattedQr);
        setStatus('connecting');
        toast.success("Instância limpa e novo QR Code gerado!");
        startPolling();
      } else {
        toast.success("Instância resetada com sucesso! Gerando QR Code...");
        generateQrCode();
      }
    } catch (err: any) {
      toast.error("Erro ao resetar: " + err.message);
      setStatus('disconnected');
    } finally {
      setIsLoadingQr(false);
    }
  };

  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setShowConfirmDisconnect(false);
    try {
      toast.loading("Desconectando sessão do WhatsApp...", { id: "disconnect-toast" });
      const res = await fetch('/api/whatsapp/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getRequestBody())
      });
      const data = await res.json();
      if (data.success) {
        toast.success("WhatsApp desconectado com sucesso!", { id: "disconnect-toast" });
        setStatus('disconnected');
        setQrCodeBase64(null);
        setOwnerJid(null);
      } else {
        toast.error("Erro ao desconectar: " + (data.error || "Tente novamente"), { id: "disconnect-toast" });
      }
    } catch (err: any) {
      toast.error("Falha ao desconectar: " + err.message, { id: "disconnect-toast" });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Cabeçalho */}
        <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <MessageSquare className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Conexão WhatsApp da Clínica</h2>
              <p className="text-xs text-blue-100">Pareamento fácil via QR Code do seu celular</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 space-y-6">
          
          {/* Badge de Status Atual */}
          <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50">
            <div className="flex items-center gap-3">
              {status === 'connected' ? (
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Wifi className="w-5 h-5" />
                </div>
              ) : status === 'connecting' ? (
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center animate-pulse">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center">
                  <WifiOff className="w-5 h-5" />
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Status do Serviço</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    status === 'connected' ? 'text-blue-600' :
                    status === 'connecting' ? 'text-amber-600' : 'text-slate-700'
                  }`}>
                    {status === 'connected' && '🟢 Conectado & Operacional'}
                    {status === 'connecting' && '🟡 Aguardando Leitura do QR Code...'}
                    {status === 'disconnected' && '🔴 Desconectado'}
                    {status === 'checking' && 'Verificando conexão...'}
                  </span>
                </div>
                {ownerJid && (
                  <span className="text-[11px] text-slate-500 block font-mono">
                    Número: +{ownerJid.split('@')[0]}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => checkConnectionStatus()}
              disabled={isLoadingQr}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all"
              title="Atualizar Status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingQr ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* ESTADO 1: CONECTADO */}
          {status === 'connected' && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 text-center space-y-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-blue-900">WhatsApp Vinculado com Sucesso!</h3>
                <p className="text-xs text-blue-700 mt-1 max-w-sm mx-auto">
                  Sua clínica já está conectada e pronta para enviar lembretes de agendamento, confirmações e anamneses pré-consulta automaticamente.
                </p>
                <div className="mt-3 p-3 bg-white/80 border border-blue-200 rounded-xl text-left text-xs text-slate-600">
                  <p className="font-bold text-slate-800 mb-1">ℹ️ Por que o QR Code não aparece?</p>
                  <p>O QR Code só é exibido quando a instância está <strong>desconectada</strong>. Como o WhatsApp desta instância já está pareado e ativo, não é necessário ler o QR Code novamente.</p>
                  <p className="mt-1 text-slate-500">Se você deseja conectar <strong>outro número de celular</strong>, clique no botão vermelho abaixo para desconectar a sessão atual.</p>
                </div>
              </div>

              <div className="pt-2">
                {showConfirmDisconnect ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-red-800">
                      Tem certeza que deseja desconectar o WhatsApp da instância "{evolutionConfig?.instance || 'WhatsApp'}"?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                        Confirmar Desconexão
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmDisconnect(false)}
                        disabled={isDisconnecting}
                        className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium rounded-xl text-xs transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDisconnect(true)}
                    disabled={isDisconnecting}
                    className="w-full py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Desconectar Este WhatsApp
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ESTADO 2: AGUARDANDO LEITURA / GERANDO QR CODE */}
          {(status === 'connecting' || qrCodeBase64) && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-white border-2 border-dashed border-blue-300 rounded-3xl shadow-md flex flex-col items-center relative">
                {isLoadingQr ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-2xl">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-600">Gerando QR Code...</span>
                  </div>
                ) : qrCodeBase64 ? (
                  <div className="space-y-2 text-center">
                    <img 
                      src={qrCodeBase64} 
                      alt="QR Code WhatsApp" 
                      className="w-56 h-56 object-contain rounded-2xl border border-slate-100 shadow-sm"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Aguardando leitura pelo aplicativo do seu celular...
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Instruções de Conexão */}
              <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" /> Passo a Passo para Conectar:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Abra o <strong>WhatsApp</strong> no celular do consultório.</li>
                  <li>Toque em <strong>Configurações</strong> (iPhone) ou <strong>Mais opções ⋮</strong> (Android).</li>
                  <li>Selecione <strong>Dispositivos Conectados</strong>.</li>
                  <li>Toque em <strong>Conectar um dispositivo</strong> e aponte a câmera para o QR Code acima.</li>
                </ol>
              </div>

              <div className="flex items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={generateQrCode}
                  disabled={isLoadingQr}
                  className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1.5 py-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQr ? 'animate-spin' : ''}`} /> Atualizar QR Code
                </button>
              </div>
            </div>
          )}

          {/* ESTADO 3: DESCONECTADO (BOTÃO INICIAL) */}
          {status === 'disconnected' && !qrCodeBase64 && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-blue-100">
                <QrCode className="w-9 h-9 text-blue-600" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Conecte o WhatsApp do seu Consultório</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Clique no botão abaixo para gerar o QR Code de pareamento direto na tela.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                <button
                  type="button"
                  onClick={generateQrCode}
                  disabled={isLoadingQr}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {isLoadingQr ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" /> Gerar QR Code para Pareamento
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Garantia de Segurança */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Conexão direta encriptada ponta a ponta via Evolution API oficial.</span>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
