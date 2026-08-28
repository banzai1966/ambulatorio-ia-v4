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
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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

interface FinancialModuleProps {
  currentUser?: any;
}

export default function FinancialModule({ currentUser }: FinancialModuleProps) {
  const activeDoctorKey = useMemo(() => resolveDoctorKey(currentUser), [currentUser]);
  const activeClinic = useMemo(() => getActiveClinicConfig(currentUser), [currentUser]);

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

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Modals state
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

  // In-UI Confirmation Modals (evita bloqueio de window.confirm em iframe)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

  // Sincronização de persistência
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambulatorio_financial_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  // Atualiza default do médico se currentUser mudar
  useEffect(() => {
    setNewDoctorKey(activeDoctorKey);
    setNewCategory(activeDoctorKey === 'dra_lucy' ? 'Odontologia Biológica' : 'Consulta Especializada');
  }, [activeDoctorKey]);

  // Cálculos financeiros
  const filteredTransactions = transactions.filter(t => {
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

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

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

  // Confirmação e Exclusão Segura
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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
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
              Gestão de receitas, despesas, convênios e emissão de recibos timbrados.
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

          {/* Botão Limpar Tudo (se houver registros) */}
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
              title="Limpar todos os registros e zerar o caixa"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar Caixa</span>
            </button>
          )}

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
            <TrendingDown className="w-3 h-3" />
            <span>Insumos e custos</span>
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl relative overflow-hidden shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Saldo Líquido</span>
            <div className="p-2 bg-white/10 text-sky-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black mb-1 ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="text-[11px] text-slate-400">
            Lucro do período selecionado
          </div>
        </div>

        {/* A Receber / Pendente */}
        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-100 rounded-3xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pendente / A Receber</span>
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
            {/* Filtro de Tipo */}
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

            {/* Filtro de Status */}
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold bg-slate-100 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="paid">Confirmados / Pagos</option>
              <option value="pending">Pendentes</option>
            </select>
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
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(t)}
                          title="Emitir Recibo em PDF / Imprimir"
                          className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}

                      {/* Botão de Exclusão (Abre modal de confirmação no próprio app) */}
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

      {/* MODAL NOVO LANÇAMENTO */}
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
              {/* Toggle de Tipo */}
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

              {/* Seletor de Profissional Responsável */}
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO INDIVIDUAL */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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

      {/* MODAL DE LIMPAR TUDO / ZERAR CAIXA */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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

      {/* MODAL DE IMPRESSÃO DE RECIBO PROFISSIONAL TIMBRADO */}
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

            <div className="flex justify-end gap-3 print:hidden">
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
    </div>
  );
}
