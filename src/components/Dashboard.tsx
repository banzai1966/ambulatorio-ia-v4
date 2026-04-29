import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  Plus,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  onStartConsultation: () => void;
  onOpenAgenda: () => void;
  onOpenMessages: () => void;
  onOpenHistory: () => void;
}

export default function Dashboard({ onStartConsultation, onOpenAgenda, onOpenMessages, onOpenHistory }: DashboardProps) {
  const [stats, setStats] = useState({
    newPatientsToday: 0,
    confirmedAppointments: 0,
    needsFollowUp: 0,
    totalMessages: 0
  });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ name: string; pacientes: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Data de 7 dias atrás
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const todayISO = today.toISOString();
      const todayDate = today.toISOString().split('T')[0];

      // 1. Buscar prontuários dos últimos 7 dias
      const { data: prontuarios, error: prontuariosError } = await supabase
        .from('prontuarios')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (prontuariosError) console.error("Erro ao buscar dados para o gráfico:", prontuariosError);

      // Processar dados para o gráfico
      const counts: Record<string, number> = {};
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      // Inicializar com 0
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        counts[days[d.getDay()]] = 0;
      }

      if (prontuarios) {
        prontuarios.forEach(p => {
          const date = new Date(p.created_at);
          const dayName = days[date.getDay()];
          counts[dayName] = (counts[dayName] || 0) + 1;
        });
      }

      const formattedChartData = Object.entries(counts).map(([name, pacientes]) => ({ name, pacientes }));
      setChartData(formattedChartData);

      // Helper para contagem resiliente
      const tryCount = async (table: string, filters: { column: string, value: any, op: 'eq' | 'gte' | 'in' }[]): Promise<number> => {
        try {
          let query = supabase.from(table).select('id', { count: 'exact', head: true });
          filters.forEach(f => {
            if (f.op === 'eq') query = query.eq(f.column, f.value);
            else if (f.op === 'gte') query = query.gte(f.column, f.value);
            else if (f.op === 'in') query = query.in(f.column, f.value);
          });
          const { count, error } = await query;
          if (error) {
            console.warn(`Dashboard: Erro ao contar em ${table}:`, error.message);
            if (table === 'agendamentos' && (error.message.includes('does not exist') || error.message.includes('not found'))) {
              return tryCount('appointments', filters.map(f => {
                if (f.column === 'data_consulta') return { ...f, column: 'appointment_date' };
                return f;
              }));
            }
            return 0;
          }
          return count || 0;
        } catch (err) {
          return 0;
        }
      };

      // 1. Novos Pacientes Hoje (Prontuários criados hoje)
      const newPatients = await tryCount('prontuarios', [{ column: 'created_at', value: todayISO, op: 'gte' }]);

      // 2. Agendamentos Confirmados para hoje
      const confirmed = await tryCount('agendamentos', [
        { column: 'status', value: ['scheduled', 'Agendado'], op: 'in' },
        { column: 'data_consulta', value: todayDate, op: 'eq' }
      ]);

      // 3. Pacientes que precisam de retorno (Status Alerta ou Urgente)
      const followUp = await tryCount('prontuarios', [{ column: 'paciente_status', value: ['Alerta', 'Urgente'], op: 'in' }]);

      // 4. Mensagens não lidas ou totais hoje
      const messages = await tryCount('mensagens', [{ column: 'created_at', value: todayISO, op: 'gte' }]);

      // 5. Pacientes Recentes
      const tryFetchRecent = async (columns: string): Promise<any[]> => {
        const { data, error } = await supabase
          .from('prontuarios')
          .select(columns)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) {
          if (error.message.includes('column') && error.message.includes('does not exist')) {
            const match = error.message.match(/column "([^"]+)"/);
            if (match && match[1]) {
              const missingColumn = match[1];
              const newColumns = columns.split(',').map(c => c.trim()).filter(c => !c.startsWith(missingColumn) && !c.includes(`:${missingColumn}`)).join(', ');
              if (newColumns) return tryFetchRecent(newColumns);
            }
          }
          throw error;
        }
        return data || [];
      };

      try {
        const recent = await tryFetchRecent('id, paciente_nome_completo, paciente_status, created_at, especialidade, user_id, medico_id');

        if (recent) {
          // Fallback manual para nomes de médicos se o join falhar
          const recentWithNames = await Promise.all(recent.map(async (patient: any) => {
            let medicoNome = patient.profiles?.full_name;
            const doctorId = patient.medico_id || patient.user_id;
            
            if (!medicoNome && doctorId) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', doctorId)
                .single();
              if (profileData) medicoNome = profileData.full_name;
            }
            return { ...patient, medico_nome: medicoNome };
          }));
          setRecentPatients(recentWithNames);
        }
      } catch (err) {
        console.warn("Dashboard: Erro ao buscar pacientes recentes:", err);
        setRecentPatients([]);
      }

      setStats({
        newPatientsToday: newPatients,
        confirmedAppointments: confirmed,
        needsFollowUp: followUp,
        totalMessages: messages
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Visão Geral de Gestão</h1>
          <p className="text-slate-500 font-medium">Bem-vindo ao seu centro de comando clínico.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onStartConsultation}
            className="flex items-center gap-2 px-6 py-3 bg-clinical-blue text-white rounded-2xl font-bold shadow-lg shadow-clinical-blue/20 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Novo Atendimento
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Novos Pacientes" 
          value={stats.newPatientsToday} 
          subtitle="Hoje" 
          icon={<Users className="text-blue-500" />} 
          color="bg-blue-50"
          trend="+12%"
        />
        <StatCard 
          title="Agendamentos" 
          value={stats.confirmedAppointments} 
          subtitle="Confirmados Hoje" 
          icon={<Calendar className="text-emerald-500" />} 
          color="bg-emerald-50"
          trend="Estável"
        />
        <StatCard 
          title="Precisam Retorno" 
          value={stats.needsFollowUp} 
          subtitle="Status Alerta/Urgente" 
          icon={<AlertCircle className="text-amber-500" />} 
          color="bg-amber-50"
          trend="Atenção"
        />
        <StatCard 
          title="Mensagens" 
          value={stats.totalMessages} 
          subtitle="Recebidas Hoje" 
          icon={<MessageSquare className="text-purple-500" />} 
          color="bg-purple-50"
          trend="+5"
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Volume de Atendimentos</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-slate-600">+15% vs semana anterior</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="pacientes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 4 ? '#3b82f6' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Follow up */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Atendimentos Recentes</h3>
              <button 
                onClick={onOpenHistory}
                className="text-xs font-bold text-clinical-blue hover:underline"
              >
                Ver tudo
              </button>
            </div>
            
            <div className="space-y-4">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient, i) => (
                  <div key={patient.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-clinical-blue/10 group-hover:text-clinical-blue transition-colors">
                      <Activity size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{patient.paciente_nome_completo || 'Paciente'}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR') : 'Sem data'} • {patient.especialidade || 'Geral'} • {patient.medico_nome || 'Médico'}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      patient.paciente_status === 'Urgente' ? 'bg-red-500' : 
                      patient.paciente_status === 'Alerta' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">Nenhum atendimento recente.</p>
                </div>
              )}
            </div>

            <button 
              onClick={onOpenAgenda}
              className="w-full mt-8 py-4 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors border border-slate-100"
            >
              <Calendar size={18} />
              Ver Agenda Completa
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions / Shortcuts */}
      <div className="grid md:grid-cols-3 gap-6">
        <QuickAction 
          title="Histórico de Mensagens" 
          description="Acompanhe as conversas do WhatsApp" 
          icon={<MessageSquare size={24} />} 
          onClick={onOpenMessages}
          color="text-purple-500"
        />
        <QuickAction 
          title="Agenda do Dia" 
          description="Confira seus próximos pacientes" 
          icon={<Calendar size={24} />} 
          onClick={onOpenAgenda}
          color="text-emerald-500"
        />
        <QuickAction 
          title="Base de Conhecimento" 
          description="Dicas e guia de uso do sistema" 
          icon={<CheckCircle2 size={24} />} 
          onClick={() => {}}
          color="text-clinical-blue"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color, trend }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
          trend === 'Atenção' ? 'bg-red-50 text-red-600' : 
          trend === 'Estável' ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-emerald-600'
        }`}>
          {trend}
        </span>
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800">{value}</span>
          <span className="text-[10px] font-medium text-slate-400">{subtitle}</span>
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({ title, description, icon, onClick, color }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all text-left group"
    >
      <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </button>
  );
}
