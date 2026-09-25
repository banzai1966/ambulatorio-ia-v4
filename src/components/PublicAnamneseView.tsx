import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Smile,
  Shield,
  Pill,
  Zap,
  Activity
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

  // Parâmetros de rota
  const [docParam, setDocParam] = useState<string>('');

  // 1. Identificação e Dados Pessoais
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState(initialPhone);
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  
  // 2. Endereço e CEP
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // 3. Alertas Médicos e Clínicos Gerais
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

  // 4. MÓDULO EXCLUSIVO: ODONTOLOGIA BIOLÓGICA & SAÚDE INTEGRATIVA (Dra. Lucy Murata)
  const [temAmalgama, setTemAmalgama] = useState<'nao' | 'sim' | 'ja_removeu'>('nao');
  const [qtdAmalgamas, setQtdAmalgamas] = useState('1 a 2 dentes');
  const [desejaSmart, setDesejaSmart] = useState(true);
  const [temCanalTratado, setTemCanalTratado] = useState(false);
  const [dorIncomodoCanal, setDorIncomodoCanal] = useState(false);
  const [extraiuSisos, setExtraiuSisos] = useState(false);
  const [dorNevralgiaFace, setDorNevralgiaFace] = useState(false);
  const [temBruxismo, setTemBruxismo] = useState(false);
  const [dorAtmMatinal, setDorAtmMatinal] = useState(false);
  const [alergiaMetais, setAlergiaMetais] = useState(false);
  const [gostoMetalicoBoca, setGostoMetalicoBoca] = useState(false);
  const [temImplanteTitanio, setTemImplanteTitanio] = useState(false);
  const [interesseZirconia, setInteresseZirconia] = useState(false);
  const [sintomasSistemicos, setSintomasSistemicos] = useState<string[]>([]);
  const [suplementosAtuais, setSuplementosAtuais] = useState('');

  // 5. MÓDULO EXCLUSIVO: NEUROLOGIA & MEDICINA INTEGRATIVA (Dr. Carlos Morato)
  const [temEnxaqueca, setTemEnxaqueca] = useState(false);
  const [temParestesia, setTemParestesia] = useState(false);
  const [temTonturaLabirintite, setTemTonturaLabirintite] = useState(false);
  const [qualidadeSono, setQualidadeSono] = useState<'bom' | 'insonia' | 'acorda_cansado'>('bom');
  const [queixaMemoria, setQueixaMemoria] = useState(false);

  // Identificação da especialidade
  const isDentalMode = useMemo(() => {
    if (docParam === 'dra_lucy') return true;
    if (docParam === 'dr_carlos') return false;
    const profName = (appointment?.medico_nome || '').toLowerCase();
    const profSpec = (appointment?.medico_especialidade || appointment?.especialidade_nome || '').toLowerCase();
    return (
      profName.includes('lucy') || 
      profName.includes('luci') || 
      profName.includes('murata') ||
      profSpec.includes('odonto') || 
      profSpec.includes('biolog') || 
      profSpec.includes('dent')
    );
  }, [docParam, appointment]);

  // Carrega parâmetros e busca agendamento
  useEffect(() => {
    const fetchAppointment = async () => {
      setIsLoading(true);
      try {
        let phoneParam = initialPhone;
        let idParam = initialAppointmentId;
        let doctorParam = '';

        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
          const hashParams = new URLSearchParams(hashQuery);

          if (!phoneParam) phoneParam = urlParams.get('phone') || hashParams.get('phone') || '';
          if (!idParam) idParam = urlParams.get('id') || hashParams.get('id') || '';
          doctorParam = urlParams.get('doc') || hashParams.get('doc') || '';
          
          if (doctorParam) setDocParam(doctorParam);
        }

        if (phoneParam) setTelefone(phoneParam);

        if (idParam || phoneParam) {
          let foundApp: any = null;

          // 1. Tenta API backend
          try {
            const res = await fetch(`/api/public/appointment?phone=${encodeURIComponent(phoneParam)}&id=${encodeURIComponent(idParam)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.appointment) foundApp = data.appointment;
            }
          } catch (_) {}

          // 2. Fallback direto no Supabase
          if (!foundApp && supabase) {
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
            } catch (_) {}
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

          // 3. Tenta carregar anamnese pré-existente
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
            }
          } catch (_) {}
        }
      } catch (err) {
        console.error("Erro ao buscar agendamento público:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [initialPhone, initialAppointmentId]);

  // Busca CEP automático via ViaCEP
  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error("Informe um CEP válido com 8 números.");
      return;
    }
    setIsSearchingCep(true);
    try {
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

  const toggleSintomaSistemico = (item: string) => {
    setSintomasSistemicos(prev => 
      prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]
    );
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
      alergias.forEach(a => alertas.push(`ALERGIA: ${a.toUpperCase()}`));
    } else if (alergiaTexto.trim()) {
      alertas.push(`ALERGIA: ${alergiaTexto.toUpperCase()}`);
    }

    // Alertas específicos odontológicos
    if (isDentalMode) {
      if (temAmalgama === 'sim') alertas.push(`AMÁLGAMAS METÁLICOS (${qtdAmalgamas.toUpperCase()})`);
      if (temCanalTratado) alertas.push("DENTES COM TRATAMENTO DE CANAL (ENDODONTIA)");
      if (dorIncomodoCanal) alertas.push("DESCONFORTO / DOR EM CANAL");
      if (extraiuSisos) alertas.push("HISTÓRICO EXTRAÇÃO DE SISOS");
      if (dorNevralgiaFace) alertas.push("SUSPEITA DE NEVRALGIA / FOCO CAVITAÇÃO");
      if (temBruxismo) alertas.push("BRUXISMO / APERTAMENTO");
      if (dorAtmMatinal) alertas.push("DORES ATM / CEFALEIA MATINAL");
      if (alergiaMetais) alertas.push("SENSIBILIDADE A METAIS / BIJUTERIAS");
      if (gostoMetalicoBoca) alertas.push("ELETROGALVANISMO / GOSTO METÁLICO");
      if (temImplanteTitanio) alertas.push("POSSUI IMPLANTE DE TITÂNIO");
      if (interesseZirconia) alertas.push("INTERESSE EM IMPLANTES ZIRCÔNIA");
    } else {
      if (temEnxaqueca) alertas.push("CEFALEIA / ENXAQUECA CRÔNICA");
      if (temParestesia) alertas.push("PARESTESIA / FORMIGAMENTO");
      if (temTonturaLabirintite) alertas.push("TONTURA / LABIRINTITE");
      if (qualidadeSono !== 'bom') alertas.push(`ALTERAÇÃO DE SONO: ${qualidadeSono.toUpperCase()}`);
      if (queixaMemoria) alertas.push("DIFICULDADE DE MEMÓRIA / CONCENTRAÇÃO");
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
      isDental: isDentalMode,
      odontologia_biologica: isDentalMode ? {
        tem_amalgama: temAmalgama,
        qtd_amalgamas: qtdAmalgamas,
        deseja_smart: desejaSmart,
        tem_canal: temCanalTratado,
        dor_canal: dorIncomodoCanal,
        extraiu_sisos: extraiuSisos,
        dor_nevralgia: dorNevralgiaFace,
        bruxismo: temBruxismo,
        dor_atm_matinal: dorAtmMatinal,
        alergia_metais: alergiaMetais,
        gosto_metalico: gostoMetalicoBoca,
        implante_titanio: temImplanteTitanio,
        interesse_zirconia: interesseZirconia,
        sintomas_sistemicos: sintomasSistemicos,
        suplementos_atuais: suplementosAtuais
      } : undefined,
      neurologia_integrativa: !isDentalMode ? {
        enxaqueca: temEnxaqueca,
        parestesia: temParestesia,
        tontura: temTonturaLabirintite,
        qualidade_sono: qualidadeSono,
        memoria: queixaMemoria
      } : undefined,
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
    } catch (_) {}

    // Salva diretamente no Supabase se disponível
    try {
      if (supabase) {
        const updateObj: any = {
          status: 'Confirmado',
          status_anamnese: 'preenchida',
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

        // Registra o pré-cadastro na tabela de prontuários
        await supabase.from('prontuarios').insert([{
          paciente_nome_completo: nome,
          paciente_telefone: telefone,
          paciente_cpf: cpf,
          paciente_data_nascimento: dataNascimento,
          data_nascimento: dataNascimento,
          especialidade: isDentalMode ? 'Odontologia Biológica' : 'Neurologia',
          resumo_formatado: `Pré-Anamnese Digital preenchida pelo paciente. Alertas: ${alertas.join(', ') || 'Nenhum'}. Queixa: ${observacoesClinicas || 'Avaliação geral'}.`,
          dados_clinicos: payload,
          dados_especialidade: isDentalMode ? {
            amalgama_ativo: temAmalgama === 'sim',
            amalgama_elementos: qtdAmalgamas,
            smart_dique_nitrilo: desejaSmart,
            smart_oxigenio_nasal: desejaSmart,
            smart_exaustor_vapor: desejaSmart,
            focos_cavitacao_ativo: extraiuSisos && dorNevralgiaFace,
            focos_descricao: dorNevralgiaFace ? 'Relato de queimação/nevralgia em área de sisos extraídos' : '',
            implante_zirconia_ativo: interesseZirconia,
            atm_bruxismo_ativo: temBruxismo || dorAtmMatinal,
            observacoes_odonto_biologica: observacoesClinicas
          } : undefined
        }]);
      }
    } catch (supaErr) {
      console.warn("Aviso ao salvar no Supabase:", supaErr);
    }

    // Tenta salvar via API backend
    try {
      await fetch('/api/public/submit-anamnese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (_) {}

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('anamnese_submitted', { detail: payload }));
      } catch (_) {}
    }

    setIsSubmitted(true);
    toast.success("Pré-anamnese enviada com sucesso!");
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
            <h1 className="text-2xl font-bold text-slate-900">Consulta Confirmada!</h1>
            <p className="text-sm text-slate-500 mt-2">
              Olá, <strong className="text-slate-800">{nome}</strong>! Sua Pré-Anamnese foi recebida com sucesso e já está vinculada ao seu prontuário digital.
            </p>
          </div>

          {appointment && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Data: {formatAppointmentDate(appointment).dateStr}
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Clock className="w-4 h-4 text-emerald-600" />
                Horário: {formatAppointmentDate(appointment).timeStr}
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                {isDentalMode ? <Smile className="w-4 h-4 text-emerald-600" /> : <Stethoscope className="w-4 h-4 text-blue-600" />}
                Profissional: {appointment.medico_nome || (isDentalMode ? 'Dra. Lucy Murata' : 'Dr. Carlos Morato')}
              </div>
            </div>
          )}

          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
            {isDentalMode 
              ? "🌿 Agradecemos por preencher os dados de saúde biológica. Nos vemos no consultório!"
              : "🧠 Seus dados médicos foram recebidos. Aguardamos você para sua avaliação clínica!"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* Cabeçalho da Clínica Dinâmico */}
        {isDentalMode ? (
          <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 p-6 text-white text-center relative">
            <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-2 border border-white/20 shadow-md">
              <Smile className="w-8 h-8 text-emerald-200" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Consultório Dra. Lucy Murata</h1>
            <p className="text-xs text-emerald-100 font-bold mt-0.5">
              Odontologia Biológica, Cirurgia Zircônia & Saúde Integrativa • CRO-SP 69246
            </p>
            <p className="text-[11px] text-emerald-200/80 mt-1">
              Torre II - Praça Maastricht, 200 - Sl 103 - Bragança Paulista - SP
            </p>
            
            {appointment && (
              <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap justify-center gap-4 text-xs font-semibold text-emerald-50">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatAppointmentDate(appointment).dateStr}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatAppointmentDate(appointment).timeStr}</span>
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Dra. Lucy Murata</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-900 p-6 text-white text-center relative">
            <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-2 border border-white/20 shadow-md">
              <Stethoscope className="w-8 h-8 text-blue-200" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Clínica Dr. Carlos Morato</h1>
            <p className="text-xs text-blue-100 font-bold mt-0.5">
              Neurologia Clínica & Medicina Integrativa • CRM/SP 145.892
            </p>
            <p className="text-[11px] text-blue-200/80 mt-1">
              Ficha de Pré-Anamnese Clínica & Confirmação de Presença
            </p>
            
            {appointment && (
              <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap justify-center gap-4 text-xs font-semibold text-blue-50">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatAppointmentDate(appointment).dateStr}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatAppointmentDate(appointment).timeStr}</span>
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Dr. Carlos Morato</span>
              </div>
            )}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Seção 1: Identificação & Dados Pessoais */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className={`w-4 h-4 ${isDentalMode ? 'text-emerald-600' : 'text-blue-600'}`} /> 
              1. Identificação & Dados Pessoais
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={`w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-medium transition-all ${
                    isDentalMode ? 'focus:border-emerald-600 focus:bg-white' : 'focus:border-blue-600 focus:bg-white'
                  }`}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">WhatsApp / Celular</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-medium"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-medium"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Data de Nascimento</label>
                  {dataNascimento && (
                    <span className="text-[11px] font-bold text-slate-500">
                      {calculateAge(dataNascimento)} anos
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço & CEP */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <MapPin className={`w-4 h-4 ${isDentalMode ? 'text-emerald-600' : 'text-blue-600'}`} /> 
              2. Endereço Residencial
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">CEP</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    onBlur={handleCepSearch}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCepSearch}
                    disabled={isSearchingCep}
                    className={`px-3 py-2 text-white rounded-xl text-xs font-bold transition-colors ${
                      isDentalMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSearchingCep ? "..." : <Search className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Rua / Logradouro</label>
                <input
                  type="text"
                  placeholder="Rua, Avenida, Praça..."
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Número</label>
                <input
                  type="text"
                  placeholder="Nº"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bairro</label>
                <input
                  type="text"
                  placeholder="Bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cidade</label>
                <input
                  type="text"
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">UF</label>
                <input
                  type="text"
                  placeholder="SP"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full mt-0.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Alertas Médicos e Saúde Geral */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> 
              3. Alertas Médicos & Saúde Geral
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="checkbox" checked={isHipertenso} onChange={(e) => setIsHipertenso(e.target.checked)} className="rounded text-emerald-600" />
                <span className="font-medium text-slate-700">Pressão Alta (Hipertensão)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="checkbox" checked={isDiabetico} onChange={(e) => setIsDiabetico(e.target.checked)} className="rounded text-emerald-600" />
                <span className="font-medium text-slate-700">Diabetes</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="checkbox" checked={temCardiopatia} onChange={(e) => setTemCardiopatia(e.target.checked)} className="rounded text-emerald-600" />
                <span className="font-medium text-slate-700">Problemas Cardíacos (Cardiopatia)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="checkbox" checked={temMarcapasso} onChange={(e) => setTemMarcapasso(e.target.checked)} className="rounded text-emerald-600" />
                <span className="font-medium text-slate-700">Uso de Marcapasso</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100 transition-colors sm:col-span-2">
                <input type="checkbox" checked={usaAnticoagulante} onChange={(e) => setUsaAnticoagulante(e.target.checked)} className="rounded text-emerald-600" />
                <span className="font-medium text-slate-700">Usa Anticoagulantes (Aspirina, Marevan, Xarelto, etc.)</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Alergias a Medicamentos / Substâncias:</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['Penicilina', 'Dipirona', 'Ibuprofeno', 'Anestésico Local', 'Frutos do Mar', 'Látex', 'Metais / Níquel'].map(item => (
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
          </div>

          {/* Seção 4: QUESTIONÁRIO ESPECÍFICO DE ODONTOLOGIA BIOLÓGICA (DRA. LUCY) */}
          {isDentalMode && (
            <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                  <Sparkles size={18} className="text-emerald-600" />
                  <span>4. Questionário de Odontologia Biológica & Focos Sistêmicos</span>
                </div>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Dra. Lucy Murata
                </span>
              </div>

              {/* 1. Amálgamas & Protocolo SMART */}
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 space-y-2.5 text-xs shadow-2xs">
                <label className="font-bold text-slate-900 block">
                  1. Possui restaurações escuras metálicas (Amálgama de prata / mercúrio)?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'nao', label: 'Não possuo' },
                    { id: 'sim', label: 'Sim, possuo' },
                    { id: 'ja_removeu', label: 'Já removi no passado' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTemAmalgama(opt.id as any)}
                      className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                        temAmalgama === opt.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {temAmalgama === 'sim' && (
                  <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-semibold">Quantidade aproximada:</span>
                      <select
                        value={qtdAmalgamas}
                        onChange={(e) => setQtdAmalgamas(e.target.value)}
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                      >
                        <option value="1 a 2 dentes">1 a 2 dentes</option>
                        <option value="3 a 5 dentes">3 a 5 dentes</option>
                        <option value="6 ou mais dentes">6 ou mais dentes</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={desejaSmart}
                        onChange={(e) => setDesejaSmart(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span className="text-[11px] font-bold text-emerald-900">
                        Tenho interesse na remoção segura com Protocolo SMART (IAOMT) - proteção respiratória e barreira de mercúrio.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* 2. Tratamento de Canal */}
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 space-y-2 text-xs shadow-2xs">
                <label className="font-bold text-slate-900 flex items-center justify-between cursor-pointer">
                  <span>2. Possui dentes desvitalizados ou com Canal Tratado (Endodontia)?</span>
                  <input
                    type="checkbox"
                    checked={temCanalTratado}
                    onChange={(e) => setTemCanalTratado(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                </label>
                {temCanalTratado && (
                  <label className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={dorIncomodoCanal}
                      onChange={(e) => setDorIncomodoCanal(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-[11px] font-semibold text-amber-900">
                      Sinto peso, pressão, gosto ruim ou incômodo ao mastigar nessa região.
                    </span>
                  </label>
                )}
              </div>

              {/* 3. Extração de Sisos & Cavitações (NICO/FDOK) */}
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 space-y-2 text-xs shadow-2xs">
                <label className="font-bold text-slate-900 flex items-center justify-between cursor-pointer">
                  <span>3. Já realizou a extração dos dentes do Siso?</span>
                  <input
                    type="checkbox"
                    checked={extraiuSisos}
                    onChange={(e) => setExtraiuSisos(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                </label>
                {extraiuSisos && (
                  <label className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={dorNevralgiaFace}
                      onChange={(e) => setDorNevralgiaFace(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-[11px] font-semibold text-amber-900">
                      Apresento nevralgias na face, pontadas ou sensação de queimação óssea profunda.
                    </span>
                  </label>
                )}
              </div>

              {/* 4. Bruxismo & Disfunção de ATM */}
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 space-y-2 text-xs shadow-2xs">
                <label className="font-bold text-slate-900 flex items-center justify-between cursor-pointer">
                  <span>4. Costuma apertar ou ranger os dentes (Bruxismo)?</span>
                  <input
                    type="checkbox"
                    checked={temBruxismo}
                    onChange={(e) => setTemBruxismo(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                </label>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={dorAtmMatinal}
                    onChange={(e) => setDorAtmMatinal(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="text-slate-700 font-medium">
                    Acordo com cansaço na mandíbula, estalos perto do ouvido ou dores de cabeça matinais.
                  </span>
                </label>
              </div>

              {/* 5. Sensibilidade a Metais & Eletrogalvanismo */}
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 space-y-2 text-xs shadow-2xs">
                <label className="font-bold text-slate-900 block">5. Sensibilidade a Metais & Reabilitação Cerâmica:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alergiaMetais}
                      onChange={(e) => setAlergiaMetais(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="text-slate-700">Tenho alergia a brincos de metal, bijuterias, fivelas ou níquel.</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gostoMetalicoBoca}
                      onChange={(e) => setGostoMetalicoBoca(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="text-slate-700">Sinto gosto metálico na boca, saliva ácida ou choque ao encostar talher.</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={temImplanteTitanio}
                      onChange={(e) => setTemImplanteTitanio(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="text-slate-700">Possuo implantes dentários metálicos (Titânio) ou dentes ausentes.</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interesseZirconia}
                      onChange={(e) => setInteresseZirconia(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="text-slate-700 font-bold text-emerald-900">
                      Tenho interesse em Implantes Cerâmicos de Zircônia (100% livres de metal).
                    </span>
                  </label>
                </div>
              </div>

              {/* 6. Sintomas Sistêmicos / Focos Bucais */}
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 space-y-2 text-xs shadow-2xs">
                <label className="font-bold text-slate-900 block">
                  6. Apresenta algum destes sintomas crônicos frequentes? (Selecione se houver)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    'Fadiga Crônica / Cansaço sem Motivo',
                    'Névoa Mental (Brain Fog) / Falta de Foco',
                    'Dores Articulares ou Musculares Difusas',
                    'Rinite ou Sinusite de Repetição',
                    'Zumbido no Ouvido',
                    'Alterações Intestinais / Disbiose'
                  ].map(sintoma => (
                    <button
                      key={sintoma}
                      type="button"
                      onClick={() => toggleSintomaSistemico(sintoma)}
                      className={`p-2 rounded-xl text-[11px] font-semibold border text-left transition-all ${
                        sintomasSistemicos.includes(sintoma)
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sintomasSistemicos.includes(sintoma) ? '✓ ' : '+ '}{sintoma}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Suplementação em Uso */}
              <div>
                <label className="text-xs font-bold text-emerald-950 block mb-1">
                  Suplementação em uso (Vitaminas, Minerais ou Fitoterápicos):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vitamina D3 10.000 UI, K2, Magnésio, Vitamina C, Coenzima Q10..."
                  value={suplementosAtuais}
                  onChange={(e) => setSuplementosAtuais(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Seção 4 (Alternativa): NEUROLOGIA & MEDICINA INTEGRATIVA (DR. CARLOS) */}
          {!isDentalMode && (
            <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <div className="flex items-center gap-2 text-blue-950 font-black text-sm">
                  <Activity size={18} className="text-blue-600" />
                  <span>4. Rastreio Neurológico & Medicina Integrativa</span>
                </div>
                <span className="text-[10px] bg-blue-200 text-blue-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Dr. Carlos Morato
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-3 bg-white border border-blue-100 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temEnxaqueca}
                    onChange={(e) => setTemEnxaqueca(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-800">Dores de Cabeça Frequentes ou Enxaqueca</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-white border border-blue-100 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temParestesia}
                    onChange={(e) => setTemParestesia(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-800">Formigamentos, Dormência ou Perda de Força</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-white border border-blue-100 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temTonturaLabirintite}
                    onChange={(e) => setTemTonturaLabirintite(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-800">Tontura, Vertigem ou Instabilidade no Andar</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-white border border-blue-100 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={queixaMemoria}
                    onChange={(e) => setQueixaMemoria(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-800">Dificuldade de Memória ou Concentração</span>
                </label>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-blue-100 text-xs space-y-1.5">
                <label className="font-bold text-slate-900 block">Qualidade do seu Sono:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bom', label: 'Sono Reparador' },
                    { id: 'insonia', label: 'Insônia / Dificuldade' },
                    { id: 'acorda_cansado', label: 'Acordo Cansado' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQualidadeSono(opt.id as any)}
                      className={`p-2 rounded-xl text-center font-bold border transition-all ${
                        qualidadeSono === opt.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Motivo Principal / Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {isDentalMode 
                ? "Qual é o motivo principal da sua consulta com a Dra. Lucy? (Queixa principal ou procedimento desejado):"
                : "Qual é o motivo principal da sua consulta com o Dr. Carlos?:"}
            </label>
            <textarea
              rows={3}
              placeholder={isDentalMode 
                ? "Ex: Gostaria de avaliar a remoção dos meus amálgamas com segurança, colocar implante cerâmico e tratar dores na mandíbula..."
                : "Ex: Venho sentindo dores de cabeça frequentes e gostaria de uma avaliação neurológica e integrativa..."}
              value={observacoesClinicas}
              onChange={(e) => setObservacoesClinicas(e.target.value)}
              className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none transition-all ${
                isDentalMode ? 'focus:border-emerald-600 focus:bg-white' : 'focus:border-blue-600 focus:bg-white'
              }`}
            />
          </div>

          {/* Seção LGPD */}
          <div className={`p-3.5 border rounded-2xl flex items-start gap-2.5 text-xs ${
            isDentalMode ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950' : 'bg-blue-50/60 border-blue-100 text-blue-950'
          }`}>
            <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${isDentalMode ? 'text-emerald-600' : 'text-blue-600'}`} />
            <label className="cursor-pointer font-medium leading-relaxed">
              <input
                type="checkbox"
                checked={aceitouTermoVeracidade}
                onChange={(e) => setAceitouTermoVeracidade(e.target.checked)}
                className={`mr-2 rounded ${isDentalMode ? 'text-emerald-600' : 'text-blue-600'}`}
              />
              Declaro que as informações acima são verdadeiras e autorizo o uso sigiloso dos meus dados clínicos e odontológicos para a elaboração do meu prontuário e atendimento na clínica, em estrita conformidade com a LGPD.
            </label>
          </div>

          {/* Botão Submeter */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 text-white font-extrabold rounded-2xl shadow-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDentalMode 
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/20 active:scale-99'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-indigo-600/20 active:scale-99'
            }`}
          >
            {isSubmitting ? (
              <span>Salvando sua ficha...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> 
                <span>Confirmar Presença & Enviar Ficha de Pré-Anamnese</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
