import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  Plus,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
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
      
      // Helper dates respecting Brazil (America/Sao_Paulo) timezone
      const getLocalStartOfDay = (date: Date = new Date()) => {
        const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric', day: 'numeric' } as const;
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(date);
        const month = parts.find(p => p.type === 'month')?.value || '';
        const day = parts.find(p => p.type === 'day')?.value || '';
        const year = parts.find(p => p.type === 'year')?.value || '';
        const pad = (n: string) => n.padStart(2, '0');
        const localDayStr = `${year}-${pad(month)}-${pad(day)}`;
        
        const startOfLocalDayUTC = new Date(`${localDayStr}T03:00:00.000Z`);
        return {
          todayDate: localDayStr,
          todayISO: startOfLocalDayUTC.toISOString()
        };
      };

      const { todayDate, todayISO } = getLocalStartOfDay();
      
      // Calculate seven days ago local start of day
      const dSeven = new Date(`${todayDate}T00:00:00Z`);
      dSeven.setUTCDate(dSeven.getUTCDate() - 7);
      const sevenDaysAgoISO = new Date(dSeven.getTime() + (3 * 60 * 60 * 1000)).toISOString();

      // 1. Buscar prontuários dos últimos 7 dias
      const { data: prontuarios, error: prontuariosError } = await supabase
        .from('prontuarios')
        .select('created_at')
        .gte('created_at', sevenDaysAgoISO);

      if (prontuariosError) console.error("Erro ao buscar dados para o gráfico:", prontuariosError);

      // Processar dados para o gráfico
      const counts: Record<string, number> = {};
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(`${todayDate}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() - i);
        const dayName = days[d.getUTCDay()];
        counts[dayName] = 0;
      }

      if (prontuarios) {
        prontuarios.forEach(p => {
          const date = new Date(p.created_at);
          const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' });
          const rawDay = formatter.format(date).toLowerCase().replace('.', '');
          const mappedName = ({
            'dom': 'Dom', 'seg': 'Seg', 'ter': 'Ter', 'qua': 'Qua', 'qui': 'Qui', 'sex': 'Sex', 'sáb': 'Sáb'
          } as Record<string, string>)[rawDay] || rawDay;
          
          if (counts[mappedName] !== undefined) {
            counts[mappedName] = (counts[mappedName] || 0) + 1;
          }
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

      const newPatients = await tryCount('prontuarios', [{ column: 'created_at', value: todayISO, op: 'gte' }]);

      const confirmed = await tryCount('agendamentos', [
        { column: 'status', value: ['scheduled', 'Agendado'], op: 'in' },
        { column: 'data_consulta', value: todayDate, op: 'eq' }
      ]);

      const followUp = await tryCount('prontuarios', [{ column: 'paciente_status', value: ['Alerta', 'Urgente'], op: 'in' }]);

      const messages = await tryCount('mensagens', [{ column: 'created_at', value: todayISO, op: 'gte' }]);

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

  const currentDateFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-7 pb-6 max-w-7xl mx-auto">
      {/* Top Header estilo CRM Moderno (Dribbble Ref) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full capitalize">
              {currentDateFormatted}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Visão Geral de Gestão
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Acompanhe a atividade clínica, agendamentos e prontuários em tempo real.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onStartConsultation}
            className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-98 transition-all"
          >
            <Plus size={18} className="stroke-[2.5]" />
            Novo Atendimento
          </button>
        </div>
      </div>

      {/* KPI Cards com Visual Arredondado & Suave (Estilo Dribbble) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard 
          title="Novos Pacientes" 
          value={stats.newPatientsToday} 
          subtitle="Cadastrados hoje" 
          icon={<Users size={20} className="text-blue-600" />} 
          iconBg="bg-blue-50"
          trend="+12%"
          trendType="up"
        />
        <StatCard 
          title="Agendamentos" 
          value={stats.confirmedAppointments} 
          subtitle="Confirmados hoje" 
          icon={<Calendar size={20} className="text-emerald-600" />} 
          iconBg="bg-emerald-50"
          trend="Em dia"
          trendType="neutral"
        />
        <StatCard 
          title="Precisam Retorno" 
          value={stats.needsFollowUp} 
          subtitle="Status Alerta/Urgente" 
          icon={<AlertCircle size={20} className="text-amber-600" />} 
          iconBg="bg-amber-50"
          trend="Atenção"
          trendType="alert"
        />
        <StatCard 
          title="Mensagens & WhatsApp" 
          value={stats.totalMessages} 
          subtitle="Recebidas hoje" 
          icon={<MessageSquare size={20} className="text-indigo-600" />} 
          iconBg="bg-indigo-50"
          trend="+5 ativas"
          trendType="up"
        />
      </div>

      {/* Seção Principal: Gráfico de Linha/Área Suave + Atendimentos Recentes */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Gráfico de Evolução (Área Fluída com Gradiente estilo Dribbble) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Volume de Atendimentos</h3>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Fluxo de pacientes atendidos nos últimos 7 dias</p>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100/80">
              <TrendingUp size={14} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">+15% vs semana anterior</span>
            </div>
          </div>
          
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
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
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white px-3.5 py-2 rounded-2xl shadow-xl border border-slate-800 text-xs">
                          <p className="font-semibold text-slate-300 mb-0.5">{label}</p>
                          <p className="font-bold text-indigo-300 text-sm">
                            {payload[0].value} {payload[0].value === 1 ? 'paciente' : 'pacientes'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pacientes" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPacientes)" 
                  activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              Atendimentos Registrados
            </span>
            <span className="font-medium">Total na semana: {chartData.reduce((acc, curr) => acc + curr.pacientes, 0)}</span>
          </div>
        </div>

        {/* Atendimentos Recentes com Visual Refinado */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Atendimentos Recentes</h3>
                <p className="text-xs text-slate-400">Últimos pacientes atendidos</p>
              </div>
              <button 
                type="button"
                onClick={onOpenHistory}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 transition-colors"
              >
                Ver todos
                <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="space-y-2.5">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient) => {
                  const isUrg = patient.paciente_status === 'Urgente';
                  const isAlert = patient.paciente_status === 'Alerta';
                  
                  return (
                    <div 
                      key={patient.id} 
                      onClick={onOpenHistory}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 group-hover:text-blue-600 group-hover:border-blue-200 shadow-xs transition-colors shrink-0">
                          <Activity size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                            {patient.paciente_nome_completo || 'Paciente'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}) : 'Hoje'} • {patient.especialidade || 'Geral'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`w-2 h-2 rounded-full ${
                          isUrg ? 'bg-red-500 animate-pulse' : 
                          isAlert ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 px-4 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <p className="text-xs text-slate-400">Nenhum atendimento registrado ainda.</p>
                </div>
              )}
            </div>
          </div>

          <button 
            type="button"
            onClick={onOpenAgenda}
            className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200/80 transition-all"
          >
            <Calendar size={15} className="text-slate-500" />
            <span>Acessar Agenda Completa</span>
            <ArrowRight size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Atalhos Rápidos com Cantos Arredondados & Cores Suaves */}
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
        <QuickActionCard 
          title="WhatsApp & Mensagens" 
          description="Acompanhe confirmações automáticas e conversas" 
          icon={<MessageSquare size={20} className="text-indigo-600" />} 
          iconBg="bg-indigo-50"
          onClick={onOpenMessages}
        />
        <QuickActionCard 
          title="Agenda do Consultório" 
          description="Organize horários e novos agendamentos" 
          icon={<Calendar size={20} className="text-emerald-600" />} 
          iconBg="bg-emerald-50"
          onClick={onOpenAgenda}
        />
        <QuickActionCard 
          title="Histórico de Prontuários" 
          description="Consulte relatórios, evoluções SOAP e prescrições" 
          icon={<Stethoscope size={20} className="text-blue-600" />} 
          iconBg="bg-blue-50"
          onClick={onOpenHistory}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, iconBg, trend, trendType }: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  trend: string;
  trendType: 'up' | 'neutral' | 'alert';
}) {
  return (
    <motion.div 
      whileHover={{ y: -3 }}
      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 ${iconBg} rounded-2xl flex items-center justify-center shadow-xs`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          trendType === 'alert' 
            ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
            : trendType === 'neutral'
            ? 'bg-slate-100 text-slate-600'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
        }`}>
          {trend}
        </span>
      </div>
      
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
          {title}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {subtitle}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function QuickActionCard({ title, description, icon, iconBg, onClick }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  onClick: () => void;
}) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 p-5 bg-white hover:bg-slate-50/80 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all text-left group w-full"
    >
      <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-xs`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
          {title}
        </h4>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
      <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
    </button>
  );
}
