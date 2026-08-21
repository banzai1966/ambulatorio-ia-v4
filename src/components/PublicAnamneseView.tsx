import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  User, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Calendar, 
  Clock, 
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
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
  const [aceitouTermoVeracidade, setAceitouTermoVeracidade] = useState(true);

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
      updated_at: new Date().toISOString()
    };

    const cleanPhone = telefone.replace(/\D/g, '');
    const cleanWithout55 = cleanPhone.startsWith('55') && cleanPhone.length > 10 ? cleanPhone.slice(2) : cleanPhone;

    // Salva cópia local para garantia imediata
    try {
      if (cleanPhone) localStorage.setItem(`anamnese_${cleanPhone}`, JSON.stringify(payload));
      if (cleanWithout55) localStorage.setItem(`anamnese_${cleanWithout55}`, JSON.stringify(payload));
      if (appointment?.id) {
        localStorage.setItem(`anamnese_app_${appointment.id}`, JSON.stringify(payload));
      }
    } catch (err) {
      console.warn("Aviso de storage local:", err);
    }

    // Salva diretamente no Supabase se disponível (vital no Netlify)
    try {
      if (supabase) {
        const updateObj: any = {
          status: 'Confirmado',
          paciente_cpf: cpf || undefined,
          data_nascimento: dataNascimento || undefined,
          paciente_data_nascimento: dataNascimento || undefined,
          cep: cep || undefined,
          logradouro: logradouro || undefined,
          bairro: bairro || undefined,
          cidade: cidade || undefined,
          estado: estado || undefined,
          numero: numero || undefined,
          complemento: complemento || undefined
        };

        if (appointment?.id && appointment.id !== '1') {
          const numId = Number(appointment.id);
          if (!isNaN(numId)) {
            await supabase.from('agendamentos').update(updateObj).eq('id', numId);
          }
          await supabase.from('agendamentos').update(updateObj).eq('id', String(appointment.id));
        }

        if (cleanPhone) {
          await supabase.from('agendamentos').update(updateObj).or(`paciente_telefone.ilike.%${cleanPhone}%,paciente_telefone.ilike.%${cleanPhone.replace(/^55/, '')}%`);
        }

        // Registra o pré-cadastro na tabela de prontuários/anamneses
        await supabase.from('prontuarios').insert([{
          paciente_nome_completo: nome,
          paciente_telefone: telefone,
          paciente_cpf: cpf,
          paciente_data_nascimento: dataNascimento,
          data_nascimento: dataNascimento,
          resumo_formatado: `Pré-cadastro digital realizado. Alertas: ${alertas.join(', ') || 'Nenhum'}.`,
          dados_clinicos: {
            alertas_clinicos: alertas,
            medicamentos_atuais: medicamentosAtuais,
            observacoes: observacoesClinicas
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

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('anamnese_submitted', { detail: payload }));
      } catch (e) {}
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
              Olá, <strong className="text-slate-800">{nome}</strong>! Seus dados de pré-cadastro foram recebidos com sucesso.
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

          {/* Seção 1: Identificação & Dados Pessoais */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" /> 1. Identificação & Dados Pessoais
            </h2>

            <div className="space-y-3">
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
