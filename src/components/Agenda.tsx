import { useState, useEffect } from 'react';
import axios from 'axios';
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
  Activity,
  Trash2,
  MapPin,
  ShieldCheck,
  ClipboardList,
  Copy,
  QrCode,
  ExternalLink,
  Check,
  CreditCard,
  DollarSign,
  Wallet,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { getAvailableSlots, getDoctorsBySpecialty } from '../services/schedulingService';
import PreConsultationAnamneseModal from './PreConsultationAnamneseModal';
import { calculateAge, formatDateMask } from '../lib/utils';

interface Appointment {
  id: string;
  paciente_nome: string;
  paciente_telefone?: string;
  paciente_cpf?: string;
  data_nascimento?: string;
  foto_url?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
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
  onStartConsultation: (
    paciente: string, 
    telefone?: string, 
    motivo?: string, 
    medicoId?: string, 
    appointmentId?: string, 
    convenio?: string, 
    especialidade?: string,
    statusPagamento?: string,
    valorConsulta?: string,
    dataNascimento?: string,
    cpf?: string
  ) => void, 
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
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false);
  const [selectedAppointmentForAnamnese, setSelectedAppointmentForAnamnese] = useState<Appointment | null>(null);
  const [isSendingAutoWhatsApp, setIsSendingAutoWhatsApp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Estados da Baixa de Pagamento Rápido na Recepção
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payingAppointment, setPayingAppointment] = useState<Appointment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash' | 'health_insurance'>('pix');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [newAppointment, setNewAppointment] = useState({ 
    paciente_nome: prefillPatient?.name || '', 
    paciente_telefone: prefillPatient?.phone || '', 
    paciente_cpf: '',
    data_nascimento: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    data_hora_inicio: '', 
    motivo: '', 
    medico_id: user?.role === 'doctor' ? user.id : '',
    especialidade_id: '',
    convenio: 'Particular / Convênio',
    valor_consulta: '',
    status_pagamento: 'Cortesia / Isento',
    tipo_consulta: 'Primeira Consulta'
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [testPhone, setTestPhone] = useState('');

  const handleCepSearch = async (cepValue?: string) => {
    const cleanCep = (cepValue || newAppointment.cep).replace(/\D/g, '');
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
        setNewAppointment(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado
        }));
        toast.success("Endereço preenchido automaticamente!");
      }
    } catch (e) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsSearchingCep(false);
    }
  };

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

  const handleDeleteAppointment = async (id: string, name: string) => {
    // Remove da tela imediatamente no 1º milissegundo
    setAppointments(prev => prev.filter(a => String(a.id) !== String(id)));
    toast.success(`Agendamento de ${name || 'paciente'} removido com sucesso.`);

    try {
      // 1. Deleta via API do servidor
      await fetch(`/api/agendamentos/${id}`, { method: 'DELETE' });
      
      // 2. Deleta via Supabase direto (dupla garantia)
      const numId = Number(id);
      if (!isNaN(numId)) {
        await supabase.from('agendamentos').delete().eq('id', numId);
      }
      await supabase.from('agendamentos').delete().eq('id', String(id));
    } catch (err) {
      console.error("Erro ao remover agendamento:", err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setAppointments(prev => prev.map(a => String(a.id) === String(id) ? { ...a, status: newStatus } : a));
    try {
      const numId = Number(id);
      if (!isNaN(numId)) {
        await supabase.from('agendamentos').update({ status: newStatus }).eq('id', numId);
      }
      await supabase.from('agendamentos').update({ status: newStatus }).eq('id', String(id));
      toast.success(`Status alterado para "${newStatus}"`);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  // Abrir modal de baixa financeira rápida
  const openPaymentModal = (app: Appointment) => {
    setPayingAppointment(app);
    // Tenta sugerir o valor padrão da consulta
    const defaultVal = app.valor_consulta ? app.valor_consulta.replace(/[^\d.,]/g, '').replace(',', '.') : '250.00';
    setPaymentAmount(defaultVal || '250.00');
    setPaymentMethod(app.convenio && app.convenio !== 'Particular / Convênio' && !app.convenio.toLowerCase().includes('particular') ? 'health_insurance' : 'pix');
    setPaymentNotes(`Recebimento ref. consulta - ${app.paciente_nome}`);
    setPaymentModalOpen(true);
  };

  // Confirmar recebimento do pagamento
  const handleConfirmPayment = async (sendReceiptWhatsApp: boolean = true) => {
    if (!payingAppointment) return;
    setIsProcessingPayment(true);
    const toastId = toast.loading("Registrando pagamento no caixa...");

    try {
      const numAmount = parseFloat(paymentAmount.replace(',', '.')) || 0;
      const methodLabels: Record<string, string> = {
        pix: 'PIX',
        credit_card: 'Cartão de Crédito',
        debit_card: 'Cartão de Débito',
        cash: 'Dinheiro',
        health_insurance: 'Convênio'
      };
      const labelMethod = methodLabels[paymentMethod] || 'PIX';

      // 1. Atualiza o status do agendamento para Pago com o método e valor
      const newStatusPagamento = `Pago (${labelMethod})`;
      const updatedValor = numAmount.toFixed(2);

      setAppointments(prev => prev.map(a => 
        String(a.id) === String(payingAppointment.id) 
          ? { ...a, status_pagamento: newStatusPagamento, valor_consulta: updatedValor } 
          : a
      ));

      // Atualiza no Supabase
      try {
        const numId = Number(payingAppointment.id);
        const updatePayload = {
          status_pagamento: newStatusPagamento,
          valor_consulta: updatedValor
        };
        if (!isNaN(numId)) {
          await supabase.from('agendamentos').update(updatePayload).eq('id', numId);
        }
        await supabase.from('agendamentos').update(updatePayload).eq('id', String(payingAppointment.id));
      } catch (errDb) {
        console.warn("Erro ao atualizar pagamento no banco:", errDb);
      }

      // 2. Registra a transação no Módulo Financeiro (Fluxo de Caixa)
      try {
        const newTransaction = {
          id: String(Date.now()),
          type: 'income',
          description: `Consulta - ${payingAppointment.paciente_nome}`,
          patientName: payingAppointment.paciente_nome,
          patientCpf: payingAppointment.paciente_cpf || '',
          amount: numAmount,
          category: payingAppointment.medico_especialidade || 'Consulta Médica',
          paymentMethod: paymentMethod,
          status: 'paid',
          date: new Date().toISOString().split('T')[0],
          doctorName: payingAppointment.medico_nome || 'Dr(a). da Clínica',
          notes: paymentNotes || `Recebido na recepção via ${labelMethod}`
        };

        const existingStr = localStorage.getItem('ambulatorio_financial_transactions');
        const existingList = existingStr ? JSON.parse(existingStr) : [];
        const updatedList = [newTransaction, ...existingList];
        localStorage.setItem('ambulatorio_financial_transactions', JSON.stringify(updatedList));
      } catch (errFin) {
        console.warn("Erro ao salvar no módulo financeiro:", errFin);
      }

      // 3. Envia Comprovante / Recibo no WhatsApp se solicitado
      if (sendReceiptWhatsApp && payingAppointment.paciente_telefone) {
        const digitsPhone = payingAppointment.paciente_telefone.replace(/\D/g, '');
        const cleanPhone = digitsPhone.startsWith('55') ? digitsPhone : `55${digitsPhone}`;
        const todayStr = new Date().toLocaleDateString('pt-BR');
        const formattedMoney = numAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const receiptMsg = `🧾 *COMPROVANTE DE PAGAMENTO - AMBULATÓRIO IA*\n\nOlá *${payingAppointment.paciente_nome}*,\nConfirmamos o recebimento da sua consulta!\n\n📋 *Detalhes do Recibo:*\n👨‍⚕️ *Profissional:* ${payingAppointment.medico_nome || 'Dr(a). da Clínica'}\n💵 *Valor Pago:* ${formattedMoney}\n💳 *Forma:* ${labelMethod}\n📅 *Data:* ${todayStr}\n\n✅ *Status:* Pagamento Confirmado & Check-in Liberado!\n\nObrigado pela preferência e tenha uma excelente consulta! 🏥`;

        try {
          let clinicConfig: any = {};
          try {
            const saved = localStorage.getItem('clinic_info');
            if (saved) clinicConfig = JSON.parse(saved);
          } catch (e) {}

          const evoUrl = clinicConfig.evolution_url || "https://api.makprojetosmake.com.br";
          const instance = clinicConfig.evolution_instance || "ambulatorio";
          const apiKey = clinicConfig.evolution_apikey || "E6247913DB92-48B4-8B54-5C7449EA639B";

          await axios.post(`${evoUrl}/message/sendText/${instance}`, {
            number: cleanPhone,
            text: receiptMsg
          }, {
            headers: { apikey: apiKey }
          });
        } catch (evoErr) {
          console.warn("Evolution API indisponível para envio de recibo:", evoErr);
        }
      }

      toast.success("✅ Pagamento registrado com sucesso e lançado no financeiro!", { id: toastId });
      setPaymentModalOpen(false);
      setPayingAppointment(null);
    } catch (e: any) {
      toast.error("Erro ao registrar pagamento: " + (e?.message || ''), { id: toastId });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSendConfirmation = async (app: Appointment) => {
    if (!app.paciente_telefone) {
      toast.error("Paciente não possui telefone cadastrado.");
      return;
    }
    await executeAutoWhatsAppSend(app);
  };

  const executeAutoWhatsAppSend = async (app: Appointment) => {
    setIsSendingAutoWhatsApp(true);
    const toastId = toast.loading("Enviando confirmação via WhatsApp...");
    const digitsPhone = (app.paciente_telefone || '').replace(/\D/g, '');
    const cleanPhone = digitsPhone.startsWith('55') ? digitsPhone : `55${digitsPhone}`;
    let baseUrl = window.location.origin;
    if (baseUrl.includes('localhost') || baseUrl.includes('aistudio.google.com')) {
      baseUrl = 'https://ais-dev-rb5uztjihjvkduwo7bhuyk-51327969358.us-east1.run.app';
    }
    const docName = app.medico_nome || 'Dr(a). da Clínica';
    
    // Tratamento robusto de data e hora para evitar 'Invalid Date'
    let aptDate = (app as any).data_consulta || '';
    let aptTime = (app as any).hora_consulta || '';
    if (!aptDate || !aptTime) {
      const raw = app.data_hora_inicio || (app as any).data_hora;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          if (!aptDate) aptDate = d.toLocaleDateString('pt-BR');
          if (!aptTime) aptTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
      }
    }
    if (!aptDate) aptDate = 'Data da consulta';
    if (!aptTime) aptTime = 'Horário agendado';

    const anamneseLink = `${baseUrl}/#anamnese?phone=${digitsPhone}&id=${app.id || '1'}`;
    const msgText = `Olá *${app.paciente_nome || 'Paciente'}*! 👋\n\nConfirmamos seu agendamento na nossa clínica:\n👨‍⚕️ *Profissional:* ${docName}\n📅 *Data:* ${aptDate}\n⏰ *Horário:* ${aptTime}\n\n👉 *Por favor, responda SIM para confirmar sua presença* ou *NÃO* caso precise reagendar.\n\n⚡ *Ficha de Pré-Cadastro Digital:*\nPara agilizar sua recepção e evitar filas na clínica, preencha seus dados rápidos pelo link:\n${anamneseLink}`;

    let sent = false;

    // 1. Tenta envio através do servidor backend com as credenciais salvas no localStorage
    let clinicConfig: any = {};
    try {
      const saved = localStorage.getItem('clinic_info');
      if (saved) clinicConfig = JSON.parse(saved);
    } catch (e) {}

    try {
      const res = await fetch('/api/whatsapp/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: app.paciente_telefone,
          patientName: app.paciente_nome,
          doctorName: docName,
          date: aptDate,
          time: aptTime,
          appointmentId: app.id,
          evolution_url: clinicConfig.evolution_url,
          evolution_instance: clinicConfig.evolution_instance,
          evolution_apikey: clinicConfig.evolution_apikey
        })
      });

      if (res.ok) {
        const resJson = await res.json();
        if (resJson.success) {
          sent = true;
        }
      }
    } catch (err: any) {
      console.warn("Backend proxy indisponível ou deploy estático (Netlify). Tentando envio direto...");
    }

    // 2. Fallback direto via Evolution API (essencial quando rodando no Netlify)
    if (!sent) {
      try {
        const evoUrl = clinicConfig.evolution_url || "https://api.makprojetosmake.com.br";
        const instance = clinicConfig.evolution_instance || "ambulatorio";
        const apiKey = clinicConfig.evolution_apikey || "E6247913DB92-48B4-8B54-5C7449EA639B";

        await axios.post(`${evoUrl}/message/sendText/${instance}`, {
          number: cleanPhone,
          text: msgText,
          linkPreview: true
        }, {
          headers: { apikey: apiKey }
        });

        // Grava histórico de mensagem enviada no Supabase
        await supabase.from('mensagens').insert([{
          telefone_cliente: cleanPhone,
          mensagem: msgText,
          direcao: 'enviada',
          lida: true,
          created_at: new Date().toISOString()
        }]);

        sent = true;
      } catch (evoErr: any) {
        console.error("Erro ao enviar direto pela Evolution API:", evoErr);
      }
    }

    setIsSendingAutoWhatsApp(false);

    if (sent) {
      toast.success("✅ Mensagem enviada automaticamente para o WhatsApp do paciente!", { id: toastId });
      return;
    }

    // 3. Fallback manual apenas se nenhuma das APIs responder
    navigator.clipboard.writeText(msgText);
    toast.success("Link copiado! Abrindo WhatsApp...", { id: toastId });
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`, '_blank');
  };

  useEffect(() => {
    fetchDoctors();
    fetchAppointments(true);
    fetchSpecialties();
    
    // Garantir que o medico_id seja preenchido se o usuário for médico
    if (user?.role === 'doctor' && !newAppointment.medico_id) {
      setNewAppointment(prev => ({ ...prev, medico_id: user.id }));
    }

    // Assinante Realtime para atualizar instantaneamente quando o paciente responder o formulário
    let channel: any = null;
    try {
      channel = supabase
        .channel('agendamentos-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, (payload) => {
          console.log("Agenda: Atualização em tempo real detectada!", payload);
          fetchAppointments(false);
        })
        .subscribe();
    } catch (e) {
      console.warn("Aviso canal realtime:", e);
    }

    const handleAnamneseSubmitted = () => {
      console.log("Agenda: Evento de anamnese respondida capturado, atualizando lista...");
      fetchAppointments(false);
    };
    window.addEventListener('anamnese_submitted', handleAnamneseSubmitted);

    // Sincronização periódica silenciosa (a cada 15s) em segundo plano, sem piscar a tela
    const pollTimer = setInterval(() => {
      fetchAppointments(false);
    }, 15000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('anamnese_submitted', handleAnamneseSubmitted);
      clearInterval(pollTimer);
    };
  }, [selectedMedicoId, user]);

  const fetchSpecialties = async () => {
    // Começa com os padrões para garantir que nunca esteja vazio na UI
    const defaults = [
      { id: 'integrativa', nome: 'Medicina Integrativa' },
      { id: 'odontologia_biologica', nome: 'Odontologia Biológica & Implantes Zircônia' },
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
        console.log("Agenda: Buscando todos os médicos e administradores clínicos (fallback)...");
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .in('role', ['doctor', 'admin']);
        
        if (error) throw error;
        doctorsList = data || [];
      }

      console.log("Agenda: Médicos encontrados:", doctorsList);
      setDoctors(doctorsList);
    } catch (err) {
      console.error("Erro ao buscar médicos:", err);
      // Fallback final: tenta buscar sem filtros
      const { data } = await supabase.from('profiles').select('id, email, full_name, role').in('role', ['doctor', 'admin']);
      if (data) setDoctors(data || []);
    }
  };

  const [testMessage, setTestMessage] = useState('Olá! Esta é uma mensagem de teste do seu Ambulatório IA.');

  const fetchAppointments = async (showLoadingSpinner: boolean = false) => {
    if (showLoadingSpinner) {
      setIsLoading(true);
    }
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
          const rawStatus = (app.status || 'Agendado').trim();
          let status = 'Agendado';
          if (rawStatus.toLowerCase() === 'confirmado') status = 'Confirmado';
          else if (rawStatus.toLowerCase() === 'atendido') status = 'Atendido';
          else if (rawStatus.toLowerCase() === 'em atendimento') status = 'Em Atendimento';
          else if (rawStatus.toLowerCase() === 'cancelado') status = 'Cancelado';
          else if (rawStatus.toLowerCase() === 'faltou') status = 'Faltou';
          else if (rawStatus) status = rawStatus;

          // Se estiver como 'Agendado', checar se já existe anamnese pré-consulta preenchida
          const cleanPhoneDigits = (paciente_telefone || '').replace(/\D/g, '');
          const cleanPhoneDigitsNo55 = cleanPhoneDigits.startsWith('55') && cleanPhoneDigits.length > 10 ? cleanPhoneDigits.slice(2) : cleanPhoneDigits;
          
          if (status === 'Agendado' && typeof window !== 'undefined') {
            const hasLocalAnamnese = 
              (cleanPhoneDigits && localStorage.getItem(`anamnese_${cleanPhoneDigits}`)) ||
              (cleanPhoneDigitsNo55 && localStorage.getItem(`anamnese_${cleanPhoneDigitsNo55}`)) ||
              (app.id && localStorage.getItem(`anamnese_app_${app.id}`));
            
            if (hasLocalAnamnese || app.foto_url || (app.paciente_cpf && app.cep)) {
              status = 'Confirmado';
            }
          }

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

          const convenio = app.convenio || app.health_insurance || '';
          const valor_consulta = app.valor_consulta || '';
          const status_pagamento = app.status_pagamento || '';
          const tipo_consulta = app.tipo_consulta || 'Primeira Consulta';
          const foto_url = app.foto_url || app.url_midia || app.foto || app.avatar_url || '';
          const paciente_cpf = app.paciente_cpf || app.cpf || '';
          const data_nascimento = app.data_nascimento || app.paciente_data_nascimento || '';

          return {
            id: app.id,
            paciente_nome,
            paciente_telefone,
            paciente_cpf,
            data_nascimento,
            foto_url,
            cep: app.cep || '',
            logradouro: app.logradouro || '',
            numero: app.numero || '',
            complemento: app.complemento || '',
            bairro: app.bairro || '',
            cidade: app.cidade || '',
            estado: app.estado || '',
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
      
      // Formata telefone para incluir 55 se omitido
      let formattedPhone = (newAppointment.paciente_telefone || '').replace(/\D/g, '');
      if ((formattedPhone.length === 10 || formattedPhone.length === 11) && !formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      const initialData = {
        user_id: user?.id,
        paciente_nome: newAppointment.paciente_nome,
        paciente_telefone: formattedPhone || newAppointment.paciente_telefone,
        paciente_cpf: newAppointment.paciente_cpf,
        data_nascimento: newAppointment.data_nascimento,
        paciente_data_nascimento: newAppointment.data_nascimento,
        cep: newAppointment.cep,
        logradouro: newAppointment.logradouro,
        numero: newAppointment.numero,
        complemento: newAppointment.complemento,
        bairro: newAppointment.bairro,
        cidade: newAppointment.cidade,
        estado: newAppointment.estado,
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
      
      // Disparo automático imediato para o paciente via WhatsApp / n8n
      if (newAppointment.paciente_telefone) {
        executeAutoWhatsAppSend({
          id: String(Date.now()),
          paciente_nome: newAppointment.paciente_nome,
          paciente_telefone: newAppointment.paciente_telefone,
          medico_nome: selectedDoctor?.full_name || user?.full_name || 'Dr(a). da Clínica',
          data_hora_inicio: isoDateTime,
          data_consulta: date,
          hora_consulta: formattedTime,
          status: 'Agendado'
        } as any);
      }
      
      setNewAppointment({ 
        paciente_nome: '', 
        paciente_telefone: '', 
        paciente_cpf: '',
        data_nascimento: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        data_hora_inicio: '', 
        motivo: '', 
        medico_id: user?.role === 'doctor' ? user.id : '',
        especialidade_id: '',
        convenio: 'Particular / Convênio',
        valor_consulta: '',
        status_pagamento: 'Cortesia / Isento',
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
    let targetMedico = newAppointment.medico_id;
    if (selectedMedicoId) {
      targetMedico = selectedMedicoId;
    } else if (!targetMedico && doctors.length > 0) {
      targetMedico = doctors[0].id;
    }
    if (targetMedico !== newAppointment.medico_id) {
      setNewAppointment(prev => ({ ...prev, medico_id: targetMedico }));
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
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => fetchAppointments(true)}
              className="p-3.5 bg-white text-slate-400 hover:text-clinical-blue rounded-2xl border border-slate-200 hover:border-blue-200 transition-all shadow-xs"
              title="Atualizar Agenda"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={openModal}
              className="bg-clinical-blue text-white px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 font-bold text-xs"
            >
              <Plus size={18} /> Novo Agendamento
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
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-clinical-blue group-hover:bg-clinical-blue group-hover:text-white transition-colors overflow-hidden shrink-0 border border-slate-200/80">
                    {app.foto_url ? (
                      <img 
                        src={app.foto_url} 
                        alt={app.paciente_nome} 
                        className="w-full h-full object-cover rounded-2xl" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900">{app.paciente_nome}</h3>
                      <select
                        value={(app.status || 'Agendado').toLowerCase() === 'confirmado' ? 'Confirmado' : (app.status || 'Agendado')}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border outline-none cursor-pointer transition-all shadow-2xs ${getStatusBadgeClass(app.status)}`}
                        title="Clique para alterar o status do agendamento"
                      >
                        <option value="Agendado" className="bg-white text-slate-900 font-normal">Agendado</option>
                        <option value="Confirmado" className="bg-white text-slate-900 font-normal">Confirmado</option>
                        <option value="Em Atendimento" className="bg-white text-slate-900 font-normal">Em Atendimento</option>
                        <option value="Atendido" className="bg-white text-slate-900 font-normal">Atendido</option>
                        <option value="Cancelado" className="bg-white text-slate-900 font-normal">Cancelado</option>
                      </select>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {app.convenio || 'Particular'}
                      </span>

                      {/* Badge de Pagamento / Status Financeiro */}
                      {app.status_pagamento === 'Cortesia / Isento' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Cortesia / Isento
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${(app.status_pagamento || '').startsWith('Pago') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {(app.status_pagamento || '').startsWith('Pago') 
                            ? (app.status_pagamento || 'Pago') 
                            : (app.status_pagamento || 'Pendente no Balcão')
                          }
                          {app.valor_consulta ? ` • R$ ${app.valor_consulta}` : ' • R$ 250,00'}
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
                      {app.paciente_cpf && (
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                          <ShieldCheck size={13} className="text-slate-500" /> CPF: {app.paciente_cpf}
                        </span>
                      )}
                      {app.data_nascimento && (
                        <span className="flex items-center gap-1.5 text-blue-700 font-medium bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md text-xs">
                          🎂 {app.data_nascimento} {calculateAge(app.data_nascimento) !== null ? `(${calculateAge(app.data_nascimento)} anos)` : ''}
                        </span>
                      )}
                      {(app.logradouro || app.cidade) && (
                        <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                          <MapPin size={13} className="text-rose-500" /> 
                          {[app.logradouro, app.numero, app.bairro, app.cidade && `${app.cidade}${app.estado ? `/${app.estado}` : ''}`].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 px-3 py-1 rounded-lg inline-block">{app.motivo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPaymentModal(app)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      (app.status_pagamento || '').startsWith('Pago')
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 animate-pulse'
                    }`}
                    title="Realizar Cobrança / Baixa no Caixa da Recepção"
                  >
                    <CreditCard size={14} />
                    {(app.status_pagamento || '').startsWith('Pago') ? 'Pago' : 'Receber'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAppointmentForAnamnese(app);
                      setIsAnamneseModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                    title="Abrir Anamnese Pré-Consulta preenchida com os dados do agendamento"
                  >
                    <ClipboardList size={14} /> Ficha Pré-Consulta
                  </button>

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
                    onClick={() => handleDeleteAppointment(app.id, app.paciente_nome)}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remover / Cancelar Agendamento"
                  >
                    <Trash2 size={20} />
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
                        app.convenio || 'Particular', 
                        app.medico_especialidade || 'Clínico Geral',
                        app.status_pagamento,
                        app.valor_consulta,
                        app.data_nascimento,
                        app.paciente_cpf
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
              {/* Seção 1: Dados do Paciente */}
              <div className="space-y-3">
                <input 
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all text-xs font-semibold"
                  placeholder="Nome Completo do Paciente *"
                  value={newAppointment.paciente_nome}
                  onChange={e => setNewAppointment({...newAppointment, paciente_nome: e.target.value})}
                />
                
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Telefone / WhatsApp <span className="text-emerald-600 font-extrabold">(Com 55 + DDD)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input 
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all text-xs font-medium"
                        placeholder="Ex: 5511999998888"
                        value={newAppointment.paciente_telefone}
                        onChange={e => setNewAppointment({...newAppointment, paciente_telefone: e.target.value})}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Exemplo: <strong>55</strong>11999998888</p>
                    </div>
                    <div>
                      <input 
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all text-xs"
                        placeholder="CPF (000.000.000-00)"
                        value={newAppointment.paciente_cpf}
                        onChange={e => setNewAppointment({...newAppointment, paciente_cpf: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Data de Nascimento com cálculo imediato de Idade */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      🎂 Data de Nascimento do Paciente
                    </label>
                    {calculateAge(newAppointment.data_nascimento) !== null && (
                      <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200 animate-fade-in shadow-xs">
                        {calculateAge(newAppointment.data_nascimento)} anos
                      </span>
                    )}
                  </div>
                  <input 
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full p-2.5 bg-white rounded-lg border border-slate-200 focus:border-clinical-blue outline-none transition-all text-xs font-semibold"
                    placeholder="Ex: 08/05/1966 (DD/MM/AAAA)"
                    value={newAppointment.data_nascimento}
                    onChange={e => setNewAppointment({...newAppointment, data_nascimento: formatDateMask(e.target.value)})}
                  />
                  <p className="text-[10px] text-slate-400">
                    A idade precisa será calculada automaticamente para o prontuário e atendimento.
                  </p>
                </div>
              </div>

              {/* Seção 2: Endereço do Paciente (ViaCEP) */}
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                    <MapPin size={14} className="text-clinical-blue" />
                    Endereço & Localização (ViaCEP)
                  </label>
                  {isSearchingCep && (
                    <span className="text-[10px] text-clinical-blue font-bold flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> Buscando CEP...
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    className="flex-1 p-2.5 bg-white rounded-xl border border-slate-200 focus:border-clinical-blue outline-none text-xs font-bold"
                    placeholder="CEP (ex: 01001-000)"
                    value={newAppointment.cep}
                    onChange={e => {
                      const val = e.target.value;
                      setNewAppointment({...newAppointment, cep: val});
                      const clean = val.replace(/\D/g, '');
                      if (clean.length === 8 && !isSearchingCep) {
                        setTimeout(() => handleCepSearch(clean), 100);
                      }
                    }}
                    onBlur={() => {
                      if (newAppointment.cep.replace(/\D/g, '').length === 8) {
                        handleCepSearch();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCepSearch()}
                    disabled={isSearchingCep}
                    className="px-3 py-2 bg-clinical-blue hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Search size={12} /> Buscar
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input 
                    className="col-span-2 p-2.5 bg-white rounded-xl border border-slate-200 focus:border-clinical-blue outline-none text-xs"
                    placeholder="Rua / Logradouro"
                    value={newAppointment.logradouro}
                    onChange={e => setNewAppointment({...newAppointment, logradouro: e.target.value})}
                  />
                  <input 
                    className="p-2.5 bg-white rounded-xl border border-slate-200 focus:border-clinical-blue outline-none text-xs"
                    placeholder="Número"
                    value={newAppointment.numero}
                    onChange={e => setNewAppointment({...newAppointment, numero: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="p-2.5 bg-white rounded-xl border border-slate-200 focus:border-clinical-blue outline-none text-xs"
                    placeholder="Complemento"
                    value={newAppointment.complemento}
                    onChange={e => setNewAppointment({...newAppointment, complemento: e.target.value})}
                  />
                  <input 
                    className="p-2.5 bg-white rounded-xl border border-slate-200 focus:border-clinical-blue outline-none text-xs"
                    placeholder="Bairro"
                    value={newAppointment.bairro}
                    onChange={e => setNewAppointment({...newAppointment, bairro: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input 
                    className="col-span-2 p-2.5 bg-white rounded-xl border border-slate-200 focus:border-clinical-blue outline-none text-xs"
                    placeholder="Cidade"
                    value={newAppointment.cidade}
                    onChange={e => setNewAppointment({...newAppointment, cidade: e.target.value})}
                  />
                  <input 
                    className="p-2.5 bg-white rounded-xl border border-slate-200 focus:border-clinical-blue outline-none text-xs uppercase"
                    placeholder="UF"
                    maxLength={2}
                    value={newAppointment.estado}
                    onChange={e => setNewAppointment({...newAppointment, estado: e.target.value})}
                  />
                </div>
              </div>

              {/* Seção 3: Especialidade e Médico Responsável */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <User size={14} className="text-clinical-blue" />
                  Especialidade & Médico Responsável *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <select 
                    className="w-full p-2.5 bg-white rounded-xl border border-slate-200 focus:border-clinical-blue outline-none text-xs font-semibold"
                    value={newAppointment.especialidade_id}
                    onChange={e => {
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
                        <option value="odontologia_biologica">Odontologia Biológica & Implantes Zircônia</option>
                        <option value="neurologia">Neurologia Especializada</option>
                        <option value="clinica_geral">Clínica Geral & Rotina</option>
                      </>
                    )}
                  </select>

                  {user?.role === 'doctor' ? (
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-clinical-blue text-xs font-bold flex items-center">
                      Médico: {user.full_name || user.email}
                    </div>
                  ) : (
                    <select 
                      className="w-full p-2.5 bg-white rounded-xl border border-slate-200 focus:border-clinical-blue outline-none text-xs font-semibold"
                      value={newAppointment.medico_id}
                      onChange={e => setNewAppointment({...newAppointment, medico_id: e.target.value})}
                    >
                      <option value="">Selecione o Médico *</option>
                      {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.full_name || doc.email}</option>)}
                    </select>
                  )}
                </div>
              </div>

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
                    <option value="Implante Zircônia / Cirurgia Biológica">Implante Zircônia / Cirurgia Biológica</option>
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

              <textarea 
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinical-blue outline-none transition-all text-xs"
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

      <PreConsultationAnamneseModal
        isOpen={isAnamneseModalOpen}
        onClose={() => {
          setIsAnamneseModalOpen(false);
          setSelectedAppointmentForAnamnese(null);
        }}
        appointmentId={selectedAppointmentForAnamnese?.id}
        patientNamePrefill={selectedAppointmentForAnamnese?.paciente_nome || ''}
        patientPhonePrefill={selectedAppointmentForAnamnese?.paciente_telefone || ''}
        patientCpfPrefill={selectedAppointmentForAnamnese?.paciente_cpf || ''}
        patientDobPrefill={(selectedAppointmentForAnamnese as any)?.data_nascimento || (selectedAppointmentForAnamnese as any)?.paciente_data_nascimento || ''}
        patientPhotoPrefill={(selectedAppointmentForAnamnese as any)?.foto_url || (selectedAppointmentForAnamnese as any)?.url_midia || (selectedAppointmentForAnamnese as any)?.foto || ''}
        patientCepPrefill={selectedAppointmentForAnamnese?.cep || ''}
        patientLogradouroPrefill={selectedAppointmentForAnamnese?.logradouro || ''}
        patientBairroPrefill={selectedAppointmentForAnamnese?.bairro || ''}
        patientCidadePrefill={selectedAppointmentForAnamnese?.cidade || ''}
        patientEstadoPrefill={selectedAppointmentForAnamnese?.estado || ''}
        patientNumeroPrefill={selectedAppointmentForAnamnese?.numero || ''}
        patientComplementoPrefill={selectedAppointmentForAnamnese?.complemento || ''}
        onAnamneseSubmitted={() => {
          fetchAppointments();
          toast.success("Ficha Pré-Consulta vinculada com sucesso!");
        }}
      />

      {/* MODAL DE BAIXA E RECEBIMENTO RÁPIDO NA RECEPÇÃO */}
      {paymentModalOpen && payingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-6">
            
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Recebimento no Caixa</h3>
                  <p className="text-xs text-slate-500 font-medium">Check-in e baixa financeira rápida</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setPaymentModalOpen(false);
                  setPayingAppointment(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Dados do Paciente e Consulta */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-800">
                <span>Paciente:</span>
                <span className="text-sm text-clinical-blue">{payingAppointment.paciente_nome}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Profissional:</span>
                <span className="font-semibold text-slate-800">{payingAppointment.medico_nome || 'Dr(a). da Clínica'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Especialidade / Convênio:</span>
                <span className="font-semibold text-slate-800">
                  {payingAppointment.medico_especialidade || 'Clínico'} • {payingAppointment.convenio || 'Particular'}
                </span>
              </div>
              {payingAppointment.paciente_telefone && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>WhatsApp:</span>
                  <span className="font-mono text-slate-700">{payingAppointment.paciente_telefone}</span>
                </div>
              )}
            </div>

            {/* Seleção da Forma de Pagamento */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Forma de Pagamento Utilizada:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pix', label: 'PIX', icon: '📱', desc: 'Chave / QR' },
                  { id: 'credit_card', label: 'Crédito', icon: '💳', desc: 'Maquininha' },
                  { id: 'debit_card', label: 'Débito', icon: '💳', desc: 'Maquininha' },
                  { id: 'cash', label: 'Dinheiro', icon: '💵', desc: 'Espécie' },
                  { id: 'health_insurance', label: 'Convênio', icon: '🏥', desc: 'Guia' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === m.id
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-extrabold shadow-xs scale-102 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-xs">{m.label}</span>
                    <span className="text-[9px] text-slate-400 font-normal">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Valor do Recebimento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Valor Pago (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 font-extrabold text-sm outline-none transition-all"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Observação / Caixa:
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 text-xs outline-none transition-all font-medium"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: Pago na recepção balcão"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setPayingAppointment(null);
                }}
                disabled={isProcessingPayment}
                className="w-1/3 py-3.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPayment(true)}
                disabled={isProcessingPayment}
                className="w-2/3 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirmar & Enviar Recibo WhatsApp
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
