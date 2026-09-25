import { LUCY_LOGO_DATA_URL } from './lucyLogoBase64';

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
  logo_url?: string;
  prescription_footer?: string;
  whatsapp_message_template?: string;
  evolution_url: string;
  evolution_instance: string;
  evolution_apikey: string;
}

export const CLINIC_PROFILES_CONFIG: Record<string, ClinicProfileConfig> = {
  dra_lucy: {
    id: 'dra_lucy',
    professional_name: 'Dra. Lucy Murata',
    council_badge: 'CRO-SP 69246',
    specialty_label: 'Odontologia Biológica & Saúde Integrativa',
    name: 'Consultório Dra. Lucy Murata - Odontologia Biológica',
    address: 'Torre II - Praça Maastricht, 200 - Sl 103 - Jardim Sao Jose, Bragança Paulista - SP, 12917-021',
    phone: '(11) 91031-5626',
    email: 'lucimurata@gmail.com',
    website: 'www.dralucymurata.com.br',
    slogan: 'Odontologia Biológica, Cirurgia Zircônia & Saúde Integrativa',
    logo_url: LUCY_LOGO_DATA_URL,
    prescription_footer: 'Receituário odontológico & integrativo emitido em conformidade com as normas do CFO/CRO. Válido em território nacional.',
    whatsapp_message_template: 'Olá {paciente}, segue a sua receita / orientação odontológica emitida pela Dra. Lucy Murata.',
    evolution_url: 'https://api.makprojetosmake.com.br',
    evolution_instance: 'luci',
    evolution_apikey: 'b2efa885a71ee2edf72b597df1a0ce9'
  },
  dr_carlos: {
    id: 'dr_carlos',
    professional_name: 'Dr. Carlos Morato',
    council_badge: 'CRM/SP 145.892',
    specialty_label: 'Neurologia & Medicina Integrativa',
    name: 'Clínica Dr. Carlos Morato - Neurologia & Integrativa',
    address: 'Av. Paulista, 1000 - Conjunto 1401 - Bela Vista - São Paulo/SP',
    phone: '(11) 99876-5432',
    email: 'carvalhomorato@gmail.com',
    website: 'www.drcarlosmorato.com.br',
    slogan: 'Neurologia Clínica e Medicina Integrativa',
    prescription_footer: 'Receituário médico digital válido em território nacional nos termos da Lei 14.063/2020 e Portaria SVS/MS 344/98.',
    whatsapp_message_template: 'Olá {paciente}, segue o seu receituário médico / pedido emitido pelo Dr. Carlos Morato em sua consulta.',
    evolution_url: 'https://api.makprojetosmake.com.br',
    evolution_instance: 'drcarlos',
    evolution_apikey: 'E54C7FA2A036-4959-A843-5C258EA783BA'
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
    prescription_footer: 'Documento clínico emitido via Ambulatório IA. Válido em território nacional.',
    whatsapp_message_template: 'Olá {paciente}, segue seu documento clínico emitido pelo Ambulatório IA.',
    evolution_url: 'https://api.makprojetosmake.com.br',
    evolution_instance: 'ambulatorio',
    evolution_apikey: 'BFA493146682-4CA6-B8CB-40E2D785AA23'
  }
};

