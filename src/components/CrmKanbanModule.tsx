import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  MessageSquare, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Trash2, 
  Edit3, 
  Phone, 
  Send, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  X, 
  AlertCircle,
  Stethoscope,
  Smile,
  RefreshCw,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { getActiveClinicConfig, resolveDoctorKey, CLINIC_PROFILES_CONFIG } from '../constants/clinicProfiles';

export type CrmStageId = 
  | 'novo_lead' 
  | 'pre_anamnese' 
  | 'avaliacao_agendada' 
  | 'orcamento_pendente' 
  | 'tratamento_fechado' 
  | 'pos_cirurgico_recall';

export interface CrmCard {
  id: string;
  paciente_nome: string;
  paciente_telefone?: string;
  paciente_cpf?: string;
  stage: CrmStageId;
  doctorKey?: 'dr_carlos' | 'dra_lucy' | 'geral';
  procedimento_interesse?: string;
  valor_estimado?: number;
  status_anamnese?: 'pendente' | 'preenchida' | 'nao_enviada';
  tags?: string[];
  notas?: string;
  data_contato?: string;
  data_retorno?: string;
  origem?: 'whatsapp' | 'instagram' | 'indicacao' | 'site' | 'presencial';
  updated_at?: string;
}

const CRM_STAGES: { id: CrmStageId; label: string; desc: string; color: string; badgeBg: string; border: string }[] = [
  {
    id: 'novo_lead',
    label: '1. Novo Contato / Lead',
    desc: 'Primeiro contato no WhatsApp ou redes',
    color: 'from-blue-600 to-sky-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    border: 'border-blue-300'
  },
  {
    id: 'pre_anamnese',
    label: '2. Pré-Anamnese Enviada',
    desc: 'Link de anamnese digital enviado via WhatsApp',
    color: 'from-amber-500 to-orange-500',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-amber-300'
  },
  {
    id: 'avaliacao_agendada',
    label: '3. Avaliação Agendada',
    desc: 'Data e horário marcados na Agenda',
    color: 'from-indigo-600 to-purple-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    border: 'border-indigo-300'
  },
  {
    id: 'orcamento_pendente',
    label: '4. Orçamento Apresentado',
    desc: 'Plano cirúrgico / biológico em negociação',
    color: 'from-rose-500 to-pink-600',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-rose-300'
  },
  {
    id: 'tratamento_fechado',
    label: '5. Tratamento Fechado',
    desc: 'Cirurgia ou acompanhamento em andamento',
    color: 'from-emerald-600 to-teal-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-300'
  },
  {
    id: 'pos_cirurgico_recall',
    label: '6. Pós-Op & Recall (Revisão)',
    desc: 'Acompanhamento pós-cirúrgico ou 6 meses',
    color: 'from-cyan-600 to-blue-700',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    border: 'border-cyan-300'
  }
];

