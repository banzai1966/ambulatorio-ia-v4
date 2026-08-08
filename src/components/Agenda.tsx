import { useState, useEffect } from 'react';
// Forçando reprocessamento do arquivo pelo Vite
import { 
  Calendar, 
  Plus, 
  Clock, 
  User, 
  FileText, 
  X, 
  Search, 
  ChevronRight, 
  Stethoscope, 
  MessageSquare, 
  Send, 
  Loader2, 
  RefreshCw,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { getAvailableSlots, getDoctorsBySpecialty } from '../services/schedulingService';

interface Appointment {
  id: string;
  paciente_nome: string;
  paciente_telefone?: string;
  data_hora_inicio: string;
  status: string;
  motivo: string;
  medico_id: string;
  medico_nome?: string;
  medico_especialidade?: string;
  convenio?: string;
  valor_consulta?: string;
  status_pagamento?: string;
  tipo_consulta?: string;
}

interface Doctor {
  id: string;
  email?: string;
  full_name?: string;
}

export default function Agenda({ onStartConsultation, onOpenChat, user, prefillPatient }: { 
  onStartConsultation: (paciente: string, telefone?: string, motivo?: string, medicoId?: string, appointmentId?: string, convenio?: string, especialidade?: string) => void, 
  onOpenChat: (phone: string) => void,
  user: any, 
  prefillPatient?: {name: string, phone: string} | null 
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<{id: string, nome: string}[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>(user?.role === 'doctor' ? user.id : '');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ 
    paciente_nome: prefillPatient?.name || '', 
    paciente_telefone: prefillPatient?.phone || '', 
    data_hora_inicio: '', 
    motivo: '', 
    medico_id: user?.role === 'doctor' ? user.id : '',
    especialidade_id: '',
    convenio: 'SulAmérica Saúde',
    valor_consulta: '350',
    status_pagamento: 'Pago',
    tipo_consulta: 'Primeira Consulta'
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [testPhone, setTestPhone] = useState('');

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmado':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold'; // Amarelo
      case 'presente':
      case 'aguardando':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'; // Verde
      case 'em atendimento':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold'; // Roxo
      case 'atendido':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold'; // Indigo
      case 'agendado':
      case 'não confirmado':
      default:
        return 'bg-blue-100 text-blue-900 border-blue-300 font-bold'; // Azul
    }
  };

  const handleSendConfirmation = async (app: Appointment) => {
    if (!app.paciente_telefone) {
      toast.error("Paciente não possui telefone cadastrado.");
      return;
    }
    const toastId = toast.loading("Enviando confirmação no WhatsApp...");
    try {
      const res = await fetch('/api/whatsapp/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: app.paciente_telefone,
          patientName: app.paciente_nome,
          doctorName: app.medico_nome,
          date: new Date(app.data_hora_inicio).toLocaleDateString('pt-BR'),
          time: `${new Date(app.data_hora_inicio).getHours().toString().padStart(2, '0')}:${new Date(app.data_hora_inicio).getMinutes().toString().padStart(2, '0')}`,
          appointmentId: app.id
        })
      });

      if (!res.ok) throw new Error("Falha no disparo");

      toast.success("Confirmação e Link de Anamnese enviados com sucesso!", { id: toastId });
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem: " + err.message, { id: toastId });
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
    fetchSpecialties();
    
    // Garantir que o medico_id seja preenchido se o usuário for médico
    if (user?.role === 'doctor' && !newAppointment.medico_id) {
      setNewAppointment(prev => ({ ...prev, medico_id: user.id }));
    }
  }, [selectedMedicoId, user]);

  const fetchSpecialties = async () => {
    // Começa com os padrões para garantir que nunca esteja vazio na UI
    const defaults = [
      { id: 'integrativa', nome: 'Medicina Integrativa' },
      { id: 'odontologia_biologica', nome: 'Odontologia Biológica & Harmonização' },
      { id: 'neurologia', nome: 'Neurologia Especializada' },
      { id: 'clinica_geral', nome: 'Clínica Geral & Rotina' }
    ];
    setSpecialties(defaults);

    try {
      console.log("Agenda: Buscando especialidades...");
      // Busca tentando pegar tanto 'nome' quanto 'name' caso um deles não exista
      const { data, error } = await supabase
        .from('specialties')
        .select('id, nome')
        .order('nome', { ascending: true, nullsFirst: false });
      
      if (error) {
        console.error("Erro ao buscar especialidades:", error);
        // Se a tabela não existir, mantemos os padrões
        return;
      }

      if (data && data.length > 0) {
        const filtered = data.map((s: any) => ({
          id: s.id,
          nome: s.nome || s.name || 'Sem Nome'
        })).filter(s => s.nome && s.nome !== 'Selecione a Especialidade');

        if (filtered.length > 0) {
          console.log("Agenda: Especialidades encontradas no banco:", filtered);
          setSpecialties(filtered);
          return;
        }
      }

      console.log("Agenda: Banco de especialidades vazio, tentando inserir padrões...");
      // Se o banco estiver vazio, tenta criar as especialidades padrão
      const { data: inserted, error: insertError } = await supabase
        .from('specialties')
        .insert([{ nome: 'Neurologia' }, { nome: 'Ortopedia' }])
        .select();

      if (insertError) {
        console.error("Erro ao inserir especialidades padrão:", insertError);
      } else if (inserted && inserted.length > 0) {
        const formatted = inserted.map((s: any) => ({
          id: s.id,
          nome: s.nome || s.name || 'Sem Nome'
        }));
        console.log("Agenda: Especialidades padrão inseridas com sucesso:", formatted);
        setSpecialties(formatted);
      }
    } catch (err) {
      console.error("Erro crítico em fetchSpecialties:", err);
    }
  };

  useEffect(() => {
    const date = newAppointment.data_hora_inicio.split('T')[0];
    if (newAppointment.medico_id && date && date.length === 10) {
      console.log("Agenda: Buscando horários para médico:", newAppointment.medico_id, "data:", date);
      setIsLoadingSlots(true);
      getAvailableSlots(newAppointment.medico_id, date)
        .then(slots => {
          console.log("Agenda: Horários recebidos:", slots);
          setAvailableSlots(slots);
        })
        .catch(err => {
          console.error("Agenda: Erro ao buscar horários:", err);
          setAvailableSlots([]);
        })
        .finally(() => setIsLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [newAppointment.medico_id, newAppointment.data_hora_inicio.split('T')[0]]);

  const fetchDoctors = async (specialtyId?: string) => {
    try {
      const id = specialtyId !== undefined ? specialtyId : selectedSpecialty;
      console.log("Agenda: Buscando médicos para especialidade ID:", id);
      
      let doctorsList: Doctor[] = [];

      // Se tivermos um ID que parece ser do banco (UUID) ou especialidade padrão
      if (id) {
        const specialty = specialties.find(s => s.id === id);
        if (specialty) {
          doctorsList = await getDoctorsBySpecialty(specialty.nome);
        } else if (id === 'neurologia' || id === 'ortopedia') {
          // Fallback para especialidades padrão
          doctorsList = await getDoctorsBySpecialty(id === 'neurologia' ? 'Neurologia' : 'Ortopedia');
        }
      }
      
      // Se não encontrou médicos pela especialidade ou não tem especialidade selecionada
      if (doctorsList.length === 0) {
        console.log("Agenda: Buscando todos os médicos (fallback)...");
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('role', 'doctor');
        
        if (error) throw error;
        doctorsList = data || [];
      }

      console.log("Agenda: Médicos encontrados:", doctorsList);
      setDoctors(doctorsList);
    } catch (err) {
      console.error("Erro ao buscar médicos:", err);
      // Fallback final: tenta buscar sem filtros
      const { data } = await supabase.from('profiles').select('id, email, full_name').eq('role', 'doctor');
      if (data) setDoctors(data);
    }
  };

  const [testMessage, setTestMessage] = useState('Olá! Esta é uma mensagem de teste do seu Ambulatório IA.');

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      console.log("Agenda: Iniciando busca de agendamentos...");
      
      const tryFetch = async (tableName: string, columns: string = '*'): Promise<any> => {
        let query = supabase.from(tableName).select(columns);
        
        // Só tenta ordenar se a coluna existir no select ou se for '*'
        if (columns === '*' || columns.includes('created_at')) {
          query = query.order('created_at', { ascending: false });
        } else if (columns.includes('data_hora_inicio')) {
          query = query.order('data_hora_inicio', { ascending: false });
        }

        const { data, error } = await query;
        if (error) {
          console.warn(`Agenda: Erro ao buscar de '${tableName}' com colunas '${columns}':`, error.message);
          
          // Se o erro for de coluna inexistente (como created_at na ordenação)
          if (error.message.includes('column') && error.message.includes('does not exist')) {
            if (columns === '*') {
              // Se falhou com '*', tenta colunas específicas básicas
              return tryFetch(tableName, 'id, paciente_nome, data_hora_inicio, status, motivo, medico_id');
            } else {
              // Se falhou com colunas específicas, tenta remover a problemática se identificada
              const match = error.message.match(/column "([^"]+)"/);
              if (match && match[1]) {
                const missing = match[1];
                const newCols = columns.split(',').map(c => c.trim()).filter(c => c !== missing).join(', ');
                if (newCols) return tryFetch(tableName, newCols);
              }
            }
          }
          throw error;
        }
        return data;
      };

      let data;
      try {
        data = await tryFetch('agendamentos');
      } catch (err) {
        try {
          data = await tryFetch('appointments');
        } catch (altErr) {
          console.error("Agenda: Falha total ao buscar agendamentos:", altErr);
          setAppointments([]);
          return;
        }
      }

      if (data) {
        console.log(`Agenda: ${data.length} registros brutos encontrados.`);
        
        const formattedAppointments = await Promise.all(data.map(async (app: any) => {
          // Mapeamento flexível de campos (suporta ambos os esquemas)
          const paciente_nome = app.paciente_nome || app.patient_name || 'Paciente';
          const paciente_telefone = app.paciente_telefone || app.patient_phone || '';
          const data_consulta = app.data_consulta || app.appointment_date;
          const hora_consulta = app.hora_consulta || app.appointment_time;
          const medico_id = app.medico_id || app.doctor_id || app.user_id || '';
          const motivo = app.motivo || app.reason || '';
          const status = app.status || 'Agendado';

          let medicoNome = app.medico_nome || 'Médico';
          let especialidadeNome = app.especialidade_nome || 'Clínico Geral';
          
          // Busca informações do médico se não estiverem no registro
          if ((medicoNome === 'Médico' || !especialidadeNome) && medico_id) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, especialidade')
                .eq('id', medico_id)
                .maybeSingle();
                
              if (profileData) {
                if (medicoNome === 'Médico') medicoNome = profileData.full_name || medicoNome;
                especialidadeNome = profileData.especialidade || especialidadeNome;
              }
            } catch (e) {
              console.warn("Erro ao buscar perfil do médico:", e);
            }
          }

          // Normalização de data/hora
          let dataHoraInicio = app.data_hora_inicio || app.data_hora;
          if (!dataHoraInicio && data_consulta) {
            dataHoraInicio = hora_consulta ? `${data_consulta}T${hora_consulta}` : `${data_consulta}T08:00:00`;
          }
          if (!dataHoraInicio) dataHoraInicio = new Date().toISOString();

          const convenio = app.convenio || app.health_insurance || 'SulAmérica Saúde';
          const valor_consulta = app.valor_consulta || '350';
          const status_pagamento = app.status_pagamento || 'Pago';
          const tipo_consulta = app.tipo_consulta || 'Primeira Consulta';

          return {
            id: app.id,
            paciente_nome,
            paciente_telefone,
            data_hora_inicio: dataHoraInicio,
            motivo,
            medico_id,
            status,
            medico_nome: medicoNome,
            medico_especialidade: especialidadeNome,
            convenio,
            valor_consulta,
            status_pagamento,
            tipo_consulta
          };
        }));

        // Filtro por médico selecionado (se houver)
        const filtered = selectedMedicoId 
          ? formattedAppointments.filter(a => a.medico_id === selectedMedicoId)
          : formattedAppointments;

        setAppointments(filtered);
      }
    } catch (err: any) {
      console.error("Erro crítico ao carregar agenda:", err);
      toast.error("Erro ao carregar agenda. Verifique sua conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  const addAppointment = async () => {
    // Validação básica
    if (!newAppointment.paciente_nome || !newAppointment.paciente_telefone || !newAppointment.data_hora_inicio || !newAppointment.medico_id) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Telefone, Data/Hora e Médico).');
      return;
    }

    // Se houver slots disponíveis, garante que um foi selecionado (não pode ser 00:00 se houver slots)
    if (availableSlots.length > 0 && newAppointment.data_hora_inicio.endsWith('T00:00')) {
      alert('Por favor, selecione um horário de atendimento disponível.');
      return;
    }

    setIsSaving(true);
    console.log("Agenda: Salvando agendamento completo...", newAppointment);
    
    try {
      const [date, time] = newAppointment.data_hora_inicio.split('T');
      const formattedTime = time ? (time.length === 5 ? `${time}:00` : time) : '00:00:00';
      const isoDateTime = new Date(newAppointment.data_hora_inicio).toISOString();

      const tryInsert = async (data: any, table: string = 'agendamentos'): Promise<{ error: any }> => {
        const { error } = await supabase.from(table).insert([data]).select('id');
        if (error) {
          console.warn(`Agenda: Erro ao salvar em ${table}:`, error.message);
          
          if (table === 'agendamentos' && (error.message.includes('does not exist') || error.message.includes('não existe') || error.message.includes('not found'))) {
            const legacyData = {
              patient_name: data.paciente_nome,
              patient_phone: data.paciente_telefone,
              appointment_date: data.data_consulta,
              appointment_time: data.hora_consulta,
              doctor_id: data.medico_id,
              reason: data.motivo,
              user_id: data.user_id
            };
            return tryInsert(legacyData, 'appointments');
          }

          const isMissingColumn = error.message.includes('column') || error.message.includes('coluna') || error.message.includes('Could not find');
          if (isMissingColumn) {
            const match = error.message.match(/["']([^"']+)["']/);
            if (match && match[1]) {
              const missingColumn = match[1];
              console.log(`Agenda: Removendo coluna inexistente '${missingColumn}' do insert...`);
              const { [missingColumn]: _, ...newData } = data;
              return tryInsert(newData, table);
            }
          }
          return { error };
        }
        return { error: null };
      };

      const selectedSpecialtyObj = specialties.find(s => s.id === newAppointment.especialidade_id);
      const selectedDoctor = doctors.find(d => d.id === (newAppointment.medico_id || user?.id));
      
      const initialData = {
        user_id: user?.id,
        paciente_nome: newAppointment.paciente_nome,
        paciente_telefone: newAppointment.paciente_telefone,
        data_consulta: date,
        hora_consulta: formattedTime,
        data_hora: isoDateTime, 
        data_hora_inicio: isoDateTime,
        medico_id: newAppointment.medico_id || user?.id,
        medico_nome: selectedDoctor?.full_name || user?.full_name || 'Médico',
        especialidade_id: (newAppointment.especialidade_id && newAppointment.especialidade_id.length > 20) ? newAppointment.especialidade_id : null,
        especialidade_nome: selectedSpecialtyObj?.nome || 'Clínico Geral',
        motivo: newAppointment.motivo,
        convenio: newAppointment.convenio,
        valor_consulta: newAppointment.valor_consulta,
        status_pagamento: newAppointment.status_pagamento,
        tipo_consulta: newAppointment.tipo_consulta,
        status: 'Agendado'
      };

      const { error } = await tryInsert(initialData);
      
      if (error) {
        console.error("Agenda: Erro ao salvar:", error);
        throw error;
      }

      console.log("Agenda: Agendamento salvo com sucesso!");
      setShowModal(false);
      fetchAppointments();
      toast.success("Agendamento realizado com sucesso!");
      
      setNewAppointment({ 
        paciente_nome: '', 
        paciente_telefone: '', 
        data_hora_inicio: '', 
        motivo: '', 
        medico_id: user?.role === 'doctor' ? user.id : '',
        especialidade_id: '',
        convenio: 'SulAmérica Saúde',
        valor_consulta: '350',
        status_pagamento: 'Pago',
        tipo_consulta: 'Primeira Consulta'
      });
      setAvailableSlots([]);
    } catch (err: any) {
      console.error('Erro ao salvar agendamento:', err);
      toast.error(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone) {
      toast.error('Por favor, insira um número de telefone para teste.');
      return;
    }
    setIsSaving(true);
    try {
      await sendWhatsAppMessage(testPhone, testMessage);
      toast.success('Mensagem enviada com sucesso!');
      setTestMessage('');
    } catch (error: any) {
      console.error('Error sending test message:', error);
      const errorDetails = error.response?.data?.details || error.response?.data?.error || error.message;
      toast.error(`Erro ao enviar mensagem: ${errorDetails}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = () => {
    // Se houver um médico selecionado no filtro, pré-seleciona ele no modal
    if (selectedMedicoId && !newAppointment.medico_id) {
      setNewAppointment(prev => ({ ...prev, medico_id: selectedMedicoId }));
    }
    setShowModal(true);
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Agenda de Consultas</h2>
            <p className="text-slate-500 mt-1">Gerencie os atendimentos do dia.</p>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Envio Rápido WhatsApp</span>
            <div className="flex flex-col gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <input 
                type="text"
                placeholder="Telefone (ex: 5511999999999)"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                className="p-2 border-b border-slate-100 outline-none text-sm"
              />
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="Mensagem..."
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="flex-1 p-2 outline-none text-sm"
                />
                <button 
                  onClick={handleTestWhatsApp}
                  disabled={isSaving}
                  className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                  title="Enviar agora"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Filtro de Médico para Recepcionista/Admin */}
          {(user?.role === 'admin' || user?.role === 'receptionist') && (
            <select 
              className="p-3 rounded-xl border border-slate-200 bg-white shadow-sm outline-none"
              value={selectedMedicoId}
              onChange={(e) => setSelectedMedicoId(e.target.value)}
            >
              <option value="">Todos os Médicos</option>
              {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.full_name || doc.email}</option>)}
            </select>
          )}

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchAppointments}
              className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-200 hover:text-clinical-blue transition-all shadow-sm"
              title="Atualizar Agenda"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={openModal}
              className="bg-clinical-blue text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 font-bold"
            >
              <Plus size={20} /> Novo Agendamento
            </button>
          </div>
        </div>
        
        {/* ... resto do componente ... */}

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-4">
              <Loader2 size={48} className="text-clinical-blue animate-spin" />
              <p className="text-slate-500 font-medium">Carregando agendamentos...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Nenhum agendamento para hoje</h3>
              <p className="text-slate-500">Clique em "Novo Agendamento" para começar.</p>
            </div>
          ) : (
            appointments.map((app) => (
              <div key={app.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-clinical-blue/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-clinical-blue group-hover:bg-clinical-blue group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900">{app.paciente_nome}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border ${getStatusBadgeClass(app.status)}`}>
                        {app.status || 'Agendado'}
                      </span>
                      {app.convenio && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {app.convenio}
                        </span>
                      )}
                      {app.status_pagamento && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${app.status_pagamento === 'Pago' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {app.status_pagamento} • R$ {app.valor_consulta || '350'}
                        </span>
                      )}
                      {app.tipo_consulta && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {app.tipo_consulta}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} /> {new Date(app.data_hora_inicio).getHours().toString().padStart(2, '0')}:{new Date(app.data_hora_inicio).getMinutes().toString().padStart(2, '0')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} /> {new Date(app.data_hora_inicio).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'})}
                      </span>
                      <span className="flex items-center gap-1.5 text-clinical-blue font-medium">
                        <Stethoscope size={14} /> {app.medico_nome} {app.medico_especialidade && `(${app.medico_especialidade})`}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 px-3 py-1 rounded-lg inline-block">{app.motivo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendConfirmation(app)}
                    className="flex items-center gap-1 px-3 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                    title="Disparar confirmação de consulta com link de Anamnese no WhatsApp"
                  >
                    <Send size={14} /> Confirmação
                  </button>

                  <button 
                    onClick={() => {
                      if (app.paciente_telefone) {
                        onOpenChat(app.paciente_telefone);
                      } else {
                        toast.error("Paciente sem telefone cadastrado.");
                      }
                    }}
                    className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    title="Enviar Mensagem"
                  >
                    <MessageSquare size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      console.log("Agenda - Iniciar Atendimento - paciente:", app.paciente_nome, "telefone:", app.paciente_telefone, "convenio:", app.convenio, "especialidade:", app.medico_especialidade);
                      onStartConsultation(
                        app.paciente_nome, 
                        app.paciente_telefone, 
                        app.motivo, 
                        app.medico_id, 
                        app.id, 
                        app.convenio || 'SulAmérica Saúde', 
                        app.medico_especialidade || 'Clínico Geral'
                      );
                    }}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all font-bold group-hover:bg-clinical-blue"
                  >
                    <FileText size={18} /> Iniciar Atendimento
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 my-auto max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Novo Agendamento</h3>
                <p className="text-xs text-slate-500">Preencha os dados da consulta e do paciente</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
                title="Fechar (Esc)"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <input 
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all"
                placeholder="Nome do Paciente"
                value={newAppointment.paciente_nome}
                onChange={e => setNewAppointment({...newAppointment, paciente_nome: e.target.value})}
              />
              <input 
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all"
                placeholder="Telefone (ex: 5511999999999)"
                value={newAppointment.paciente_telefone}
                onChange={e => setNewAppointment({...newAppointment, paciente_telefone: e.target.value})}
              />
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Data da Consulta</label>
                <input 
                  type="date"
                  className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all"
                  value={newAppointment.data_hora_inicio.split('T')[0]}
                  onChange={e => {
                    const date = e.target.value;
                    const time = newAppointment.data_hora_inicio.split('T')[1] || '08:00';
                    setNewAppointment({...newAppointment, data_hora_inicio: `${date}T${time}`});
                  }}
                />
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Clock size={16} className="text-clinical-blue" />
                  Horário da Consulta
                </label>
                
                {!newAppointment.medico_id || !newAppointment.data_hora_inicio.split('T')[0] ? (
                  <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 text-xs text-center italic">
                    Selecione um médico e uma data para ver os horários.
                  </div>
                ) : isLoadingSlots ? (
                  <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 text-xs text-center flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin text-clinical-blue" /> Carregando horários...
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setNewAppointment({...newAppointment, data_hora_inicio: newAppointment.data_hora_inicio.split('T')[0] + 'T' + slot})}
                        className={`p-2 rounded-lg text-xs border transition-all ${newAppointment.data_hora_inicio.includes(slot) ? 'bg-clinical-blue text-white border-clinical-blue shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-clinical-blue hover:bg-blue-50'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      Nenhum horário pré-definido. Digite o horário:
                    </div>
                    <input 
                      type="time"
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg outline-none"
                      value={newAppointment.data_hora_inicio.split('T')[1] || '08:00'}
                      onChange={e => setNewAppointment({...newAppointment, data_hora_inicio: newAppointment.data_hora_inicio.split('T')[0] + 'T' + e.target.value})}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Convênio / Plano</label>
                  <select 
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:border-clinical-blue outline-none"
                    value={newAppointment.convenio}
                    onChange={e => setNewAppointment({...newAppointment, convenio: e.target.value})}
                  >
                    <option value="Particular">Particular</option>
                    <option value="SulAmérica Saúde">SulAmérica Saúde</option>
                    <option value="Bradesco Saúde">Bradesco Saúde</option>
                    <option value="Unimed">Unimed</option>
                    <option value="Amil Saúde">Amil Saúde</option>
                    <option value="Porto Seguro">Porto Seguro</option>
                    <option value="Cassi">Cassi</option>
                    <option value="Outro Convênio">Outro Convênio</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tipo de Consulta</label>
                  <select 
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:border-clinical-blue outline-none"
                    value={newAppointment.tipo_consulta}
                    onChange={e => setNewAppointment({...newAppointment, tipo_consulta: e.target.value})}
                  >
                    <option value="Primeira Consulta">Primeira Consulta</option>
                    <option value="Retorno">Retorno</option>
                    <option value="Procedimento / Harmonização">Procedimento / Harmonização</option>
                    <option value="Avaliação Integrativa">Avaliação Integrativa</option>
                    <option value="Emergência / Encaixe">Emergência / Encaixe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Valor (R$)</label>
                  <input 
                    type="number"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:border-clinical-blue outline-none"
                    placeholder="350"
                    value={newAppointment.valor_consulta}
                    onChange={e => setNewAppointment({...newAppointment, valor_consulta: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Status Pagamento</label>
                  <select 
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:border-clinical-blue outline-none"
                    value={newAppointment.status_pagamento}
                    onChange={e => setNewAppointment({...newAppointment, status_pagamento: e.target.value})}
                  >
                    <option value="Pago">Pago</option>
                    <option value="Pendente no Balcão">Pendente no Balcão</option>
                    <option value="Guia Faturada">Guia Faturada</option>
                    <option value="Cortesia / Isento">Cortesia / Isento</option>
                  </select>
                </div>
              </div>

              <select 
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all"
                value={newAppointment.especialidade_id}
                onChange={e => {
                  // Mantém o médico se for o próprio médico logado, senão limpa para forçar nova escolha baseada na especialidade
                  const nextMedicoId = user?.role === 'doctor' ? user.id : '';
                  setNewAppointment({...newAppointment, especialidade_id: e.target.value, medico_id: nextMedicoId});
                  fetchDoctors(e.target.value);
                }}
              >
                <option value="">Selecione a Especialidade</option>
                {specialties.length > 0 ? (
                  specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))
                ) : (
                  <>
                    <option value="integrativa">Medicina Integrativa</option>
                    <option value="odontologia_biologica">Odontologia Biológica & Harmonização</option>
                    <option value="neurologia">Neurologia Especializada</option>
                    <option value="clinica_geral">Clínica Geral & Rotina</option>
                  </>
                )}
              </select>
              {/* Seleção de Médico - Visível para Admin/Recep ou pré-selecionado para Médico */}
              {user?.role === 'doctor' ? (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-clinical-blue text-sm font-bold">
                  Médico Responsável: {user.full_name || user.email}
                </div>
              ) : (
                <select 
                  className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all"
                  value={newAppointment.medico_id}
                  onChange={e => setNewAppointment({...newAppointment, medico_id: e.target.value})}
                >
                  <option value="">Selecione o Médico</option>
                  {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.full_name || doc.email}</option>)}
                </select>
              )}
              <textarea 
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all"
                placeholder="Motivo da consulta"
                rows={3}
                value={newAppointment.motivo}
                onChange={e => setNewAppointment({...newAppointment, motivo: e.target.value})}
              />
              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/3 bg-slate-100 text-slate-700 p-4 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={addAppointment}
                  disabled={isSaving}
                  className="w-2/3 bg-clinical-blue text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Agendamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
