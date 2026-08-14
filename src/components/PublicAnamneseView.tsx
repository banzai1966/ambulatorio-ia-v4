import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  User, 
  Phone, 
  MapPin, 
  Camera, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  X, 
  Heart, 
  Upload, 
  Video, 
  Calendar, 
  Clock, 
  Sparkles,
  Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface PublicAnamneseViewProps {
  initialPhone?: string;
  initialAppointmentId?: string;
}

export default function PublicAnamneseView({ initialPhone = '', initialAppointmentId = '' }: PublicAnamneseViewProps) {
  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState(initialPhone);
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  
  // Endereço
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Alertas Clínicos
  const [isHipertenso, setIsHipertenso] = useState(false);
  const [isDiabetico, setIsDiabetico] = useState(false);
  const [temCardiopatia, setTemCardiopatia] = useState(false);
  const [usaAnticoagulante, setUsaAnticoagulante] = useState(false);
  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiaTexto, setAlergiaTexto] = useState('');
  const [medicamentosAtuais, setMedicamentosAtuais] = useState('');
  const [observacoesClinicas, setObservacoesClinicas] = useState('');

  // Foto & Câmera
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [aceitouTermoVeracidade, setAceitouTermoVeracidade] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Buscar agendamento ao carregar
  useEffect(() => {
    const fetchAppointment = async () => {
      setIsLoading(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const phoneParam = initialPhone || urlParams.get('phone') || hashParams.get('phone') || '';
        const idParam = initialAppointmentId || urlParams.get('id') || hashParams.get('id') || '';

        if (phoneParam) setTelefone(phoneParam);

        if (idParam || phoneParam) {
          const res = await fetch(`/api/public/appointment?phone=${encodeURIComponent(phoneParam)}&id=${encodeURIComponent(idParam)}`);
          const data = await res.json();
          if (data.appointment) {
            setAppointment(data.appointment);
            if (data.appointment.paciente_nome) setNome(data.appointment.paciente_nome);
            if (data.appointment.paciente_telefone) setTelefone(data.appointment.paciente_telefone);
            if (data.appointment.paciente_cpf) setCpf(data.appointment.paciente_cpf);
            if (data.appointment.cep) setCep(data.appointment.cep);
            if (data.appointment.logradouro) setLogradouro(data.appointment.logradouro);
            if (data.appointment.bairro) setBairro(data.appointment.bairro);
            if (data.appointment.cidade) setCidade(data.appointment.cidade);
            if (data.appointment.estado) setEstado(data.appointment.estado);
            if (data.appointment.numero) setNumero(data.appointment.numero);
            if (data.appointment.complemento) setComplemento(data.appointment.complemento);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar agendamento público:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [initialPhone, initialAppointmentId]);

  // Câmera
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

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const capturePhotoFromWebcam = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPhotoPreview(canvas.toDataURL('image/jpeg', 0.85));
      toast.success("Foto capturada com sucesso!");
    }
    stopWebcam();
  };

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
        toast.success("Endereço localizado com sucesso!");
      }
    } catch (e) {
      toast.error("Erro ao consultar CEP.");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const toggleAlergia = (item: string) => {
    setAlergias(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Por favor, preencha o seu nome completo.");
      return;
    }
    if (!aceitouTermoVeracidade) {
      toast.error("Você precisa aceitar a declaração de veracidade das informações.");
      return;
    }

    setIsSubmitting(true);

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

    try {
      const res = await fetch('/api/public/submit-anamnese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment?.id || '',
          paciente_nome: nome,
          paciente_telefone: telefone,
          paciente_cpf: cpf,
          data_nascimento: dataNascimento,
          endereco: { cep, logradouro, numero, complemento, bairro, cidade, estado },
          alertas_clinicos: alertas,
          medicamentosAtuais,
          observacoesClinicas,
          foto_url: photoPreview
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        toast.success("Pré-cadastro e confirmação enviados!");
      } else {
        toast.error("Erro ao enviar pré-cadastro: " + data.error);
      }
    } catch (err: any) {
      toast.error("Falha ao comunicar com o servidor: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agendamento Confirmado!</h1>
            <p className="text-sm text-slate-500 mt-2">
              Olá, <strong className="text-slate-800">{nome}</strong>! Seus dados de pré-cadastro e foto foram recebidos com sucesso.
            </p>
          </div>

          {appointment && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Calendar className="w-4 h-4 text-blue-600" />
                Data: {new Date(appointment.data_hora_inicio).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Clock className="w-4 h-4 text-blue-600" />
                Horário: {new Date(appointment.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Profissional: {appointment.medico_nome || 'Dr. Especialista'}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Sua presença já está confirmada no sistema da clínica. Esperamos você!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 flex justify-center">
      <Toaster position="top-right" />
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* Cabeçalho da Clínica */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 text-white text-center relative">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-3 border border-white/20">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Ambulatório IA</h1>
          <p className="text-xs text-blue-100 mt-1">Ficha de Pré-Cadastro & Confirmador de Consulta</p>
          
          {appointment && (
            <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap justify-center gap-4 text-xs font-medium text-blue-50">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(appointment.data_hora_inicio).toLocaleDateString('pt-BR')}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(appointment.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {appointment.medico_nome || 'Médico Responsável'}</span>
            </div>
          )}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Seção 1: Dados Pessoais & Foto */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" /> 1. Identificação & Foto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Câmera / Selfie */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl min-h-[150px]">
                {photoPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-blue-600 shadow-md">
                      <img src={photoPreview} alt="Selfie" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(null)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow-sm"
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
                    <div className="relative w-full h-32 bg-black rounded-xl overflow-hidden">
                      <video ref={videoRef} className="w-full h-full object-cover transform -scale-x-100" autoPlay playsInline muted />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhotoFromWebcam}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        Capturar
                      </button>
                      <button
                        type="button"
                        onClick={stopWebcam}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-2 w-full">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-full">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Foto para Recepção</span>
                    <div className="flex gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={startWebcam}
                        className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <Video className="w-3 h-3" /> Câmera
                      </button>
                      <label className="flex-1 py-1.5 bg-white border text-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" /> Galeria
                        <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Campos Textuais */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:bg-white transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600">Telefone (WhatsApp)</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">CPF</label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">Data de Nascimento</label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço (ViaCEP) */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-blue-600" /> 2. Endereço
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="CEP (ex: 01001-000)"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleCepSearch}
                disabled={isSearchingCep}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Search className="w-3.5 h-3.5" /> {isSearchingCep ? 'Buscando...' : 'Buscar CEP'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Rua / Logradouro"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Número"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="text"
                  placeholder="Bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="UF"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Alertas Clínicos */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> 3. Alertas Clínicos de Saúde
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer">
                <input type="checkbox" checked={isHipertenso} onChange={(e) => setIsHipertenso(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-medium text-slate-700">Pressão Alta (Hipertensão)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer">
                <input type="checkbox" checked={isDiabetico} onChange={(e) => setIsDiabetico(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-medium text-slate-700">Diabetes</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer">
                <input type="checkbox" checked={temCardiopatia} onChange={(e) => setTemCardiopatia(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-medium text-slate-700">Problemas Cardíacos</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer">
                <input type="checkbox" checked={usaAnticoagulante} onChange={(e) => setUsaAnticoagulante(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-medium text-slate-700">Usa Anticoagulantes</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Alergias Conhecidas:</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['Penicilina', 'Dipirona', 'Ibuprofeno', 'Anestésico Local', 'Frutos do Mar', 'Látex'].map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAlergia(item)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      alergias.includes(item)
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Medicamentos de Uso Contínuo:</label>
              <input
                type="text"
                placeholder="Ex: Losartana 50mg, Puran T4, Omeprazol..."
                value={medicamentosAtuais}
                onChange={(e) => setMedicamentosAtuais(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Motivo Principal da Consulta / Sintomas:</label>
              <textarea
                rows={2}
                placeholder="Descreva brevemente o que está sentindo ou a queixa principal..."
                value={observacoesClinicas}
                onChange={(e) => setObservacoesClinicas(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none"
              />
            </div>
          </div>

          {/* Seção 4: Termo LGPD */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-2 text-xs text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={aceitouTermoVeracidade}
                onChange={(e) => setAceitouTermoVeracidade(e.target.checked)}
                className="mr-2 rounded text-blue-600"
              />
              Declaro que os dados fornecidos são verdadeiros e autorizo a utilização do meu perfil para fins do atendimento médico na clínica conforme a LGPD.
            </label>
          </div>

          {/* Botão Submeter */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg text-sm flex items-center justify-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <span>Enviando dados...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Confirmar Agendamento & Enviar Ficha
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
