import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Printer, 
  Trash2, 
  Search,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  X,
  AlertTriangle,
  Sparkles,
  Building2,
  Stethoscope,
  Brain,
  ShieldAlert,
  RotateCcw,
  Receipt,
  Coins,
  Percent,
  Lock,
  Unlock,
  Send,
  Share2,
  FileText,
  Check,
  Layers,
  BadgePercent,
  FileSpreadsheet,
  QrCode,
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { 
  getActiveClinicConfig, 
  resolveDoctorKey, 
  CLINIC_PROFILES_CONFIG 
} from '../constants/clinicProfiles';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  patientName?: string;
  patientCpf?: string;
  amount: number;
  category: string;
  paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'health_insurance';
  status: 'paid' | 'pending';
  date: string; // YYYY-MM-DD
  doctorName?: string;
  doctorCouncil?: string;
  doctorKey?: string;
  notes?: string;
}

export interface CashRegisterSession {
  id: string;
  date: string; // YYYY-MM-DD
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  operatorName: string;
  initialCash: number; // fundo de troco
  bleedings: { id: string; time: string; amount: number; reason: string; operator: string }[];
  physicalCashCounted?: number; // valor físico contado no fechamento
  difference?: number; // physical - expected
  notes?: string;
}

export interface RecurringBill {
  id: string;
  description: string;
  category: string;
  amount: number;
  dueDay: number; // dia de vencimento (1 a 31)
  status: 'paid' | 'pending';
  unit?: 'dra_lucy' | 'dr_carlos' | 'geral';
  lastPaidMonth?: string; // YYYY-MM
  beneficiary?: string;
}

export interface DoctorBankSettings {
  doctorKey: 'dr_carlos' | 'dra_lucy' | 'geral';
  doctorName: string;
  bankName: string;
  agency: string;
  account: string;
  pixKeyType: 'cnpj' | 'cpf' | 'telefone' | 'email';
  pixKey: string;
  pixBeneficiary: string;
}

interface FinancialModuleProps {
  currentUser?: any;
}

