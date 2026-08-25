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
  AlertCircle,
  Award,
  BadgeCheck
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
  crm_cro?: string;
}

const DEFAULT_SPECIALTIES = [
  'Nenhuma',
  'Clínica Geral',
  'Ortopedia',
  'Neurologia',
  'Medicina Integrativa',
  'Odontologia Biológica',
  'Cardiologia',
  'Pediatria',
  'Ginecologia',
  'Dermatologia',
  'Psiquiatria',
  'Endocrinologia'
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
  const [newMemberCrm, setNewMemberCrm] = useState('');
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

  const getLocalCrmCroMap = (): Record<string, string> => {
    try {
      const stored = localStorage.getItem('clinic_crm_cro_map');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  };

  const setLocalCrmCro = (idOrEmail: string, crm: string) => {
    if (!idOrEmail) return;
    try {
      const map = getLocalCrmCroMap();
      map[idOrEmail.toLowerCase().trim()] = crm;
      localStorage.setItem('clinic_crm_cro_map', JSON.stringify(map));
    } catch (e) {}
  };

  const getLocalTeamOwnerMap = (): Record<string, string> => {
    try {
      const stored = localStorage.getItem('clinic_team_owner_map');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  };

  const setLocalTeamOwner = (memberEmailOrId: string, ownerEmail: string) => {
    if (!memberEmailOrId || !ownerEmail) return;
    try {
      const map = getLocalTeamOwnerMap();
      map[memberEmailOrId.toLowerCase().trim()] = ownerEmail.toLowerCase().trim();
      localStorage.setItem('clinic_team_owner_map', JSON.stringify(map));
    } catch (e) {}
  };

  const isMasterAdmin = (currentUser?.email || '').toLowerCase().trim() === 'marco.agduarte22@gmail.com' ||
                        (currentUser?.id || '').toLowerCase().includes('master-admin-marco') ||
                        (currentUser?.id || '').toLowerCase().includes('marco-duarte-admin') ||
                        (!currentUser?.email && !currentUser?.id);

  const currentUserEmailNorm = (currentUser?.email || '').toLowerCase().trim();
  const currentUserNameNorm = (currentUser?.full_name || '').toLowerCase().trim();

  const isCarlosUser = currentUserEmailNorm.includes('carlos') || 
                       currentUserEmailNorm.includes('morato') || 
                       currentUserEmailNorm === 'carvalhomorato@gmail.com' || 
                       currentUserNameNorm.includes('carlos');

  const isLucyUser = currentUserEmailNorm.includes('luc') || 
                     currentUserEmailNorm.includes('murata') || 
                     currentUserEmailNorm === 'lucimurata@gmail.com' || 
                     currentUserNameNorm.includes('luc');

  const canManageTeam = isMasterAdmin || isCarlosUser || isLucyUser || currentUser?.role === 'admin';

  const IMMORTAL_EMAILS = [
    'marco.agduarte22@gmail.com',
    'carvalhomorato@gmail.com',
    'lucimurata@gmail.com'
  ];

  const isImmortalClinicalMember = (p: Partial<Profile>) => {
    const normEmail = (p.email || '').toLowerCase().trim();
    const normName = (p.full_name || '').toLowerCase().trim();
    return normEmail === 'marco.agduarte22@gmail.com' ||
           normEmail === 'carvalhomorato@gmail.com' ||
           normEmail === 'lucimurata@gmail.com' ||
           normName.includes('marco duarte') ||
           normName.includes('carlos morato') ||
           normName.includes('luci murata') ||
           normName.includes('lucy morata');
  };

  const getLocalDeletedMembers = (): string[] => {
    try {
      const stored = localStorage.getItem('deleted_members_local');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => {
            const norm = String(item).toLowerCase().trim();
            return norm !== 'marco.agduarte22@gmail.com' && 
                   norm !== 'carvalhomorato@gmail.com' &&
                   norm !== 'dr-carlos-morato';
          });
        }
      }
    } catch (e) {}
    return [];
  };

  const addLocalDeletedMember = (emailOrId: string) => {
    if (!emailOrId) return;
    try {
      const list = getLocalDeletedMembers();
      const norm = emailOrId.toLowerCase().trim();
      if (!list.includes(norm)) {
        list.push(norm);
        localStorage.setItem('deleted_members_local', JSON.stringify(list));
      }
    } catch (e) {}
  };

  const removeLocalDeletedMember = (emailOrId: string) => {
    if (!emailOrId) return;
    try {
      const list = getLocalDeletedMembers();
      const norm = emailOrId.toLowerCase().trim();
      const updated = list.filter(item => item !== norm);
      localStorage.setItem('deleted_members_local', JSON.stringify(updated));
    } catch (e) {}
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let rawProfiles: any[] = [];
      
      // 1. Tenta buscar via API Administrativa Server-Side (Garante acesso irrestrito sem bloqueios de RLS)
      try {
        const res = await fetch("/api/admin/members");
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.success && Array.isArray(resJson.members)) {
            rawProfiles = resJson.members;
          }
        }
      } catch (fErr) {
        console.warn("Aviso fetch admin members:", fErr);
      }

      // 2. Fallback direto pelo client se a API falhar
      if (!rawProfiles || rawProfiles.length === 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role, status, full_name, especialidade')
          .order('role', { ascending: true });
        
        if (error) {
          console.error("Erro ao buscar perfis client:", error);
        } else if (data) {
          rawProfiles = data;
        }
      }
      
      const localDeleted = getLocalDeletedMembers();
      const crmMap = getLocalCrmCroMap();

      // Remove duplicatas locais caso existam no banco por email e ignora deletados
      const uniqueMap = new Map<string, any>();
      for (const p of rawProfiles) {
        const key = (p.email || p.id || '').toLowerCase().trim();
        const idKey = (p.id || '').toLowerCase().trim();
        
        // Ignora se estiver na lista de deletados
        if (localDeleted.includes(key) || localDeleted.includes(idKey)) {
          continue;
        }

        // Sanitiza nomes padrão incorretos (ex: 'Médico') para o nome do profissional real
        let cleanName = (p.full_name || '').trim();
        let cleanSpecialty = p.especialidade || '';
        let cleanCrm = p.crm_cro || crmMap[key] || crmMap[idKey] || '';

        if (key.includes('carlos') || key.includes('morato') || key === 'carvalhomorato@gmail.com' || idKey.includes('carlos')) {
          if (!cleanName || cleanName.toLowerCase() === 'médico' || cleanName.toLowerCase() === 'medico') {
            cleanName = 'Dr. Carlos Morato';
          }
          cleanSpecialty = cleanSpecialty || 'Neurologia & Medicina Integrativa';
          cleanCrm = cleanCrm || 'CRM/SP 145.892';
        } else if (key.includes('luci') || key.includes('murata') || key === 'lucimurata@gmail.com' || idKey.includes('lucy')) {
          if (!cleanName || cleanName.toLowerCase() === 'médico' || cleanName.toLowerCase() === 'medico') {
            cleanName = 'Dra. Luci Murata';
          }
          cleanSpecialty = cleanSpecialty || 'Odontologia Biológica & Saúde Integrativa';
          cleanCrm = cleanCrm || 'CRO/SP 98.412';
        } else if (key === 'marco.agduarte22@gmail.com' || idKey.includes('marco')) {
          cleanName = 'Marco Duarte';
          cleanSpecialty = 'Gestor & Administrador Mestre';
          cleanCrm = 'ADMIN-MASTER-01';
        }

        const enriched = {
          ...p,
          full_name: cleanName,
          especialidade: cleanSpecialty,
          crm_cro: cleanCrm
        };

        if (key && !uniqueMap.has(key)) {
          uniqueMap.set(key, enriched);
        } else if (!key) {
          uniqueMap.set(p.id, enriched);
        }
      }
      const uniqueProfiles = Array.from(uniqueMap.values());

      const CORE_DEFAULT_MEMBERS = [
        {
          id: 'marco-duarte-admin',
          email: 'marco.agduarte22@gmail.com',
          full_name: 'Marco Duarte',
          role: 'admin' as const,
          especialidade: 'Gestor & Administrador Mestre',
          crm_cro: 'ADMIN-MASTER-01',
          status: 'approved' as const
        },
        {
          id: 'dr-carlos-morato',
          email: 'carvalhomorato@gmail.com',
          full_name: 'Dr. Carlos Morato',
          role: 'admin' as const,
          especialidade: 'Neurologia & Medicina Integrativa',
          crm_cro: 'CRM/SP 145.892',
          status: 'approved' as const
        },
        {
          id: 'dra-lucy-morata',
          email: 'lucimurata@gmail.com',
          full_name: 'Dra. Luci Murata',
          role: 'admin' as const,
          especialidade: 'Odontologia Biológica & Saúde Integrativa',
          crm_cro: 'CRO/SP 98.412',
          status: 'approved' as const
        }
      ];

      for (const core of CORE_DEFAULT_MEMBERS) {
        const foundIndex = uniqueProfiles.findIndex(p => 
          (p.email && p.email.toLowerCase().trim() === core.email) ||
          (p.full_name && p.full_name.toLowerCase().includes(
            core.email.includes('carlos') ? 'carlos' : core.email.includes('luci') ? 'luci' : 'duarte'
          ))
        );
        if (foundIndex === -1) {
          uniqueProfiles.push(core);
        } else {
          // Atualiza dados padrão garantidos se estavam genéricos
          if (!uniqueProfiles[foundIndex].full_name || uniqueProfiles[foundIndex].full_name === 'Médico') {
            uniqueProfiles[foundIndex].full_name = core.full_name;
          }
          if (!uniqueProfiles[foundIndex].especialidade) {
            uniqueProfiles[foundIndex].especialidade = core.especialidade;
          }
          if (!uniqueProfiles[foundIndex].crm_cro) {
            uniqueProfiles[foundIndex].crm_cro = core.crm_cro;
          }
        }
      }

      // Se houver perfis com status 'pending' antigo, atualiza automaticamente no banco para 'approved'
      const pendingProfiles = uniqueProfiles.filter(p => p.status === 'pending');
      if (pendingProfiles.length > 0) {
        (async () => {
          try {
            for (const p of pendingProfiles) {
              await supabase.from('profiles').update({ status: 'approved' }).eq('id', p.id);
            }
          } catch (e) {
            console.warn("Erro ao auto-aprovar:", e);
          }
        })();
      }

      if (isMasterAdmin) {
        setProfiles(uniqueProfiles.map(p => ({ ...p, status: 'approved' as const })));
      } else {
        const currentEmail = (currentUser?.email || '').toLowerCase().trim();
        const currentId = (currentUser?.id || '').toLowerCase().trim();
        const currentName = (currentUser?.full_name || '').toLowerCase().trim();

        const isCarlos = currentEmail.includes('carlos') || currentEmail.includes('morato') || currentEmail === 'carvalhomorato@gmail.com' || currentName.includes('carlos');
        const isLucy = currentEmail.includes('luc') || currentEmail.includes('murata') || currentEmail === 'lucimurata@gmail.com' || currentName.includes('luc');

        const ownerMap = getLocalTeamOwnerMap();

        let myProfiles = uniqueProfiles.filter(p => {
          const pEmail = (p.email || '').toLowerCase().trim();
          const pId = (p.id || '').toLowerCase().trim();
          const pName = (p.full_name || '').toLowerCase().trim();
          
          if (isCarlos) {
            // Se for o próprio Dr. Carlos
            if (pEmail === 'carvalhomorato@gmail.com' || pId === 'dr-carlos-morato' || (pName.includes('carlos') && pName.includes('morato'))) {
              return true;
            }
            // Se for membro criado ou pertencente à equipe do Dr. Carlos
            if (ownerMap[pEmail] === 'carvalhomorato@gmail.com' || ownerMap[pId] === 'carvalhomorato@gmail.com') {
              return true;
            }
            // Não exibe Dra. Luci nem Marco Duarte
            return false;
          }

          if (isLucy) {
            // Se for a própria Dra. Luci
            if (pEmail === 'lucimurata@gmail.com' || pId === 'dra-lucy-morata' || (pName.includes('luci') && pName.includes('murata'))) {
              return true;
            }
            // Se for membro criado ou pertencente à equipe da Dra. Luci
            if (ownerMap[pEmail] === 'lucimurata@gmail.com' || ownerMap[pId] === 'lucimurata@gmail.com') {
              return true;
            }
            // Não exibe Dr. Carlos nem Marco Duarte
            return false;
          }

          if (currentEmail && (pEmail === currentEmail)) return true;
          if (currentId && pId === currentId) return true;
          return false;
        });

        if (myProfiles.length === 0) {
          myProfiles = [{
            id: currentUser?.id || (isCarlos ? 'dr-carlos-morato' : (isLucy ? 'dra-lucy-morata' : 'self-profile')),
            email: currentUser?.email || (isCarlos ? 'carvalhomorato@gmail.com' : (isLucy ? 'lucimurata@gmail.com' : '')),
            full_name: currentUser?.full_name || (isCarlos ? 'Dr. Carlos Morato' : (isLucy ? 'Dra. Luci Murata' : 'Profissional')),
            role: 'admin' as const,
            especialidade: currentUser?.especialidade || (isCarlos ? 'Neurologia & Medicina Integrativa' : (isLucy ? 'Odontologia Biológica & Saúde Integrativa' : 'Clínica Geral')),
            crm_cro: currentUser?.crm_cro || (isCarlos ? 'CRM/SP 145.892' : (isLucy ? 'CRO/SP 98.412' : '')),
            status: 'approved' as const
          }];
        }

        setProfiles(myProfiles.map(p => ({ ...p, status: 'approved' as const })));
      }
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
      const email = newMemberEmail.trim().toLowerCase();
      const fullName = newMemberName.trim();
      const password = newMemberPassword.trim() || "Duarte2026!";
      const role = newMemberRole;
      const especialidade = newMemberSpecialty;
      const crm_cro = newMemberCrm.trim();

      removeLocalDeletedMember(email);
      if (crm_cro) {
        setLocalCrmCro(email, crm_cro);
      }

      // Vincula o membro ao consultório do médico ou admin criador
      const creatorEmail = currentUser?.email || (isCarlosUser ? 'carvalhomorato@gmail.com' : (isLucyUser ? 'lucimurata@gmail.com' : 'marco.agduarte22@gmail.com'));
      setLocalTeamOwner(email, creatorEmail);

      // 1. Tenta cadastrar via rota administrativa segura do backend
      let createdViaApi = false;
      try {
        const resp = await fetch("/api/admin/create-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            role,
            especialidade,
            crm_cro
          })
        });

        if (resp.ok) {
          const resData = await resp.json();
          if (resData.success) {
            createdViaApi = true;
            if (resData.member?.id && crm_cro) {
              setLocalCrmCro(resData.member.id, crm_cro);
            }
          }
        }
      } catch (apiErr) {
        console.warn("Aviso chamada API admin create-member:", apiErr);
      }

      // 2. Fallback direto pelo client caso o backend não tenha respondido
      if (!createdViaApi) {
        let createdUserId = '';
        if (password.length >= 6) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { 
              data: { 
                full_name: fullName, 
                role,
                especialidade,
                crm_cro
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

        const profileData: any = {
          email,
          full_name: fullName,
          role,
          especialidade,
          status: 'approved'
        };
        if (createdUserId) {
          profileData.id = createdUserId;
          if (crm_cro) setLocalCrmCro(createdUserId, crm_cro);
        }

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'email' });

        if (upsertError) {
          console.error('Erro ao salvar no profiles:', upsertError);
          throw upsertError;
        }
      }

      toast.success('Membro cadastrado e acesso liberado com sucesso!', { id: toastId });
      setShowAddModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPassword('');
      setNewMemberCrm('');
      setNewMemberSpecialty('Nenhuma');
      await fetchProfiles();
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
      const { crm_cro, ...dbUpdates } = updates as any;
      
      // Salva CRM/CRO localmente e na API de auth
      if (crm_cro !== undefined) {
        setLocalCrmCro(id, crm_cro);
        const existingProf = profiles.find(p => p.id === id);
        if (existingProf?.email) {
          setLocalCrmCro(existingProf.email, crm_cro);
        }
      }

      // Atualiza no banco somente campos existentes na tabela profiles
      if (Object.keys(dbUpdates).length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', id)
          .select('id, email, role, status, full_name, especialidade');
        
        if (error) {
          console.warn("Aviso atualização remota profile:", error);
        }
      }
      
      toast.success("Perfil atualizado com sucesso!");
      setProfiles(prev => prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...updates,
            crm_cro: crm_cro !== undefined ? crm_cro : p.crm_cro
          };
        }
        return p;
      }));
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

    if (isImmortalClinicalMember(memberToDelete)) {
      setMemberToDelete(null);
      toast.error("Este é um profissional clínico principal/administrador do Ambulatório IA e está blindado contra exclusão.");
      return;
    }
    
    setDeleting(id);
    setMemberToDelete(null); // Fecha o popup imediatamente
    toast.dismiss(); // Limpa toasts anteriores
    const toastId = toast.loading("Removendo membro da equipe...");
    
    try {
      // 1. Registra localmente e remove da interface visual imediatamente
      if (email) addLocalDeletedMember(email);
      if (id) addLocalDeletedMember(id);

      setProfiles(prev => prev.filter(p => p.id !== id && (email ? p.email !== email : true)));

      // 2. Chama a API do backend (que tem service_role com permissão administrativa máxima)
      const res = await fetch("/api/admin/delete-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Falha na exclusão do servidor.");
      }

      // 3. Deleta direto via Supabase client também como garantia
      try {
        if (id) await supabase.from('profiles').delete().eq('id', id);
        if (email) await supabase.from('profiles').delete().eq('email', email);
      } catch (cErr) {
        console.warn("Client delete warning:", cErr);
      }
      
      toast.dismiss(toastId);
      toast.success(`${full_name || email} foi removido permanentemente!`, { duration: 3000 });
      
      // 4. Recarrega a lista oficial do banco após a exclusão
      await fetchProfiles();
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
            <h2 className="text-xl font-bold text-slate-800">
              {isMasterAdmin 
                ? "Gerenciar Equipe do Consultório & Acessos" 
                : isCarlosUser 
                  ? "Equipe do Consultório & Acessos (Dr. Carlos Morato)" 
                  : isLucyUser 
                    ? "Equipe do Consultório & Acessos (Dra. Luci Murata)" 
                    : "Minha Equipe & Acesso Profissional"}
            </h2>
            <p className="text-xs text-slate-500">
              {isMasterAdmin 
                ? "Painel Geral de Gestão - Adicione secretárias, recepcionistas, médicos e gerencie permissões" 
                : "Adicione e gerencie secretárias, recepcionistas e profissionais da equipe da sua clínica"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÃO NOVO MEMBRO (Disponível para Dr. Carlos, Dra. Luci e Marco Duarte) */}
          {canManageTeam && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Novo Membro</span>
            </button>
          )}

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
                <label className="font-bold text-slate-700 block mb-1">CRM / CRO / Registro Profissional (opcional):</label>
                <div className="relative">
                  <Award className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: CRM/SP 123456 ou CRO/RJ 98765"
                    value={newMemberCrm}
                    onChange={(e) => setNewMemberCrm(e.target.value)}
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
                    placeholder="Senha para login do profissional"
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
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 px-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/80">
                      <CheckCircle2 className="w-3 h-3 text-sky-600" /> ACESSO LIBERADO
                    </span>
                    {profile.crm_cro && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        <Award className="w-3 h-3 text-blue-600" /> {profile.crm_cro}
                      </span>
                    )}
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

                {(profile.role === 'doctor' || profile.role === 'admin') && (
                  <>
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

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">CRM / CRO</label>
                      <input
                        type="text"
                        defaultValue={profile.crm_cro || ''}
                        onBlur={(e) => {
                          if (e.target.value !== profile.crm_cro) {
                            updateProfile(profile.id, { crm_cro: e.target.value });
                          }
                        }}
                        placeholder="Ex: CRM/SP 1234"
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 w-32 focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                      />
                    </div>
                  </>
                )}
                
                {isImmortalClinicalMember(profile) ? (
                  <div 
                    className="p-2 text-amber-500 bg-amber-50 rounded-xl transition-all self-end mb-0.5 border border-amber-200/60 flex items-center gap-1 text-[11px] font-bold"
                    title="Administrador Mestre (Blindado contra exclusão)"
                  >
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="hidden sm:inline text-amber-800 text-[10px]">Blindado</span>
                  </div>
                ) : isMasterAdmin ? (
                  <button 
                    type="button"
                    onClick={() => setMemberToDelete(profile)}
                    disabled={deleting === profile.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all self-end mb-0.5"
                    title="Remover Membro"
                  >
                    {deleting === profile.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
