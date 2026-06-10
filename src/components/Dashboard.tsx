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

const themes = {
  light: {
    bg: "p-0 rounded-none bg-transparent border-none shadow-none",
    textTitle: "text-slate-800",
    textSubtitle: "text-slate-500",
    cardBg: "bg-white",
    cardBorder: "border-slate-100",
    cardHoverShadow: "hover:shadow-md",
    textPrimary: "text-slate-800",
    textSecondary: "text-slate-500",
    textMuted: "text-slate-400",
    iconBg: "bg-slate-50 border border-slate-100",
    btnSecondary: "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 border-slate-100",
    graphContainer: "bg-white border-slate-100",
    gridStroke: "#f1f5f9",
    tickColor: "#94a3b8",
    barColorActive: "#3b82f6",
    barColorInactive: "#e2e8f0",
    tooltipConfig: {
      cursor: { fill: '#f8fafc' },
      contentStyle: { 
        borderRadius: '16px', 
        border: 'none', 
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        padding: '12px',
        backgroundColor: '#ffffff',
        color: '#1e293b'
      }
    }
  },
  charcoal: {
    bg: "p-6 md:p-8 rounded-[32px] bg-slate-950/80 border border-slate-900 shadow-2xl backdrop-blur-md",
    textTitle: "text-slate-100",
    textSubtitle: "text-slate-400",
    cardBg: "bg-slate-900/90 backdrop-blur-md",
    cardBorder: "border-slate-800/80",
    cardHoverShadow: "hover:shadow-xl hover:shadow-slate-950/30",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-400",
    textMuted: "text-slate-550",
    iconBg: "bg-slate-800/80 border border-slate-700/85",
    btnSecondary: "bg-slate-805 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-750",
    graphContainer: "bg-slate-900/95 border-slate-800/80",
    gridStroke: "#1e293b",
    tickColor: "#64748b",
    barColorActive: "#38bdf8",
    barColorInactive: "#334155",
    tooltipConfig: {
      cursor: { fill: '#0f172a' },
      contentStyle: { 
        borderRadius: '16px', 
        border: '1px solid #334155', 
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', 
        padding: '12px', 
        backgroundColor: '#0f172a', 
        color: '#f8fafc'
      }
    }
  },
  navy: {
    bg: "p-6 md:p-8 rounded-[32px] bg-[#020617]/95 border border-blue-950/50 shadow-2xl shadow-blue-950/20 backdrop-blur-md",
    textTitle: "text-blue-50",
    textSubtitle: "text-blue-300/80",
    cardBg: "bg-slate-900 border border-blue-900/50",
    cardBorder: "border-blue-900/40",
    cardHoverShadow: "hover:shadow-xl hover:shadow-blue-950/30",
    textPrimary: "text-blue-100",
    textSecondary: "text-blue-300",
    textMuted: "text-blue-400",
    iconBg: "bg-blue-950/80 border border-blue-900/50",
    btnSecondary: "bg-blue-950 text-blue-200 hover:bg-blue-900 hover:text-white border-blue-900/40",
    graphContainer: "bg-slate-900 border-blue-900/55",
    gridStroke: "#172554",
    tickColor: "#475569",
    barColorActive: "#60a5fa",
    barColorInactive: "#1e293b",
    tooltipConfig: {
      cursor: { fill: '#172554' },
      contentStyle: { 
        borderRadius: '16px', 
        border: '1px solid #1e3a8a', 
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', 
        padding: '12px', 
        backgroundColor: '#090d16', 
        color: '#f8fafc'
      }
    }
  },
  ocean: {
    bg: "p-6 md:p-8 rounded-[32px] bg-[#020d14]/95 border border-cyan-950/50 shadow-2xl shadow-cyan-950/20 backdrop-blur-md",
    textTitle: "text-emerald-50",
    textSubtitle: "text-cyan-200/80",
    cardBg: "bg-[#0b171f]/90 backdrop-blur-md border border-cyan-950/80",
    cardBorder: "border-cyan-900/40",
    cardHoverShadow: "hover:shadow-xl hover:shadow-emerald-950/20",
    textPrimary: "text-cyan-100",
    textSecondary: "text-cyan-300",
    textMuted: "text-cyan-500",
    iconBg: "bg-[#071118]/80 border border-cyan-900/50",
    btnSecondary: "bg-[#071118] text-cyan-200 hover:bg-[#0f2433] hover:text-white border-cyan-900/40",
    graphContainer: "bg-[#0b171f]/90 border-cyan-950/85",
    gridStroke: "#0e3043",
    tickColor: "#155e75",
    barColorActive: "#22d3ee",
    barColorInactive: "#152a36",
    tooltipConfig: {
      cursor: { fill: '#0c1d28' },
      contentStyle: { 
        borderRadius: '16px', 
        border: '1px solid #164e63', 
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', 
        padding: '12px', 
        backgroundColor: '#0b171f', 
        color: '#ecfeff'
      }
    }
  }
};

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

  const [theme, setTheme] = useState<'light' | 'charcoal' | 'navy' | 'ocean'>(() => {
    return (localStorage.getItem('dashboard-theme') as any) || 'light';
  });

  const handleThemeChange = (newTheme: 'light' | 'charcoal' | 'navy' | 'ocean') => {
    setTheme(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
  };

  const t = themes[theme] || themes.light;

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
    <div className={`transition-all duration-300 ${t.bg}`}>
      <div className="space-y-8 pb-4">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${t.textTitle} tracking-tight transition-colors`}>Visão Geral de Gestão</h1>
            <p className={`${t.textSubtitle} font-medium transition-colors`}>Bem-vindo ao seu centro de comando clínico.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Tema do Dashboard */}
            <div className={`flex items-center gap-1 p-1 ${t.cardBg} border ${t.cardBorder} rounded-2xl shadow-sm transition-all`}>
              <span className={`text-[9px] font-bold uppercase tracking-wider pl-2 pr-1.5 ${t.textSecondary}`}>
                Visual:
              </span>
              <button
                onClick={() => handleThemeChange('light')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  theme === 'light' 
                    ? 'bg-clinical-blue text-white shadow-sm' 
                    : `${t.textSecondary} hover:bg-slate-100 dark:hover:bg-slate-800`
                }`}
              >
                Claro
              </button>
              <button
                onClick={() => handleThemeChange('charcoal')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  theme === 'charcoal' 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : `${t.textSecondary} hover:bg-slate-800/80`
                }`}
              >
                Grafite
              </button>
              <button
                onClick={() => handleThemeChange('navy')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  theme === 'navy' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : `${t.textSecondary} hover:bg-slate-800/80`
                }`}
              >
                Naval
              </button>
              <button
                onClick={() => handleThemeChange('ocean')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  theme === 'ocean' 
                    ? 'bg-cyan-600 text-white shadow-sm' 
                    : `${t.textSecondary} hover:bg-slate-850`
                }`}
              >
                Oceano
              </button>
            </div>

            <button 
              onClick={onStartConsultation}
              className="flex items-center gap-2 px-5 py-2.5 bg-clinical-blue text-white rounded-2xl font-bold shadow-lg shadow-clinical-blue/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={18} />
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
            t={t}
          />
          <StatCard 
            title="Agendamentos" 
            value={stats.confirmedAppointments} 
            subtitle="Confirmados Hoje" 
            icon={<Calendar className="text-emerald-500" />} 
            color="bg-emerald-50"
            trend="Estável"
            t={t}
          />
          <StatCard 
            title="Precisam Retorno" 
            value={stats.needsFollowUp} 
            subtitle="Status Alerta/Urgente" 
            icon={<AlertCircle className="text-amber-500" />} 
            color="bg-amber-50"
            trend="Atenção"
            t={t}
          />
          <StatCard 
            title="Mensagens" 
            value={stats.totalMessages} 
            subtitle="Recebidas Hoje" 
            icon={<MessageSquare className="text-purple-500" />} 
            color="bg-purple-50"
            trend="+5"
            t={t}
          />
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Chart Section */}
          <div className={`lg:col-span-8 ${t.cardBg} p-8 rounded-[32px] border ${t.cardBorder} shadow-sm transition-all`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className={`text-lg font-bold ${t.textPrimary}`}>Volume de Atendimentos</h3>
                <p className={`text-xs ${t.textMuted} font-medium uppercase tracking-widest`}>Últimos 7 dias</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 ${t.iconBg} rounded-lg border ${t.cardBorder} transition-all`}>
                <TrendingUp size={14} className="text-emerald-500" />
                <span className={`text-xs font-bold ${t.textSecondary}`}>+15% vs semana anterior</span>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.gridStroke} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: t.tickColor, fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: t.tickColor, fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip 
                    cursor={t.tooltipConfig.cursor}
                    contentStyle={t.tooltipConfig.contentStyle}
                  />
                  <Bar dataKey="pacientes" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 4 ? t.barColorActive : t.barColorInactive} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity / Follow up */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`${t.cardBg} p-8 rounded-[32px] border ${t.cardBorder} shadow-sm h-full transition-all`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${t.textPrimary}`}>Atendimentos Recentes</h3>
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
                    <div key={patient.id} className={`flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50/10 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer`}>
                      <div className={`w-10 h-10 ${t.iconBg} rounded-xl flex items-center justify-center ${t.textMuted} group-hover:bg-clinical-blue/10 group-hover:text-clinical-blue transition-colors`}>
                        <Activity size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${t.textPrimary} truncate`}>{patient.paciente_nome_completo || 'Paciente'}</p>
                        <p className={`text-[10px] ${t.textMuted} font-medium uppercase tracking-wider`}>
                          {patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}) : 'Sem data'} • {patient.especialidade || 'Geral'} • {patient.medico_nome || 'Médico'}
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
                    <p className={`text-sm ${t.textMuted}`}>Nenhum atendimento recente.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={onOpenAgenda}
                className={`w-full mt-8 py-4 ${t.btnSecondary} rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border`}
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
            t={t}
          />
          <QuickAction 
            title="Agenda do Dia" 
            description="Confira seus próximos pacientes" 
            icon={<Calendar size={24} />} 
            onClick={onOpenAgenda}
            color="text-emerald-500"
            t={t}
          />
          <QuickAction 
            title="Base de Conhecimento" 
            description="Dicas e guia de uso do sistema" 
            icon={<CheckCircle2 size={24} />} 
            onClick={() => {}}
            color="text-clinical-blue"
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color, trend, t }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`${t.cardBg} p-6 rounded-[32px] border ${t.cardBorder} ${t.cardHoverShadow} transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${t.iconBg} rounded-2xl flex items-center justify-center transition-all`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
          trend === 'Atenção' ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 
          trend === 'Estável' ? `${t.iconBg} ${t.textSecondary}` : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
        }`}>
          {trend}
        </span>
      </div>
      <div className="space-y-1">
        <h4 className={`text-xs font-bold ${t.textMuted} uppercase tracking-widest`}>{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${t.textPrimary}`}>{value}</span>
          <span className={`text-[10px] font-medium ${t.textMuted}`}>{subtitle}</span>
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({ title, description, icon, onClick, color, t }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 p-6 ${t.cardBg} rounded-[32px] border ${t.cardBorder} border-slate-100 ${t.cardHoverShadow} transition-all text-left group w-full`}
    >
      <div className={`w-14 h-14 ${t.iconBg} rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform shrink-0`}>
        {icon}
      </div>
      <div>
        <h4 className={`font-bold ${t.textPrimary}`}>{title}</h4>
        <p className={`text-xs ${t.textSecondary}`}>{description}</p>
      </div>
    </button>
  );
}