export function detectRecordSpecialtyAndDoctor(record: any, allDoctorProfiles?: any[]): {
  mode: 'biological_dentistry' | 'neurological' | 'integrative' | 'standard';
  doctorId: 'dra_lucy' | 'dr_carlos' | 'marco_admin' | string;
  doctorName: string;
  specialtyLabel: string;
  councilBadge: string;
  isDental: boolean;
  isNeuro: boolean;
  isIntegrative: boolean;
} {
  if (!record) {
    return {
      mode: 'neurological',
      doctorId: 'dr_carlos',
      doctorName: 'Dr. Carlos Morato',
      specialtyLabel: 'Neurologia & Medicina Integrativa',
      councilBadge: 'CRM/SP 145.892',
      isDental: false,
      isNeuro: true,
      isIntegrative: false
    };
  }

  const spec = (record.especialidade || '').toLowerCase();
  const prof = (record.profissional_responsavel || '').toLowerCase();
  const medicoId = (record.medico_id || '').toLowerCase();
  const dados = record.dados_especialidade || {};

  // Detecção de Odontologia Biológica (Dra. Lucy Murata)
  const isDental = Boolean(
    spec.includes('odonto') ||
    spec.includes('dent') ||
    spec.includes('dente') ||
    spec.includes('biol') ||
    medicoId === 'dra_lucy' ||
    medicoId.includes('lucy') ||
    medicoId.includes('luci') ||
    prof.includes('lucy') ||
    prof.includes('luci') ||
    prof.includes('murata') ||
    prof.includes('morata') ||
    dados.odontograma ||
    dados.amalgama_ativo !== undefined ||
    dados.implante_zirconia_ativo !== undefined ||
    dados.focos_cavitacao_ativo !== undefined ||
    dados.terapia_neural_ativo !== undefined
  );

  if (isDental) {
    return {
      mode: 'biological_dentistry',
      doctorId: 'dra_lucy',
      doctorName: 'Dra. Lucy Murata',
      specialtyLabel: 'Odontologia Biológica & Saúde Integrativa',
      councilBadge: 'CRO-SP 69246',
      isDental: true,
      isNeuro: false,
      isIntegrative: false
    };
  }

  // Detecção de Neurologia (Dr. Carlos Morato)
  const isNeuro = Boolean(
    spec.includes('neuro') ||
    medicoId === 'dr_carlos' ||
    medicoId.includes('carlos') ||
    prof.includes('carlos') ||
    (record.exame_neurologico && Object.keys(record.exame_neurologico).length > 0) ||
    (dados.exame_neurologico && Object.keys(dados.exame_neurologico).length > 0)
  );

  if (isNeuro) {
    return {
      mode: 'neurological',
      doctorId: 'dr_carlos',
      doctorName: 'Dr. Carlos Morato',
      specialtyLabel: 'Neurologia',
      councilBadge: 'CRM/SP 145.892',
      isDental: false,
      isNeuro: true,
      isIntegrative: false
    };
  }

  // Detecção de Medicina Integrativa pura (Dr. Carlos Morato)
  const isIntegrative = Boolean(
    spec.includes('integrat') ||
    (record.checklist_integrativo && Object.keys(record.checklist_integrativo).length > 0)
  );

  if (isIntegrative) {
    return {
      mode: 'integrative',
      doctorId: 'dr_carlos',
      doctorName: 'Dr. Carlos Morato',
      specialtyLabel: 'Medicina Integrativa',
      councilBadge: 'CRM/SP 145.892',
      isDental: false,
      isNeuro: false,
      isIntegrative: true
    };
  }

  // Detecção de Marco Duarte (Admin / Gestor)
  if (
    prof.includes('marco') ||
    medicoId === 'marco_admin' ||
    medicoId === 'master-admin-marco'
  ) {
    return {
      mode: 'standard',
      doctorId: 'marco_admin',
      doctorName: 'Marco Duarte',
      specialtyLabel: 'Gestor & Administrador',
      councilBadge: 'Gestão Master',
      isDental: false,
      isNeuro: false,
      isIntegrative: false
    };
  }

  // Fallback padrão se houver perfil em allDoctorProfiles
  if (allDoctorProfiles && allDoctorProfiles.length > 0 && record.medico_id) {
    const matchedProfile = allDoctorProfiles.find(d => d.id === record.medico_id || d.full_name?.toLowerCase().includes(prof));
    if (matchedProfile) {
      return {
        mode: matchedProfile.default_mode || 'standard',
        doctorId: matchedProfile.id,
        doctorName: matchedProfile.full_name,
        specialtyLabel: matchedProfile.especialidade,
        councilBadge: matchedProfile.crm_cro || 'CRM/CRO',
        isDental: matchedProfile.default_mode === 'biological_dentistry',
        isNeuro: matchedProfile.default_mode === 'neurological',
        isIntegrative: matchedProfile.default_mode === 'integrative'
      };
    }
  }

  return {
    mode: 'standard',
    doctorId: 'dr_carlos',
    doctorName: 'Dr. Carlos Morato',
    specialtyLabel: record.especialidade || 'Clínica Geral',
    councilBadge: 'CRM/SP 145.892',
    isDental: false,
    isNeuro: false,
    isIntegrative: false
  };
}