const INITIAL_DEMO_LEADS: CrmCard[] = [
  {
    id: 'crm_1',
    paciente_nome: 'Mariana Silveira',
    paciente_telefone: '11988776655',
    paciente_cpf: '345.678.912-00',
    stage: 'orcamento_pendente',
    doctorKey: 'dra_lucy',
    procedimento_interesse: 'Protocolo SMART (Remoção de 4 Amálgamas) + 2 Implantes Zircônia',
    valor_estimado: 18500,
    status_anamnese: 'preenchida',
    tags: ['SMART', 'Zircônia', 'Alta Prioridade'],
    notas: 'Paciente tem queixas de fadiga crônica e cefaleia. Adorou a explicação do Odontograma Dente-Órgão.',
    origem: 'instagram',
    data_contato: new Date().toISOString()
  },
  {
    id: 'crm_2',
    paciente_nome: 'Carlos Eduardo Mendes',
    paciente_telefone: '11977665544',
    paciente_cpf: '456.789.012-33',
    stage: 'avaliacao_agendada',
    doctorKey: 'dr_carlos',
    procedimento_interesse: 'Avaliação Neurológica + Protocolo Ortomolecular Integrativo',
    valor_estimado: 1200,
    status_anamnese: 'preenchida',
    tags: ['Neurologia', 'Enxaqueca', 'Exame Físico'],
    notas: 'Preencheu a pré-anamnese relatando dor retro-orbitária há 6 meses. Já enviou RMN.',
    origem: 'whatsapp',
    data_contato: new Date().toISOString()
  },
  {
    id: 'crm_3',
    paciente_nome: 'Juliana Paes Vasconcelos',
    paciente_telefone: '11966554433',
    stage: 'pre_anamnese',
    doctorKey: 'dra_lucy',
    procedimento_interesse: 'Avaliação Biológica & Terapia Neural / Ozônio',
    valor_estimado: 3500,
    status_anamnese: 'pendente',
    tags: ['Ozônio', 'ATM / Bruxismo'],
    notas: 'Enviado link de anamnese no WhatsApp ontem às 16h.',
    origem: 'indicacao',
    data_contato: new Date().toISOString()
  },
  {
    id: 'crm_4',
    paciente_nome: 'Roberto Antunes',
    paciente_telefone: '11955443322',
    stage: 'tratamento_fechado',
    doctorKey: 'dra_lucy',
    procedimento_interesse: 'Descontaminação Óssea NICO + I-PRF',
    valor_estimado: 12800,
    status_anamnese: 'preenchida',
    tags: ['NICO/FDOK', 'Cirurgia Fechada'],
    notas: 'Cirurgia agendada para próxima terça-feira às 08h30.',
    origem: 'site',
    data_contato: new Date().toISOString()
  },
  {
    id: 'crm_5',
    paciente_nome: 'Fernanda Lima Rocha',
    paciente_telefone: '11944332211',
    stage: 'pos_cirurgico_recall',
    doctorKey: 'dr_carlos',
    procedimento_interesse: 'Reavaliação 90 dias - Homocisteína e Vitamina D',
    valor_estimado: 850,
    status_anamnese: 'preenchida',
    tags: ['Retorno 90 dias', 'Exames Laboratoriais'],
    notas: 'Disparar WhatsApp automático de recall para trazer os novos exames de sangue.',
    origem: 'whatsapp',
    data_contato: new Date().toISOString()
  }
];

interface CrmKanbanModuleProps {
  currentUser?: any;
  onOpenAgendaWithPatient?: (patientName: string, phone?: string) => void;
  onStartConsultation?: (patientName: string, phone?: string) => void;
}

