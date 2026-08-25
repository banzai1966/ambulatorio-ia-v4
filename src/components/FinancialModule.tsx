import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  FileText, 
  Filter, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Printer, 
  Download, 
  Trash2, 
  Search,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  notes?: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'income',
    description: 'Consulta Neurológica de Rotina',
    patientName: 'Carlos Eduardo Silva',
    patientCpf: '123.456.789-00',
    amount: 450.00,
    category: 'Consulta Especializada',
    paymentMethod: 'pix',
    status: 'paid',
    date: new Date().toISOString().split('T')[0],
    doctorName: 'Dr. Marco Duarte',
    notes: 'Pagamento via PIX no ato do atendimento.'
  },
  {
    id: '2',
    type: 'income',
    description: 'Consulta de Medicina Integrativa',
    patientName: 'Ana Maria Santos',
    patientCpf: '987.654.321-11',
    amount: 500.00,
    category: 'Consulta Integrativa',
    paymentMethod: 'credit_card',
    status: 'paid',
    date: new Date().toISOString().split('T')[0],
    doctorName: 'Dra. Lucy Duarte'
  },
  {
    id: '3',
    type: 'income',
    description: 'Atendimento Convênio SulAmérica',
    patientName: 'Roberto Oliveira',
    patientCpf: '456.789.123-22',
    amount: 220.00,
    category: 'Convênio Médico',
    paymentMethod: 'health_insurance',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    doctorName: 'Dr. Marco Duarte'
  },
  {
    id: '4',
    type: 'expense',
    description: 'Insumos Médicos e Material de Descarte',
    amount: 680.00,
    category: 'Insumos',
    paymentMethod: 'pix',
    status: 'paid',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '5',
    type: 'expense',
    description: 'Licença do Sistema / Software Clínico',
    amount: 350.00,
    category: 'Tecnologia',
    paymentMethod: 'credit_card',
    status: 'paid',
    date: new Date().toISOString().split('T')[0]
  }
];

