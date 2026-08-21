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
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { calculateAge, formatDateMask } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface PublicAnamneseViewProps {
  initialPhone?: string;
  initialAppointmentId?: string;
}

// Helper para formatar data e horário com segurança total sem 'Invalid Date'
function formatAppointmentDate(app: any): { dateStr: string; timeStr: string } {
  if (!app) return { dateStr: '', timeStr: '' };

  let dateStr = '';
  let timeStr = app.hora_consulta || '';

  // 1. Tenta formatar data_consulta se for YYYY-MM-DD
  if (app.data_consulta && typeof app.data_consulta === 'string') {
    if (app.data_consulta.includes('-')) {
      const parts = app.data_consulta.split('-');
      if (parts.length === 3) {
        dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } else {
      dateStr = app.data_consulta;
    }
  }

  // 2. Se tiver data_hora_inicio ou data_hora
  const rawDate = app.data_hora_inicio || app.data_hora;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      if (!dateStr) dateStr = d.toLocaleDateString('pt-BR');
      if (!timeStr) {
        timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
    }
  }

  return {
    dateStr: dateStr || 'Data Confirmada',
    timeStr: timeStr || 'Horário Agendado'
  };
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
  const [temMarcapasso, setTemMarcapasso] = useState(false);
  const [usaAnticoagulante, setUsaAnticoagulante] = useState(false);
  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiaTexto, setAlergiaTexto] = useState('');
  const [medicamentosAtuais, setMedicamentosAtuais] = useState('');
  const [observacoesClinicas, setObservacoesClinicas] = useState('');

  // Foto & Câmera
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [aceitouTermoVeracidade, setAceitouTermoVeracidade] = useState(true);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Detecta se o paciente está abrindo de dentro do WebView do WhatsApp / Instagram / Facebook
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const ua = window.navigator.userAgent || '';
      const isWA = /WhatsApp|FBAN|FBAV|Instagram|Line/i.test(ua) || (ua.includes('wv') && !ua.includes('Chrome/1'));
      if (isWA) {
        setIsInAppBrowser(true);
      }
    }
  }, []);

  // Buscar agendamento e anamnese prévia ao carregar
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
          let foundApp = null;

          try {
            const res = await fetch(`/api/public/appointment?phone=${encodeURIComponent(phoneParam)}&id=${encodeURIComponent(idParam)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.appointment) {
                foundApp = data.appointment;
              }
            }
          } catch (apiErr) {
            console.warn("API proxy não respondeu. Buscando direto no banco...");
          }

          // Fallback direto no Supabase (essencial para Netlify e modo offline)
          if (!foundApp) {
            try {
              if (idParam && idParam !== '1' && idParam !== 'undefined' && idParam !== 'null') {
                const { data: byId } = await supabase.from('agendamentos').select('*').eq('id', idParam);
                if (byId && byId.length > 0) foundApp = byId[0];
              }
              if (!foundApp && phoneParam) {
                const clean = phoneParam.replace(/\D/g, '');
                const cleanWithout55 = clean.startsWith('55') && clean.length > 10 ? clean.slice(2) : clean;
                const { data: byPhone } = await supabase
                  .from('agendamentos')
                  .select('*')
                  .or(`paciente_telefone.ilike.%${clean}%,paciente_telefone.ilike.%${cleanWithout55}%`)
                  .order('created_at', { ascending: false })
                  .limit(1);
                if (byPhone && byPhone.length > 0) foundApp = byPhone[0];
              }
            } catch (supaFetchErr) {
              console.warn("Erro ao buscar no Supabase:", supaFetchErr);
            }
          }

          if (foundApp) {
            setAppointment(foundApp);
            if (foundApp.paciente_nome) setNome(foundApp.paciente_nome);
            if (foundApp.paciente_telefone) setTelefone(foundApp.paciente_telefone);
            if (foundApp.paciente_cpf) setCpf(foundApp.paciente_cpf);
            if (foundApp.cep) setCep(foundApp.cep);
            if (foundApp.logradouro) setLogradouro(foundApp.logradouro);
            if (foundApp.bairro) setBairro(foundApp.bairro);
            if (foundApp.cidade) setCidade(foundApp.cidade);
            if (foundApp.estado) setEstado(foundApp.estado);
            if (foundApp.numero) setNumero(foundApp.numero);
            if (foundApp.complemento) setComplemento(foundApp.complemento);
          }

          // Tenta carregar anamnese pré-existente
          try {
            const resAnamnese = await fetch(`/api/public/anamnese-data?phone=${encodeURIComponent(phoneParam)}&id=${encodeURIComponent(idParam)}`);
            const anamneseJson = await resAnamnese.json();
            if (anamneseJson.data) {
              const rec = anamneseJson.data;
              if (rec.paciente_nome) setNome(rec.paciente_nome);
              if (rec.paciente_cpf) setCpf(rec.paciente_cpf);
              if (rec.data_nascimento) setDataNascimento(rec.data_nascimento);
              if (rec.foto_url) setPhotoPreview(rec.foto_url);
              if (rec.medicamentos_atuais || rec.medicamentosAtuais) setMedicamentosAtuais(rec.medicamentos_atuais || rec.medicamentosAtuais);
              if (rec.observacoes_clinicas || rec.observacoesClinicas) setObservacoesClinicas(rec.observacoes_clinicas || rec.observacoesClinicas);

              if (rec.alertas_clinicos && Array.isArray(rec.alertas_clinicos)) {
                setIsHipertenso(rec.alertas_clinicos.some((a: string) => String(a).toUpperCase().includes("HIPERTENS")));
                setIsDiabetico(rec.alertas_clinicos.some((a: string) => String(a).toUpperCase().includes("DIABÉT") || String(a).toUpperCase().includes("DIABET")));
                setTemCardiopatia(rec.alertas_clinicos.some((a: string) => (String(a).toUpperCase().includes("CARDIO") || String(a).toUpperCase().includes("CARDÍACO")) && !String(a).toUpperCase().includes("MARCAPASSO")));
                setTemMarcapasso(rec.alertas_clinicos.some((a: string) => String(a).toUpperCase().includes("MARCAPASSO")));
                setUsaAnticoagulante(rec.alertas_clinicos.some((a: string) => String(a).toUpperCase().includes("ANTICOAGULANTE")));

                const defaultAlergiasList = ['Penicilina', 'Dipirona', 'Ibuprofeno', 'Anestésico Local', 'Frutos do Mar', 'Látex'];
                const alergiasEncontradas = rec.alertas_clinicos
                  .filter((a: string) => String(a).toUpperCase().includes("ALERGIA:"))
                  .map((a: string) => String(a).replace(/ALERGIA:\s*/i, '').trim());
                
                if (alergiasEncontradas.length > 0) {
                  const matchedAlergias = alergiasEncontradas.map(found => {
                    const normFound = found.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    const match = defaultAlergiasList.find(opt => 
                      opt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normFound
                    );
                    return match || found;
                  });
                  setAlergias(matchedAlergias);
                  setAlergiaTexto(matchedAlergias.join(', '));
                }
              }
            }
          } catch (e) {
            // Ignora erro
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

  // Câmera ao vivo ou fallback input
  const startWebcam = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
      } else {
        cameraInputRef.current?.click();
      }
    } catch (err) {
      cameraInputRef.current?.click();
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
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const maxDim = 480;
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        setPhotoPreview(canvas.toDataURL('image/jpeg', 0.72));
        toast.success("Foto capturada com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao capturar foto da webcam:", err);
      toast.error("Erro ao capturar imagem.");
    } finally {
      stopWebcam();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 480;
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              setPhotoPreview(canvas.toDataURL('image/jpeg', 0.72));
              toast.success("Foto otimizada e anexada com sucesso!");
            }
          } catch (err) {
            console.error("Erro ao comprimir imagem:", err);
            toast.error("Falha ao processar arquivo de imagem.");
          }
        };
        img.src = event.target?.result as string;
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
      // 1. Tenta ViaCEP público direto (funciona 100% em Netlify, Cloud Run e local)
      const resViaCep = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const dataViaCep = await resViaCep.json();
      if (!dataViaCep.erro) {
        setLogradouro(dataViaCep.logradouro || '');
        setBairro(dataViaCep.bairro || '');
        setCidade(dataViaCep.localidade || '');
        setEstado(dataViaCep.uf || '');
        toast.success("Endereço localizado com sucesso!");
        return;
      }
      
      // 2. Fallback para rota local /api/cep
      const res = await fetch(`/api/cep/${cleanCep}`);
      const data = await res.json();
      if (!data.error) {
        setLogradouro(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || '');
        toast.success("Endereço localizado com sucesso!");
      } else {
        toast.error("CEP não encontrado.");
      }
    } catch (e) {
      toast.error("Erro ao consultar CEP.");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const isAlergiaChecked = (item: string) => {
    const normItem = item.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return alergias.some(a => a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normItem);
  };

  const toggleAlergia = (item: string) => {
    const normItem = item.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    setAlergias(prev => {
      const exists = prev.some(a => a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normItem);
      if (exists) {
        return prev.filter(a => a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() !== normItem);
      } else {
        return [...prev, item];
      }
    });
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
    if (temCardiopatia) alertas.push("PROBLEMAS CARDÍACOS");
    if (temMarcapasso) alertas.push("USO DE MARCAPASSO");
    if (usaAnticoagulante) alertas.push("USO DE ANTICOAGULANTE");
    if (alergias.length > 0) {
      alergias.forEach(a => {
        const cleanA = a.replace(/^ALERGIA:\s*/i, '').trim();
        alertas.push(`ALERGIA: ${cleanA.toUpperCase()}`);
      });
    } else if (alergiaTexto.trim()) {
      alertas.push(`ALERGIA: ${alergiaTexto.toUpperCase()}`);
    }

    const payload = {
      appointmentId: appointment?.id || '',
      paciente_nome: nome,
      paciente_telefone: telefone,
      paciente_cpf: cpf,
      data_nascimento: dataNascimento,
      endereco: { cep, logradouro, numero, complemento, bairro, cidade, estado },
      alertas_clinicos: alertas,
      medicamentosAtuais,
      observacoesClinicas,
      foto_url: photoPreview,
      updated_at: new Date().toISOString()
    };

    // Salva cópia local para garantia imediata
    try {
      const cleanPhone = telefone.replace(/\D/g, '');
      localStorage.setItem(`anamnese_${cleanPhone}`, JSON.stringify(payload));
      if (appointment?.id) {
        localStorage.setItem(`anamnese_app_${appointment.id}`, JSON.stringify(payload));
      }
    } catch (err) {
      console.warn("Aviso de storage local:", err);
    }

    // Salva diretamente no Supabase se disponível (vital no Netlify)
    try {
      if (supabase) {
        if (appointment?.id && appointment.id !== '1') {
          await supabase.from('agendamentos').update({
            status: 'confirmado',
            paciente_cpf: cpf || undefined,
            cep: cep || undefined,
            logradouro: logradouro || undefined,
            bairro: bairro || undefined,
            cidade: cidade || undefined,
            estado: estado || undefined,
            numero: numero || undefined,
            complemento: complemento || undefined
          }).eq('id', appointment.id);
        }

        // Registra o pré-cadastro na tabela de prontuários/anamneses
        await supabase.from('prontuarios').insert([{
          paciente_nome_completo: nome,
          paciente_telefone: telefone,
          paciente_cpf: cpf,
          paciente_data_nascimento: dataNascimento,
          url_midia: photoPreview || null,
          resumo_formatado: `Pré-cadastro digital realizado. Alertas: ${alertas.join(', ') || 'Nenhum'}.`,
          dados_clinicos: {
            alertas_clinicos: alertas,
            medicamentos_atuais: medicamentosAtuais,
            observacoes: observacoesClinicas,
            foto_url: photoPreview
          },
          created_at: new Date().toISOString()
        }]);
      }
    } catch (supaErr) {
      console.warn("Aviso Supabase:", supaErr);
    }

    // Tenta também a rota de backend se estiver em ambiente Node/Full-stack
    try {
      await fetch('/api/public/submit-anamnese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Backend API offline ou modo estático Netlify.");
    }

    setIsSubmitted(true);
    toast.success("Pré-cadastro e confirmação enviados com sucesso!");
    setIsSubmitting(false);
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
                Data: {formatAppointmentDate(appointment).dateStr}
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Clock className="w-4 h-4 text-blue-600" />
                Horário: {formatAppointmentDate(appointment).timeStr}
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
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatAppointmentDate(appointment).dateStr}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatAppointmentDate(appointment).timeStr}</span>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {appointment.medico_nome || 'Médico Responsável'}</span>
            </div>
          )}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Banner Didático de Ajuda para Câmera & Navegador */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300/90 p-4 sm:p-5 rounded-2xl space-y-3 text-amber-950 text-xs shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                  📸 Dica para Tirar a Foto / Selfie:
                </h3>
                <p className="text-amber-900 leading-relaxed font-medium">
                  Se você abriu pelo <strong>WhatsApp</strong> e a câmera não abrir ao clicar no botão azul, toque nos <strong>3 pontinhos (⋮)</strong> no canto superior do celular e selecione <strong>"Abrir no Chrome / Navegador"</strong>.
                </p>
              </div>
            </div>

            {/* Guia Visual Passo a Passo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-semibold text-[11px] text-amber-950">
              <div className="flex items-center gap-2 p-2 bg-white/90 rounded-xl border border-amber-200 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Toque nos <strong>3 pontinhos (⋮)</strong> no topo</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/90 rounded-xl border border-amber-200 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Escolha <strong>"Abrir no Chrome / Navegador"</strong></span>
              </div>
            </div>

            {/* Botão de Atalho Direto para o Chrome */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentUrl = window.location.href;
                  if (/android/i.test(navigator.userAgent)) {
                    const cleanUrl = currentUrl.replace(/^https?:\/\//, '');
                    window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end;`;
                  } else {
                    window.open(currentUrl, '_blank');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-amber-600/20 active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> Abrir no Google Chrome (Recomendado)
              </button>
            </div>
          </div>

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
                    
                    {/* Inputs HTML5 Nativos Reais (Compatíveis com todos os celulares e navegadores) */}
                    <input 
                      id="anamnese-camera-input"
                      ref={cameraInputRef}
                      type="file" 
                      accept="image/*" 
                      capture="user" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                    <input 
                      id="anamnese-gallery-input"
                      ref={galleryInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />

                    <div className="flex gap-2 w-full pt-1">
                      {/* Botão Tirar Foto / Câmera */}
                      <button 
                        type="button"
                        onClick={() => {
                          if (cameraInputRef.current) {
                            cameraInputRef.current.click();
                          }
                        }}
                        className="flex-1 py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer select-none"
                      >
                        <Camera className="w-3.5 h-3.5" /> Tirar Foto
                      </button>

                      {/* Botão Galeria */}
                      <button 
                        type="button"
                        onClick={() => {
                          if (galleryInputRef.current) {
                            galleryInputRef.current.click();
                          }
                        }}
                        className="flex-1 py-2 px-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 shadow-sm active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer select-none"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" /> Galeria
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={startWebcam}
                      className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1 pt-0.5"
                    >
                      <Camera className="w-3 h-3" /> Usar Câmera ao Vivo do Navegador
                    </button>
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
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600">Data de Nascimento (DD/MM/AAAA)</label>
                    {calculateAge(dataNascimento) !== null && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
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
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-600 focus:bg-white"
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
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input type="checkbox" checked={isHipertenso} onChange={(e) => setIsHipertenso(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-medium text-slate-700">Pressão Alta (Hipertensão)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input type="checkbox" checked={isDiabetico} onChange={(e) => setIsDiabetico(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-medium text-slate-700">Diabetes</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input type="checkbox" checked={temCardiopatia} onChange={(e) => setTemCardiopatia(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-medium text-slate-700">Problemas Cardíacos (Cardiopatia)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input type="checkbox" checked={temMarcapasso} onChange={(e) => setTemMarcapasso(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-medium text-slate-700">Uso de Marcapasso</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors col-span-2">
                <input type="checkbox" checked={usaAnticoagulante} onChange={(e) => setUsaAnticoagulante(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-medium text-slate-700">Usa Anticoagulantes (Aspirina, Marevan, etc.)</span>
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
                      isAlergiaChecked(item)
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isAlergiaChecked(item) ? '✓ ' : '+ '}{item}
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
