export interface WhiteLabelClinicBrand {
  clinicName: string;
  professionalName: string;
  councilBadge: string;
  specialtySubtitle: string;
  phone: string;
  address: string;
  cityFooter: string;
}

export const DEFAULT_WHITE_LABEL_BRAND: WhiteLabelClinicBrand = {
  clinicName: 'Odonto Studio Visual IA',
  professionalName: 'Dr(a). Cirurgião-Dentista',
  councilBadge: 'CRO',
  specialtySubtitle: 'Odontologia Biológica & Diagnóstico Visual IA',
  phone: '',
  address: '',
  cityFooter: 'Documento odontológico emitido digitalmente para fins de orientação diagnóstica e terapêutica.'
};

const BRAND_STORAGE_KEY = 'studio_clinico_whitelabel_brand_v1';

export function loadWhiteLabelBrand(): WhiteLabelClinicBrand {
  if (typeof window === 'undefined') return DEFAULT_WHITE_LABEL_BRAND;
  try {
    const raw = localStorage.getItem(BRAND_STORAGE_KEY);
    if (!raw) return DEFAULT_WHITE_LABEL_BRAND;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_WHITE_LABEL_BRAND, ...parsed };
  } catch {
    return DEFAULT_WHITE_LABEL_BRAND;
  }
}

export function saveWhiteLabelBrand(brand: WhiteLabelClinicBrand): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
  } catch (err) {
    console.warn('Erro ao salvar marca da clínica:', err);
  }
}

export function calculatePreciseAge(dobString?: string): number | null {
  if (!dobString) return null;
  const trimmed = dobString.trim();
  let year: number;
  let month: number;
  let day: number;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [y, m, d] = trimmed.slice(0, 10).split('-').map(Number);
    year = y;
    month = m;
    day = d;
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    year = y;
    month = m;
    day = d;
  } else {
    return null;
  }

  if (!year || !month || !day) return null;
  const now = new Date();
  let age = now.getFullYear() - year;
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  return age >= 0 && age <= 130 ? age : null;
}
