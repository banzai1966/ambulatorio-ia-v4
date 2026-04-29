import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Loader2, 
  X, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Shield, 
  User, 
  UserCheck, 
  Trash2 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist';
  status: 'pending' | 'approved';
  full_name?: string;
  especialidade_id?: string;
  especialidade?: string;
}

export default function ManageTeam({ onClose }: { onClose: () => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [specialties, setSpecialties] = useState<{id: string, nome: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
    fetchSpecialties();

    // Ouvinte em tempo real para novos membros da equipe
    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscamos apenas as colunas que sabemos que funcionam, evitando o erro de cache de esquema
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, status, full_name, especialidade');
      
      if (error) {
        console.error("Erro ao buscar perfis:", error);
        throw error;
      }
      
      setProfiles(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar equipe", err);
      setError(err.message || "Falha ao buscar equipe.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    // Começa com os padrões para garantir que nunca esteja vazio na UI
    const defaults = [
      { id: 'neurologia', nome: 'Neurologia' },
      { id: 'ortopedia', nome: 'Ortopedia' }
    ];
    setSpecialties(defaults);

    try {
      console.log("ManageTeam: Buscando especialidades...");
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
          console.log("ManageTeam: Especialidades encontradas no banco:", filtered);
          setSpecialties(filtered);
          return;
        }
      }

      console.log("ManageTeam: Banco de especialidades vazio, tentando inserir padrões...");
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
        console.log("ManageTeam: Especialidades padrão inseridas com sucesso:", formatted);
        setSpecialties(formatted);
      }
    } catch (err) {
      console.error("Erro crítico em fetchSpecialties:", err);
    }
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    console.log(`Tentando atualizar perfil ${id}:`, updates);
    setUpdating(id);
    try {
      // Criamos um objeto de atualização limpo, removendo o especialidade_id que causa erro de cache
      const cleanUpdates: any = { ...updates };
      
      // Se estivermos tentando atualizar a especialidade, usamos apenas o campo de texto
      if (updates.especialidade_id) {
        const specialty = specialties.find(s => s.id === updates.especialidade_id);
        if (specialty) {
          cleanUpdates.especialidade = specialty.nome;
        }
      }
      
      // SEMPRE removemos o especialidade_id antes de enviar, pois ele está travando o cache do Supabase
      delete cleanUpdates.especialidade_id;

      // Usamos .select() explícito para evitar que o Supabase tente retornar todas as colunas (RETURNING *)
      // que é o que dispara o erro de cache de esquema
      const { data, error } = await supabase
        .from('profiles')
        .update(cleanUpdates)
        .eq('id', id)
        .select('id, email, role, status, full_name, especialidade');
      
      if (error) {
        console.error("Erro retornado pelo Supabase:", error);
        throw error;
      }
      
      toast.success("Perfil atualizado com sucesso!");
      
      // Atualizamos o estado local com os dados retornados ou com o que enviamos
      const updatedData = data && data[0] ? data[0] : { ...profiles.find(p => p.id === id), ...cleanUpdates };
      setProfiles(profiles.map(p => p.id === id ? updatedData : p));
    } catch (err: any) {
      console.error("Erro ao atualizar perfil:", err);
      toast.error(`Falha ao atualizar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setUpdating(null);
    }
  };

  const deleteProfile = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este membro da equipe? Esta ação não pode ser desfeita.")) return;
    
    setDeleting(id);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Membro removido com sucesso!");
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err: any) {
      console.error("Erro ao excluir perfil:", err);
      toast.error(`Falha ao excluir: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-clinical-blue" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-clinical-border p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Gerenciar Equipe</h2>
          <button 
            onClick={fetchProfiles} 
            className={cn("p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all", loading && "animate-spin text-clinical-blue")}
            title="Recarregar Lista"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
            Erro: {error}
          </div>
        )}
        {profiles.length === 0 && !error ? (
          <div className="text-center py-8 text-slate-500">
            Nenhum membro da equipe encontrado.
          </div>
        ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-clinical-blue/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    profile.role === 'admin' ? "bg-purple-100 text-purple-600" : 
                    profile.role === 'doctor' ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600"
                  )}>
                    {profile.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        defaultValue={profile.full_name || ''}
                        onBlur={(e) => {
                          if (e.target.value !== profile.full_name) {
                            updateProfile(profile.id, { full_name: e.target.value });
                          }
                        }}
                        className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-clinical-blue focus:outline-none transition-all px-1"
                        placeholder="Nome Completo"
                      />
                    </div>
                    <p className="text-xs text-slate-500 px-1">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {profile.status === 'pending' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          <Clock size={10} /> AGUARDANDO APROVAÇÃO
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle2 size={10} /> ACESSO LIBERADO
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {profile.status === 'pending' && (
                    <button 
                      onClick={() => updateProfile(profile.id, { status: 'approved' })}
                      disabled={updating === profile.id}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {updating === profile.id ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                      <span className="text-xs font-bold">APROVAR</span>
                    </button>
                  )}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cargo</label>
                      <select
                        value={profile.role}
                        onChange={(e) => updateProfile(profile.id, { role: e.target.value as any })}
                        disabled={updating === profile.id}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-clinical-blue outline-none disabled:bg-slate-100 transition-all"
                      >
                        <option value="admin">Administrador</option>
                        <option value="doctor">Médico</option>
                        <option value="receptionist">Recepcionista</option>
                      </select>
                    </div>

                    {profile.role === 'doctor' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Especialidade</label>
                        <select
                          value={profile.especialidade || ''}
                          onChange={(e) => updateProfile(profile.id, { especialidade_id: specialties.find(s => s.nome === e.target.value)?.id || '', especialidade: e.target.value } as any)}
                          disabled={updating === profile.id}
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-clinical-blue outline-none disabled:bg-slate-100 transition-all"
                        >
                          <option value="">Nenhuma</option>
                          {specialties.length > 0 ? (
                            specialties.map(s => (
                              <option key={s.id} value={s.nome}>{s.nome}</option>
                            ))
                          ) : (
                            <>
                              <option value="Neurologia">Neurologia (Padrão)</option>
                              <option value="Ortopedia">Ortopedia (Padrão)</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => deleteProfile(profile.id)}
                      disabled={deleting === profile.id}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                      title="Excluir Membro"
                    >
                      {deleting === profile.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