export default function FinancialModule({ currentUser }: FinancialModuleProps) {
  const activeDoctorKey = useMemo(() => resolveDoctorKey(currentUser), [currentUser]);
  const activeClinic = useMemo(() => getActiveClinicConfig(currentUser), [currentUser]);

  // Aba ativa: 'lancamentos' | 'caixa_diario' | 'repasses' | 'contas_fixas'
  const [activeTab, setActiveTab] = useState<'lancamentos' | 'caixa_diario' | 'repasses' | 'contas_fixas'>('lancamentos');

  // Lançamentos gerais
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ambulatorio_financial_transactions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Erro ao ler transações salvas:', e);
        }
      }
    }
    return [];
  });

  // Sessões de Caixa Diário
  const [cashSessions, setCashSessions] = useState<CashRegisterSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ambulatorio_cash_sessions_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  // Contas Recorrentes
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ambulatorio_recurring_bills_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      // Unidade Dra. Lucy (Odontologia Biológica - Torre II, Praça Maastricht)
      { id: 'rec-lucy-1', description: 'Aluguel do Consultório - Torre II Praça Maastricht (Sl 103)', category: 'Aluguel', amount: 3500, dueDay: 5, status: 'pending', unit: 'dra_lucy', beneficiary: 'Condomínio Torre II Maastricht' },
      { id: 'rec-lucy-2', description: 'Energia Elétrica & Climatização Torre II', category: 'Infraestrutura', amount: 480, dueDay: 15, status: 'pending', unit: 'dra_lucy', beneficiary: 'Energisa / CPFL' },
      { id: 'rec-lucy-3', description: 'Insumos Odonto, Luvas Nitrilo & SMART IAOMT', category: 'Insumos Odonto/Médicos', amount: 1200, dueDay: 20, status: 'pending', unit: 'dra_lucy', beneficiary: 'Dental Cremer / Biomec' },
      { id: 'rec-lucy-4', description: 'Laboratório de Prótese Cerâmica & Zircônia', category: 'Laboratório', amount: 1800, dueDay: 25, status: 'pending', unit: 'dra_lucy', beneficiary: 'Lab Dental Ceram' },
      // Unidade Dr. Carlos (Neurologia & Medicina Integrativa)
      { id: 'rec-carlos-1', description: 'Consultório de Neurologia & Integrativa', category: 'Aluguel', amount: 3200, dueDay: 10, status: 'pending', unit: 'dr_carlos', beneficiary: 'Locação Consultório Neuro' },
      { id: 'rec-carlos-2', description: 'Energia Elétrica & Climatização Consultório Neuro', category: 'Infraestrutura', amount: 420, dueDay: 12, status: 'pending', unit: 'dr_carlos', beneficiary: 'CPFL Energia' },
      { id: 'rec-carlos-3', description: 'Insumos Médicos & Fitoterapia / Suplementação', category: 'Insumos Odonto/Médicos', amount: 800, dueDay: 18, status: 'pending', unit: 'dr_carlos', beneficiary: 'Farmácia de Manipulação / Insumos' },
      // Geral / Recepção Compartilhada
      { id: 'rec-geral-1', description: 'Internet Fibra Óptica 500MB & Telefonia', category: 'Tecnologia', amount: 140, dueDay: 10, status: 'paid', unit: 'geral', beneficiary: 'Vivo Fibra' },
      { id: 'rec-geral-2', description: 'Insumos de Copa, Café e Higiene da Recepção', category: 'Infraestrutura', amount: 220, dueDay: 8, status: 'paid', unit: 'geral', beneficiary: 'Fornecedor Local' }
    ];
  });

  // Filtro de Unidade para Contas Fixas
  const [selectedBillUnit, setSelectedBillUnit] = useState<'all' | 'dra_lucy' | 'dr_carlos' | 'geral'>('all');

  // Configurações Bancárias e Chaves PIX por Profissional
  const [bankSettings, setBankSettings] = useState<Record<string, DoctorBankSettings>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ambulatorio_doctor_bank_settings_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      dra_lucy: {
        doctorKey: 'dra_lucy',
        doctorName: 'Dra. Lucy Murata (CRO/SP 69246)',
        bankName: 'Banco Itaú (341)',
        agency: '0524',
        account: '28491-0',
        pixKeyType: 'cnpj',
        pixKey: '98.412.000/0001-90',
        pixBeneficiary: 'Dra. Lucy Murata Odontologia Biológica'
      },
      dr_carlos: {
        doctorKey: 'dr_carlos',
        doctorName: 'Dr. Carlos Morato (CRM/SP 145.892)',
        bankName: 'Banco Santander (033)',
        agency: '1204',
        account: '10492-3',
        pixKeyType: 'email',
        pixKey: 'carlos.morato@neurologia.med.br',
        pixBeneficiary: 'Dr. Carlos Morato Neurologia Integrativa'
      },
      geral: {
        doctorKey: 'geral',
        doctorName: 'Ambulatório IA (Recepção Geral)',
        bankName: 'Banco do Brasil (001)',
        agency: '3310',
        account: '55120-8',
        pixKeyType: 'telefone',
        pixKey: '11999998888',
        pixBeneficiary: 'Ambulatório IA Recepção'
      }
    };
  });

  // Modais de PIX e Bancos
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isBankSettingsModalOpen, setIsBankSettingsModalOpen] = useState(false);
  const [selectedPixDoctorKey, setSelectedPixDoctorKey] = useState<'dra_lucy' | 'dr_carlos' | 'geral'>(
    activeDoctorKey === 'dra_lucy' ? 'dra_lucy' : (activeDoctorKey === 'dr_carlos' ? 'dr_carlos' : 'geral')
  );

  // Percentuais de Repasse por Profissional
  const [commissionRates, setCommissionRates] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ambulatorio_commission_rates_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      dr_carlos: 70, // 70% Dr. Carlos / 30% Clínica
      dra_lucy: 60,  // 60% Dra. Lucy / 40% Clínica
      marco_admin: 100
    };
  });

  // Modais de Caixa Diário
  const [isOpenCashModalOpen, setIsOpenCashModalOpen] = useState(false);
  const [isCloseCashModalOpen, setIsCloseCashModalOpen] = useState(false);
  const [isBleedingModalOpen, setIsBleedingModalOpen] = useState(false);
  const [initialCashInput, setInitialCashInput] = useState('200,00');
  const [physicalCashInput, setPhysicalCashInput] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [bleedingAmountInput, setBleedingAmountInput] = useState('');
  const [bleedingReasonInput, setBleedingReasonInput] = useState('');

  // Modais de Contas Recorrentes
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [newBillDesc, setNewBillDesc] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillCategory, setNewBillCategory] = useState('Infraestrutura');
  const [newBillDueDay, setNewBillDueDay] = useState(10);
  const [newBillBeneficiary, setNewBillBeneficiary] = useState('');

  // Filtros
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Modal Novo Lançamento
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<'income' | 'expense'>('income');
  const [newDesc, setNewDesc] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientCpf, setNewPatientCpf] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState(
    activeDoctorKey === 'dra_lucy' ? 'Odontologia Biológica' : 'Consulta Especializada'
  );
  const [newPaymentMethod, setNewPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash' | 'health_insurance'>('pix');
  const [newStatus, setNewStatus] = useState<'paid' | 'pending'>('paid');
  const [newDoctorKey, setNewDoctorKey] = useState<string>(activeDoctorKey);

  // In-UI Confirmation Modals
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

  // Sincronização LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambulatorio_financial_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambulatorio_cash_sessions_v1', JSON.stringify(cashSessions));
    }
  }, [cashSessions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambulatorio_recurring_bills_v1', JSON.stringify(recurringBills));
    }
  }, [recurringBills]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambulatorio_commission_rates_v1', JSON.stringify(commissionRates));
    }
  }, [commissionRates]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambulatorio_doctor_bank_settings_v1', JSON.stringify(bankSettings));
    }
  }, [bankSettings]);

  useEffect(() => {
    setNewDoctorKey(activeDoctorKey);
    setNewCategory(activeDoctorKey === 'dra_lucy' ? 'Odontologia Biológica' : 'Consulta Especializada');
  }, [activeDoctorKey]);

  // Sincronizar Atendimentos e Consultas da Agenda
  const [isSyncingAgenda, setIsSyncingAgenda] = useState(false);
  const handleSyncFromAgenda = async () => {
    setIsSyncingAgenda(true);
    const toastId = toast.loading('Sincronizando atendimentos da agenda com o financeiro...');

    try {
      // 1. Busca agendamentos do Supabase
      const { data: supaApps, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data_consulta', { ascending: false });

      if (error) {
        console.warn('Aviso busca agendamentos Supabase:', error.message);
      }

      // 2. Busca também do cache local se houver
      const localAppsRaw = typeof window !== 'undefined' ? localStorage.getItem('ambulatorio_appointments_v1') : null;
      const localApps = localAppsRaw ? JSON.parse(localAppsRaw) : [];

      const allApps = [...(supaApps || []), ...localApps];
      const seenAppIds = new Set<string>();
      let importedCount = 0;

      const newTransactionsToAdd: Transaction[] = [];

      allApps.forEach((app: any) => {
        if (!app.id || seenAppIds.has(String(app.id))) return;
        seenAppIds.add(String(app.id));

        const appStatus = (app.status || '').toLowerCase();
        const appPayment = (app.status_pagamento || '').toLowerCase();
        const isPaid = appPayment.includes('pago') || appStatus === 'finalizado';
        
        // Verifica se tem valor
        const rawVal = app.valor_consulta ? String(app.valor_consulta).replace(/[^\d.,]/g, '').replace(',', '.') : '';
        const numVal = parseFloat(rawVal);
        if (isNaN(numVal) || numVal <= 0) return;

        // Verifica se já existe transação para este agendamento ou paciente na data
        const appDate = app.data_consulta || (app.data_hora ? app.data_hora.split('T')[0] : '');
        const alreadyExists = transactions.some(t => 
          (t.patientName && app.paciente_nome && t.patientName.toLowerCase() === app.paciente_nome.toLowerCase() && t.date === appDate) ||
          t.id === `app-${app.id}`
        );

        if (!alreadyExists && (isPaid || appStatus === 'agendado' || appStatus === 'confirmado')) {
          const docName = app.medico_nome || '';
          const isLucy = docName.toLowerCase().includes('lucy') || docName.toLowerCase().includes('luci');
          const isCarlos = docName.toLowerCase().includes('carlos');
          const dKey = isLucy ? 'dra_lucy' : (isCarlos ? 'dr_carlos' : undefined);

          let method: Transaction['paymentMethod'] = 'pix';
          if (appPayment.includes('cartão') || appPayment.includes('credito')) method = 'credit_card';
          else if (appPayment.includes('debito')) method = 'debit_card';
          else if (appPayment.includes('dinheiro')) method = 'cash';
          else if (appPayment.includes('convenio') || app.convenio?.toLowerCase().includes('convênio')) method = 'health_insurance';

          newTransactionsToAdd.push({
            id: `app-${app.id}-${Date.now()}`,
            type: 'income',
            description: `Consulta - ${app.paciente_nome}`,
            patientName: app.paciente_nome,
            patientCpf: app.paciente_cpf || '',
            amount: numVal,
            category: app.especialidade_nome || (isLucy ? 'Odontologia Biológica' : 'Consulta Neurológica'),
            paymentMethod: method,
            status: isPaid ? 'paid' : 'pending',
            date: appDate || todayStr,
            doctorName: docName || (isLucy ? 'Dra. Lucy Murata' : 'Dr. Carlos Morato'),
            doctorKey: dKey,
            doctorCouncil: isLucy ? 'CRO/SP 69246' : (isCarlos ? 'CRM/SP 145.892' : undefined),
            notes: `Importado da Agenda Médica (${app.status || 'Atendimento'})`
          });
          importedCount++;
        }
      });

      if (importedCount > 0) {
        setTransactions(prev => [...newTransactionsToAdd, ...prev]);
        toast.success(`${importedCount} consultas importadas da agenda para o fluxo financeiro!`, { id: toastId });
      } else {
        toast.success('Fluxo financeiro já está 100% atualizado com a agenda médica.', { id: toastId });
      }
    } catch (e: any) {
      toast.error('Erro ao sincronizar com a agenda: ' + e.message, { id: toastId });
    } finally {
      setIsSyncingAgenda(false);
    }
  };

  // Caixa de hoje (aberto ou fechado)
  const currentCashSession = useMemo(() => {
    return cashSessions.find(s => s.date === todayStr && s.status === 'open') || null;
  }, [cashSessions, todayStr]);

  // Transações de hoje em dinheiro físico
  const todayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === todayStr && t.status === 'paid');
  }, [transactions, todayStr]);

  const todayCashIn = useMemo(() => {
    return todayTransactions
      .filter(t => t.type === 'income' && t.paymentMethod === 'cash')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [todayTransactions]);

  const todayPixTotal = useMemo(() => {
    return todayTransactions
      .filter(t => t.type === 'income' && t.paymentMethod === 'pix')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [todayTransactions]);

  const todayCreditTotal = useMemo(() => {
    return todayTransactions
      .filter(t => t.type === 'income' && t.paymentMethod === 'credit_card')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [todayTransactions]);

  const todayDebitTotal = useMemo(() => {
    return todayTransactions
      .filter(t => t.type === 'income' && t.paymentMethod === 'debit_card')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [todayTransactions]);

  const todayBleedingsTotal = useMemo(() => {
    if (!currentCashSession) return 0;
    return currentCashSession.bleedings.reduce((acc, b) => acc + b.amount, 0);
  }, [currentCashSession]);

  // Saldo esperado em dinheiro físico na gaveta
  const expectedDrawerCash = useMemo(() => {
    if (!currentCashSession) return 0;
    return currentCashSession.initialCash + todayCashIn - todayBleedingsTotal;
  }, [currentCashSession, todayCashIn, todayBleedingsTotal]);

  // Cálculos do Mês Selecionado
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesMonth = t.date.startsWith(selectedMonth);
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesSearch = searchTerm === '' || 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.patientName && t.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.doctorName && t.doctorName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesMonth && matchesType && matchesStatus && matchesSearch;
    });
  }, [transactions, selectedMonth, filterType, filterStatus, searchTerm]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const pendingIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const netBalance = totalIncome - totalExpenses;

  // Cálculos de Repasse por Profissional
  const commissionSummary = useMemo(() => {
    const paidIncomes = filteredTransactions.filter(t => t.type === 'income' && t.status === 'paid');
    
    // Dr. Carlos
    const drCarlosIncomes = paidIncomes.filter(t => t.doctorKey === 'dr_carlos' || (t.doctorName && t.doctorName.toLowerCase().includes('carlos')));
    const drCarlosTotal = drCarlosIncomes.reduce((acc, t) => acc + t.amount, 0);
    const drCarlosRate = commissionRates.dr_carlos ?? 70;
    const drCarlosDoctorAmount = (drCarlosTotal * drCarlosRate) / 100;
    const drCarlosClinicAmount = drCarlosTotal - drCarlosDoctorAmount;

    // Dra. Lucy
    const draLucyIncomes = paidIncomes.filter(t => t.doctorKey === 'dra_lucy' || (t.doctorName && t.doctorName.toLowerCase().includes('lucy')) || (t.doctorName && t.doctorName.toLowerCase().includes('luci')));
    const draLucyTotal = draLucyIncomes.reduce((acc, t) => acc + t.amount, 0);
    const draLucyRate = commissionRates.dra_lucy ?? 60;
    const draLucyDoctorAmount = (draLucyTotal * draLucyRate) / 100;
    const draLucyClinicAmount = draLucyTotal - draLucyDoctorAmount;

    // Total Geral
    const totalDoctorSplits = drCarlosDoctorAmount + draLucyDoctorAmount;
    const totalClinicRetention = drCarlosClinicAmount + draLucyClinicAmount;

    return {
      drCarlos: { total: drCarlosTotal, rate: drCarlosRate, doctorAmount: drCarlosDoctorAmount, clinicAmount: drCarlosClinicAmount, count: drCarlosIncomes.length },
      draLucy: { total: draLucyTotal, rate: draLucyRate, doctorAmount: draLucyDoctorAmount, clinicAmount: draLucyClinicAmount, count: draLucyIncomes.length },
      totalDoctorSplits,
      totalClinicRetention
    };
  }, [filteredTransactions, commissionRates]);

  // Abertura de Caixa
  const handleOpenCash = (e: React.FormEvent) => {
    e.preventDefault();
    const initVal = parseFloat(initialCashInput.replace(/\./g, '').replace(',', '.'));
    if (isNaN(initVal) || initVal < 0) {
      toast.error('Informe um valor de fundo de troco válido.');
      return;
    }

    const newSession: CashRegisterSession = {
      id: `cash-${Date.now()}`,
      date: todayStr,
      openedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'open',
      operatorName: currentUser?.nome || currentUser?.email || 'Recepção / Gestão',
      initialCash: initVal,
      bleedings: []
    };

    setCashSessions([newSession, ...cashSessions]);
    setIsOpenCashModalOpen(false);
    toast.success(`Caixa do dia ${new Date().toLocaleDateString('pt-BR')} aberto com sucesso!`);
  };

  // Realizar Sangria de Caixa
  const handleBleeding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCashSession) return;
    const val = parseFloat(bleedingAmountInput.replace(/\./g, '').replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor numérico válido para a sangria.');
      return;
    }
    if (val > expectedDrawerCash) {
      toast.error(`A sangria não pode ser maior que o saldo em gaveta (${numberToWordsBrl(expectedDrawerCash)}).`);
      return;
    }

    const bleeding = {
      id: `bld-${Date.now()}`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      amount: val,
      reason: bleedingReasonInput.trim() || 'Sangria para depósito ou pagamento em espécie',
      operator: currentUser?.nome || 'Operador de Caixa'
    };

    // Atualiza a sessão atual
    setCashSessions(cashSessions.map(s => {
      if (s.id === currentCashSession.id) {
        return {
          ...s,
          bleedings: [...s.bleedings, bleeding]
        };
      }
      return s;
    }));

    // Cria lançamento correspondente de despesa no fluxo geral
    const expenseRecord: Transaction = {
      id: `exp-sangria-${Date.now()}`,
      type: 'expense',
      description: `Sangria de Caixa: ${bleeding.reason}`,
      amount: val,
      category: 'Sangria de Caixa',
      paymentMethod: 'cash',
      status: 'paid',
      date: todayStr,
      notes: `Horário: ${bleeding.time} por ${bleeding.operator}`
    };
    setTransactions(prev => [expenseRecord, ...prev]);

    setIsBleedingModalOpen(false);
    setBleedingAmountInput('');
    setBleedingReasonInput('');
    toast.success(`Sangria de ${numberToWordsBrl(val)} realizada com sucesso.`);
  };

  // Fechamento de Caixa
  const handleCloseCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCashSession) return;
    const counted = parseFloat(physicalCashInput.replace(/\./g, '').replace(',', '.'));
    if (isNaN(counted) || counted < 0) {
      toast.error('Informe o valor físico contado na gaveta.');
      return;
    }

    const diff = counted - expectedDrawerCash;

    setCashSessions(cashSessions.map(s => {
      if (s.id === currentCashSession.id) {
        return {
          ...s,
          status: 'closed',
          closedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          physicalCashCounted: counted,
          difference: diff,
          notes: closingNotes.trim()
        };
      }
      return s;
    }));

    setIsCloseCashModalOpen(false);
    setPhysicalCashInput('');
    setClosingNotes('');

    if (Math.abs(diff) < 0.01) {
      toast.success('Caixa fechado com sucesso! Saldo 100% exato sem divergências.');
    } else if (diff > 0) {
      toast.success(`Caixa fechado com SOBRA de ${numberToWordsBrl(diff)}.`);
    } else {
      toast.error(`Caixa fechado com FALTA de ${numberToWordsBrl(Math.abs(diff))}.`);
    }
  };

  // Lançar Pagamento de Conta Recorrente
  const handlePayRecurringBill = (bill: RecurringBill) => {
    const updatedStatus = bill.status === 'paid' ? 'pending' : 'paid';
    setRecurringBills(recurringBills.map(b => b.id === bill.id ? { ...b, status: updatedStatus, lastPaidMonth: updatedStatus === 'paid' ? selectedMonth : undefined } : b));
    
    if (updatedStatus === 'paid') {
      // Cria lançamento de despesa no mês selecionado
      const expenseItem: Transaction = {
        id: `rec-exp-${Date.now()}`,
        type: 'expense',
        description: `Pagamento Recorrente: ${bill.description}`,
        amount: bill.amount,
        category: bill.category,
        paymentMethod: 'pix',
        status: 'paid',
        date: todayStr,
        notes: `Beneficiário: ${bill.beneficiary || 'Clínica'}`
      };
      setTransactions(prev => [expenseItem, ...prev]);
      toast.success(`Conta "${bill.description}" marcada como paga e debitada do fluxo de caixa.`);
    } else {
      toast.success(`Status da conta "${bill.description}" retornado para pendente.`);
    }
  };

  // Criar Nova Conta Recorrente
  const handleAddRecurringBill = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBillAmount.replace(/\./g, '').replace(',', '.'));
    if (!newBillDesc || isNaN(val) || val <= 0) {
      toast.error('Preencha a descrição e um valor válido.');
      return;
    }

    const newBill: RecurringBill = {
      id: `bill-${Date.now()}`,
      description: newBillDesc.trim(),
      category: newBillCategory,
      amount: val,
      dueDay: Number(newBillDueDay) || 10,
      status: 'pending',
      beneficiary: newBillBeneficiary.trim()
    };

    setRecurringBills([...recurringBills, newBill]);
    setIsAddBillModalOpen(false);
    setNewBillDesc('');
    setNewBillAmount('');
    setNewBillBeneficiary('');
    toast.success('Conta fixa cadastrada com sucesso!');
  };

  // Adicionar Lançamento Manual
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount) {
      toast.error('Preencha a descrição e o valor.');
      return;
    }

    const val = parseFloat(newAmount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor numérico válido.');
      return;
    }

    const docConfig = CLINIC_PROFILES_CONFIG[newDoctorKey] || activeClinic;

    const item: Transaction = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      type: newType,
      description: newDesc.trim(),
      patientName: newType === 'income' ? newPatientName.trim() : undefined,
      patientCpf: newType === 'income' ? newPatientCpf.trim() : undefined,
      amount: val,
      category: newCategory,
      paymentMethod: newPaymentMethod,
      status: newStatus,
      date: new Date().toISOString().split('T')[0],
      doctorName: newType === 'income' ? docConfig.professional_name : undefined,
      doctorCouncil: newType === 'income' ? docConfig.council_badge : undefined,
      doctorKey: newType === 'income' ? newDoctorKey : undefined,
    };

    setTransactions([item, ...transactions]);
    toast.success(newType === 'income' ? 'Receita registrada com sucesso!' : 'Despesa lançada com sucesso!');
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewDesc('');
    setNewPatientName('');
    setNewPatientCpf('');
    setNewAmount('');
    setNewCategory(activeDoctorKey === 'dra_lucy' ? 'Odontologia Biológica' : 'Consulta Especializada');
    setNewPaymentMethod('pix');
    setNewStatus('paid');
  };

  const toggleStatus = (id: string) => {
    setTransactions(transactions.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'paid' ? 'pending' : 'paid';
        toast.success(`Status alterado para ${nextStatus === 'paid' ? 'Pago' : 'Pendente'}`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const confirmDelete = () => {
    if (!transactionToDelete) return;
    setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
    toast.success(`Lançamento "${transactionToDelete.description}" excluído.`);
    setTransactionToDelete(null);
  };

  const confirmClearAll = () => {
    setTransactions([]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambulatorio_financial_transactions', JSON.stringify([]));
    }
    toast.success('Todos os lançamentos financeiros foram limpos.');
    setIsClearAllModalOpen(false);
  };

  const getMethodLabel = (method: Transaction['paymentMethod']) => {
    switch(method) {
      case 'pix': return 'PIX';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'cash': return 'Dinheiro';
      case 'health_insurance': return 'Convênio';
    }
  };

  const numberToWordsBrl = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  // Copiar Recibo para Enviar no WhatsApp
  const handleCopyReceiptWhatsApp = (t: Transaction) => {
    const docConfig = t.doctorKey && CLINIC_PROFILES_CONFIG[t.doctorKey] ? CLINIC_PROFILES_CONFIG[t.doctorKey] : activeClinic;
    const text = `*COMPROVANTE DE PAGAMENTO / RECIBO CLÍNICO*\n\n` +
      `🏥 *${docConfig.name}*\n` +
      `📍 ${docConfig.address}\n\n` +
      `👤 *Paciente:* ${t.patientName || 'Paciente'}\n` +
      (t.patientCpf ? `📄 *CPF:* ${t.patientCpf}\n` : '') +
      `💰 *Valor Pago:* ${numberToWordsBrl(t.amount)}\n` +
      `💳 *Forma de Pagamento:* ${getMethodLabel(t.paymentMethod)}\n` +
      `📝 *Referente a:* ${t.description}\n` +
      `📅 *Data:* ${new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}\n\n` +
      `👨‍⚕️ *Profissional Responsável:* ${t.doctorName || docConfig.professional_name} (${t.doctorCouncil || docConfig.council_badge})\n\n` +
      `_Comprovante emitido eletronicamente para fins de declaração e reembolso._`;
    
    navigator.clipboard.writeText(text);
    toast.success('Texto do recibo copiado! Cole diretamente na conversa do WhatsApp.');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho Superior */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl text-white shadow-xs ${
            activeDoctorKey === 'dra_lucy' ? 'bg-emerald-600' : 'bg-blue-600'
          }`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-800">Financeiro & Caixa</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                activeDoctorKey === 'dra_lucy'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-blue-50 border-blue-300 text-blue-800'
              }`}>
                {activeClinic.professional_name} ({activeClinic.council_badge})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de caixa diário, sangrias, repasses de honorários, contas recorrentes e emissão de recibos timbrados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seletor de Mês */}
          <div className="flex items-center gap-2 bg-slate-100/90 px-3.5 py-2 rounded-2xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            />
          </div>

          {/* Sincronizar Agenda */}
          <button
            type="button"
            onClick={handleSyncFromAgenda}
            disabled={isSyncingAgenda}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            title="Importar atendimentos e consultas da agenda médica para o caixa"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAgenda ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Sincronizar Agenda</span>
          </button>

          {/* Cobrança PIX / QR Code */}
          <button
            type="button"
            onClick={() => setIsPixModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer"
            title="Abrir chave PIX e QR Code para recebimento do paciente"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cobrança PIX</span>
          </button>

          {/* Configurações Bancárias */}
          <button
            type="button"
            onClick={() => setIsBankSettingsModalOpen(true)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors border border-slate-200 cursor-pointer"
            title="Configurar Dados Bancários e Chaves PIX dos Doutores"
          >
            <Settings className="w-4 h-4 text-slate-600" />
          </button>

          {/* Botão Novo Lançamento */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Barra de Abas Estratégicas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('lancamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'lancamentos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Lançamentos & Fluxo Geral</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/60 text-slate-200">
            {filteredTransactions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('caixa_diario')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'caixa_diario'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Caixa Diário & Sangria</span>
          {currentCashSession ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Caixa Aberto Hoje" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-300" title="Caixa Fechado" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('repasses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'repasses'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Repasses & Honorários Médicos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contas_fixas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'contas_fixas'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Contas Fixas & Recorrentes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-700">
            {recurringBills.filter(b => b.status === 'pending').length} pendentes
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: LANÇAMENTOS GERAIS & FLUXO                                */}
      {/* ============================================================== */}
      {activeTab === 'lancamentos' && (
        <div className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Entradas */}
            <div className="p-5 bg-gradient-to-br from-sky-50 to-blue-50/70 border border-sky-100 rounded-3xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">Receitas Recebidas</span>
                <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mb-1">
                {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-[11px] text-sky-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-sky-600" />
                <span>Confirmado em caixa</span>
              </div>
            </div>

            {/* Despesas */}
            <div className="p-5 bg-gradient-to-br from-rose-50 to-red-50/70 border border-rose-100 rounded-3xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Despesas / Saídas</span>
                <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-900 mb-1">
                {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-[11px] text-rose-700 flex items-center gap-1">
                <span>{filteredTransactions.filter(t => t.type === 'expense').length} pagamentos realizados</span>
              </div>
            </div>

            {/* Saldo Líquido */}
            <div className={`p-5 rounded-3xl border relative overflow-hidden ${
              netBalance >= 0 
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50/70 border-emerald-100' 
                : 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-100'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Saldo Líquido</span>
                <div className={`p-2 rounded-xl ${netBalance >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black mb-1 ${netBalance >= 0 ? 'text-emerald-900' : 'text-amber-900'}`}>
                {netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-[11px] text-slate-600">
                Resultado operacional do período
              </div>
            </div>

            {/* Receitas Pendentes */}
            <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50/70 border border-amber-100 rounded-3xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">A Receber / Convênios</span>
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-900 mb-1">
                {pendingIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-[11px] text-amber-700 flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                <span>Convênios / Faturas a compensar</span>
              </div>
            </div>
          </div>

          {/* Tabela de Lançamentos & Filtros */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Buscar por paciente, descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button 
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Todos
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFilterType('income')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === 'income' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Receitas
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFilterType('expense')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Despesas
                  </button>
                </div>

                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 text-xs font-bold bg-slate-100 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos os Status</option>
                  <option value="paid">Confirmados / Pagos</option>
                  <option value="pending">Pendentes</option>
                </select>

                {transactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsClearAllModalOpen(true)}
                    className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
                    title="Limpar todos os registros"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabela de Dados */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3.5">Data</th>
                    <th className="p-3.5">Descrição / Paciente</th>
                    <th className="p-3.5">Categoria</th>
                    <th className="p-3.5">Forma</th>
                    <th className="p-3.5">Valor</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Wallet className="w-8 h-8 text-slate-300 stroke-1" />
                          <p className="font-medium text-slate-500">Nenhum lançamento financeiro neste período.</p>
                          <p className="text-[11px] text-slate-400">Clique em "Novo Lançamento" para registrar receitas ou despesas.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-medium text-slate-600 whitespace-nowrap">
                          {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{t.description}</div>
                          {t.patientName && (
                            <div className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                              <span>👤</span>
                              <span>{t.patientName}</span>
                              {t.patientCpf && <span className="text-slate-400">({t.patientCpf})</span>}
                            </div>
                          )}
                          {t.doctorName && (
                            <div className="text-[10px] text-slate-400">
                              {t.doctorName} {t.doctorCouncil && `• ${t.doctorCouncil}`}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold">
                            {t.category}
                          </span>
                        </td>

                        <td className="p-3.5 font-medium text-slate-600">
                          {getMethodLabel(t.paymentMethod)}
                        </td>

                        <td className="p-3.5">
                          <span className={`font-black ${t.type === 'income' ? 'text-blue-600' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => toggleStatus(t.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-transform hover:scale-105 cursor-pointer ${
                              t.status === 'paid'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                            title="Clique para alternar entre Pago e Pendente"
                          >
                            {t.status === 'paid' ? <CheckCircle className="w-3 h-3 text-blue-600" /> : <Clock className="w-3 h-3" />}
                            <span>{t.status === 'paid' ? 'Pago' : 'Pendente'}</span>
                          </button>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                          {t.type === 'income' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopyReceiptWhatsApp(t)}
                                title="Copiar Comprovante para WhatsApp"
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt(t)}
                                title="Emitir Recibo em PDF / Imprimir"
                                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setTransactionToDelete(t)}
                            title="Excluir Lançamento"
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: CAIXA DIÁRIO & SANGRIA (FRENTE DE CAIXA DA RECEPÇÃO)      */}
      {/* ============================================================== */}
      {activeTab === 'caixa_diario' && (
        <div className="space-y-6">
          {/* Card Principal do Dia */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black text-slate-800">Frente de Caixa Diário</h2>
                  {currentCashSession ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Caixa Aberto (Operador: {currentCashSession.operatorName})
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Caixa Fechado Hoje
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Data: {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!currentCashSession ? (
                  <button
                    type="button"
                    onClick={() => setIsOpenCashModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Abrir Caixa do Dia</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsBleedingModalOpen(true)}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-600/20 cursor-pointer"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      <span>Fazer Sangria</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCloseCashModalOpen(true)}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Fechar Caixa</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Painel de Movimentação em Tempo Real Hoje */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Fundo de Troco</span>
                <div className="text-xl font-black text-slate-800 mt-1">
                  {numberToWordsBrl(currentCashSession ? currentCashSession.initialCash : 0)}
                </div>
                <span className="text-[10px] text-slate-400">Abertura da recepção</span>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Dinheiro na Gaveta</span>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {numberToWordsBrl(expectedDrawerCash)}
                </div>
                <span className="text-[10px] text-emerald-600">Troco + Entradas - Sangrias</span>
              </div>

              <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-100">
                <span className="text-[11px] font-bold text-sky-800 uppercase">Entradas PIX Hoje</span>
                <div className="text-xl font-black text-sky-700 mt-1">
                  {numberToWordsBrl(todayPixTotal)}
                </div>
                <span className="text-[10px] text-sky-600">Direto na conta bancária</span>
              </div>

              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                <span className="text-[11px] font-bold text-indigo-800 uppercase">Cartão Crédito / Débito</span>
                <div className="text-xl font-black text-indigo-700 mt-1">
                  {numberToWordsBrl(todayCreditTotal + todayDebitTotal)}
                </div>
                <span className="text-[10px] text-indigo-600">Maquininha de cartão</span>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100">
                <span className="text-[11px] font-bold text-amber-800 uppercase">Sangrias Realizadas</span>
                <div className="text-xl font-black text-amber-700 mt-1">
                  {numberToWordsBrl(todayBleedingsTotal)}
                </div>
                <span className="text-[10px] text-amber-600">Retiradas da gaveta hoje</span>
              </div>
            </div>

            {/* Lista de Sangrias de Hoje */}
            {currentCashSession && currentCashSession.bleedings.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Histórico de Sangrias de Hoje:</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  {currentCashSession.bleedings.map(b => (
                    <div key={b.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{b.reason}</span>
                        <span className="text-slate-400 ml-2">às {b.time} por {b.operator}</span>
                      </div>
                      <div className="font-black text-amber-700">
                        - {numberToWordsBrl(b.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Histórico de Fechamentos Anteriores */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Histórico de Caixas Fechados
            </h3>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3.5">Data / Operador</th>
                    <th className="p-3.5">Fundo Inicial</th>
                    <th className="p-3.5">Saldo Sistema</th>
                    <th className="p-3.5">Contagem Física</th>
                    <th className="p-3.5">Divergência</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashSessions.filter(s => s.status === 'closed').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Nenhum fechamento registrado no histórico recente.
                      </td>
                    </tr>
                  ) : (
                    cashSessions.filter(s => s.status === 'closed').map(session => (
                      <tr key={session.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">
                            {new Date(session.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {session.operatorName} • Fechado às {session.closedAt || '--:--'}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">{numberToWordsBrl(session.initialCash)}</td>
                        <td className="p-3.5 font-bold text-slate-800">{numberToWordsBrl(session.initialCash)}</td>
                        <td className="p-3.5 font-bold text-indigo-700">
                          {numberToWordsBrl(session.physicalCashCounted || 0)}
                        </td>
                        <td className="p-3.5">
                          {session.difference === 0 ? (
                            <span className="text-emerald-700 font-bold">R$ 0,00 (Exato)</span>
                          ) : (session.difference || 0) > 0 ? (
                            <span className="text-blue-700 font-bold">+ {numberToWordsBrl(session.difference || 0)} (Sobra)</span>
                          ) : (
                            <span className="text-rose-700 font-bold">{numberToWordsBrl(session.difference || 0)} (Falta)</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                            Fechado
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: REPASSES & HONORÁRIOS MÉDICOS                           */}
      {/* ============================================================== */}
      {activeTab === 'repasses' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <BadgePercent className="w-5 h-5 text-indigo-600" />
                  Divisão de Repasses & Honorários Médicos
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Mês de Referência: <strong>{selectedMonth}</strong> • Cálculo automático da fatia do profissional e retenção da clínica.
                </p>
              </div>
            </div>

            {/* Cards de Resumo dos Dois Pilares */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dr. Carlos Morato */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl border border-blue-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Dr. Carlos Morato</h3>
                      <span className="text-[11px] text-blue-700 font-bold">CRM/SP 145.892 • Neurologia & Integrativa</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-blue-200 text-xs font-bold text-blue-800">
                    <span>Repasse:</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={commissionRates.dr_carlos ?? 70}
                      onChange={(e) => setCommissionRates({ ...commissionRates, dr_carlos: Number(e.target.value) })}
                      className="w-12 text-center bg-blue-50 rounded font-black text-blue-900 outline-none"
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-3 bg-white rounded-2xl border border-blue-100 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Total Faturado</span>
                    <div className="text-sm font-black text-slate-800 mt-0.5">
                      {numberToWordsBrl(commissionSummary.drCarlos.total)}
                    </div>
                    <span className="text-[10px] text-slate-400">{commissionSummary.drCarlos.count} atendimentos</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold">Honorário Médico</span>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">
                      {numberToWordsBrl(commissionSummary.drCarlos.doctorAmount)}
                    </div>
                    <span className="text-[10px] text-emerald-600">{commissionSummary.drCarlos.rate}% do profissional</span>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-center">
                    <span className="text-[10px] text-indigo-800 uppercase font-bold">Fatia da Clínica</span>
                    <div className="text-sm font-black text-indigo-700 mt-0.5">
                      {numberToWordsBrl(commissionSummary.drCarlos.clinicAmount)}
                    </div>
                    <span className="text-[10px] text-indigo-600">{100 - commissionSummary.drCarlos.rate}% retenção</span>
                  </div>
                </div>
              </div>

              {/* Dra. Lucy Murata */}
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-3xl border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-2xl">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Dra. Lucy Murata</h3>
                      <span className="text-[11px] text-emerald-700 font-bold">CRO/SP 69246 • Odontologia Biológica</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800">
                    <span>Repasse:</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={commissionRates.dra_lucy ?? 60}
                      onChange={(e) => setCommissionRates({ ...commissionRates, dra_lucy: Number(e.target.value) })}
                      className="w-12 text-center bg-emerald-50 rounded font-black text-emerald-900 outline-none"
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-3 bg-white rounded-2xl border border-emerald-100 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Total Faturado</span>
                    <div className="text-sm font-black text-slate-800 mt-0.5">
                      {numberToWordsBrl(commissionSummary.draLucy.total)}
                    </div>
                    <span className="text-[10px] text-slate-400">{commissionSummary.draLucy.count} procedimentos</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold">Honorário Dentista</span>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">
                      {numberToWordsBrl(commissionSummary.draLucy.doctorAmount)}
                    </div>
                    <span className="text-[10px] text-emerald-600">{commissionSummary.draLucy.rate}% da profissional</span>
                  </div>

                  <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-center">
                    <span className="text-[10px] text-teal-800 uppercase font-bold">Fatia da Clínica</span>
                    <div className="text-sm font-black text-teal-700 mt-0.5">
                      {numberToWordsBrl(commissionSummary.draLucy.clinicAmount)}
                    </div>
                    <span className="text-[10px] text-teal-600">{100 - commissionSummary.draLucy.rate}% retenção</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Painel Consolidado de Repasses */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Total Consolidado de Repasses do Mês:</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {numberToWordsBrl(commissionSummary.totalDoctorSplits)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold uppercase">Retenção Líquida da Clínica:</span>
                <div className="text-2xl font-black text-sky-400 mt-1">
                  {numberToWordsBrl(commissionSummary.totalClinicRetention)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 4: CONTAS FIXAS & RECORRENTES                              */}
      {/* ============================================================== */}
      {activeTab === 'contas_fixas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-600" />
                  Contas a Pagar Recorrentes por Unidade
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Custos fixos mensais separados por consultório (Dra. Lucy - Torre II vs. Dr. Carlos - Neurologia vs. Despesas Gerais).
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAddBillModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Conta Recorrente</span>
                </button>
              </div>
            </div>

            {/* Filtro por Unidade / Consultório */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedBillUnit('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBillUnit === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas as Unidades ({recurringBills.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillUnit('dra_lucy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBillUnit === 'dra_lucy'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                🌿 Dra. Lucy (Torre II - Sl 103)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillUnit('dr_carlos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBillUnit === 'dr_carlos'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                🧠 Dr. Carlos (Neurologia)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillUnit('geral')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBillUnit === 'geral'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🏥 Recepção / Compartilhado
              </button>
            </div>

            {/* Lista de Contas Filtrada */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recurringBills
                .filter(b => selectedBillUnit === 'all' || b.unit === selectedBillUnit || (!b.unit && selectedBillUnit === 'geral'))
                .map(bill => (
                <div 
                  key={bill.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    bill.status === 'paid'
                      ? 'bg-slate-50 border-slate-200/80 opacity-75'
                      : 'bg-white border-rose-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {bill.category}
                        </span>
                        {bill.unit === 'dra_lucy' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Dra. Lucy (Torre II)
                          </span>
                        )}
                        {bill.unit === 'dr_carlos' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Dr. Carlos (Neuro)
                          </span>
                        )}
                        {bill.unit === 'geral' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            Recepção Geral
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">{bill.description}</h3>
                      {bill.beneficiary && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Favorecido: {bill.beneficiary}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-500">Vencimento</span>
                      <div className="text-xs font-black text-slate-700">Todo dia {bill.dueDay}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="text-base font-black text-rose-600">
                      {numberToWordsBrl(bill.amount)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePayRecurringBill(bill)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        bill.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs'
                      }`}
                    >
                      {bill.status === 'paid' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Paga no Mês</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Pagar Conta</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAIS DO CAIXA DIÁRIO                                         */}
      {/* ============================================================== */}

      {/* Modal Abertura de Caixa */}
      {isOpenCashModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Abertura de Caixa Diário</h3>
                <p className="text-xs text-slate-500">Defina o fundo de troco da recepção</p>
              </div>
            </div>

            <form onSubmit={handleOpenCash} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fundo de Troco Inicial em Dinheiro (R$) *
                </label>
                <input 
                  type="text"
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  placeholder="200,00"
                  className="w-full p-3 text-sm font-black bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Valor em notas e moedas físicas disponível na gaveta para iniciar o expediente.
                </span>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenCashModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sangria de Caixa */}
      {isBleedingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-2xl">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Sangria de Caixa</h3>
                <p className="text-xs text-slate-500">Retirada de dinheiro da gaveta</p>
              </div>
            </div>

            <form onSubmit={handleBleeding} className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                Saldo disponível na gaveta agora: <strong>{numberToWordsBrl(expectedDrawerCash)}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor da Retirada (R$) *
                </label>
                <input 
                  type="text"
                  required
                  value={bleedingAmountInput}
                  onChange={(e) => setBleedingAmountInput(e.target.value)}
                  placeholder="Ex: 500,00"
                  className="w-full p-2.5 text-sm font-black bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo da Sangria *
                </label>
                <input 
                  type="text"
                  required
                  value={bleedingReasonInput}
                  onChange={(e) => setBleedingReasonInput(e.target.value)}
                  placeholder="Ex: Depósito Bancário / Pagamento de Fornecedor"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsBleedingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  Registrar Sangria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechamento de Caixa */}
      {isCloseCashModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Fechamento do Caixa Diário</h3>
                <p className="text-xs text-slate-500">Conferência física e encerramento</p>
              </div>
            </div>

            <form onSubmit={handleCloseCash} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fundo Inicial:</span>
                  <span className="font-bold">{numberToWordsBrl(currentCashSession?.initialCash || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entradas Dinheiro:</span>
                  <span className="font-bold text-emerald-700">+ {numberToWordsBrl(todayCashIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sangrias:</span>
                  <span className="font-bold text-amber-700">- {numberToWordsBrl(todayBleedingsTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-black">
                  <span>Esperado na Gaveta:</span>
                  <span className="text-blue-700">{numberToWordsBrl(expectedDrawerCash)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor Físico Real Contado na Gaveta (R$) *
                </label>
                <input 
                  type="text"
                  required
                  value={physicalCashInput}
                  onChange={(e) => setPhysicalCashInput(e.target.value)}
                  placeholder="Ex: 450,00"
                  className="w-full p-3 text-sm font-black bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações do Fechamento
                </label>
                <textarea 
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Ex: Tudo conferido sem divergências. Dinheiro entregue à administração."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseCashModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Encerrar e Fechar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Conta Recorrente */}
      {isAddBillModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Nova Conta Recorrente</h3>
                <p className="text-xs text-slate-500">Custo fixo mensal da clínica</p>
              </div>
            </div>

            <form onSubmit={handleAddRecurringBill} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição da Conta *</label>
                <input 
                  type="text"
                  required
                  value={newBillDesc}
                  onChange={(e) => setNewBillDesc(e.target.value)}
                  placeholder="Ex: Aluguel / Condomínio / Luz / Laboratório"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Mensal (R$) *</label>
                  <input 
                    type="text"
                    required
                    value={newBillAmount}
                    onChange={(e) => setNewBillAmount(e.target.value)}
                    placeholder="Ex: 850,00"
                    className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dia do Vencimento *</label>
                  <input 
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newBillDueDay}
                    onChange={(e) => setNewBillDueDay(Number(e.target.value))}
                    className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Favorecido / Fornecedor</label>
                <input 
                  type="text"
                  value={newBillBeneficiary}
                  onChange={(e) => setNewBillBeneficiary(e.target.value)}
                  placeholder="Ex: Imobiliária / CPFL / Dental Cremer"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBillModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL NOVO LANÇAMENTO MANUAL                                   */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Novo Lançamento Financeiro
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setNewType('income')}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    newType === 'income' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600'
                  }`}
                >
                  🔵 Receita / Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('expense')}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    newType === 'expense' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600'
                  }`}
                >
                  🔴 Despesa / Saída
                </button>
              </div>

              {newType === 'income' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Profissional / Atendimento</label>
                  <select
                    value={newDoctorKey}
                    onChange={(e) => {
                      const key = e.target.value;
                      setNewDoctorKey(key);
                      if (key === 'dra_lucy') setNewCategory('Odontologia Biológica');
                      else if (key === 'dr_carlos') setNewCategory('Consulta Neurológica');
                    }}
                    className="w-full p-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="dra_lucy">Dra. Lucy Murata (CRO-SP 69246) - Odontologia Biológica</option>
                    <option value="dr_carlos">Dr. Carlos Morato (CRM/SP 145.892) - Neurologia & Integrativa</option>
                    <option value="marco_admin">Marco Duarte - Ambulatório Geral</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Serviço / Conta *</label>
                <input 
                  type="text" 
                  required
                  placeholder={
                    newType === 'income' 
                      ? (newDoctorKey === 'dra_lucy' ? "Ex: Protocolo Remoção Amálgama SMART" : "Ex: Consulta Neurológica de Avaliação") 
                      : "Ex: Insumos Odontológicos / Conta de Energia / Software"
                  }
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {newType === 'income' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Paciente</label>
                    <input 
                      type="text" 
                      placeholder="Nome completo do paciente"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CPF do Paciente (Para Recibo)</label>
                    <input 
                      type="text" 
                      placeholder="000.000.000-00"
                      value={newPatientCpf}
                      onChange={(e) => setNewPatientCpf(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="0,00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select 
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="pix">PIX</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="cash">Dinheiro</option>
                    <option value="health_insurance">Convênio / Reembolso</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {newType === 'income' ? (
                      <>
                        <option value="Odontologia Biológica">Odontologia Biológica</option>
                        <option value="Cirurgia Cerâmica Zircônia">Cirurgia Cerâmica Zircônia</option>
                        <option value="Remoção Segura SMART">Remoção Segura SMART</option>
                        <option value="Terapia Neural & Ozônio">Terapia Neural & Ozônio</option>
                        <option value="Consulta Especializada">Consulta Especializada</option>
                        <option value="Consulta Integrativa">Consulta Integrativa</option>
                        <option value="Exame Neurológico">Exame Neurológico</option>
                        <option value="Convênio Médico">Convênio Médico</option>
                        <option value="Outros">Outros</option>
                      </>
                    ) : (
                      <>
                        <option value="Insumos Odonto/Médicos">Insumos Odonto / Médicos</option>
                        <option value="Tecnologia">Tecnologia & Software</option>
                        <option value="Aluguel">Aluguel / Condomínio</option>
                        <option value="Equipe">Salários / Pessoal</option>
                        <option value="Outros">Outras Despesas</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="paid">Confirmado / Pago</option>
                    <option value="pending">Pendente / A Receber</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Excluir Lançamento</h3>
                <p className="text-xs text-slate-500">Confirmação de exclusão</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-800">{transactionToDelete.description}</p>
              {transactionToDelete.patientName && (
                <p className="text-slate-600">Paciente: {transactionToDelete.patientName}</p>
              )}
              <p className={`font-bold ${transactionToDelete.type === 'income' ? 'text-blue-600' : 'text-rose-600'}`}>
                Valor: {numberToWordsBrl(transactionToDelete.amount)}
              </p>
              <p className="text-[11px] text-slate-400">Data: {new Date(transactionToDelete.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
            </div>

            <p className="text-xs text-slate-600">
              Tem certeza de que deseja remover este registro financeiro? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Limpar Tudo */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Limpar Todo o Caixa</h3>
                <p className="text-xs text-slate-500">Zerar histórico financeiro</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Você está prestes a remover <strong>todos os lançamentos financeiros</strong> atuais do sistema para iniciar do zero. Deseja continuar?
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impressão de Recibo Timbrado */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in-95 print:p-0 print:shadow-none print:w-full print:max-w-none">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 print:hidden">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                Recibo Profissional para Paciente
              </h3>
              <button 
                type="button"
                onClick={() => setSelectedReceipt(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template do Recibo Timbrado */}
            <div className="border-2 border-slate-800 p-8 rounded-2xl space-y-6 text-slate-800 bg-white">
              <div className="text-center border-b-2 border-slate-800 pb-4">
                {(() => {
                  const docConfig = selectedReceipt.doctorKey && CLINIC_PROFILES_CONFIG[selectedReceipt.doctorKey]
                    ? CLINIC_PROFILES_CONFIG[selectedReceipt.doctorKey]
                    : activeClinic;
                  return (
                    <div className="flex flex-col items-center justify-center gap-2">
                      {docConfig?.logo_url && (
                        <img 
                          src={docConfig.logo_url} 
                          alt="Logo da Clínica" 
                          referrerPolicy="no-referrer"
                          className="h-14 w-auto object-contain mx-auto mb-1 max-w-[150px]"
                        />
                      )}
                      <h1 className="text-xl font-black uppercase tracking-wider">
                        {docConfig.name}
                      </h1>
                      <p className="text-xs text-slate-600 font-medium">
                        {docConfig.slogan}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {docConfig.address} • Tel: {docConfig.phone}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="text-center">
                <span className="text-lg font-black underline tracking-widest uppercase">
                  R E C I B O
                </span>
                <div className="text-right text-xs font-bold mt-2">
                  VALOR: <span className="text-base font-black">{numberToWordsBrl(selectedReceipt.amount)}</span>
                </div>
              </div>

              <div className="text-xs leading-relaxed text-justify space-y-3">
                <p>
                  Recebi(emos) de <strong>{selectedReceipt.patientName || 'PACIENTE NÃO INFORMADO'}</strong>
                  {selectedReceipt.patientCpf ? (
                    <>
                      , inscrito(a) no CPF sob o nº <strong>{selectedReceipt.patientCpf}</strong>
                    </>
                  ) : ''}
                  , a quantia de <strong>{numberToWordsBrl(selectedReceipt.amount)}</strong>, referente a <strong>{selectedReceipt.description}</strong>.
                </p>
                <p>
                  Forma de Pagamento: <strong>{getMethodLabel(selectedReceipt.paymentMethod)}</strong>.
                </p>
              </div>

              <div className="pt-8 text-center space-y-2">
                <p className="text-xs font-medium">
                  São Paulo, {new Date(selectedReceipt.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="pt-10 flex flex-col items-center">
                  <div className="w-64 border-b border-slate-800 mb-1"></div>
                  <p className="text-xs font-bold">
                    {selectedReceipt.doctorName || activeClinic.professional_name}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Profissional Responsável • {selectedReceipt.doctorCouncil || activeClinic.council_badge}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={() => handleCopyReceiptWhatsApp(selectedReceipt)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Copiar para WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRANÇA PIX & QR CODE */}
      {isPixModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Cobrança PIX Rápida</h3>
                  <p className="text-xs text-slate-500">Apresente para o paciente escanear</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsPixModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seletor de Profissional / Destinatário */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Recebedor do PIX:</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedPixDoctorKey('dra_lucy')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedPixDoctorKey === 'dra_lucy' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  🌿 Dra. Lucy
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPixDoctorKey('dr_carlos')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedPixDoctorKey === 'dr_carlos' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  🧠 Dr. Carlos
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPixDoctorKey('geral')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedPixDoctorKey === 'geral' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  🏥 Clínica
                </button>
              </div>
            </div>

            {/* Card com Detalhes da Chave */}
            {(() => {
              const b = bankSettings[selectedPixDoctorKey] || bankSettings.geral;
              return (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl border-2 border-slate-800 shadow-xs flex items-center justify-center">
                    {/* QR Code Simulado Alta Fidelidade */}
                    <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center p-2 text-white">
                      <QrCode className="w-16 h-16 text-emerald-400" />
                      <span className="text-[9px] font-black tracking-wider uppercase mt-1">PIX Oficial</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Chave PIX ({b.pixKeyType.toUpperCase()})</span>
                    <div className="font-mono font-black text-sm text-slate-800 select-all bg-white py-1.5 px-3 rounded-xl border border-emerald-300 mt-1">
                      {b.pixKey}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p><strong>Titular:</strong> {b.pixBeneficiary}</p>
                    <p><strong>Banco:</strong> {b.bankName} • Ag: {b.agency} / CC: {b.account}</p>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const b = bankSettings[selectedPixDoctorKey] || bankSettings.geral;
                  navigator.clipboard.writeText(b.pixKey);
                  toast.success('Chave PIX copiada para a área de transferência!');
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Copiar Chave PIX</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const b = bankSettings[selectedPixDoctorKey] || bankSettings.geral;
                  const msg = `*DADOS PARA PAGAMENTO VIA PIX*\n\n` +
                    `🏥 *${b.doctorName}*\n` +
                    `🏦 *Banco:* ${b.bankName}\n` +
                    `🔑 *Chave PIX (${b.pixKeyType.toUpperCase()}):* ${b.pixKey}\n` +
                    `👤 *Favorecido:* ${b.pixBeneficiary}\n\n` +
                    `_Após efetuar o pagamento, por favor envie o comprovante nesta conversa._`;
                  navigator.clipboard.writeText(msg);
                  toast.success('Texto com dados do PIX copiado para envio no WhatsApp!');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR DADOS BANCÁRIOS & PIX */}
      {isBankSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Configurações Bancárias & PIX</h3>
                  <p className="text-xs text-slate-500">Defina os bancos e chaves de cada profissional</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsBankSettingsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Config Dra. Lucy */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
                <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <span>🌿 Dra. Lucy Murata (Odontologia Biológica)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Banco:</label>
                    <input 
                      type="text" 
                      value={bankSettings.dra_lucy.bankName}
                      onChange={(e) => setBankSettings({
                        ...bankSettings,
                        dra_lucy: { ...bankSettings.dra_lucy, bankName: e.target.value }
                      })}
                      className="w-full p-2 bg-white rounded-xl border border-emerald-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Agência / Conta:</label>
                    <input 
                      type="text" 
                      value={`${bankSettings.dra_lucy.agency} / ${bankSettings.dra_lucy.account}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('/');
                        setBankSettings({
                          ...bankSettings,
                          dra_lucy: { ...bankSettings.dra_lucy, agency: parts[0]?.trim() || '', account: parts[1]?.trim() || '' }
                        });
                      }}
                      className="w-full p-2 bg-white rounded-xl border border-emerald-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Chave PIX:</label>
                    <input 
                      type="text" 
                      value={bankSettings.dra_lucy.pixKey}
                      onChange={(e) => setBankSettings({
                        ...bankSettings,
                        dra_lucy: { ...bankSettings.dra_lucy, pixKey: e.target.value }
                      })}
                      className="w-full p-2 bg-white rounded-xl border border-emerald-200 text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Titular:</label>
                    <input 
                      type="text" 
                      value={bankSettings.dra_lucy.pixBeneficiary}
                      onChange={(e) => setBankSettings({
                        ...bankSettings,
                        dra_lucy: { ...bankSettings.dra_lucy, pixBeneficiary: e.target.value }
                      })}
                      className="w-full p-2 bg-white rounded-xl border border-emerald-200 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Config Dr. Carlos */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                <h4 className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <span>🧠 Dr. Carlos Morato (Neurologia & Integrativa)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Banco:</label>
                    <input 
                      type="text" 
                      value={bankSettings.dr_carlos.bankName}
                      onChange={(e) => setBankSettings({
                        ...bankSettings,
                        dr_carlos: { ...bankSettings.dr_carlos, bankName: e.target.value }
                      })}
                      className="w-full p-2 bg-white rounded-xl border border-blue-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Agência / Conta:</label>
                    <input 
                      type="text" 
                      value={`${bankSettings.dr_carlos.agency} / ${bankSettings.dr_carlos.account}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('/');
                        setBankSettings({
                          ...bankSettings,
                          dr_carlos: { ...bankSettings.dr_carlos, agency: parts[0]?.trim() || '', account: parts[1]?.trim() || '' }
                        });
                      }}
                      className="w-full p-2 bg-white rounded-xl border border-blue-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Chave PIX:</label>
                    <input 
                      type="text" 
                      value={bankSettings.dr_carlos.pixKey}
                      onChange={(e) => setBankSettings({
                        ...bankSettings,
                        dr_carlos: { ...bankSettings.dr_carlos, pixKey: e.target.value }
                      })}
                      className="w-full p-2 bg-white rounded-xl border border-blue-200 text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">Titular:</label>
                    <input 
                      type="text" 
                      value={bankSettings.dr_carlos.pixBeneficiary}
                      onChange={(e) => setBankSettings({
                        ...bankSettings,
                        dr_carlos: { ...bankSettings.dr_carlos, pixBeneficiary: e.target.value }
                      })}
                      className="w-full p-2 bg-white rounded-xl border border-blue-200 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsBankSettingsModalOpen(false);
                  toast.success('Configurações bancárias e chaves PIX salvas!');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
