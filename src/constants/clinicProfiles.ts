export interface ClinicProfileConfig {
  id: 'dra_lucy' | 'dr_carlos' | 'marco_admin' | string;
  professional_name: string;
  council_badge: string;
  specialty_label: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  slogan: string;
  evolution_url: string;
  evolution_instance: string;
  evolution_apikey: string;
}

export const CLINIC_PROFILES_CONFIG: Record<string, ClinicProfileConfig> = {
  dra_lucy: {
    id: 'dra_lucy',
    professional_name: 'Dra. Lucy Morata',
    council_badge: 'CRO/SP 98.412',
    specialty_label: 'Odontologia Biológica & Saúde Integrativa',
    name: 'Consultório Dra. Lucy Morata - Odontologia Biológica',
    address: 'Av. Paulista, 1000 - Conjunto 1402 - Bela Vista - São Paulo/SP',
    phone: '(11) 98765-4321',
    email: 'dra.lucy@ambulatorioia.com',
    website: 'www.dralucymorata.com.br',
    slogan: 'Odontologia Biológica, Cirurgia Zircônia & Saúde Integrativa',
    evolution_url: 'https://api.makprojetosmake.com.br',
    evolution_instance: 'luci',
    evolution_apikey: 'E6247913DB92-48B4-8B54-5C7449EA639B'
  },
  dr_carlos: {
    id: 'dr_carlos',
    professional_name: 'Dr. Carlos Morato',
    council_badge: 'CRM/SP 145.892',
    specialty_label: 'Neurologia & Medicina Integrativa',
    name: 'Clínica Dr. Carlos Morato - Neurologia & Integrativa',
    address: 'Av. Paulista, 1000 - Conjunto 1401 - Bela Vista - São Paulo/SP',
    phone: '(11) 99876-5432',
    email: 'dr.carlos@ambulatorioia.com',
    website: 'www.drcarlosmorato.com.br',
    slogan: 'Neurologia Clínica e Medicina Integrativa',
    evolution_url: 'https://api.makprojetosmake.com.br',
    evolution_instance: 'drcarlos',
    evolution_apikey: 'E6247913DB92-48B4-8B54-5C7449EA639B'
  },
  marco_admin: {
    id: 'marco_admin',
    professional_name: 'Marco Duarte',
    council_badge: 'Gestão Master',
    specialty_label: 'Gestor & Administrador do Ambulatório IA',
    name: 'Ambulatório IA - Gestão de Saúde Integrada',
    address: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP',
    phone: '(11) 91234-5678',
    email: 'marco.agduarte22@gmail.com',
    website: 'www.ambulatorioia.com',
    slogan: 'Gestão Integrada de Saúde, Neurologia e Odontologia Biológica',
    evolution_url: 'https://api.makprojetosmake.com.br',
    evolution_instance: 'ambulatorio',
    evolution_apikey: 'E6247913DB92-48B4-8B54-5C7449EA639B'
  }
};

export function resolveDoctorKey(userOrEmail?: any, name?: string): 'dra_lucy' | 'dr_carlos' | 'marco_admin' {
  const email = (typeof userOrEmail === 'string' ? userOrEmail : (userOrEmail?.email || '')).toLowerCase().trim();
  const fullName = (typeof userOrEmail === 'object' ? (userOrEmail?.full_name || name || '') : (name || '')).toLowerCase().trim();
  const id = (typeof userOrEmail === 'object' ? (userOrEmail?.id || '') : '');

  // Marco Duarte (Master Admin)
  if (email === 'marco.agduarte22@gmail.com' || id === 'master-admin-marco' || (fullName.includes('marco') && fullName.includes('duarte'))) {
    return 'marco_admin';
  }

  // Dra. Lucy
  if (email.includes('lucy') || email.includes('luci') || fullName.includes('lucy') || fullName.includes('luci') || fullName.includes('morata')) {
    return 'dra_lucy';
  }

  // Dr. Carlos
  if (email.includes('carlos') || fullName.includes('carlos') || fullName.includes('morato')) {
    return 'dr_carlos';
  }

  return 'dra_lucy'; // Padrão seguro
}

export function getActiveClinicConfig(user?: any, overrideDoctorKey?: string): ClinicProfileConfig {
  const key = overrideDoctorKey || resolveDoctorKey(user);
  const baseDefault = CLINIC_PROFILES_CONFIG[key] || CLINIC_PROFILES_CONFIG.dra_lucy;

  if (typeof window === 'undefined') return baseDefault;

  // 1. Tenta buscar configuração personalizada salva para este perfil
  try {
    const savedSpecific = localStorage.getItem(`clinic_info_${key}`);
    if (savedSpecific) {
      const parsed = JSON.parse(savedSpecific);
      return {
        ...baseDefault,
        ...parsed,
        evolution_url: parsed.evolution_url || baseDefault.evolution_url,
        evolution_instance: parsed.evolution_instance || baseDefault.evolution_instance,
        evolution_apikey: parsed.evolution_apikey || baseDefault.evolution_apikey
      };
    }
  } catch (e) {
    console.warn("Aviso ao ler clinic_info específica:", e);
  }

  return baseDefault;
}

export function saveActiveClinicConfig(config: ClinicProfileConfig, user?: any, doctorKey?: string) {
  const key = doctorKey || resolveDoctorKey(user);
  if (typeof window !== 'undefined') {
    localStorage.setItem(`clinic_info_${key}`, JSON.stringify(config));
    // Sincroniza também na chave global ativa para retrocompatibilidade
    localStorage.setItem('clinic_info', JSON.stringify(config));
    window.dispatchEvent(new Event('clinic_info_updated'));
  }
}
