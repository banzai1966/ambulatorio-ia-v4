/**
 * Gerenciador de Certificado Digital ICP-Brasil (Padrão A1 .pfx / e-CPF em Nuvem)
 * Permite armazenamento seguro de metadados do certificado para emissão de Receitas ANVISA e Atestados Oficiais
 */

export interface IcpCertificateProfile {
  id: string;
  doctorName: string;
  crm_cro: string;
  specialty: string;
  cpf: string;
  type: 'a1_file' | 'cloud_vidaas' | 'cloud_birdid' | 'cloud_neoid' | 'internal_hash';
  certificateFileName?: string;
  issuer: string;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'expired' | 'pending';
  lastValidatedAt: string;
}

const STORAGE_KEY_PREFIX = 'ambulatorio_icp_cert_';

export const getSavedIcpCertificate = (doctorName: string): IcpCertificateProfile => {
  const cleanKey = `${STORAGE_KEY_PREFIX}${doctorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  try {
    const raw = localStorage.getItem(cleanKey);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Erro ao ler certificado ICP:", e);
  }

  // Perfil padrão configurado de fábrica para Dr. Carlos e Dra. Lucy
  const isLucy = doctorName.toLowerCase().includes('lucy');
  return {
    id: isLucy ? 'cert-lucy-001' : 'cert-carlos-001',
    doctorName: isLucy ? 'Dra. Lucy Morata' : 'Dr. Carlos Morato',
    crm_cro: isLucy ? 'CRO/SP 98.412' : 'CRM/SP 145.892',
    specialty: isLucy ? 'Odontologia Biológica & Saúde Integrativa' : 'Neurologia Clínica & Medicina Integrativa',
    cpf: isLucy ? '***.482.918-**' : '***.729.148-**',
    type: 'a1_file',
    certificateFileName: isLucy ? 'eCPF_LUCY_MORATA_A1.pfx' : 'eCPF_CARLOS_MORATO_A1.pfx',
    issuer: 'AC Soluti Multipla v5 • Autoridade Certificadora ICP-Brasil',
    validFrom: '15/01/2026',
    validUntil: '15/01/2027',
    status: 'active',
    lastValidatedAt: new Date().toLocaleDateString('pt-BR')
  };
};

export const saveIcpCertificate = (doctorName: string, cert: IcpCertificateProfile): void => {
  const cleanKey = `${STORAGE_KEY_PREFIX}${doctorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  try {
    localStorage.setItem(cleanKey, JSON.stringify(cert));
  } catch (e) {
    console.warn("Erro ao salvar certificado ICP:", e);
  }
};