export function resolveDoctorKey(userOrEmail?: any, name?: string): 'dra_lucy' | 'dr_carlos' | 'marco_admin' {
  const email = (typeof userOrEmail === 'string' ? userOrEmail : (userOrEmail?.email || '')).toLowerCase().trim();
  const fullName = (typeof userOrEmail === 'object' ? (userOrEmail?.full_name || name || '') : (name || '')).toLowerCase().trim();
  const id = (typeof userOrEmail === 'object' ? (userOrEmail?.id || '') : '').toLowerCase().trim();
  const specialty = (typeof userOrEmail === 'object' ? (userOrEmail?.especialidade || '') : '').toLowerCase().trim();

  // 1. Marco Duarte (Master Admin)
  if (
    email === 'marco.agduarte22@gmail.com' || 
    id === 'master-admin-marco' || 
    id === 'marco-duarte-admin' ||
    (fullName.includes('marco') && fullName.includes('duarte'))
  ) {
    return 'marco_admin';
  }

  // 2. Dr. Carlos Morato (Neurologia)
  if (
    email === 'carvalhomorato@gmail.com' ||
    email.includes('morato') ||
    email.includes('carlos') ||
    fullName.includes('carlos') ||
    fullName.includes('morato') ||
    id.includes('carlos') ||
    id.includes('morato') ||
    specialty.includes('neuro')
  ) {
    return 'dr_carlos';
  }

  // 3. Dra. Lucy / Luci Murata (Odontologia)
  if (
    email === 'lucimurata@gmail.com' ||
    email === 'dra.lucy.morata@gmail.com' ||
    email.includes('lucy') ||
    email.includes('luci') ||
    email.includes('murata') ||
    email.includes('morata') ||
    fullName.includes('lucy') ||
    fullName.includes('luci') ||
    fullName.includes('murata') ||
    fullName.includes('morata') ||
    id.includes('lucy') ||
    id.includes('luci') ||
    specialty.includes('odonto') ||
    specialty.includes('dent')
  ) {
    return 'dra_lucy';
  }

  return 'dr_carlos'; // Padrão seguro
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
      let apikey = (parsed.evolution_apikey || baseDefault.evolution_apikey || '').trim();
      
      // Se a chave no cache local for antiga ou diferente da chave mestra da Evolution
      const isOutdatedOrTruncated = 
        apikey.includes("40E2D785AA23") ||
        apikey.includes("4CA6-B8CB") ||
        apikey.includes("BFA493146682") ||
        apikey.includes("E6247913DB92") ||
        apikey.includes("0452D343F39E") ||
        apikey.includes("4CA4-915D") ||
        apikey.length < 20 ||
        apikey !== "b2efa885a71ee2edf72b597df1a0ce9";

      if (isOutdatedOrTruncated) {
        apikey = "b2efa885a71ee2edf72b597df1a0ce9";
        try {
          localStorage.setItem(`clinic_info_${key}`, JSON.stringify({
            ...parsed,
            evolution_apikey: apikey
          }));
        } catch (_) {}
      }

      return {
        ...baseDefault,
        ...parsed,
        evolution_url: parsed.evolution_url || baseDefault.evolution_url,
        evolution_instance: parsed.evolution_instance || baseDefault.evolution_instance,
        evolution_apikey: apikey
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
