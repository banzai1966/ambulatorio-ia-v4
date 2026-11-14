export type StudioSpecialtyId = 'biological_dentistry';

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
  }
];