export default function CrmKanbanModule({ 
  currentUser,
  onOpenAgendaWithPatient,
  onStartConsultation
}: CrmKanbanModuleProps) {
  const activeDoctorKey = useMemo(() => resolveDoctorKey(currentUser), [currentUser]);
  const activeClinic = useMemo(() => getActiveClinicConfig(currentUser), [currentUser]);

  const isMasterAdmin = useMemo(() => {
    if (!currentUser) return false;
    const email = (currentUser.email || '').toLowerCase().trim();
    const fullName = (currentUser.full_name || '').toLowerCase().trim();
    return email === 'marco.agduarte22@gmail.com' || 
           currentUser.role === 'admin' || 
           (fullName.includes('marco') && fullName.includes('duarte'));
  }, [currentUser]);

  const [cards, setCards] = useState<CrmCard[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ambulatorio_crm_cards_v1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.warn("Erro ao carregar CRM local:", e);
        }
      }
    }
    return INITIAL_DEMO_LEADS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<'all' | 'dr_carlos' | 'dra_lucy'>(() => {
    if (activeDoctorKey === 'dr_carlos' || activeDoctorKey === 'dra_lucy') {
      return activeDoctorKey;
    }
    return 'all';
  });

  const effectiveDoctorFilter: 'all' | 'dr_carlos' | 'dra_lucy' = isMasterAdmin
    ? selectedDoctorFilter
    : (activeDoctorKey === 'dra_lucy' ? 'dra_lucy' : (activeDoctorKey === 'dr_carlos' ? 'dr_carlos' : 'all'));

  useEffect(() => {
    if (!isMasterAdmin) {
      if (activeDoctorKey === 'dra_lucy' || activeDoctorKey === 'dr_carlos') {
        setSelectedDoctorFilter(activeDoctorKey);
      }
    }
  }, [isMasterAdmin, activeDoctorKey]);

  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CrmCard | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CrmCard>>({
    paciente_nome: '',
    paciente_telefone: '',
    paciente_cpf: '',
    stage: 'novo_lead',
    doctorKey: activeDoctorKey === 'dra_lucy' ? 'dra_lucy' : (activeDoctorKey === 'dr_carlos' ? 'dr_carlos' : 'geral'),
    procedimento_interesse: '',
    valor_estimado: 0,
    status_anamnese: 'pendente',
    tags: [],
    notas: '',
    origem: 'whatsapp'
  });
  const [tagInput, setTagInput] = useState('');

  // Persiste no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambulatorio_crm_cards_v1', JSON.stringify(cards));
    }
  }, [cards]);

  // Escuta atualizações vindas da Agenda em tempo real
  useEffect(() => {
    const handleCrmUpdate = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ambulatorio_crm_cards_v1');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setCards(parsed);
            }
          } catch (e) {}
        }
      }
    };

    window.addEventListener('crm_cards_updated', handleCrmUpdate);
    return () => window.removeEventListener('crm_cards_updated', handleCrmUpdate);
  }, []);

  // Carrega também leads do Supabase e mescla se houver
  const syncWithSupabase = async () => {
    try {
      // 1. Busca agendamentos recentes
      const { data: agData } = await supabase
        .from('agendamentos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (agData && agData.length > 0) {
        setCards(prev => {
          const existingPhones = new Set(prev.map(c => (c.paciente_telefone || '').replace(/\D/g, '')));
          const existingNames = new Set(prev.map(c => c.paciente_nome.toLowerCase().trim()));

          const newCardsFromAg: CrmCard[] = [];

          agData.forEach((ag: any) => {
            const cleanP = (ag.paciente_telefone || '').replace(/\D/g, '');
            const cleanN = (ag.paciente_nome || '').toLowerCase().trim();

            if (!existingNames.has(cleanN) && (!cleanP || !existingPhones.has(cleanP))) {
              const isLucy = (ag.medico_especialidade || '').toLowerCase().includes('odonto') || (ag.medico_nome || '').toLowerCase().includes('lucy');
              const isCarlos = (ag.medico_especialidade || '').toLowerCase().includes('neuro') || (ag.medico_nome || '').toLowerCase().includes('carlos');

              newCardsFromAg.push({
                id: `ag_${ag.id}`,
                paciente_nome: ag.paciente_nome,
                paciente_telefone: ag.paciente_telefone || '',
                paciente_cpf: ag.paciente_cpf || '',
                stage: ag.status === 'Concluído' ? 'pos_cirurgico_recall' : 'avaliacao_agendada',
                doctorKey: isLucy ? 'dra_lucy' : (isCarlos ? 'dr_carlos' : 'geral'),
                procedimento_interesse: ag.motivo || 'Consulta / Procedimento Agendado',
                valor_estimado: ag.valor_consulta ? Number(ag.valor_consulta) : 0,
                status_anamnese: 'preenchida',
                tags: ['Vindo da Agenda', ag.convenio || 'Particular'],
                notas: `Agendamento: ${ag.data_hora_inicio ? new Date(ag.data_hora_inicio).toLocaleDateString('pt-BR') : 'Data não definida'}`,
                origem: 'whatsapp',
                data_contato: ag.created_at || new Date().toISOString()
              });
            }
          });

          if (newCardsFromAg.length > 0) {
            toast.success(`✨ ${newCardsFromAg.length} novos pacientes da Agenda foram sincronizados com o CRM!`);
            return [...newCardsFromAg, ...prev];
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn("Erro no sync CRM:", e);
    }
  };

  useEffect(() => {
    syncWithSupabase();
  }, []);

  // Filtros
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Filtro de texto
      const matchesSearch = 
        card.paciente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.paciente_telefone && card.paciente_telefone.includes(searchTerm)) ||
        (card.procedimento_interesse && card.procedimento_interesse.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (card.tags && card.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

      // Filtro de profissional estrito e isolado
      let matchesDoctor = true;
      if (effectiveDoctorFilter === 'dra_lucy') {
        matchesDoctor = card.doctorKey === 'dra_lucy';
      } else if (effectiveDoctorFilter === 'dr_carlos') {
        matchesDoctor = card.doctorKey === 'dr_carlos';
      } else {
        matchesDoctor = true; // 'all' (apenas para Master Admin)
      }

      return matchesSearch && matchesDoctor;
    });
  }, [cards, searchTerm, effectiveDoctorFilter]);

  // Estatísticas Rápidas do Funil
  const metrics = useMemo(() => {
    const totalPipelineValue = filteredCards.reduce((acc, c) => acc + (c.valor_estimado || 0), 0);
    const pendingProposals = filteredCards.filter(c => c.stage === 'orcamento_pendente');
    const totalPendingValue = pendingProposals.reduce((acc, c) => acc + (c.valor_estimado || 0), 0);
    const closedTreatments = filteredCards.filter(c => c.stage === 'tratamento_fechado');
    const totalClosedValue = closedTreatments.reduce((acc, c) => acc + (c.valor_estimado || 0), 0);

    return {
      totalLeads: filteredCards.length,
      totalPipelineValue,
      pendingCount: pendingProposals.length,
      totalPendingValue,
      closedCount: closedTreatments.length,
      totalClosedValue
    };
  }, [filteredCards]);

  // Mover cartão de coluna
  const handleMoveStage = (cardId: string, targetStage: CrmStageId) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          stage: targetStage,
          updated_at: new Date().toISOString()
        };
      }
      return card;
    }));
    toast.success("Paciente movido no funil com sucesso!");
  };

  // Drag & Drop Nativo
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: CrmStageId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (cardId) {
      handleMoveStage(cardId, targetStage);
    }
    setDraggedCardId(null);
  };

  // Disparo Rápido de WhatsApp por Etapa
  const handleWhatsAppAction = async (card: CrmCard) => {
    if (!card.paciente_telefone) {
      toast.error("Este paciente não possui telefone cadastrado.");
      return;
    }

    const cleanPhone = card.paciente_telefone.replace(/\D/g, '');
    setIsSendingWhatsApp(card.id);

    const docName = card.doctorKey === 'dra_lucy' 
      ? 'Dra. Lucy Morata (Odontologia Biológica)' 
      : (card.doctorKey === 'dr_carlos' ? 'Dr. Carlos Morato (Neurologia & Integrativa)' : 'Ambulatório IA');

    let templateMessage = '';
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const anamneseLink = `${currentOrigin}/?anamnese=true&phone=${encodeURIComponent(cleanPhone)}&name=${encodeURIComponent(card.paciente_nome)}`;

    switch (card.stage) {
      case 'novo_lead':
        templateMessage = `Olá, *${card.paciente_nome}*! Tudo bem?\n\nAqui é da equipe do *${docName}*.\n\nRecebemos seu contato com interesse em *${card.procedimento_interesse || 'nossos atendimentos clínicos e biológicos'}*. Gostaria de tirar dúvidas ou verificar os horários disponíveis para avaliação?`;
        break;

      case 'pre_anamnese':
        templateMessage = `Olá, *${card.paciente_nome}*! 👋\n\nPara que sua consulta com *${docName}* seja de altíssima precisão e sem perda de tempo, pedimos que preencha previamente sua *Pré-Anamnese Digital* no link abaixo:\n\n👉 ${anamneseLink}\n\nLeva menos de 3 minutos e chega direto no prontuário do consultório!`;
        break;

      case 'avaliacao_agendada':
        templateMessage = `Olá, *${card.paciente_nome}*! Lembrete de consulta com *${docName}*.\n\nPor favor, lembre-se de trazer exames de imagem anteriores (RMN/Tomografias/Radiografias) e lista de suplementos/medicações em uso.\n\nPodemos confirmar sua presença?`;
        break;

      case 'orcamento_pendente':
        templateMessage = `Olá, *${card.paciente_nome}*! Tudo bem?\n\n*${docName}* pediu para verificar se você conseguiu analisar a proposta do seu plano de tratamento (*${card.procedimento_interesse || 'procedimento'}*).\n\nFicou alguma dúvida sobre o protocolo biológico, etapas cirúrgicas ou condições de pagamento? Estamos à sua inteira disposição!`;
        break;

      case 'tratamento_fechado':
        templateMessage = `Olá, *${card.paciente_nome}*! Parabéns por dar esse passo na sua saúde integrativa com *${docName}*.\n\nSeu procedimento de *${card.procedimento_interesse || 'tratamento'}* está confirmado. Qualquer dúvida pré-operatória, estamos aqui!`;
        break;

      case 'pos_cirurgico_recall':
        templateMessage = `Olá, *${card.paciente_nome}*! Como você está se sentindo hoje?\n\nAqui é da equipe de acompanhamento pós-atendimento de *${docName}*. Gostaríamos de saber como está sua recuperação e se você tem alguma dúvida sobre as orientações passadas!`;
        break;
    }

    try {
      const res = await sendWhatsAppMessage(cleanPhone, templateMessage);
      if (res.success) {
        toast.success(`📲 WhatsApp enviado com sucesso para ${card.paciente_nome}!`);
      } else {
        // Fallback: abre o link direto do WhatsApp Web
        const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(templateMessage)}`;
        window.open(waUrl, '_blank');
        toast.success("Abrindo WhatsApp...");
      }

      // Se o card estava em 'novo_lead' e a secretária disparou o WhatsApp de Pré-Anamnese, avança automaticamente
      if (card.stage === 'novo_lead') {
        handleMoveStage(card.id, 'pre_anamnese');
        toast("Card movido automaticamente para 'Pré-Anamnese Enviada'!", { icon: '📋' });
      }
    } catch (e) {
      const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(templateMessage)}`;
      window.open(waUrl, '_blank');
    } finally {
      setIsSendingWhatsApp(null);
    }
  };

  // Salvar / Criar Cartão
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paciente_nome?.trim()) {
      toast.error("Informe o nome do paciente.");
      return;
    }

    const targetDoctorKey = !isMasterAdmin
      ? (activeDoctorKey === 'dra_lucy' ? 'dra_lucy' : (activeDoctorKey === 'dr_carlos' ? 'dr_carlos' : 'geral'))
      : (formData.doctorKey || 'geral');

    if (editingCard) {
      setCards(prev => prev.map(c => c.id === editingCard.id ? { 
        ...c, 
        ...formData, 
        doctorKey: isMasterAdmin ? (formData.doctorKey || c.doctorKey) : c.doctorKey 
      } as CrmCard : c));
      toast.success("Oportunidade atualizada no CRM!");
    } else {
      const newCard: CrmCard = {
        id: `crm_${Date.now()}`,
        paciente_nome: formData.paciente_nome.trim(),
        paciente_telefone: formData.paciente_telefone || '',
        paciente_cpf: formData.paciente_cpf || '',
        stage: formData.stage || 'novo_lead',
        doctorKey: targetDoctorKey,
        procedimento_interesse: formData.procedimento_interesse || '',
        valor_estimado: Number(formData.valor_estimado) || 0,
        status_anamnese: formData.status_anamnese || 'pendente',
        tags: formData.tags || [],
        notas: formData.notas || '',
        origem: formData.origem || 'whatsapp',
        data_contato: new Date().toISOString()
      };
      setCards(prev => [newCard, ...prev]);
      toast.success("Novo lead adicionado ao CRM com sucesso!");

      // Salva também no Supabase (se a tabela pacientes estiver acessível)
      try {
        await supabase.from('pacientes').insert([{
          nome: newCard.paciente_nome,
          telefone: newCard.paciente_telefone,
          cpf: newCard.paciente_cpf,
          observacoes: `[Origem CRM: ${newCard.origem}] Interesse: ${newCard.procedimento_interesse}`
        }]);
      } catch (err) {
        // Ignora silenciosamente caso já exista
      }
    }

    setShowNewCardModal(false);
    setEditingCard(null);
    setFormData({
      paciente_nome: '',
      paciente_telefone: '',
      paciente_cpf: '',
      stage: 'novo_lead',
      doctorKey: 'geral',
      procedimento_interesse: '',
      valor_estimado: 0,
      status_anamnese: 'pendente',
      tags: [],
      notas: '',
      origem: 'whatsapp'
    });
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm("Tem certeza que deseja remover este paciente do CRM?")) {
      setCards(prev => prev.filter(c => c.id !== cardId));
      toast.success("Card removido do CRM.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Principal do CRM */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">CRM & Funil de Pacientes</h2>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[11px] font-extrabold uppercase">
                Conversão & Retenção
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Acompanhe a jornada completa: do primeiro WhatsApp ao fechamento de orçamentos e retornos preventivos.
            </p>
          </div>
        </div>

        {/* Controles de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={syncWithSupabase}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
            title="Sincronizar com agendamentos recentes"
          >
            <RefreshCw size={14} className="text-blue-600" />
            Sincronizar Agenda
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCard(null);
              setFormData({
                paciente_nome: '',
                paciente_telefone: '',
                paciente_cpf: '',
                stage: 'novo_lead',
                doctorKey: activeDoctorKey === 'dra_lucy' ? 'dra_lucy' : (activeDoctorKey === 'dr_carlos' ? 'dr_carlos' : 'geral'),
                procedimento_interesse: '',
                valor_estimado: 0,
                status_anamnese: 'pendente',
                tags: [],
                notas: '',
                origem: 'whatsapp'
              });
              setShowNewCardModal(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20 active:scale-98"
          >
            <Plus size={16} />
            Novo Paciente / Oportunidade
          </button>
        </div>
      </div>

      {/* Cards de Métricas e Desempenho Financeiro do Funil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Oportunidades</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">{metrics.totalLeads}</p>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Pacientes no fluxo ativo</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Orçamentos em Negociação</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalPendingValue)}
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{metrics.pendingCount} propostas aguardando</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tratamentos Fechados</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalClosedValue)}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{metrics.closedCount} procedimentos confirmados</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Total Estimado</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalPipelineValue)}
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Potencial financeiro global</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros por Especialidade e Busca */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filtros de Profissional (Exclusivo Administrador Mestre Marco Duarte) OU Identificador Blindado do Médico */}
        {isMasterAdmin ? (
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedDoctorFilter('all')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDoctorFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos os Pacientes
            </button>
            <button
              type="button"
              onClick={() => setSelectedDoctorFilter('dra_lucy')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedDoctorFilter === 'dra_lucy'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smile size={14} />
              Dra. Lucy (Odonto Biológica)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDoctorFilter('dr_carlos')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedDoctorFilter === 'dr_carlos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope size={14} />
              Dr. Carlos (Neurologia)
            </button>
          </div>
        ) : (
          /* Badge de Isolamento Clínico Total para Médicos */
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl w-full sm:w-auto">
            {activeDoctorKey === 'dra_lucy' ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Smile size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Funil Clínico Exclusivo</p>
                  <p className="text-xs font-black text-emerald-950">Dra. Lucy Murata (Odontologia Biológica)</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Stethoscope size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Funil Clínico Exclusivo</p>
                  <p className="text-xs font-black text-blue-950">Dr. Carlos Morato (Neurologia & Integrativa)</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Campo de Busca */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, procedimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-medium"
          />
        </div>
      </div>

      {/* Quadro Kanban (Colunas de Estágios) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {CRM_STAGES.map((stage) => {
          const stageCards = filteredCards.filter(c => c.stage === stage.id);
          const stageTotal = stageCards.reduce((acc, c) => acc + (c.valor_estimado || 0), 0);

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="bg-slate-50/80 rounded-3xl p-3 border border-slate-200 flex flex-col min-h-[550px] transition-all"
            >
              {/* Header da Coluna */}
              <div className="p-2.5 mb-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-extrabold text-xs text-slate-800 leading-tight truncate">{stage.label}</h3>
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                    {stageCards.length}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-semibold">
                  <span>Subtotal:</span>
                  <span className="font-extrabold text-slate-800">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stageTotal)}
                  </span>
                </div>
              </div>

              {/* Lista de Cartões */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {stageCards.length === 0 ? (
                  <div className="h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-3 text-slate-400">
                    <p className="text-[11px] font-medium">Arraste um paciente para esta etapa</p>
                  </div>
                ) : (
                  stageCards.map((card) => {
                    const isLucyDoc = card.doctorKey === 'dra_lucy';
                    const isCarlosDoc = card.doctorKey === 'dr_carlos';

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing space-y-2.5"
                      >
                        {/* Topo do Card: Badge do Médico & Ações */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                            isLucyDoc 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isCarlosDoc 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {isLucyDoc ? '🦷 Dra. Lucy' : isCarlosDoc ? '🧠 Dr. Carlos' : 'Clínica Geral'}
                          </span>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCard(card);
                                setFormData(card);
                                setShowNewCardModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                              title="Editar lead"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Remover"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Nome do Paciente e Procedimento */}
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs leading-snug group-hover:text-indigo-600 transition-colors">
                            {card.paciente_nome}
                          </h4>
                          {card.procedimento_interesse && (
                            <p className="text-[11px] font-medium text-slate-600 line-clamp-2 mt-0.5">
                              {card.procedimento_interesse}
                            </p>
                          )}
                        </div>

                        {/* Tags */}
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {card.tags.map((tag, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Valor Estimado & Status Anamnese */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Valor:</span>
                            <span className="font-black text-slate-900 text-xs">
                              {card.valor_estimado 
                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(card.valor_estimado)
                                : 'A definir'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Anamnese:</span>
                            <span className={`text-[10px] font-bold ${
                              card.status_anamnese === 'preenchida' 
                                ? 'text-emerald-600' 
                                : 'text-amber-600'
                            }`}>
                              {card.status_anamnese === 'preenchida' ? '✓ Preenchida' : '⏳ Pendente'}
                            </span>
                          </div>
                        </div>

                        {/* Botão de Disparo WhatsApp & Ação Rápida */}
                        <div className="pt-1 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleWhatsAppAction(card)}
                            disabled={isSendingWhatsApp === card.id}
                            className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            title="Disparar mensagem personalizada do WhatsApp para esta etapa"
                          >
                            <MessageSquare size={12} className="text-emerald-600" />
                            <span>{isSendingWhatsApp === card.id ? "Enviando..." : "Disparar WhatsApp"}</span>
                          </button>

                          {onOpenAgendaWithPatient && (
                            <button
                              type="button"
                              onClick={() => onOpenAgendaWithPatient(card.paciente_nome, card.paciente_telefone)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl"
                              title="Agendar na Agenda Médica"
                            >
                              <Calendar size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação / Edição de Card no CRM */}
      {showNewCardModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingCard ? "Editar Paciente no CRM" : "Nova Oportunidade / Lead"}
                  </h3>
                  <p className="text-xs text-slate-500">Cadastre e gerencie a evolução no funil de atendimento</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCardModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Nome Completo do Paciente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria das Dores Silva"
                  value={formData.paciente_nome || ''}
                  onChange={(e) => setFormData({ ...formData, paciente_nome: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 98877-6655"
                    value={formData.paciente_telefone || ''}
                    onChange={(e) => setFormData({ ...formData, paciente_telefone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Profissional Destino</label>
                  {isMasterAdmin ? (
                    <select
                      value={formData.doctorKey || 'geral'}
                      onChange={(e) => setFormData({ ...formData, doctorKey: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-700"
                    >
                      <option value="dra_lucy">🦷 Dra. Lucy (Odonto Biológica)</option>
                      <option value="dr_carlos">🧠 Dr. Carlos (Neurologia)</option>
                      <option value="geral">🏥 Clínica Geral</option>
                    </select>
                  ) : (
                    <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs flex items-center gap-2">
                      {activeDoctorKey === 'dra_lucy' ? (
                        <>
                          <Smile size={14} className="text-emerald-600 shrink-0" />
                          <span className="truncate">Dra. Lucy Murata (Odonto)</span>
                        </>
                      ) : (
                        <>
                          <Stethoscope size={14} className="text-blue-600 shrink-0" />
                          <span className="truncate">Dr. Carlos Morato (Neuro)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Etapa do Funil</label>
                  <select
                    value={formData.stage || 'novo_lead'}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as CrmStageId })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-700"
                  >
                    {CRM_STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={formData.valor_estimado || ''}
                    onChange={(e) => setFormData({ ...formData, valor_estimado: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Procedimento de Interesse / Queixa</label>
                <input
                  type="text"
                  placeholder="Ex: Protocolo SMART + 2 Implantes Zircônia"
                  value={formData.procedimento_interesse || ''}
                  onChange={(e) => setFormData({ ...formData, procedimento_interesse: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Notas de Negociação / Histórico</label>
                <textarea
                  rows={2}
                  placeholder="Anotações internas sobre o que o paciente conversou, objeções ou preferências..."
                  value={formData.notas || ''}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCardModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-500/20"
                >
                  {editingCard ? "Salvar Alterações" : "Adicionar Oportunidade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
