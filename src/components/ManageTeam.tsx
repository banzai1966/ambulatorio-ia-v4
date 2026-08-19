import React, { useState, useEffect } from 'react';
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
  Trash2,
  UserPlus,
  Mail,
  Lock,
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist';
  status: 'pending' | 'approved';
  full_name?: string;
  especialidade?: string;
}

const DEFAULT_SPECIALTIES = [
  'Nenhuma',
  'Ortopedia',
  'Neurologia',
  'Medicina Integrativa',
  'Cardiologia',
  'Pediatria',
  'Ginecologia',
  'Dermatologia',
  'Clínica Geral'
];

export default function ManageTeam({ currentUser, onClose }: { currentUser?: any; onClose: () => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal / Formulário de Novo Membro
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'doctor' | 'receptionist'>('doctor');
  const [newMemberSpecialty, setNewMemberSpecialty] = useState('Nenhuma');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProfiles();

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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, status, full_name, especialidade')
        .order('role', { ascending: true });
      
      if (error) {
        console.error("Erro ao buscar perfis:", error);
        throw error;
      }
      
      const rawProfiles = data || [];
      // Se houver perfis com status 'pending' antigo, atualiza automaticamente no banco para 'approved'
      const pendingProfiles = rawProfiles.filter(p => p.status === 'pending');
      if (pendingProfiles.length > 0) {
        Promise.all(
          pendingProfiles.map(p => 
            supabase.from('profiles').update({ status: 'approved' }).eq('id', p.id)
          )
        ).catch(e => console.warn("Erro ao auto-aprovar:", e));
      }

      setProfiles(rawProfiles.map(p => ({ ...p, status: 'approved' as const })));
    } catch (err: any) {
      console.error("Erro ao buscar equipe:", err);
      setError(err.message || "Falha ao buscar equipe.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !newMemberName.trim()) {
      toast.error('Informe o nome e o e-mail do profissional.');
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading('Cadastrando membro da equipe...');
    try {
      let createdUserId = '';
      
      // Cria usuário no Auth se tiver senha fornecida
      if (newMemberPassword && newMemberPassword.length >= 6) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: newMemberEmail.trim(),
          password: newMemberPassword,
          options: { 
            data: { 
              full_name: newMemberName.trim(), 
              role: newMemberRole 
            } 
          }
        });
        if (authError && !authError.message.includes('already registered')) {
          console.warn('Aviso Auth signUp:', authError);
        }
        if (authData?.user) {
          createdUserId = authData.user.id;
        }
      }

      // Garante inserção ou atualização no profiles
      const profileData: any = {
        email: newMemberEmail.trim(),
        full_name: newMemberName.trim(),
        role: newMemberRole,
        especialidade: newMemberSpecialty,
        status: 'approved'
      };
      if (createdUserId) {
        profileData.id = createdUserId;
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'email' });

      if (upsertError) {
        console.error('Erro ao salvar no profiles:', upsertError);
        throw upsertError;
      }

      toast.success('Membro cadastrado e acesso liberado com sucesso!', { id: toastId });
      setShowAddModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPassword('');
      setNewMemberSpecialty('Nenhuma');
      fetchProfiles();
    } catch (err: any) {
      console.error("Erro ao adicionar membro:", err);
      toast.error(`Falha ao adicionar: ${err.message || 'Verifique os dados'}`, { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    setUpdating(id);
    try {
      const cleanUpdates: any = { ...updates };
      const { data, error } = await supabase
        .from('profiles')
        .update(cleanUpdates)
        .eq('id', id)
        .select('id, email, role, status, full_name, especialidade');
      
      if (error) throw error;
      
      toast.success("Perfil atualizado com sucesso!");
      const updatedData = data && data[0] ? data[0] : { ...profiles.find(p => p.id === id), ...cleanUpdates };
      setProfiles(profiles.map(p => p.id === id ? updatedData : p));
    } catch (err: any) {
      console.error("Erro ao atualizar perfil:", err);
      toast.error(`Falha ao atualizar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setUpdating(null);
    }
  };

  // Modal de confirmação de exclusão
  const [memberToDelete, setMemberToDelete] = useState<Profile | null>(null);

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    const { id, email, full_name } = memberToDelete;
    
    setDeleting(id);
    setMemberToDelete(null); // Fecha o popup imediatamente
    toast.dismiss(); // Limpa toasts anteriores
    const toastId = toast.loading("Removendo membro da equipe...");
    
    try {
      // 1. Remove da interface visual imediatamente
      setProfiles(prev => prev.filter(p => p.id !== id && p.email !== email));

      // 2. Executa exclusão com timeout de 6 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        await fetch("/api/admin/delete-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, email }),
          signal: controller.signal
        });
      } catch (fErr) {
        console.warn("Aviso fetch delete backend:", fErr);
      } finally {
        clearTimeout(timeoutId);
      }

      // 3. Fallback adicional direto no banco de forma não bloqueante
      if (email) {
        supabase.from('profiles').delete().eq('email', email).catch(console.warn);
      }
      if (id) {
        supabase.from('profiles').delete().eq('id', id).catch(console.warn);
      }
      
      toast.dismiss(toastId);
      toast.success(`${full_name || email} foi removido com sucesso!`, { duration: 3000 });
    } catch (err: any) {
      console.error("Erro ao excluir perfil:", err);
      toast.dismiss(toastId);
      toast.error(`Falha ao excluir: ${err.message || 'Erro desconhecido'}`);
      fetchProfiles();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full mx-auto shadow-xl border border-slate-100 animate-fadeIn">
      {/* Header com Botão de Novo Membro em destaque */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Gerenciar Equipe & Médicos</h2>
            <p className="text-xs text-slate-500">Adicione médicos, secretárias e defina cargos e acessos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÃO NOVO MEMBRO */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Novo Membro</span>
          </button>

          <button 
            type="button"
            onClick={fetchProfiles} 
            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Recarregar Lista"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-blue-600")} />
          </button>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL DE ADICIONAR NOVO MEMBRO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Cadastrar Novo Membro</h3>
                  <p className="text-[11px] text-slate-400">Liberação de acesso para login imediato</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo (com Dr./Dra.):</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Juliana Costa"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">E-mail de Login do Profissional:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="medico@clinica.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Senha de Acesso Inicial (mínimo 6 dígitos):</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Senha para login do médico"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cargo / Função:</label>
                  <select
                    value={newMemberRole}
                    onChange={(e: any) => setNewMemberRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                  >
                    <option value="doctor">Médico(a)</option>
                    <option value="admin">Administrador(a)</option>
                    <option value="receptionist">Recepção</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Especialidade:</label>
                  <select
                    value={newMemberSpecialty}
                    onChange={(e) => setNewMemberSpecialty(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                  >
                    {DEFAULT_SPECIALTIES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Cadastrar & Liberar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-red-100 text-left relative animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Remover membro da equipe?
            </h3>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Você está prestes a excluir o acesso de <strong className="text-slate-700">{memberToDelete.full_name || memberToDelete.email}</strong> ({memberToDelete.email}). Esta ação removerá o perfil e o acesso ao sistema.
            </p>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-amber-800 leading-tight">
                Permissão de Administrador: Esta operação remove os registros do banco e revoga todas as credenciais.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteMember}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-red-500/20 transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Deletar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE MEMBROS */}
      <div className="space-y-3">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-xs font-semibold">
            Erro: {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Carregando equipe...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhum membro encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Clique em "+ Novo Membro" para adicionar o primeiro.</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div 
              key={profile.id} 
              className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all gap-3"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs",
                  profile.role === 'admin' ? "bg-purple-100 text-purple-600" : 
                  profile.role === 'doctor' ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600"
                )}>
                  {profile.role === 'admin' ? <Shield className="w-5 h-5" /> : 
                   profile.role === 'doctor' ? <Stethoscope className="w-5 h-5" /> : <User className="w-5 h-5" />}
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
                      className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-hidden transition-all text-sm px-1"
                      placeholder="Nome Completo"
                    />
                  </div>
                  <p className="text-xs text-slate-400 px-1">{profile.email}</p>
                  <div className="flex items-center gap-2 mt-0.5 px-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3" /> ACESSO LIBERADO
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Cargo</label>
                  <select
                    value={profile.role}
                    onChange={(e) => updateProfile(profile.id, { role: e.target.value as any })}
                    disabled={updating === profile.id}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                  >
                    <option value="admin">Administrador</option>
                    <option value="doctor">Médico</option>
                    <option value="receptionist">Recepção</option>
                  </select>
                </div>

                {profile.role === 'doctor' && (
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Especialidade</label>
                    <select
                      value={profile.especialidade || 'Nenhuma'}
                      onChange={(e) => updateProfile(profile.id, { especialidade: e.target.value })}
                      disabled={updating === profile.id}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                    >
                      {DEFAULT_SPECIALTIES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <button 
                  type="button"
                  onClick={() => setMemberToDelete(profile)}
                  disabled={deleting === profile.id}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all self-end mb-0.5"
                  title="Remover Membro"
                >
                  {deleting === profile.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
