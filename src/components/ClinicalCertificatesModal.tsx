import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileCheck, 
  Copy, 
  MessageSquare, 
  Download, 
  Printer, 
  Clock, 
  UserCheck, 
  Calendar, 
  Sparkles, 
  Stethoscope, 
  Mic, 
  Check, 
  ShieldCheck,
  HeartPulse,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateOfficialCertificatePDF, CertificateData, montarTextoPadrao } from '../lib/certificatePdfGenerator';
import { getActiveClinicConfig } from '../constants/clinicProfiles';

interface ClinicalCertificatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientCpf?: string;
  patientPhone?: string;
  doctorName?: string;
  doctorCouncil?: string;
  doctorSpecialty?: string;
  isDental?: boolean;
  allDoctorProfiles?: any[];
}

export default function ClinicalCertificatesModal({
  isOpen,
  onClose,
  patientName,
  patientCpf,
  patientPhone = '',
  doctorName = 'Dr. Carlos Morato',
  doctorCouncil = 'CRM/SP 145.892',
  doctorSpecialty = 'Neurologia & Medicina Integrativa',
  isDental = false,
  allDoctorProfiles = []
}: ClinicalCertificatesModalProps) {
  // Estado do profissional selecionado (permite alternar se necessário)
  const [selectedDocName, setSelectedDocName] = useState(doctorName);
  const [selectedDocCouncil, setSelectedDocCouncil] = useState(doctorCouncil);
  const [selectedDocSpecialty, setSelectedDocSpecialty] = useState(doctorSpecialty);
  const [selectedIsDental, setSelectedIsDental] = useState(isDental);

  useEffect(() => {
    setSelectedDocName(doctorName);
    setSelectedDocCouncil(doctorCouncil);
    setSelectedDocSpecialty(doctorSpecialty);
    setSelectedIsDental(isDental);
  }, [doctorName, doctorCouncil, doctorSpecialty, isDental, isOpen]);

  // Tipos de Documento
  const [tipo, setTipo] = useState<'repouso' | 'comparecimento' | 'acompanhante' | 'pos_operatorio' | 'laudo_parecer'>('repouso');

  // Parâmetros Rápidos
  const [diasAfastamento, setDiasAfastamento] = useState<number>(2);
  const [cid, setCid] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('09:00');
  const [horarioFim, setHorarioFim] = useState('10:30');
  const [nomeAcompanhante, setNomeAcompanhante] = useState('');
  const [documentoAcompanhante, setDocumentoAcompanhante] = useState('');
  const [procedimentoDescricao, setProcedimentoDescricao] = useState('');

  // Texto Livre Personalizado (inicia com modelo)
  const [textoPersonalizado, setTextoPersonalizado] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reconstrói texto padrão ao trocar parâmetros
  useEffect(() => {
    const certData: CertificateData = {
      tipo,
      pacienteNome: patientName || 'Paciente',
      pacienteCpf: patientCpf || '',
      medicoNome: selectedDocName,
      medicoConselho: selectedDocCouncil,
      medicoEspecialidade: selectedDocSpecialty,
      isDental: selectedIsDental,
      diasAfastamento,
      cid,
      horarioInicio,
      horarioFim,
      nomeAcompanhante,
      documentoAcompanhante,
      procedimentoDescricao
    };
    setTextoPersonalizado(montarTextoPadrao(certData));
  }, [
    tipo, 
    diasAfastamento, 
    cid, 
    horarioInicio, 
    horarioFim, 
    nomeAcompanhante, 
    documentoAcompanhante, 
    procedimentoDescricao,
    patientName,
    patientCpf,
    selectedDocName,
    selectedDocCouncil,
    selectedDocSpecialty,
    selectedIsDental
  ]);

  // Função para ditar por voz
  const handleVoiceInput = () => {
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
      setIsDictating(true);
      toast('🎙️ Ouvindo... Fale para complementar o atestado.', { icon: '🎤' });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsDictating(false);
      if (transcript) {
        setTextoPersonalizado(prev => `${prev}\n${transcript}`);
        toast.success('Texto adicionado ao atestado!');
      }
    };

    recognition.onerror = () => {
      setIsDictating(false);
      toast.error('Não foi possível capturar o áudio.');
    };

    recognition.onend = () => {
      setIsDictating(false);
    };

    try {
      recognition.start();
    } catch {
      setIsDictating(false);
    }
  };

  // Copiar Texto
  const handleCopy = () => {
    if (!textoPersonalizado) return;
    navigator.clipboard.writeText(textoPersonalizado);
    setCopied(true);
    toast.success('Texto do atestado copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Enviar WhatsApp
  const handleSendWhatsApp = () => {
    const rawPhone = (patientPhone || '').replace(/\D/g, '');
    const clinicConfig = getActiveClinicConfig(selectedDocName);
    const msg = encodeURIComponent(
      `Olá ${patientName || ''}, segue seu *${
        selectedIsDental ? 'Atestado / Declaração Odontológica' : 'Atestado Médico Oficial'
      }* emitido por *${selectedDocName}* (${selectedDocCouncil}):\n\n${textoPersonalizado}${
        cid ? `\n\n📌 *CID-10:* ${cid}` : ''
      }\n\n_${clinicConfig.name}_\n${new Date().toLocaleDateString('pt-BR')}`
    );
    window.open(`https://wa.me/55${rawPhone}?text=${msg}`, '_blank');
  };

  // Baixar PDF Oficial
  const handleDownloadPDF = () => {
    try {
      const certData: CertificateData = {
        tipo,
        pacienteNome: patientName || 'Paciente',
        pacienteCpf: patientCpf || '',
        medicoNome: selectedDocName,
        medicoConselho: selectedDocCouncil,
        medicoEspecialidade: selectedDocSpecialty,
        isDental: selectedIsDental,
        diasAfastamento,
        cid,
        horarioInicio,
        horarioFim,
        nomeAcompanhante,
        documentoAcompanhante,
        procedimentoDescricao,
        conteudoLivre: textoPersonalizado
      };

      const doc = generateOfficialCertificatePDF(certData);
      const safeName = (patientName || 'Paciente').replace(/\s+/g, '_');
      doc.save(`Atestado_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF Oficial do Atestado baixado com sucesso!');
    } catch (e: any) {
      console.error('Erro ao gerar PDF do atestado:', e);
      toast.error('Erro ao gerar PDF do atestado.');
    }
  };

  // Imprimir Diretamente
  const handlePrint = () => {
    try {
      const certData: CertificateData = {
        tipo,
        pacienteNome: patientName || 'Paciente',
        pacienteCpf: patientCpf || '',
        medicoNome: selectedDocName,
        medicoConselho: selectedDocCouncil,
        medicoEspecialidade: selectedDocSpecialty,
        isDental: selectedIsDental,
        diasAfastamento,
        cid,
        horarioInicio,
        horarioFim,
        nomeAcompanhante,
        documentoAcompanhante,
        procedimentoDescricao,
        conteudoLivre: textoPersonalizado
      };

      const doc = generateOfficialCertificatePDF(certData);
      doc.autoPrint();
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } catch (e: any) {
      console.error('Erro ao imprimir atestado:', e);
      toast.error('Erro ao abrir impressão do atestado.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Discreto e Minimalista */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                selectedIsDental ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'
              }`}>
                <FileCheck size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    {selectedIsDental ? 'Atestados & Declarações Odontológicas' : 'Atestados & Declarações Médicas'}
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                    {selectedIsDental ? 'CFO / Lei 5.081/66' : 'CFM Res. 1.658/02'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {patientName || 'Paciente'} {patientCpf ? `• CPF ${patientCpf}` : ''}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Corpo do Modal */}
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Identificação do Profissional Emissor */}
            {allDoctorProfiles.length > 1 ? (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-500">Emissor:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {allDoctorProfiles.map(doc => {
                    const isSelected = doc.full_name === selectedDocName || doc.id === selectedDocName;
                    const isDocDental = doc.default_mode === 'biological_dentistry' || doc.id === 'dra_lucy';
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setSelectedDocName(doc.full_name);
                          setSelectedDocCouncil(doc.crm_cro);
                          setSelectedDocSpecialty(doc.especialidade);
                          setSelectedIsDental(isDocDental);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {doc.full_name} ({doc.crm_cro})
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 bg-slate-50/90 p-2 px-3 rounded-xl border border-slate-200/70 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">Profissional Emissor:</span>
                  <span className="font-bold text-slate-800">{selectedDocName || doctorName}</span>
                  {(selectedDocCouncil || doctorCouncil) && (
                    <span className="text-slate-500 font-medium">({selectedDocCouncil || doctorCouncil})</span>
                  )}
                </div>
                <span className="font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                  {selectedDocSpecialty || doctorSpecialty}
                </span>
              </div>
            )}

            {/* Abas Minimalistas dos Modelos (1 clique) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Modelo do Documento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTipo('repouso')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    tipo === 'repouso'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs">{selectedIsDental ? 'Repouso Odonto' : 'Repouso Médico'}</p>
                  <p className={`text-[10px] ${tipo === 'repouso' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Afastamento por dias
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('comparecimento')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    tipo === 'comparecimento'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs">Comparecimento</p>
                  <p className={`text-[10px] ${tipo === 'comparecimento' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Horário de consulta
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('acompanhante')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    tipo === 'acompanhante'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs">Acompanhante</p>
                  <p className={`text-[10px] ${tipo === 'acompanhante' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Declaração presencial
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('pos_operatorio')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    tipo === 'pos_operatorio'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs">{selectedIsDental ? 'Pós-Cirúrgico' : 'Pós-Procedimento'}</p>
                  <p className={`text-[10px] ${tipo === 'pos_operatorio' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Cuidados e repouso
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('laudo_parecer')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    tipo === 'laudo_parecer'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs">Parecer / Laudo</p>
                  <p className={`text-[10px] ${tipo === 'laudo_parecer' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Avaliação clínica
                  </p>
                </button>
              </div>
            </div>

            {/* Parâmetros Específicos por Tipo */}
            {tipo === 'repouso' && (
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700">Dias de Afastamento:</span>
                    <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {diasAfastamento} {diasAfastamento === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 2, 3, 5, 7, 10, 14].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setDiasAfastamento(num)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                          diasAfastamento === num
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num} {num === 1 ? 'dia' : 'dias'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-slate-200/70">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      CID-10 (Opcional - autorizado pelo paciente):
                    </label>
                    <input
                      type="text"
                      value={cid}
                      onChange={e => setCid(e.target.value)}
                      placeholder={selectedIsDental ? "Ex: K08.1 - Perda de dentes / K05 - Gengivite" : "Ex: G43 - Enxaqueca / M54.2 - Cervicalgia"}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {tipo === 'comparecimento' && (
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">Horário de Permanência:</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">Das:</span>
                    <input
                      type="time"
                      value={horarioInicio}
                      onChange={e => setHorarioInicio(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">Às:</span>
                    <input
                      type="time"
                      value={horarioFim}
                      onChange={e => setHorarioFim(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setHorarioInicio('08:30'); setHorarioFim('10:00'); }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Manhã (08h30-10h)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHorarioInicio('14:00'); setHorarioFim('15:30'); }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Tarde (14h-15h30)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tipo === 'acompanhante' && (
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 block">Dados do Acompanhante:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={nomeAcompanhante}
                    onChange={e => setNomeAcompanhante(e.target.value)}
                    placeholder="Nome completo do acompanhante"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <input
                    type="text"
                    value={documentoAcompanhante}
                    onChange={e => setDocumentoAcompanhante(e.target.value)}
                    placeholder="RG ou CPF do acompanhante"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {tipo === 'pos_operatorio' && (
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Procedimento Realizado:</span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500">Repouso:</span>
                    <select
                      value={diasAfastamento}
                      onChange={e => setDiasAfastamento(parseInt(e.target.value) || 1)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800"
                    >
                      <option value={1}>1 dia</option>
                      <option value={2}>2 dias</option>
                      <option value={3}>3 dias</option>
                      <option value={5}>5 dias</option>
                      <option value={7}>7 dias</option>
                    </select>
                  </div>
                </div>

                {selectedIsDental && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      'Remoção Segura SMART (IAOMT)',
                      'Instalação de Implante Zircônia',
                      'Enxerto Ósseo com PRF / I-PRF',
                      'Cirurgia de Cavitação NICO / Ozônio',
                      'Exodontia com Limpeza Biológica'
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setProcedimentoDescricao(preset)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all border ${
                          procedimentoDescricao === preset
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={procedimentoDescricao}
                  onChange={e => setProcedimentoDescricao(e.target.value)}
                  placeholder="Descrição do procedimento cirúrgico..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            )}

            {/* Editor de Texto do Atestado (ao vivo) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Texto do Documento (Editável)
                </span>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    isDictating
                      ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <Mic size={12} className={isDictating ? 'text-white' : 'text-slate-600'} />
                  {isDictating ? 'Ouvindo...' : 'Ditar por Voz'}
                </button>
              </div>

              <textarea
                rows={5}
                value={textoPersonalizado}
                onChange={e => setTextoPersonalizado(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-sans leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 shadow-inner"
              />
            </div>
          </div>

          {/* Rodapé Minimalista com Ações Rápidas */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                title="Copiar texto para área de transferência"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>

              {patientPhone && (
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                  title="Enviar mensagem com atestado no WhatsApp do paciente"
                >
                  <MessageSquare size={14} />
                  WhatsApp
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                title="Imprimir diretamente"
              >
                <Printer size={14} />
                Imprimir
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                title="Baixar PDF Oficial Timbrado"
              >
                <Download size={14} />
                Baixar PDF Oficial
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
