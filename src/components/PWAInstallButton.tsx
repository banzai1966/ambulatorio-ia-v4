import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import toast from 'react-hot-toast';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'topbar' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'sidebar', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // Se já estiver rodando instalado em modo standalone (app nativo), não precisa exibir
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        toast.success("Ambulatório IA instalado com sucesso no seu dispositivo!");
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Se o navegador for desktop e não deu prompt direto, exibe instrução rápida
      setShowDesktopGuide(true);
    }
  };

  const buttonContent = (
    <>
      <Download size={13} className="shrink-0 text-blue-600 animate-pulse" />
      <span className="truncate">Instalar Aplicativo (PWA)</span>
    </>
  );

  return (
    <>
      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full py-2 px-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all border border-blue-200/80 shadow-xs cursor-pointer ${className}`}
          title="Instale o Ambulatório IA no seu Computador ou Celular para abrir em tela cheia e usar offline"
        >
          {buttonContent}
        </button>
      )}

      {variant === 'topbar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-blue-200 shadow-xs cursor-pointer ${className}`}
          title="Instalar aplicativo"
        >
          <Download size={14} className="text-blue-600" />
          <span>Instalar App</span>
        </button>
      )}

      {/* Guia para iOS Safari (iPhone / iPad) */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Smartphone size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Instalar no iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p className="flex items-start gap-2">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">1</span>
                <span>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima) na barra inferior do Safari.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">2</span>
                <span>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">3</span>
                <span>Toque em <strong>Adicionar</strong> no canto superior direito.</span>
              </p>
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>O ícone do Ambulatório IA aparecerá como um app nativo na sua tela!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Guia para Desktop Chrome / Edge quando o prompt direto não estiver disponível */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Info size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Instalar no Computador</h3>
              </div>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Você pode instalar o Ambulatório IA diretamente pela barra de endereços do seu navegador (Google Chrome ou Microsoft Edge):
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Download size={14} className="text-blue-600 shrink-0" />
                  Ícone na barra de endereço:
                </p>
                <p className="text-[11px] text-slate-500">
                  Olhe no final da barra de endereço onde fica o link <code className="text-blue-600 bg-white px-1 py-0.5 rounded border border-slate-200">ambulatorio.makprojetosmake.com.br</code>. Clique no ícone de <strong>computador com seta para baixo (Instalar)</strong>.
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                Ou clique nos <strong>três pontinhos (⋮)</strong> no canto do Chrome ➡️ <strong>Salvar e compartilhar</strong> ➡️ <strong>Instalar Ambulatório IA...</strong>
              </p>
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="mt-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
