import React, { useState } from 'react';
import { Star, MessageSquare, Send, ThumbsUp, HeartHandshake, CheckCircle2, ExternalLink, X, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NPSAndGoogleReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone: string;
  doctorName?: string;
  onPromoterStatusChanged?: (isPromoter: boolean) => void;
}

export default function NPSAndGoogleReviewModal({
  isOpen,
  onClose,
  patientName,
  patientPhone,
  doctorName = "Dr. Carlos Morato",
  onPromoterStatusChanged
}: NPSAndGoogleReviewModalProps) {
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [surveySent, setSurveySent] = useState(false);
  const [googleReviewUrl, setGoogleReviewUrl] = useState("https://search.google.com/local/writereview?placeid=ChIJN1t_t_UzxAAR1111111111");

  if (!isOpen) return null;

  const handleSendSurveyToWhatsApp = async () => {
    setIsSending(true);
    try {
      const res = await fetch('/api/whatsapp/send-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: patientPhone,
          patientName,
          doctorName
        })
      });

      if (!res.ok) throw new Error("Erro ao enviar pesquisa via WhatsApp");

      setSurveySent(true);
      toast.success("Pesquisa de satisfação NPS disparada para o WhatsApp do paciente!");
    } catch (err: any) {
      toast.error("Falha ao enviar pesquisa: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateResponse = async (ratingVal: number) => {
    setIsSending(true);
    try {
      const ratingLabel = ratingVal >= 4 ? "Excelente" : (ratingVal === 3 ? "Regular" : "Ruim");
      const res = await fetch('/api/whatsapp/process-survey-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: patientPhone,
          rating: String(ratingVal),
          feedbackText: feedback
        })
      });

      const data = await res.json();
      if (data.googleReviewUrl) {
        setGoogleReviewUrl(data.googleReviewUrl);
      }

      if (data.isPromoter) {
        toast.success("Paciente Promotor! Link do Google Business Profile enviado.");
        if (onPromoterStatusChanged) onPromoterStatusChanged(true);
      } else {
        toast.custom("Feedback interno registrado para melhoria contínua.", { icon: 'ℹ️' });
        if (onPromoterStatusChanged) onPromoterStatusChanged(false);
      }

      onClose();
    } catch (err: any) {
      toast.error("Erro ao simular resposta: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 text-amber-200 rounded-2xl border border-amber-300/30">
              <Star className="w-6 h-6 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Pesquisa NPS & Booster Google Reviews</h2>
              <p className="text-xs text-amber-100">Captura depoimentos 5★ e redireciona promotores ao Google Meu Negócio</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-amber-200 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-500">Paciente: </span>
              <strong className="text-slate-900">{patientName}</strong>
            </div>
            <div>
              <span className="font-semibold text-slate-500">WhatsApp: </span>
              <strong className="text-emerald-700">{patientPhone}</strong>
            </div>
          </div>

          {/* Opção 1: Disparo Direto para o WhatsApp do Paciente */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">1. Disparar Pesquisa NPS Automática no WhatsApp</h4>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  Envia a pergunta com os botões de nota de 1 a 5. Se o paciente responder 4 ou 5 estrelas, ele recebe instantaneamente o link direto para avaliar sua clínica no Google.
                </p>
              </div>
            </div>

            <button
              onClick={handleSendSurveyToWhatsApp}
              disabled={isSending}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSending ? "Enviando..." : "Disparar Pesquisa para o WhatsApp do Paciente"}
            </button>
          </div>

          {/* Opção 2: Testar / Registrar Avaliação Manual no Sistema */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              2. Simular / Registrar Nota do Atendimento
            </h4>

            {/* Estrelas */}
            <div className="flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  className="p-2 hover:scale-110 transition-transform"
                >
                  <Star 
                    className={`w-7 h-7 ${
                      star <= selectedRating 
                        ? 'text-amber-500 fill-amber-400 drop-shadow-xs' 
                        : 'text-slate-300'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <p className="text-center text-xs font-bold text-slate-700">
              {selectedRating >= 4 ? (
                <span className="text-emerald-700 flex items-center justify-center gap-1">
                  <ThumbsUp className="w-4 h-4" /> Paciente Promotor (Nota {selectedRating}/5) → Ativa Anel Verde no Perfil!
                </span>
              ) : (
                <span className="text-amber-700">
                  Paciente Detractor / Neutro (Nota {selectedRating}/5) → Encaminha para SAC Interno
                </span>
              )}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Comentário ou Feedback do Paciente:</label>
              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                placeholder="Ex: 'Atendimento excelente, Dra. atenciosa e sem fila de espera...'"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleSimulateResponse(selectedRating)}
                disabled={isSending}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                Registrar Nota & Executar Ação Google
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
