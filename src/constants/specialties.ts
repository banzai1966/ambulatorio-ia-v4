export type StudioSpecialtyId = 'biological_dentistry' | 'nutrology' | 'dermatology';

export interface SpecialtyConfig {
  id: StudioSpecialtyId;
  title: string;
  shortLabel: string;
  tagline: string;
  accentHex: string;
}

export const STUDIO_SPECIALTIES: SpecialtyConfig[] = [
  {
    id: 'biological_dentistry',
    title: 'Odontologia Biológica & Visual IA',
    shortLabel: 'Odontologia IA',
    tagline: 'Scanner Radiológico Modo TV · Implante 360° · Odontograma 3D & Protocolo SMART',
    accentHex: '#0284c7'
  },
  {
    id: 'nutrology',
    title: 'Nutrologia & Medicina Metabólica IA',
    shortLabel: 'Nutrologia IA',
    tagline: 'Leitor Visual de Exames · Faixas Ótimas Funcionais · Bioimpedância & Radar Metabólico',
    accentHex: '#059669'
  },
  {
    id: 'dermatology',
    title: 'Dermatologia & Tricologia Visual IA',
    shortLabel: 'Dermatologia IA',
    tagline: 'Mapeamento Facial/Capilar em Tela · Fitzpatrick & Glogau · Protocolo In & Out',
    accentHex: '#e11d48'
  }
];
