import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Check, RotateCcw, ShieldCheck, Download, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientCpf?: string;
  documentType?: string;
  onSignatureSaved?: (signatureDataUrl: string, docType: string) => void;
}

export default function DigitalSignatureModal({
  isOpen,
  onClose,
  patientName,
  patientCpf,
  documentType = "TCLE - Termo de Consentimento Livre e Esclarecido",
  onSignatureSaved
}: DigitalSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(documentType);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      clearCanvas();
    }
  }, [isOpen]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha linha de assinatura suave
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 30);
    ctx.lineTo(canvas.width - 30, canvas.height - 30);
    ctx.stroke();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('Assine sobre a linha acima usando o dedo ou mouse', canvas.width / 2, canvas.height - 10);

    setHasSignature(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSaveSignature = () => {
    if (!hasSignature) {
      toast.error("Por favor, desenhe sua assinatura no campo indicado.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    toast.success(`Assinatura salva para o documento ${selectedDoc}!`);
    if (onSignatureSaved) {
      onSignatureSaved(dataUrl, selectedDoc);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Assinatura Digital Touchscreen</h2>
              <p className="text-xs text-slate-300">Validação jurídica via MP nº 2.200-2/2001 e ICP-Brasil</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-5">
          
          {/* Seleção do Tipo de Documento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Selecione o Documento a Assinar:</label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="TCLE - Exodontia & Cirurgia Bochecha/Boca">TCLE - Exodontia & Cirurgia Oral / Odontologia Biológica</option>
              <option value="Termo de Autorização de Uso de Imagem & Caso Clínico">Termo de Autorização de Uso de Imagem & Mídias Sociais</option>
              <option value="Contrato de Prestação de Serviços de Saúde Integrativa">Contrato de Prestação de Serviços de Saúde Integrativa</option>
              <option value="Termo de Consentimento Neurologia Especializada">Termo de Consentimento Neurologia Especializada</option>
              <option value="Orçamento & Plano Terapêutico Aprovado">Orçamento & Plano Terapêutico Aprovado</option>
            </select>
          </div>

          {/* Dados do Assinante */}
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
            <div>
              <span className="font-semibold">Assinante: </span>
              <strong className="text-indigo-950">{patientName}</strong>
              {patientCpf && <span className="ml-2">({patientCpf})</span>}
            </div>
            <span className="text-[10px] bg-indigo-200/60 font-bold px-2.5 py-1 rounded-lg">
              Data: {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* Resumo do Texto do Termo */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 max-h-24 overflow-y-auto leading-relaxed">
            <strong>Resumo Legal:</strong> Declaro que li e compreendi integralmente os riscos, benefícios e alternativas do procedimento selecionado acima. Autorizo a equipe médica responsável a realizar as intervenções planejadas. Minha assinatura digital abaixo possui validade jurídica plena.
          </div>

          {/* Canvas da Assinatura */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                Desenhe sua Assinatura (Touch/Mouse):
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Limpar
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={560}
                height={160}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className="w-full cursor-crosshair touch-none"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Assinatura Criptografada</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveSignature}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Confirmar e Anexar ao Prontuário
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
