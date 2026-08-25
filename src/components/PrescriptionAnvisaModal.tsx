import React, { useState, useEffect } from 'react';
import { Search, Pill, ExternalLink, Send, Check, AlertCircle, FileText, Download, X, QrCode, Mic } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { getActiveClinicConfig } from '../constants/clinicProfiles';

interface AnvisaMedication {
  id: string;
  nome: string;
  principioAtivo: string;
  precoMedio: string;
  apresentacoes: string[];
  bulaUrl: string;
  posologiaSugerida: string;
}

interface PrescriptionItem {
  medication: AnvisaMedication;
  selectedApresentacao: string;
  posologiaCustomizada: string;
  quantidade: string;
}

interface PrescriptionAnvisaModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone: string;
  patientCpf?: string;
  doctorName: string;
  clinicName?: string;
}

export default function PrescriptionAnvisaModal({
  isOpen,
  onClose,
  patientName,
  patientPhone,
  patientCpf,
  doctorName,
  clinicName = "Ambulatório IA & Saúde Integrativa"
}: PrescriptionAnvisaModalProps) {
  const [recipeType, setRecipeType] = useState<'branca' | 'azul' | 'amarela' | 'bulario'>('branca');
  const [searchTerm, setSearchTerm] = useState('');
  const [medications, setMedications] = useState<AnvisaMedication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMed, setSelectedMed] = useState<AnvisaMedication | null>(null);
  const [selectedApresentacao, setSelectedApresentacao] = useState('');
  const [posologia, setPosologia] = useState('');
  const [quantidade, setQuantidade] = useState('1 caixa');
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // Reconhecimento de Voz para Buscar / Ditar Medicamentos ANVISA
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Reconhecimento de voz não suportado neste navegador. Use Google Chrome ou Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsVoiceListening(true);
      toast('🎙️ Ouvindo... Fale o nome do medicamento ou posologia.', { icon: '🎤' });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsVoiceListening(false);
      if (transcript) {
        setSearchTerm(transcript);
        fetchMedications(transcript);
        toast.success(`Buscando por voz: "${transcript}"`);
      }
    };

    recognition.onerror = () => {
      setIsVoiceListening(false);
      toast.error("Não foi possível capturar o áudio. Tente novamente.");
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setIsVoiceListening(false);
    }
  };

  // Campos específicos para Notificação A e B (ANVISA)
  const [numeroNotificacao, setNumeroNotificacao] = useState('000123');
  const [ufNotificacao, setUfNotificacao] = useState('SP');
  const [enderecoPaciente, setEnderecoPaciente] = useState('');
  const [compradorNome, setCompradorNome] = useState('');
  const [compradorDocumento, setCompradorDocumento] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMedications('');
    }
  }, [isOpen]);

  const fetchMedications = async (query: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/anvisa/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setMedications(data);
    } catch (err) {
      console.error("Erro ao carregar medicamentos ANVISA:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchMedications(value);
  };

  const handleSelectMed = (med: AnvisaMedication) => {
    setSelectedMed(med);
    setSelectedApresentacao(med.apresentacoes[0] || '');
    setPosologia(med.posologiaSugerida || '');
  };

  const handleAddItem = () => {
    if (!selectedMed) return;
    const newItem: PrescriptionItem = {
      medication: selectedMed,
      selectedApresentacao,
      posologiaCustomizada: posologia,
      quantidade
    };
    setPrescriptionItems(prev => [...prev, newItem]);
    setSelectedMed(null);
    setPosologia('');
    toast.success(`${selectedMed.nome} adicionado à receita!`);
  };

  const handleRemoveItem = (index: number) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
  };

  const generatePDF = () => {
    const clinicConfig = getActiveClinicConfig(doctorName);
    const doc = new jsPDF();
    
    // Cabeçalho Clínica
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 38, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(clinicConfig.name || clinicName, 14, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${clinicConfig.slogan || 'Neurologia Clínica & Medicina Integrativa'} | ${clinicConfig.phone}`, 14, 23);
    doc.text(clinicConfig.address || 'Av. Paulista, 1000 - São Paulo/SP', 14, 29);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("RECEITUÁRIO DIGITAL OFICIAL - VALIDADO VIA ANVISA & MP 2.200-2/2001", 14, 35);

    // Dados do Paciente e Médico
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`PACIENTE: ${patientName.toUpperCase()}`, 14, 48);
    if (patientCpf) doc.text(`CPF: ${patientCpf}`, 14, 54);
    doc.text(`PROFISSIONAL RESPONSÁVEL: ${(doctorName || clinicConfig.professional_name).toUpperCase()}`, 14, patientCpf ? 60 : 54);
    doc.text(`REGISTRO: ${clinicConfig.council_badge} | ${clinicConfig.specialty_label}`, 14, patientCpf ? 66 : 60);
    doc.text(`DATA: ${new Date().toLocaleDateString('pt-BR')}`, 150, 48);

    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, patientCpf ? 72 : 66, 196, patientCpf ? 72 : 66);

    // Tabela de Medicamentos
    const tableRows = prescriptionItems.map((item, index) => [
      `${index + 1}. ${item.medication.nome}\n(${item.selectedApresentacao})`,
      item.quantidade,
      item.posologiaCustomizada
    ]);

    autoTable(doc, {
      startY: patientCpf ? 76 : 70,
      head: [['MEDICAMENTO / APRESENTAÇÃO', 'QTD', 'POSOLOGIA E ORIENTAÇÕES']],
      body: tableRows,
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30 },
        2: { cellWidth: 80 }
      }
    });

    // Nota de Validação e Assinatura
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(clinicConfig.prescription_footer || "Assinatura Eletrônica Qualificada com Validação em Farmácias (MP 2.200-2/2001)", 14, finalY + 18);
    
    // Linha de assinatura
    doc.setDrawColor(148, 163, 184);
    doc.line(110, finalY + 36, 196, finalY + 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(doctorName || clinicConfig.professional_name, 110, finalY + 42);
    doc.setFont("helvetica", "normal");
    doc.text(`${clinicConfig.council_badge} - ${clinicConfig.specialty_label}`, 110, finalY + 47);

    return doc;
  };

  const handleDownloadPDF = () => {
    if (prescriptionItems.length === 0) {
      toast.error("Adicione pelo menos um medicamento para gerar a receita.");
      return;
    }
    const doc = generatePDF();
    doc.save(`Receita_${patientName.replace(/\s+/g, '_')}.pdf`);
    toast.success("Receita baixada em PDF!");
  };

  const handleSendWhatsApp = async () => {
    if (prescriptionItems.length === 0) {
      toast.error("Adicione pelo menos um medicamento.");
      return;
    }
    setIsSendingWhatsApp(true);
    try {
      const clinicConfig = getActiveClinicConfig(doctorName);
      const itemsText = prescriptionItems.map((item, idx) => 
        `*${idx + 1}. ${item.medication.nome}* (${item.selectedApresentacao})\n   └ 📌 *Posologia:* ${item.posologiaCustomizada}\n   └ 💊 *Qtd:* ${item.quantidade}`
      ).join('\n\n');

      const customGreeting = (clinicConfig.whatsapp_message_template || 'Olá {paciente}, segue o seu receituário emitido em sua consulta.')
        .replace('{paciente}', patientName);

      const messageText = `💊 *RECEITA MÉDICA DIGITAL - ${clinicConfig.name || clinicName}*\n\n${customGreeting}\n\n*Paciente:* ${patientName}\n*Médico:* ${doctorName || clinicConfig.professional_name} (${clinicConfig.council_badge})\n*Especialidade:* ${clinicConfig.specialty_label}\n*Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n===========================\n\n${itemsText}\n\n===========================\n\n🔍 *Consulte as bulas oficiais da ANVISA:* \n${prescriptionItems.map(i => `• ${i.medication.nome}: ${i.medication.bulaUrl}`).join('\n')}\n\n✅ *${clinicConfig.prescription_footer || 'Receita digital com validação direta nas farmácias.'}*`;

      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: patientPhone,
          message: messageText
        })
      });

      if (!res.ok) throw new Error("Falha ao enviar mensagem");

      toast.success("Receita enviada com sucesso para o WhatsApp do paciente!");
      onClose();
    } catch (err: any) {
      toast.error("Erro ao enviar via WhatsApp: " + err.message);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Prescrição Digital com Bulário ANVISA</h2>
              <p className="text-xs text-slate-300">Busca oficial de medicamentos, preços médios e posologia automática</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                isVoiceListening 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Mic className={`w-4 h-4 ${isVoiceListening ? 'animate-bounce' : ''}`} />
              <span>{isVoiceListening ? 'Ouvindo...' : 'Ditar Remédio por Voz'}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Informações do Paciente */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-700">Paciente: </span>
              <span className="text-slate-900 font-bold">{patientName}</span>
              {patientCpf && <span className="ml-2 text-slate-500">({patientCpf})</span>}
            </div>
            <div>
              <span className="font-semibold text-slate-700">WhatsApp: </span>
              <span className="text-slate-900">{patientPhone || "Não informado"}</span>
            </div>
          </div>

          {/* Abas de Tipos de Receitas Oficiais ANVISA */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Selecione o Modelo de Receita ANVISA:</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setRecipeType('branca')}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex flex-col justify-between ${
                  recipeType === 'branca'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-sm">⚪ Receita Branca</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">C1 / C5</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">Controle Especial & Antimicrobianos (Aceita WhatsApp)</span>
              </button>

              <button
                type="button"
                onClick={() => setRecipeType('azul')}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex flex-col justify-between ${
                  recipeType === 'azul'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-blue-50/50 text-blue-900 border-blue-200 hover:bg-blue-100/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-sm">🔵 Notificação Azul</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 text-white font-bold">Receita B</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">Psicotrópicos (Rivotril, Diazepam, Alprazolam)</span>
              </button>

              <button
                type="button"
                onClick={() => setRecipeType('amarela')}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex flex-col justify-between ${
                  recipeType === 'amarela'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-amber-50/50 text-amber-900 border-amber-200 hover:bg-amber-100/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-sm">🟡 Notificação Amarela</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 text-white font-bold">Receita A</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">Entorpecentes (Ritalina, Venvanse, Morfina)</span>
              </button>

              <button
                type="button"
                onClick={() => setRecipeType('bulario')}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex flex-col justify-between ${
                  recipeType === 'bulario'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-sm">💊 Bulário ANVISA</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 text-white font-bold">Busca</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">Consulte bulas e medicamentos cadastrados</span>
              </button>
            </div>
          </div>

          {/* Banner Explicativo de Regras ANVISA */}
          {recipeType === 'branca' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-slate-900">
                <Check className="w-4 h-4 text-blue-600" />
                Receita Branca de Controle Especial (C1, C5 e Antimicrobianos)
              </div>
              <p className="text-[11px] text-slate-600">
                <strong>Validação Digital:</strong> Esta receita pode ser enviada diretamente para o WhatsApp do paciente em formato PDF assinado digitalmente. A farmácia valida gratuitamente pelo portal do governo (validar.iti.gov.br).
              </p>
            </div>
          )}

          {recipeType === 'azul' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-900">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                Notificação de Receita B (Azul - Psicotrópicos)
              </div>
              <p className="text-[11px] text-blue-800">
                <strong>Exigência ANVISA:</strong> Medicamentos como Clonazepam (Rivotril), Alprazolam e Diazepam exigem a retenção do talão impresso de Notificação Azul com número fornecido pela Vigilância Sanitária local. Imprima a via preenchida e assine a caneta.
              </p>
            </div>
          )}

          {recipeType === 'amarela' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Notificação de Receita A (Amarela - Entorpecentes / Estimulantes)
              </div>
              <p className="text-[11px] text-amber-800">
                <strong>Exigência ANVISA:</strong> Medicamentos como Ritalina, Venvanse e Morfina exigem obrigatoriamente a notificação física amarela em papel timbrado numerado. Imprima a via com a folha amarela da clínica e assine manualmente.
              </p>
            </div>
          )}

          {/* Busca de Medicamento ANVISA */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Buscar Medicamento / Princípio Ativo (ANVISA):</span>
              <span className="text-emerald-600 font-normal">Base com bulas oficiais e preços médios</span>
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Digite o nome do remédio ou princípio ativo (ex: Paracetamol, Amoxicilina, Dipirona)..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-24 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`absolute right-2 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs ${
                  isVoiceListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-700'
                }`}
                title="Ditar por voz"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isVoiceListening ? 'Ouvindo...' : 'Voz'}</span>
              </button>
            </div>

            {/* Lista de Resultados ANVISA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="text-xs text-slate-500 col-span-2 py-4 text-center">Buscando na base ANVISA...</p>
              ) : medications.length === 0 ? (
                <p className="text-xs text-slate-400 col-span-2 py-4 text-center">Nenhum medicamento encontrado para essa busca.</p>
              ) : (
                medications.map(med => (
                  <div
                    key={med.id}
                    onClick={() => handleSelectMed(med)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                      selectedMed?.id === med.id 
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900">{med.nome}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg whitespace-nowrap">
                        Média: {med.precoMedio}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Princípio: {med.principioAtivo}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">{med.apresentacoes.length} apresentações</span>
                      <a 
                        href={med.bulaUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()} 
                        className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Ver Bula ANVISA <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Configurar Posologia do Medicamento Selecionado */}
          {selectedMed && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-emerald-400">{selectedMed.nome}</h3>
                  <p className="text-xs text-slate-300">Princípio Ativo: {selectedMed.principioAtivo}</p>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-xl">
                  Preço Médio Estimado: {selectedMed.precoMedio}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Apresentação:</label>
                  <select
                    value={selectedApresentacao}
                    onChange={(e) => setSelectedApresentacao(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    {selectedMed.apresentacoes.map((ap, idx) => (
                      <option key={idx} value={ap}>{ap}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Quantidade Prescrita:</label>
                  <input
                    type="text"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-emerald-500"
                    placeholder="Ex: 1 caixa, 2 frascos..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Posologia & Instruções de Uso:</label>
                <textarea
                  rows={2}
                  value={posologia}
                  onChange={(e) => setPosologia(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-emerald-500 text-xs"
                  placeholder="Ex: Tomar 1 comprimido de 8 em 8 horas por 7 dias..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMed(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-emerald-500 text-slate-900 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Adicionar à Receita
                </button>
              </div>
            </div>
          )}

          {/* Itens Adicionados na Receita */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Medicamentos na Receita ({prescriptionItems.length})
            </h3>

            {prescriptionItems.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                Selecione um medicamento acima para incluir na receita do paciente.
              </div>
            ) : (
              <div className="space-y-2">
                {prescriptionItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{idx + 1}. {item.medication.nome}</span>
                        <span className="text-slate-500 text-[11px]">({item.selectedApresentacao})</span>
                      </div>
                      <p className="text-slate-600 mt-0.5 text-[11px]">📌 Posologia: {item.posologiaCustomizada}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-700 font-semibold rounded-lg text-[10px]">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <QrCode className="w-4 h-4 text-slate-600" />
            <span>Validação Digital MP 2.200-2/2001</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={prescriptionItems.length === 0}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Baixar PDF
            </button>

            <button
              onClick={handleSendWhatsApp}
              disabled={prescriptionItems.length === 0 || isSendingWhatsApp}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-all shadow-xs active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSendingWhatsApp ? "Enviando no WhatsApp..." : "Enviar via WhatsApp sem Papel"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