export default function FinancialModule() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ambulatorio_financial_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
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
  const [newCategory, setNewCategory] = useState('Consulta Especializada');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash' | 'health_insurance'>('pix');
  const [newStatus, setNewStatus] = useState<'paid' | 'pending'>('paid');
  const [newDoctorName, setNewDoctorName] = useState('Dr. Marco Duarte');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

  useEffect(() => {
    localStorage.setItem('ambulatorio_financial_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Calculations
  const filteredTransactions = transactions.filter(t => {
    const matchesMonth = t.date.startsWith(selectedMonth);
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.patientName && t.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
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

    const val = parseFloat(newAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }

    const item: Transaction = {
      id: Date.now().toString(),
      type: newType,
      description: newDesc,
      patientName: newType === 'income' ? newPatientName : undefined,
      patientCpf: newType === 'income' ? newPatientCpf : undefined,
      amount: val,
      category: newCategory,
      paymentMethod: newPaymentMethod,
      status: newStatus,
      date: new Date().toISOString().split('T')[0],
      doctorName: newType === 'income' ? newDoctorName : undefined,
    };

    setTransactions([item, ...transactions]);
    toast.success(newType === 'income' ? 'Receita lançada com sucesso!' : 'Despesa registrada com sucesso!');
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewDesc('');
    setNewPatientName('');
    setNewPatientCpf('');
    setNewAmount('');
    setNewCategory('Consulta Especializada');
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

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento financeiro?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Lançamento removido.');
    }
  };

  const getMethodLabel = (method: Transaction['paymentMethod']) => {
    switch(method) {
      case 'pix': return 'PIX';
      case 'credit_card': return 'Cartão Crédito';
      case 'debit_card': return 'Cartão Débito';
      case 'cash': return 'Dinheiro';
      case 'health_insurance': return 'Convênio';
    }
  };

  // Convert number to words in Portuguese (simple for receipts)
  const numberToWordsBrl = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">Módulo Financeiro & Caixa</h1>
              <p className="text-xs text-slate-500">Gestão simplificada de recebimentos, despesas e emissão de recibos para convênio/I.R.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-2xl">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entradas */}
        <div className="p-5 bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-3xl relative overflow-hidden">
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
            <CheckCircle className="w-3 h-3" />
            <span>Confirmado em caixa</span>
          </div>
        </div>

        {/* Despesas */}
        <div className="p-5 bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 rounded-3xl relative overflow-hidden">
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
        <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Saldo Líquido</span>
            <div className="p-2 bg-white/10 text-sky-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black mb-1 ${netBalance >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
            {netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="text-[11px] text-slate-400">
            Lucro do período selecionado
          </div>
        </div>

        {/* A Receber / Pendente */}
        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl relative overflow-hidden">
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

      {/* Filters & Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text" 
                placeholder="Buscar paciente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {/* Type filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilterType('income')}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'income' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Receitas
              </button>
              <button 
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Despesas
              </button>
            </div>

            {/* Status Filter */}
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-2 text-xs font-bold bg-slate-100 border-none rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="paid">Confirmados / Pagos</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="p-3.5 rounded-l-xl">Data</th>
                <th className="p-3.5">Descrição / Paciente</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Forma</th>
                <th className="p-3.5">Valor</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right rounded-r-xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum lançamento encontrado para os filtros selecionados.
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
                        <div className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                          👤 {t.patientName} {t.patientCpf && `(${t.patientCpf})`}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold">
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
                        onClick={() => toggleStatus(t.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-transform hover:scale-105 ${
                          t.status === 'paid'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status === 'paid' ? <CheckCircle className="w-3 h-3 text-blue-600" /> : <Clock className="w-3 h-3" />}
                        <span>{t.status === 'paid' ? 'Pago' : 'Pendente'}</span>
                      </button>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                      {t.type === 'income' && (
                        <button
                          onClick={() => setSelectedReceipt(t)}
                          title="Emitir Recibo Médico em PDF / Imprimir"
                          className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Excluir"
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
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

      {/* Modal Novo Lançamento */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Novo Lançamento Financeiro
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setNewType('income')}
                  className={`py-2 rounded-xl transition-all ${newType === 'income' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600'}`}
                >
                  🔵 Receita / Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('expense')}
                  className={`py-2 rounded-xl transition-all ${newType === 'expense' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600'}`}
                >
                  🔴 Despesa / Saída
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Serviço / Conta *</label>
                <input 
                  type="text" 
                  required
                  placeholder={newType === 'income' ? "Ex: Consulta Neurológica de Avaliação" : "Ex: Conta de Luz / Material Médico"}
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
                        <option value="Consulta Especializada">Consulta Especializada</option>
                        <option value="Consulta Integrativa">Consulta Integrativa</option>
                        <option value="Exame Neurológico">Exame Neurológico</option>
                        <option value="Procedimento Odontológico">Procedimento Odontológico</option>
                        <option value="Convênio Médico">Convênio Médico</option>
                        <option value="Outros">Outros</option>
                      </>
                    ) : (
                      <>
                        <option value="Insumos">Insumos Médicos</option>
                        <option value="Tecnologia">Tecnologia & Software</option>
                        <option value="Aluguel">Aluguel / Condomínio</option>
                        <option value="Pessoal">Salários / Pessoal</option>
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Impressão de Recibo Médico */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in-95 print:p-0 print:shadow-none print:w-full print:max-w-none">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 print:hidden">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                Recibo Médico para Paciente
              </h3>
              <button onClick={() => setSelectedReceipt(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template do Recibo */}
            <div className="border-2 border-slate-800 p-8 rounded-2xl space-y-6 text-slate-800 bg-white">
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <h1 className="text-xl font-black uppercase tracking-wider">AMBULATÓRIO IA & SAÚDE INTEGRATIVA</h1>
                <p className="text-xs text-slate-600 font-medium">Clínica Médica Especializada • Neurologia & Medicina Integrativa</p>
                <p className="text-[10px] text-slate-500">Rua das Clínicas, 1000 - Centro • Tel: (11) 99999-8888</p>
              </div>

              <div className="text-center">
                <span className="text-lg font-black underline tracking-widest uppercase">R E C I B O   M É D I C O</span>
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
                  <p className="text-xs font-bold">{selectedReceipt.doctorName || 'Dr. Marco Antônio Duarte'}</p>
                  <p className="text-[10px] text-slate-600">Médico Responsável • CRM/SP 123.456</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
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
