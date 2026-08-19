import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, MapPin, Camera, AlertTriangle, ShieldCheck, Check, Search, X, Heart, AlertCircle, Sparkles, Upload, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { calculateAge, formatDateMask } from '../lib/utils';

interface PreConsultationAnamneseModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientNamePrefill?: string;
  patientPhonePrefill?: string;
  patientCpfPrefill?: string;
  patientCepPrefill?: string;
  patientLogradouroPrefill?: string;
  patientBairroPrefill?: string;
  patientCidadePrefill?: string;
  patientEstadoPrefill?: string;
  patientNumeroPrefill?: string;
  patientComplementoPrefill?: string;
  onAnamneseSubmitted?: (updatedData: any) => void;
}

export default function PreConsultationAnamneseModal({
  isOpen,
  onClose,
  patientNamePrefill = '',
  patientPhonePrefill = '',
  patientCpfPrefill = '',
  patientCepPrefill = '',
  patientLogradouroPrefill = '',
  patientBairroPrefill = '',
  patientCidadePrefill = '',
  patientEstadoPrefill = '',
  patientNumeroPrefill = '',
  patientComplementoPrefill = '',
  onAnamneseSubmitted
}: PreConsultationAnamneseModalProps) {
  const [nome, setNome] = useState(patientNamePrefill);
  const [telefone, setTelefone] = useState(patientPhonePrefill);
  const [cpf, setCpf] = useState(patientCpfPrefill);
  const [dataNascimento, setDataNascimento] = useState('');
  const [cep, setCep] = useState(patientCepPrefill);
  const [logradouro, setLogradouro] = useState(patientLogradouroPrefill);
  const [bairro, setBairro] = useState(patientBairroPrefill);
  const [cidade, setCidade] = useState(patientCidadePrefill);
  const [estado, setEstado] = useState(patientEstadoPrefill);
  const [numero, setNumero] = useState(patientNumeroPrefill);
  const [complemento, setComplemento] = useState(patientComplementoPrefill);

  // Perguntas Clínicas / Alertas
  const [isHipertenso, setIsHipertenso] = useState(false);
  const [isDiabetico, setIsDiabetico] = useState(false);
  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiaTexto, setAlergiaTexto] = useState('');
  const [temCardiopatia, setTemCardiopatia] = useState(false);
  const [usaAnticoagulante, setUsaAnticoagulante] = useState(false);
  const [medicamentosAtuais, setMedicamentosAtuais] = useState('');
  const [observacoesClinicas, setObservacoesClinicas] = useState('');

  // Foto / Selfie / Câmera
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [aceitouTermoVeracidade, setAceitouTermoVeracidade] = useState(true);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Limpeza / Reset de estados prévios para evitar resíduos de pacientes anteriores
      setIsHipertenso(false);
      setIsDiabetico(false);
      setTemCardiopatia(false);
      setUsaAnticoagulante(false);
      setAlergias([]);
      setAlergiaTexto('');
      setMedicamentosAtuais('');
      setObservacoesClinicas('');
      setPhotoPreview(null);
      setDataNascimento('');

      if (patientNamePrefill) setNome(patientNamePrefill);
      if (patientPhonePrefill) setTelefone(patientPhonePrefill);
      if (patientCpfPrefill) setCpf(patientCpfPrefill);
      if (patientCepPrefill) setCep(patientCepPrefill);
      if (patientLogradouroPrefill) setLogradouro(patientLogradouroPrefill);
      if (patientBairroPrefill) setBairro(patientBairroPrefill);
      if (patientCidadePrefill) setCidade(patientCidadePrefill);
      if (patientEstadoPrefill) setEstado(patientEstadoPrefill);
      if (patientNumeroPrefill) setNumero(patientNumeroPrefill);
      if (patientComplementoPrefill) setComplemento(patientComplementoPrefill);

      // Buscar anamnese pré-existente no servidor
      const fetchAnamneseData = async () => {
        try {
          if (!patientPhonePrefill) return;
          const res = await fetch(`/api/public/anamnese-data?phone=${encodeURIComponent(patientPhonePrefill)}`);
          const data = await res.json();
          if (data.success && data.data) {
            const rec = data.data;
            if (rec.paciente_nome) setNome(rec.paciente_nome);
            if (rec.paciente_telefone) setTelefone(rec.paciente_telefone);
            if (rec.paciente_cpf) setCpf(rec.paciente_cpf);
            if (rec.data_nascimento) setDataNascimento(rec.data_nascimento);

            if (rec.endereco) {
              if (rec.endereco.cep) setCep(rec.endereco.cep);
              if (rec.endereco.logradouro) setLogradouro(rec.endereco.logradouro);
              if (rec.endereco.bairro) setBairro(rec.endereco.bairro);
              if (rec.endereco.cidade) setCidade(rec.endereco.cidade);
              if (rec.endereco.estado) setEstado(rec.endereco.estado);
              if (rec.endereco.numero) setNumero(rec.endereco.numero);
              if (rec.endereco.complemento) setComplemento(rec.endereco.complemento);
            }

            if (rec.alertas_clinicos && Array.isArray(rec.alertas_clinicos)) {
              setIsHipertenso(rec.alertas_clinicos.some((a: string) => String(a).toUpperCase().trim() === "HIPERTENSO" || String(a).toUpperCase().includes("HIPERTENSO")));
              setIsDiabetico(rec.alertas_clinicos.some((a: string) => String(a).toUpperCase().trim() === "DIABÉTICO" || String(a).toUpperCase().includes("DIABÉTICO") || String(a).toUpperCase().includes("DIABETES")));
              setTemCardiopatia(rec.alertas_clinicos.some((a: string) => String(a).toUpperCase().trim() === "CARDIOPATIA" || String(a).toUpperCase().includes("CARDIOPATIA") || String(a).toUpperCase().includes("MARCAPASSO") || String(a).toUpperCase().includes("CARDÍACO")));
              setUsaAnticoagulante(rec.alertas_clinicos.some((a: string) => String(a).toUpperCase().trim() === "ANTICOAGULANTE" || String(a).toUpperCase().includes("ANTICOAGULANTE")));

              // Extrair alergias salvas
              const alergiasEncontradas = rec.alertas_clinicos
                .filter((a: string) => String(a).toUpperCase().startsWith("ALERGIA:"))
                .map((a: string) => String(a).replace(/ALERGIA:\s*/i, '').trim());
              
              if (alergiasEncontradas.length > 0) {
                setAlergias(alergiasEncontradas);
                setAlergiaTexto(alergiasEncontradas.join(', '));
              }
            }

            if (rec.medicamentos_atuais || rec.medicamentosAtuais) setMedicamentosAtuais(rec.medicamentos_atuais || rec.medicamentosAtuais);
            if (rec.observacoes_clinicas || rec.observacoesClinicas) setObservacoesClinicas(rec.observacoes_clinicas || rec.observacoesClinicas);
            if (rec.foto_url) setPhotoPreview(rec.foto_url);
          }
        } catch (err) {
          console.error("Erro ao carregar dados da anamnese:", err);
        }
      };

      fetchAnamneseData();
    }
  }, [
    isOpen,
    patientNamePrefill,
    patientPhonePrefill,
    patientCpfPrefill,
    patientCepPrefill,
    patientLogradouroPrefill,
    patientBairroPrefill,
    patientCidadePrefill,
    patientEstadoPrefill,
    patientNumeroPrefill,
    patientComplementoPrefill
  ]);

  // Iniciar Câmera ao Vivo
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false
      });
      setIsWebcamActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 150);
    } catch (err) {
      toast.error("Não foi possível acessar a câmera. Permita o acesso ou envie um arquivo de foto.");
    }
  };

  // Parar Câmera
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  // Capturar Foto do Vídeo ao Vivo
  const capturePhotoFromWebcam = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoPreview(dataUrl);
      toast.success("Foto capturada com sucesso!");
    }
    stopWebcam();
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  if (!isOpen) return null;

  // Busca Automática de CEP
  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error("Informe um CEP válido com 8 números.");
      return;
    }
    setIsSearchingCep(true);
    try {
      const res = await fetch(`/api/cep/${cleanCep}`);
      const data = await res.json();
      if (data.error) {
        toast.error("CEP não encontrado.");
      } else {
        setLogradouro(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || '');
        toast.success("Endereço preenchido automaticamente!");
      }
    } catch (e: any) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Upload ou captura de selfie
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAlergia = (item: string) => {
    setAlergias(prev => 
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Nome completo é obrigatório.");
      return;
    }
    if (!aceitouTermoVeracidade) {
      toast.error("Você precisa declarar a veracidade das informações fornecidas.");
      return;
    }

    setIsSubmitting(true);

    // Gerar Etiquetas de Alertas Clínicos
    const alertas: string[] = [];
    if (isHipertenso) alertas.push("HIPERTENSO");
    if (isDiabetico) alertas.push("DIABÉTICO");
    if (temCardiopatia) alertas.push("CARDIOPATIA");
    if (usaAnticoagulante) alertas.push("ANTICOAGULANTE");
    if (alergias.length > 0) {
      alergias.forEach(a => alertas.push(`ALERGIA: ${a.toUpperCase()}`));
    } else if (alergiaTexto.trim()) {
      alertas.push(`ALERGIA: ${alergiaTexto.toUpperCase()}`);
    }

    const payload = {
      paciente_nome: nome,
      paciente_telefone: telefone,
      paciente_cpf: cpf,
      data_nascimento: dataNascimento,
      endereco: {
        cep, logradouro, numero, complemento, bairro, cidade, estado
      },
      alertas_clinicos: alertas,
      medicamentosAtuais,
      observacoesClinicas,
      foto_url: photoPreview,
      data_submissao: new Date().toISOString()
    };

    try {
      toast.success("Anamnese pré-consulta enviada com sucesso! Alertas clínicos ativos.");
      if (onAnamneseSubmitted) {
        onAnamneseSubmitted(payload);
      }
      onClose();
    } catch (err: any) {
      toast.error("Erro ao enviar anamnese: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-400/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Anamnese Pré-Consulta & Cadastro Digital</h2>
              <p className="text-xs text-blue-200">Preenchimento rápido e seguro para agilizar seu atendimento médico</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Seção 1: Dados Pessoais & Foto/Selfie */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              1. Identificação do Paciente & Foto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Foto Selfie & Câmera */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl min-h-[160px]">
                {photoPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-blue-600 shadow-md">
                      <img src={photoPreview} alt="Selfie Paciente" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(null)}
                        className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-sm"
                        title="Remover Foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Foto Anexada
                    </span>
                  </div>
                ) : isWebcamActive ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="relative w-full max-w-[200px] h-36 bg-black rounded-xl overflow-hidden shadow-inner border border-slate-300">
                      <video ref={videoRef} className="w-full h-full object-cover transform -scale-x-100" autoPlay playsInline muted />
                    </div>
                    <div className="flex gap-2 w-full justify-center">
                      <button
                        type="button"
                        onClick={capturePhotoFromWebcam}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Camera className="w-3.5 h-3.5" /> Bater Foto
                      </button>
                      <button
                        type="button"
                        onClick={stopWebcam}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-2 w-full">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-800 block">Identificação por Foto</span>
                      <span className="text-[10px] text-slate-400 block">Reconhecimento na Recepção</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
                      <button
                        type="button"
                        onClick={startWebcam}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                      >
                        <Video className="w-3.5 h-3.5" /> Webcam / Câmera
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex-1 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" /> Galeria / Arquivo
                      </button>

                      {/* Inputs ocultos de câmera e galeria */}
                      <input 
                        ref={cameraInputRef} 
                        type="file" 
                        accept="image/*" 
                        capture="user" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                      <input 
                        ref={galleryInputRef} 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Campos Principais */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Seu nome sem abreviações"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefone (WhatsApp)</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Data de Nascimento (DD/MM/AAAA)</label>
                      {calculateAge(dataNascimento) !== null && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">
                          {calculateAge(dataNascimento)} anos
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Ex: 08/05/1966"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(formatDateMask(e.target.value))}
                      className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço com busca inteligente por CEP */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              2. Endereço com Busca por CEP (ViaCEP)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CEP</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCep(val);
                      const clean = val.replace(/\D/g, '');
                      if (clean.length === 8 && !isSearchingCep) {
                        setTimeout(() => handleCepSearch(), 100);
                      }
                    }}
                    onBlur={() => {
                      if (cep.replace(/\D/g, '').length === 8) {
                        handleCepSearch();
                      }
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="00000-000"
                  />
                  <button
                    type="button"
                    onClick={handleCepSearch}
                    disabled={isSearchingCep}
                    className="px-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    {isSearchingCep ? "..." : <Search className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Logradouro / Rua</label>
                <input
                  type="text"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Rua, Avenida, Alameda..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="123"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UF</label>
                <input
                  type="text"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase"
                  placeholder="SP"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Questionário de Saúde & Alertas Clínicos Automáticos */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              3. Alertas Clínicos e Histórico de Saúde
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                isHipertenso ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>Possui Pressão Alta (Hipertensão)?</span>
                <input
                  type="checkbox"
                  checked={isHipertenso}
                  onChange={(e) => setIsHipertenso(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
              </label>

              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                isDiabetico ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>Possui Diabetes?</span>
                <input
                  type="checkbox"
                  checked={isDiabetico}
                  onChange={(e) => setIsDiabetico(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
              </label>

              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                temCardiopatia ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>Problemas Cardíacos / Marcapasso?</span>
                <input
                  type="checkbox"
                  checked={temCardiopatia}
                  onChange={(e) => setTemCardiopatia(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
              </label>

              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                usaAnticoagulante ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>Usa Anticoagulanties (Aspirina, Marevan)?</span>
                <input
                  type="checkbox"
                  checked={usaAnticoagulante}
                  onChange={(e) => setUsaAnticoagulante(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
              </label>
            </div>

            {/* Seleção de Alergias */}
            <div className="p-3 bg-red-50/50 border border-red-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-red-900 block">Alergias Conhecidas (Medicamentos/Alimentos):</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Penicilina', 'Dipirona', 'Ibuprofeno', 'Anestésico Local', 'Frutos do Mar', 'Látex'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAlergia(item)}
                    className={`px-3 py-1.5 rounded-xl font-medium border transition-all ${
                      alergias.includes(item)
                        ? 'bg-red-600 text-white border-red-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                    }`}
                  >
                    {alergias.includes(item) ? '✓ ' : '+ '}{item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Medicamentos de uso contínuo:</label>
              <input
                type="text"
                value={medicamentosAtuais}
                onChange={(e) => setMedicamentosAtuais(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Ex: Losartana 50mg, Puran T4, Omeprazol..."
              />
            </div>
          </div>

          {/* Termo de Veracidade */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="veracidade"
              checked={aceitouTermoVeracidade}
              onChange={(e) => setAceitouTermoVeracidade(e.target.checked)}
              className="mt-1 w-4 h-4 rounded-md accent-blue-600"
            />
            <label htmlFor="veracidade" className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Declaração de Veracidade e Consentimento:</strong> Declaro que todas as informações prestadas são verdadeiras e completas. Autorizo o cadastramento para fins estritamente clínicos conforme a LGPD.
            </label>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-2xl text-xs transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? "Enviando..." : "Confirmar e Transmitir Anamnese"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
