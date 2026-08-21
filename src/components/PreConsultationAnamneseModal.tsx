import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, MapPin, Camera, AlertTriangle, ShieldCheck, Check, Search, X, Heart, AlertCircle, Sparkles, Upload, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { calculateAge, formatDateMask } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface PreConsultationAnamneseModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: string;
  patientNamePrefill?: string;
  patientPhonePrefill?: string;
  patientCpfPrefill?: string;
  patientDobPrefill?: string;
  patientPhotoPrefill?: string;
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
  appointmentId = '',
  patientNamePrefill = '',
  patientPhonePrefill = '',
  patientCpfPrefill = '',
  patientDobPrefill = '',
  patientPhotoPrefill = '',
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
  const [dataNascimento, setDataNascimento] = useState(patientDobPrefill);
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
  const [temMarcapasso, setTemMarcapasso] = useState(false);
  const [usaAnticoagulante, setUsaAnticoagulante] = useState(false);
  const [medicamentosAtuais, setMedicamentosAtuais] = useState('');
  const [observacoesClinicas, setObservacoesClinicas] = useState('');

  // Foto / Selfie / Câmera
  const [photoPreview, setPhotoPreview] = useState<string | null>(patientPhotoPrefill || null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [aceitouTermoVeracidade, setAceitouTermoVeracidade] = useState(true);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isScanningHistory, setIsScanningHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Helper para preencher estados a partir de um registro
  const applyRecordData = (rec: any) => {
    if (!rec) return;
    if (rec.paciente_nome || rec.paciente_nome_completo) {
      setNome(rec.paciente_nome || rec.paciente_nome_completo);
    }
    if (rec.paciente_telefone || rec.telefone) {
      setTelefone(rec.paciente_telefone || rec.telefone);
    }
    if (rec.paciente_cpf || rec.cpf) {
      setCpf(rec.paciente_cpf || rec.cpf);
    }
    
    // Normalizar data de nascimento para DD/MM/AAAA
    const rawDob = rec.data_nascimento || rec.paciente_data_nascimento;
    if (rawDob && typeof rawDob === 'string') {
      let formattedDob = rawDob;
      if (rawDob.includes('-')) {
        const parts = rawDob.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      setDataNascimento(formattedDob);
    }

    if (rec.endereco) {
      if (typeof rec.endereco === 'object') {
        if (rec.endereco.cep) setCep(rec.endereco.cep);
        if (rec.endereco.logradouro) setLogradouro(rec.endereco.logradouro);
        if (rec.endereco.bairro) setBairro(rec.endereco.bairro);
        if (rec.endereco.cidade) setCidade(rec.endereco.cidade);
        if (rec.endereco.estado) setEstado(rec.endereco.estado);
        if (rec.endereco.numero) setNumero(rec.endereco.numero);
        if (rec.endereco.complemento) setComplemento(rec.endereco.complemento);
      }
    } else {
      if (rec.cep) setCep(rec.cep);
      if (rec.logradouro) setLogradouro(rec.logradouro);
      if (rec.bairro) setBairro(rec.bairro);
      if (rec.cidade) setCidade(rec.cidade);
      if (rec.estado) setEstado(rec.estado);
      if (rec.numero) setNumero(rec.numero);
      if (rec.complemento) setComplemento(rec.complemento);
    }

    const rawAlerts = rec.alertas_clinicos || (rec.alergias ? (typeof rec.alergias === 'string' ? rec.alergias.split(',').map((s: string) => s.trim()) : rec.alergias) : []);
    const alertsList = Array.isArray(rawAlerts) ? rawAlerts : [];

    if (alertsList.length > 0) {
      setIsHipertenso(alertsList.some((a: string) => String(a).toUpperCase().includes("HIPERTENS")));
      setIsDiabetico(alertsList.some((a: string) => String(a).toUpperCase().includes("DIABÉT") || String(a).toUpperCase().includes("DIABET")));
      setTemCardiopatia(alertsList.some((a: string) => (String(a).toUpperCase().includes("CARDIO") || String(a).toUpperCase().includes("CARDÍACO")) && !String(a).toUpperCase().includes("MARCAPASSO")));
      setTemMarcapasso(alertsList.some((a: string) => String(a).toUpperCase().includes("MARCAPASSO")));
      setUsaAnticoagulante(alertsList.some((a: string) => String(a).toUpperCase().includes("ANTICOAGULANTE")));

      const defaultAlergiasList = ['Penicilina', 'Dipirona', 'Ibuprofeno', 'Anestésico Local', 'Frutos do Mar', 'Látex'];
      const alergiasEncontradas = alertsList
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

    if (rec.medicamentos_atuais !== undefined || rec.medicamentosAtuais !== undefined) {
      setMedicamentosAtuais(rec.medicamentos_atuais || rec.medicamentosAtuais || '');
    }
    if (rec.observacoes_clinicas !== undefined || rec.observacoesClinicas !== undefined) {
      setObservacoesClinicas(rec.observacoes_clinicas || rec.observacoesClinicas || '');
    }
    
    const foto = rec.foto_url || rec.foto || rec.url_midia || rec.photoPreview || rec.avatar_url || null;
    if (foto) {
      setPhotoPreview(foto);
    }
  };

  // Função centralizada para executar a varredura
  const performFullScan = async (nameToScan?: string, phoneToScan?: string, notifyOnFound = false) => {
    setIsScanningHistory(true);
    const targetName = (nameToScan !== undefined ? nameToScan : (nome || patientNamePrefill || '')).trim();
    const targetPhone = (phoneToScan !== undefined ? phoneToScan : (telefone || patientPhonePrefill || '')).trim();
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const cleanWithout55 = cleanPhone.startsWith('55') && cleanPhone.length > 10 ? cleanPhone.slice(2) : cleanPhone;
    const cleanCpf = (cpf || patientCpfPrefill || '').replace(/\D/g, '');

    let foundData = false;

    // 1. CARREGAMENTO DO LOCALSTORAGE
    try {
      // Checar foto prévia salva em localStorage
      const savedPhoto = (cleanCpf && localStorage.getItem(`anamnese_foto_${cleanCpf}`)) || 
                         (cleanPhone && localStorage.getItem(`anamnese_foto_${cleanPhone}`)) || 
                         (cleanWithout55 && localStorage.getItem(`anamnese_foto_${cleanWithout55}`)) ||
                         (appointmentId && localStorage.getItem(`anamnese_foto_${appointmentId}`));
      if (savedPhoto && !photoPreview) {
        setPhotoPreview(savedPhoto);
      }

      const savedApp = appointmentId ? localStorage.getItem(`anamnese_app_${appointmentId}`) : null;
      const savedPhone = cleanPhone ? localStorage.getItem(`anamnese_${cleanPhone}`) : null;
      const savedWithout55 = cleanWithout55 ? localStorage.getItem(`anamnese_${cleanWithout55}`) : null;
      const savedWith55 = cleanPhone ? localStorage.getItem(`anamnese_55${cleanPhone}`) : null;

      let localRec: any = null;
      if (savedApp) localRec = JSON.parse(savedApp);
      else if (savedPhone) localRec = JSON.parse(savedPhone);
      else if (savedWithout55) localRec = JSON.parse(savedWithout55);
      else if (savedWith55) localRec = JSON.parse(savedWith55);

      if (!localRec) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('anamnese_')) {
            try {
              const parsed = JSON.parse(localStorage.getItem(key) || '');
              if (parsed && (
                (parsed.paciente_nome && targetName && parsed.paciente_nome.toLowerCase().trim().includes(targetName.toLowerCase().trim())) ||
                (cleanWithout55 && String(parsed.paciente_telefone || '').replace(/\D/g, '').includes(cleanWithout55)) ||
                (cleanCpf && String(parsed.paciente_cpf || '').replace(/\D/g, '') === cleanCpf)
              )) {
                localRec = parsed;
                break;
              }
            } catch (_) {}
          }
        }
      }

      if (localRec) {
        applyRecordData(localRec);
        foundData = true;
      }
    } catch (err) {
      console.warn("Aviso ao ler dados locais:", err);
    }

    // 2. BUSCA REMOTA NO SERVIDOR / DISCO / SUPABASE
    try {
      const params = new URLSearchParams();
      if (cleanPhone) params.append('phone', cleanPhone);
      if (appointmentId) params.append('id', appointmentId);
      if (targetName) params.append('name', targetName);

      const res = await fetch(`/api/public/anamnese-data?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          applyRecordData(data.data);
          foundData = true;
          if (notifyOnFound) {
            toast.success(`Dados clínicos e cadastrais localizados para "${targetName || 'Paciente'}"!`);
          }
        } else if (notifyOnFound && !foundData) {
          toast("Nenhum histórico anterior encontrado para este nome/telefone.", { icon: 'ℹ️' });
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados remotos da anamnese:", err);
    } finally {
      setIsScanningHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Limpeza / Reset inicial
      setIsHipertenso(false);
      setIsDiabetico(false);
      setTemCardiopatia(false);
      setTemMarcapasso(false);
      setUsaAnticoagulante(false);
      setAlergias([]);
      setAlergiaTexto('');
      setMedicamentosAtuais('');
      setObservacoesClinicas('');
      setPhotoPreview(null);
      setDataNascimento(patientDobPrefill || '');

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

      // Dispara a varredura automática imediata
      performFullScan(patientNamePrefill, patientPhonePrefill, false);
    }
  }, [
    isOpen,
    appointmentId,
    patientNamePrefill,
    patientPhonePrefill,
    patientCpfPrefill,
    patientDobPrefill,
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

  // Capturar Foto do Vídeo ao Vivo de forma ultra leve (evita estouro de memória)
  const capturePhotoFromWebcam = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Limita resolução a no máximo 480px para foto de perfil leve (25-45KB)
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        setPhotoPreview(dataUrl);
        
        const cleanPhone = (telefone || patientPhonePrefill || '').replace(/\D/g, '');
        const cleanCpf = (cpf || patientCpfPrefill || '').replace(/\D/g, '');
        try {
          if (cleanPhone) localStorage.setItem(`anamnese_foto_${cleanPhone}`, dataUrl);
          if (cleanCpf) localStorage.setItem(`anamnese_foto_${cleanCpf}`, dataUrl);
          if (appointmentId) localStorage.setItem(`anamnese_foto_${appointmentId}`, dataUrl);
        } catch (storageErr) {
          console.warn("Aviso de cota de armazenamento local:", storageErr);
        }

        toast.success("Foto capturada com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro ao capturar foto:", err);
      toast.error("Erro ao capturar foto. Tente novamente.");
    } finally {
      stopWebcam();
    }
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

  // Upload ou captura de selfie com compressão automática
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 480;
            let width = img.width;
            let height = img.height;

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
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
              setPhotoPreview(dataUrl);

              const cleanPhone = (telefone || patientPhonePrefill || '').replace(/\D/g, '');
              const cleanCpf = (cpf || patientCpfPrefill || '').replace(/\D/g, '');
              try {
                if (cleanPhone) localStorage.setItem(`anamnese_foto_${cleanPhone}`, dataUrl);
                if (cleanCpf) localStorage.setItem(`anamnese_foto_${cleanCpf}`, dataUrl);
                if (appointmentId) localStorage.setItem(`anamnese_foto_${appointmentId}`, dataUrl);
              } catch (storageErr) {
                console.warn("Aviso de armazenamento:", storageErr);
              }
              toast.success("Foto otimizada e anexada com sucesso!");
            }
          } catch (compressErr) {
            console.error("Erro ao comprimir imagem:", compressErr);
            toast.error("Falha ao processar imagem.");
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
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

    const cleanPhone = (telefone || '').replace(/\D/g, '');
    const cleanWithout55 = cleanPhone.startsWith('55') && cleanPhone.length > 10 ? cleanPhone.slice(2) : cleanPhone;

    const payload = {
      appointmentId: appointmentId || undefined,
      agendamento_id: appointmentId || undefined,
      paciente_nome: nome,
      paciente_telefone: telefone,
      paciente_cpf: cpf,
      data_nascimento: dataNascimento,
      endereco: {
        cep, logradouro, numero, complemento, bairro, cidade, estado
      },
      alertas_clinicos: alertas,
      medicamentosAtuais,
      medicamentos_atuais: medicamentosAtuais,
      observacoesClinicas,
      observacoes_clinicas: observacoesClinicas,
      foto_url: photoPreview,
      data_submissao: new Date().toISOString()
    };

    try {
      // 1. Salvar no localStorage
      try {
        if (cleanPhone) localStorage.setItem(`anamnese_${cleanPhone}`, JSON.stringify(payload));
        if (cleanWithout55) localStorage.setItem(`anamnese_${cleanWithout55}`, JSON.stringify(payload));
        if (appointmentId) localStorage.setItem(`anamnese_app_${appointmentId}`, JSON.stringify(payload));
      } catch (lsErr) {
        console.warn("Aviso localStorage:", lsErr);
      }

      // 2. Salvar no Supabase (se disponível)
      try {
        if (supabase) {
          const agUpdate: any = {
            status: 'Confirmado',
            paciente_cpf: cpf || undefined,
            data_nascimento: dataNascimento || undefined,
            paciente_data_nascimento: dataNascimento || undefined,
            foto_url: photoPreview || undefined,
            cep: cep || undefined,
            logradouro: logradouro || undefined,
            bairro: bairro || undefined,
            cidade: cidade || undefined,
            estado: estado || undefined,
            numero: numero || undefined,
            complemento: complemento || undefined
          };

          if (appointmentId && appointmentId !== '1') {
            const numId = Number(appointmentId);
            if (!isNaN(numId)) {
              await supabase.from('agendamentos').update(agUpdate).eq('id', numId);
            }
            await supabase.from('agendamentos').update(agUpdate).eq('id', String(appointmentId));
          }

          if (cleanPhone) {
            await supabase.from('agendamentos').update(agUpdate).or(`paciente_telefone.ilike.%${cleanPhone}%,paciente_telefone.ilike.%${cleanWithout55}%`);
          }

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

      // 3. Salvar no backend / disco
      try {
        await fetch('/api/public/submit-anamnese', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (apiErr) {
        console.warn("Aviso submit API:", apiErr);
      }

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('anamnese_submitted', { detail: payload }));
        } catch (e) {}
      }

      toast.success("Anamnese pré-consulta salva com sucesso! Alertas clínicos ativos.");
      if (onAnamneseSubmitted) {
        onAnamneseSubmitted(payload);
      }
      onClose();
    } catch (err: any) {
      toast.error("Erro ao salvar anamnese: " + err.message);
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
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                1. Identificação do Paciente & Foto
              </span>
              <span className="text-[11px] font-normal normal-case text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Foto Opcional (pode ser tirada na recepção)
              </span>
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
                      <span className="text-xs font-bold text-slate-800 block">Foto de Identificação</span>
                      <span className="text-[10px] text-slate-500 block">Opcional • Se preferir, tiramos na recepção</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
                      <button
                        type="button"
                        onClick={startWebcam}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                      >
                        <Video className="w-3.5 h-3.5" /> Câmera / Selfie
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Nome Completo *</label>
                    <button
                      type="button"
                      onClick={() => performFullScan(nome, telefone, true)}
                      disabled={isScanningHistory}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Search className={`w-3 h-3 ${isScanningHistory ? 'animate-spin' : ''}`} />
                      {isScanningHistory ? "Fazendo varredura..." : "Fazer Varredura de Histórico"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      onBlur={() => {
                        if (nome.trim().length >= 3 && !dataNascimento && !photoPreview) {
                          performFullScan(nome, telefone, false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          performFullScan(nome, telefone, true);
                        }
                      }}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-9 font-medium"
                      placeholder="Nome do paciente para busca ou cadastro"
                    />
                    <button
                      type="button"
                      onClick={() => performFullScan(nome, telefone, true)}
                      disabled={isScanningHistory}
                      title="Buscar dados no histórico"
                      className="absolute right-2 top-2 p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                    >
                      <Search className={`w-4 h-4 ${isScanningHistory ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefone (WhatsApp)</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      onBlur={() => {
                        if (telefone.replace(/\D/g, '').length >= 8 && !dataNascimento) {
                          performFullScan(nome, telefone, false);
                        }
                      }}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CPF</label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Nascimento</label>
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
                <span>Problemas Cardíacos (Cardiopatia)?</span>
                <input
                  type="checkbox"
                  checked={temCardiopatia}
                  onChange={(e) => setTemCardiopatia(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
              </label>

              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                temMarcapasso ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>Possui Marcapasso?</span>
                <input
                  type="checkbox"
                  checked={temMarcapasso}
                  onChange={(e) => setTemMarcapasso(e.target.checked)}
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
                      isAlergiaChecked(item)
                        ? 'bg-red-600 text-white border-red-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                    }`}
                  >
                    {isAlergiaChecked(item) ? '✓ ' : '+ '}{item}
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
