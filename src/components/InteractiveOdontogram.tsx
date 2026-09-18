import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Award, 
  CircleDot, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Plus, 
  Layers, 
  Cpu, 
  FileText, 
  Info,
  ChevronRight,
  Eye,
  Check,
  RotateCcw,
  Trash2,
  Scan,
  Grid,
  Zap,
  Box
} from 'lucide-react';
import { cn } from '../lib/utils';
import Dental3DViewer from './Dental3DViewer';

export type ToothStatus = 
  | 'healthy' 
  | 'amalgam' 
  | 'zirconia_implant' 
  | 'titanium_implant' 
  | 'endodontic' 
  | 'cavitation_nico' 
  | 'missing' 
  | 'caries' 
  | 'ceramic_crown';

export interface ToothRecord {
  id: number; // 11 to 48
  status: ToothStatus;
  notes?: string;
  cbctFindings?: string;
  biologicalPlan?: string;
  neuralTherapy?: boolean;
  galvanismo_mv?: number; // Microvoltagem galvânica em mV (ex: +250, -110)
  galvanismo_polaridade?: '+' | '-';
  faces?: {
    mesial?: boolean;
    distal?: boolean;
    vestibular?: boolean;
    lingual?: boolean;
    oclusal?: boolean;
  };
}

export interface OdontogramData {
  teeth?: Record<number, ToothRecord>;
  generalNotes?: string;
  cbctTomographyCorrelation?: string;
}

// FDI Dental Notation definition with Systemic Organ-Meridian Correlation
export interface ToothMeta {
  number: number;
  name: string;
  arch: 'superior' | 'inferior';
  quadrant: 1 | 2 | 3 | 4;
  type: 'incisor' | 'canine' | 'premolar' | 'molar';
  rootsCount: number;
  organ: string;
  meridian: string;
  vertebrae: string;
  emotion: string;
  tissue: string;
}

export const TOOTH_METADATA: Record<number, ToothMeta> = {
  // Quadrante 1 (Superior Direito)
  18: { number: 18, name: '3º Molar Superior Direito (Siso)', arch: 'superior', quadrant: 1, type: 'molar', rootsCount: 3, organ: 'Coração / Intestino Delgado', meridian: 'Coração', vertebrae: 'C7, T1, T5', emotion: 'Ansiedade / Alegria excessiva', tissue: 'Sistema Nervoso Central, Ombro' },
  17: { number: 17, name: '2º Molar Superior Direito', arch: 'superior', quadrant: 1, type: 'molar', rootsCount: 3, organ: 'Estômago / Baço-Pâncreas', meridian: 'Estômago', vertebrae: 'T11, T12, L1', emotion: 'Preocupação / Ruminação', tissue: 'Seio Maxilar, Joelho anterior' },
  16: { number: 16, name: '1º Molar Superior Direito', arch: 'superior', quadrant: 1, type: 'molar', rootsCount: 3, organ: 'Estômago / Baço-Pâncreas', meridian: 'Estômago', vertebrae: 'T11, T12, L1', emotion: 'Preocupação / Digestão', tissue: 'Glândula Mamária, ATM' },
  15: { number: 15, name: '2º Pré-Molar Superior Direito', arch: 'superior', quadrant: 1, type: 'premolar', rootsCount: 1, organ: 'Pulmão / Intestino Grosso', meridian: 'Pulmão', vertebrae: 'C4, C5, T3', emotion: 'Tristeza / Luto', tissue: 'Brônquios, Pele, Ombro' },
  14: { number: 14, name: '1º Pré-Molar Superior Direito', arch: 'superior', quadrant: 1, type: 'premolar', rootsCount: 2, organ: 'Pulmão / Intestino Grosso', meridian: 'Intestino Grosso', vertebrae: 'C4, C5, T4', emotion: 'Apego / Eliminação', tissue: 'Mucosa respiratória, Cólon' },
  13: { number: 13, name: 'Canino Superior Direito', arch: 'superior', quadrant: 1, type: 'canine', rootsCount: 1, organ: 'Fígado / Vesícula Biliar', meridian: 'Fígado', vertebrae: 'T8, T9, T10', emotion: 'Raiva / Decisão / Clareza', tissue: 'Olhos, Tendões, Quadril' },
  12: { number: 12, name: 'Incisivo Lateral Superior Direito', arch: 'superior', quadrant: 1, type: 'incisor', rootsCount: 1, organ: 'Rim / Bexiga / Urogenital', meridian: 'Rim', vertebrae: 'L2, L3, S1-S2', emotion: 'Medo / Vitalidade', tissue: 'Gônadas, Ouvidos, Joelho posterior' },
  11: { number: 11, name: 'Incisivo Central Superior Direito', arch: 'superior', quadrant: 1, type: 'incisor', rootsCount: 1, organ: 'Rim / Bexiga / Urogenital', meridian: 'Bexiga', vertebrae: 'L2, L3, Cóccix', emotion: 'Segurança / Vontade', tissue: 'Coluna Lombar, Sistema Urogenital' },

  // Quadrante 2 (Superior Esquerdo)
  21: { number: 21, name: 'Incisivo Central Superior Esquerdo', arch: 'superior', quadrant: 2, type: 'incisor', rootsCount: 1, organ: 'Rim / Bexiga / Urogenital', meridian: 'Bexiga', vertebrae: 'L2, L3, Cóccix', emotion: 'Segurança / Vontade', tissue: 'Coluna Lombar, Sistema Urogenital' },
  22: { number: 22, name: 'Incisivo Lateral Superior Esquerdo', arch: 'superior', quadrant: 2, type: 'incisor', rootsCount: 1, organ: 'Rim / Bexiga / Urogenital', meridian: 'Rim', vertebrae: 'L2, L3, S1-S2', emotion: 'Medo / Vitalidade', tissue: 'Gônadas, Ouvidos, Joelho posterior' },
  23: { number: 23, name: 'Canino Superior Esquerdo', arch: 'superior', quadrant: 2, type: 'canine', rootsCount: 1, organ: 'Fígado / Vesícula Biliar', meridian: 'Vesícula Biliar', vertebrae: 'T8, T9, T10', emotion: 'Coragem / Planejamento', tissue: 'Olhos, Tendões, Quadril' },
  24: { number: 24, name: '1º Pré-Molar Superior Esquerdo', arch: 'superior', quadrant: 2, type: 'premolar', rootsCount: 2, organ: 'Pulmão / Intestino Grosso', meridian: 'Pulmão', vertebrae: 'C4, C5, T3', emotion: 'Tristeza / Aceitação', tissue: 'Brônquios, Pele, Ombro' },
  25: { number: 25, name: '2º Pré-Molar Superior Esquerdo', arch: 'superior', quadrant: 2, type: 'premolar', rootsCount: 1, organ: 'Pulmão / Intestino Grosso', meridian: 'Intestino Grosso', vertebrae: 'C4, C5, T4', emotion: 'Renovação / Imunidade', tissue: 'Mucosa respiratória, Cólon' },
  26: { number: 26, name: '1º Molar Superior Esquerdo', arch: 'superior', quadrant: 2, type: 'molar', rootsCount: 3, organ: 'Estômago / Baço-Pâncreas', meridian: 'Baço-Pâncreas', vertebrae: 'T11, T12, L1', emotion: 'Preocupação / Cuidado', tissue: 'Glândula Mamária, ATM' },
  27: { number: 27, name: '2º Molar Superior Esquerdo', arch: 'superior', quadrant: 2, type: 'molar', rootsCount: 3, organ: 'Estômago / Baço-Pâncreas', meridian: 'Estômago', vertebrae: 'T11, T12, L1', emotion: 'Nutrição celular / Digestão', tissue: 'Seio Maxilar, Joelho anterior' },
  28: { number: 28, name: '3º Molar Superior Esquerdo (Siso)', arch: 'superior', quadrant: 2, type: 'molar', rootsCount: 3, organ: 'Coração / Intestino Delgado', meridian: 'Intestino Delgado', vertebrae: 'C7, T1, T5', emotion: 'Clareza mental / Paz', tissue: 'Sistema Nervoso Central, Ombro' },

  // Quadrante 4 (Inferior Direito)
  48: { number: 48, name: '3º Molar Inferior Direito (Siso)', arch: 'inferior', quadrant: 4, type: 'molar', rootsCount: 2, organ: 'Coração / Intestino Delgado', meridian: 'Coração', vertebrae: 'C7, T1, T5', emotion: 'Ansiedade / Agitação', tissue: 'Nervo Trigêmeo, Ouvido' },
  47: { number: 47, name: '2º Molar Inferior Direito', arch: 'inferior', quadrant: 4, type: 'molar', rootsCount: 2, organ: 'Pulmão / Intestino Grosso', meridian: 'Intestino Grosso', vertebrae: 'C4, C5, T3', emotion: 'Eliminação / Desapego', tissue: 'Articulação do Joelho, Pele' },
  46: { number: 46, name: '1º Molar Inferior Direito', arch: 'inferior', quadrant: 4, type: 'molar', rootsCount: 2, organ: 'Pulmão / Intestino Grosso', meridian: 'Pulmão', vertebrae: 'C4, C5, T3', emotion: 'Vitalidade Respiratória', tissue: 'Brônquios, Cólon Ascendente' },
  45: { number: 45, name: '2º Pré-Molar Inferior Direito', arch: 'inferior', quadrant: 4, type: 'premolar', rootsCount: 1, organ: 'Estômago / Baço-Pâncreas', meridian: 'Estômago', vertebrae: 'T11, T12, L1', emotion: 'Digestão emocional', tissue: 'Glândula Tireoide, Seios' },
  44: { number: 44, name: '1º Pré-Molar Inferior Direito', arch: 'inferior', quadrant: 4, type: 'premolar', rootsCount: 1, organ: 'Estômago / Baço-Pâncreas', meridian: 'Baço-Pâncreas', vertebrae: 'T11, T12, L1', emotion: 'Equilíbrio / Foco', tissue: 'Sistema Linfático, Mastigação' },
  43: { number: 43, name: 'Canino Inferior Direito', arch: 'inferior', quadrant: 4, type: 'canine', rootsCount: 1, organ: 'Fígado / Vesícula Biliar', meridian: 'Fígado', vertebrae: 'T8, T9, T10', emotion: 'Determinação / Visão', tissue: 'Articulação do Quadril, Olho D.' },
  42: { number: 42, name: 'Incisivo Lateral Inferior Direito', arch: 'inferior', quadrant: 4, type: 'incisor', rootsCount: 1, organ: 'Rim / Bexiga / Urogenital', meridian: 'Rim', vertebrae: 'L2, L3, S1', emotion: 'Autonomia / Coragem', tissue: 'Glândula Adrenal, Próstata/Útero' },
  41: { number: 41, name: 'Incisivo Central Inferior Direito', arch: 'inferior', quadrant: 4, type: 'incisor', rootsCount: 1, organ: 'Rim / Bexiga / Urogenital', meridian: 'Bexiga', vertebrae: 'L2, L3, Cóccix', emotion: 'Segurança Básica', tissue: 'Coluna Lombossacra' },

  // Quadrante 3 (Inferior Esquerdo)
  31: { number: 31, name: 'Incisivo Central Inferior Esquerdo', arch: 'inferior', quadrant: 3, type: 'incisor', rootsCount: 1, organ: 'Rim / Bexiga / Urogenital', meridian: 'Bexiga', vertebrae: 'L2, L3, Cóccix', emotion: 'Segurança Básica', tissue: 'Coluna Lombossacra' },
  32: { number: 32, name: 'Incisivo Lateral Inferior Esquerdo', arch: 'inferior', quadrant: 3, type: 'incisor', rootsCount: 1, organ: 'Rim / Bexiga / Urogenital', meridian: 'Rim', vertebrae: 'L2, L3, S1', emotion: 'Autonomia / Coragem', tissue: 'Glândula Adrenal, Próstata/Útero' },
  33: { number: 33, name: 'Canino Inferior Esquerdo', arch: 'inferior', quadrant: 3, type: 'canine', rootsCount: 1, organ: 'Fígado / Vesícula Biliar', meridian: 'Vesícula Biliar', vertebrae: 'T8, T9, T10', emotion: 'Decisão / Flexibilidade', tissue: 'Articulação do Quadril, Olho E.' },
  34: { number: 34, name: '1º Pré-Molar Inferior Esquerdo', arch: 'inferior', quadrant: 3, type: 'premolar', rootsCount: 1, organ: 'Estômago / Baço-Pâncreas', meridian: 'Baço-Pâncreas', vertebrae: 'T11, T12, L1', emotion: 'Equilíbrio / Imunidade', tissue: 'Sistema Linfático, Mastigação' },
  35: { number: 35, name: '2º Pré-Molar Inferior Esquerdo', arch: 'inferior', quadrant: 3, type: 'premolar', rootsCount: 1, organ: 'Estômago / Baço-Pâncreas', meridian: 'Estômago', vertebrae: 'T11, T12, L1', emotion: 'Digestão emocional', tissue: 'Glândula Tireoide, Seios' },
  36: { number: 36, name: '1º Molar Inferior Esquerdo', arch: 'inferior', quadrant: 3, type: 'molar', rootsCount: 2, organ: 'Pulmão / Intestino Grosso', meridian: 'Pulmão', vertebrae: 'C4, C5, T3', emotion: 'Vitalidade Respiratória', tissue: 'Brônquios, Cólon Descendente' },
  37: { number: 37, name: '2º Molar Inferior Esquerdo', arch: 'inferior', quadrant: 3, type: 'molar', rootsCount: 2, organ: 'Pulmão / Intestino Grosso', meridian: 'Intestino Grosso', vertebrae: 'C4, C5, T3', emotion: 'Eliminação / Desapego', tissue: 'Articulação do Joelho, Pele' },
  38: { number: 38, name: '3º Molar Inferior Esquerdo (Siso)', arch: 'inferior', quadrant: 3, type: 'molar', rootsCount: 2, organ: 'Coração / Intestino Delgado', meridian: 'Intestino Delgado', vertebrae: 'C7, T1, T5', emotion: 'Paz Interior / Sono', tissue: 'Nervo Trigêmeo, Ouvido' },
};

export const STATUS_CONFIG: Record<ToothStatus, { 
  label: string; 
  shortLabel: string; 
  badgeColor: string; 
  badgeBorder: string; 
  badgeText: string; 
  dotColor: string; 
  description: string;
}> = {
  healthy: {
    label: 'Hígido / Saudável',
    shortLabel: 'Hígido',
    badgeColor: 'bg-slate-100',
    badgeBorder: 'border-slate-300',
    badgeText: 'text-slate-700',
    dotColor: 'bg-emerald-500',
    description: 'Elemento íntegro sem restaurações metálicas ou focos inflamatórios.'
  },
  amalgam: {
    label: 'Amálgama Metálico (Troca SMART)',
    shortLabel: 'Amálgama',
    badgeColor: 'bg-slate-800',
    badgeBorder: 'border-slate-950',
    badgeText: 'text-white',
    dotColor: 'bg-slate-800',
    description: 'Restauração com amálgama / mercúrio. Indicado protocolo seguro SMART (IAOMT).'
  },
  zirconia_implant: {
    label: 'Implante Zircônia (Metal-Free)',
    shortLabel: 'Zircônia',
    badgeColor: 'bg-sky-600',
    badgeBorder: 'border-sky-700',
    badgeText: 'text-white',
    dotColor: 'bg-sky-500',
    description: 'Implante cerâmico puro 100% biocompatível livre de corrosão e galvanismo.'
  },
  titanium_implant: {
    label: 'Implante Titânio',
    shortLabel: 'Titânio',
    badgeColor: 'bg-zinc-700',
    badgeBorder: 'border-zinc-800',
    badgeText: 'text-white',
    dotColor: 'bg-zinc-600',
    description: 'Implante metálico de titânio (avaliar galvanismo, alergia e peri-implantite).'
  },
  endodontic: {
    label: 'Canal Tratado (Endodontia)',
    shortLabel: 'Canal/Endo',
    badgeColor: 'bg-orange-600',
    badgeBorder: 'border-orange-700',
    badgeText: 'text-white',
    dotColor: 'bg-orange-500',
    description: 'Dente desvitalizado com obturação em guta-percha. Avaliar infecção anaeróbia e toxinas.'
  },
  cavitation_nico: {
    label: 'Cavitação Óssea / NICO / FDOK',
    shortLabel: 'NICO/Foco',
    badgeColor: 'bg-rose-600',
    badgeBorder: 'border-rose-700',
    badgeText: 'text-white',
    dotColor: 'bg-rose-500',
    description: 'Osteonecrose isquêmica no osso alveolar (foco silencioso interferente / RANTES).'
  },
  missing: {
    label: 'Ausente / Extraído',
    shortLabel: 'Ausente',
    badgeColor: 'bg-slate-200',
    badgeBorder: 'border-dashed border-slate-400',
    badgeText: 'text-slate-500',
    dotColor: 'bg-slate-400',
    description: 'Dente ausente ou previamente extraído.'
  },
  caries: {
    label: 'Cárie / Restauração Resina',
    shortLabel: 'Cárie/Resina',
    badgeColor: 'bg-amber-500',
    badgeBorder: 'border-amber-600',
    badgeText: 'text-white',
    dotColor: 'bg-amber-500',
    description: 'Lesão cariosa ativa ou restauração estética em resina composta.'
  },
  ceramic_crown: {
    label: 'Coroa Cerâmica Metal-Free',
    shortLabel: 'Coroa Cerâmica',
    badgeColor: 'bg-teal-600',
    badgeBorder: 'border-teal-700',
    badgeText: 'text-white',
    dotColor: 'bg-teal-500',
    description: 'Prótese fixa em cerâmica pura/dissilicato ou zircônia sem metal.'
  }
};

export function normalizeToothStatus(rawStatus?: string): ToothStatus {
  if (!rawStatus) return 'healthy';
  const s = String(rawStatus).toLowerCase().trim();
  if (s === 'amalgam' || s === 'amalgama' || s === 'amalgam_restoration') return 'amalgam';
  if (s === 'zirconia_implant' || s === 'zirconia' || s === 'implante_zirconia') return 'zirconia_implant';
  if (s === 'titanium_implant' || s === 'titanio' || s === 'implante_titanio' || s === 'implant') return 'titanium_implant';
  if (s === 'endodontic' || s === 'canal' || s === 'endo' || s === 'tratamento_canal') return 'endodontic';
  if (s === 'cavitation_nico' || s === 'nico_focus' || s === 'nico' || s === 'fdok' || s === 'osteonecrose' || s === 'cavitacao') return 'cavitation_nico';
  if (s === 'missing' || s === 'ausente' || s === 'extraido' || s === 'extracao') return 'missing';
  if (s === 'caries' || s === 'carie' || s === 'resina' || s === 'restauracao') return 'caries';
  if (s === 'ceramic_crown' || s === 'coroa' || s === 'coroa_ceramica' || s === 'protese') return 'ceramic_crown';
  if (STATUS_CONFIG[s as ToothStatus]) return s as ToothStatus;
  return 'healthy';
}

export function getStatusConfig(status?: string) {
  const norm = normalizeToothStatus(status);
  return STATUS_CONFIG[norm] || STATUS_CONFIG.healthy;
}

const UPPER_RIGHT_TEETH = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT_TEETH = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT_TEETH = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT_TEETH = [31, 32, 33, 34, 35, 36, 37, 38];

// ==========================================
// REALISTIC ANATOMICAL TOOTH SVG COMPONENT
// ==========================================
interface RealisticToothProps {
  meta: ToothMeta;
  record: ToothRecord;
  isSelected: boolean;
}

function RealisticAnatomicalToothSVG({ meta, record, isSelected }: RealisticToothProps) {
  const isUpper = meta.arch === 'superior';
  const type = meta.type;
  const status = record.status;
  const isMissing = status === 'missing';
  const isEndo = status === 'endodontic';
  const isAmalgam = status === 'amalgam';
  const isZirconia = status === 'zirconia_implant';
  const isTitanium = status === 'titanium_implant';
  const isNico = status === 'cavitation_nico';
  const isCaries = status === 'caries';
  const isCrown = status === 'ceramic_crown';

  // Base colors
  const rootColor = '#f3ede2';
  const rootBorder = '#b8aa93';
  const crownColor = isCrown ? '#fdf8ea' : isZirconia ? '#ffffff' : '#fcfbf7';
  const crownBorder = isCrown ? '#0d9488' : isZirconia ? '#0284c7' : '#94a3b8';

  return (
    <svg 
      viewBox="0 0 50 82" 
      className={cn(
        "w-full h-full transition-transform duration-200 select-none",
        isSelected ? "scale-105" : "group-hover:scale-105",
        isMissing ? "opacity-30" : "opacity-100"
      )}
    >
      <defs>
        {/* Enamel gradient */}
        <linearGradient id={`enamelGrad-${meta.number}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f8f6f0" />
          <stop offset="100%" stopColor="#ece4d4" />
        </linearGradient>

        {/* Root Dentin Gradient */}
        <linearGradient id={`rootGrad-${meta.number}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8dfce" />
          <stop offset="50%" stopColor="#f7f3eb" />
          <stop offset="100%" stopColor="#dfd5c2" />
        </linearGradient>

        {/* Amalgam Metallic Gradient */}
        <linearGradient id={`amalgamGrad-${meta.number}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Ceramic Crown Gradient */}
        <linearGradient id={`crownGrad-${meta.number}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ccfbf1" />
          <stop offset="50%" stopColor="#99f6e4" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>

        {/* Zirconia Screw Gradient */}
        <linearGradient id={`zirconiaScrew-${meta.number}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>

        {/* Titanium Screw Gradient */}
        <linearGradient id={`titaniumScrew-${meta.number}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Endodontic Gutta Percha Glow */}
        <filter id="guttaGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ======================================================== */}
      {/* 1. CAVITATION / NICO / FDOK APICAL RADIOLUCENCY HALO      */}
      {/* ======================================================== */}
      {isNico && (
        <g className="animate-pulse">
          {isUpper ? (
            <circle cx="25" cy="10" r="9" fill="#f43f5e" fillOpacity="0.45" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="2,2" />
          ) : (
            <circle cx="25" cy="72" r="9" fill="#f43f5e" fillOpacity="0.45" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="2,2" />
          )}
        </g>
      )}

      {/* ======================================================== */}
      {/* 2. ROOT ANATOMY (UPPER ARCH: Pointing UP, LOWER: DOWN)   */}
      {/* ======================================================== */}
      {!isZirconia && !isTitanium ? (
        <g>
          {isUpper ? (
            // MAXILLARY (UPPER) ROOTS
            type === 'molar' ? (
              // Upper Molar: 3 roots (Mesiobuccal, Distobuccal, Palatal)
              <g>
                {/* Palatal (Central/Longer) */}
                <path d="M22 45 L22 10 Q25 6 28 10 L28 45 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
                {/* Mesial & Distal Roots */}
                <path d="M12 45 C12 30 14 16 16 12 C18 12 20 25 21 45 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
                <path d="M29 45 C30 25 32 12 34 12 C36 16 38 30 38 45 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
              </g>
            ) : type === 'premolar' ? (
              // Upper Premolar: 2 tapered roots
              <g>
                <path d="M16 45 C16 28 18 15 20 12 C22 12 23 25 24 45 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
                <path d="M26 45 C27 25 28 12 30 12 C32 15 34 28 34 45 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
              </g>
            ) : type === 'canine' ? (
              // Upper Canine: 1 long robust root
              <path d="M18 45 C18 25 22 8 25 6 C28 8 32 25 32 45 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
            ) : (
              // Upper Incisor: 1 single tapered root
              <path d="M17 45 C18 28 22 10 25 8 C28 10 32 28 33 45 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
            )
          ) : (
            // MANDIBULAR (LOWER) ROOTS
            type === 'molar' ? (
              // Lower Molar: 2 strong curved roots (Mesial & Distal)
              <g>
                <path d="M13 37 C13 52 15 68 18 72 C21 72 23 58 23 37 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
                <path d="M27 37 C27 58 29 72 32 72 C35 68 37 52 37 37 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
              </g>
            ) : type === 'premolar' ? (
              // Lower Premolar: 1 single tapered root
              <path d="M18 37 C18 55 22 72 25 74 C28 72 32 55 32 37 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
            ) : type === 'canine' ? (
              // Lower Canine: 1 long root
              <path d="M18 37 C18 58 22 74 25 76 C28 74 32 58 32 37 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
            ) : (
              // Lower Incisor: 1 slender root
              <path d="M19 37 C19 55 22 70 25 72 C28 70 31 55 31 37 Z" fill={`url(#rootGrad-${meta.number})`} stroke={rootBorder} strokeWidth="1" />
            )
          )}
        </g>
      ) : (
        // ========================================================
        // IMPLANT FIXTURE (SCREW THREADS IN BONE)
        // ========================================================
        <g>
          {isUpper ? (
            <g>
              {/* Upper Implant Screw */}
              <rect x="19" y="10" width="12" height="35" rx="3" fill={isZirconia ? `url(#zirconiaScrew-${meta.number})` : `url(#titaniumScrew-${meta.number})`} stroke={isZirconia ? '#38bdf8' : '#0f172a'} strokeWidth="1" />
              {/* Screw Threads */}
              <line x1="17" y1="16" x2="33" y2="16" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="17" y1="22" x2="33" y2="22" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="17" y1="28" x2="33" y2="28" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="17" y1="34" x2="33" y2="34" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="40" x2="32" y2="40" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              {/* Lower Implant Screw */}
              <rect x="19" y="37" width="12" height="35" rx="3" fill={isZirconia ? `url(#zirconiaScrew-${meta.number})` : `url(#titaniumScrew-${meta.number})`} stroke={isZirconia ? '#38bdf8' : '#0f172a'} strokeWidth="1" />
              {/* Screw Threads */}
              <line x1="17" y1="42" x2="33" y2="42" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="17" y1="48" x2="33" y2="48" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="17" y1="54" x2="33" y2="54" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="17" y1="60" x2="33" y2="60" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="66" x2="32" y2="66" stroke={isZirconia ? '#7dd3fc' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}

      {/* ======================================================== */}
      {/* 3. ROOT CANAL FILLING (ENDODONTIC GUTTA-PERCHA LINES)    */}
      {/* ======================================================== */}
      {isEndo && (
        <g stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" filter="url(#guttaGlow)">
          {isUpper ? (
            type === 'molar' ? (
              <>
                <path d="M25 46 L25 12" />
                <path d="M17 46 Q16 30 16 14" />
                <path d="M33 46 Q34 30 34 14" />
              </>
            ) : type === 'premolar' ? (
              <>
                <path d="M20 46 Q20 30 20 14" />
                <path d="M30 46 Q30 30 30 14" />
              </>
            ) : (
              <path d="M25 46 L25 10" />
            )
          ) : (
            type === 'molar' ? (
              <>
                <path d="M18 36 Q18 55 18 70" />
                <path d="M32 36 Q32 55 32 70" />
              </>
            ) : (
              <path d="M25 36 L25 72" />
            )
          )}
          {/* Pulp chamber central seal */}
          <circle cx="25" cy={isUpper ? "46" : "36"} r="2.5" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
        </g>
      )}

      {/* ======================================================== */}
      {/* 4. CROWN ANATOMY (UPPER: points down, LOWER: points up)  */}
      {/* ======================================================== */}
      <g>
        {isUpper ? (
          // Maxillary Crown (y: 43 to 78)
          type === 'molar' ? (
            <path 
              d="M10 45 C9 55 10 70 14 74 C18 78 22 75 25 78 C28 75 32 78 36 74 C40 70 41 55 40 45 C35 44 15 44 10 45 Z" 
              fill={isCrown ? `url(#crownGrad-${meta.number})` : `url(#enamelGrad-${meta.number})`} 
              stroke={crownBorder} 
              strokeWidth="1.2" 
            />
          ) : type === 'premolar' ? (
            <path 
              d="M13 45 C12 55 13 69 18 74 C22 78 28 78 32 74 C37 69 38 55 37 45 C33 44 17 44 13 45 Z" 
              fill={isCrown ? `url(#crownGrad-${meta.number})` : `url(#enamelGrad-${meta.number})`} 
              stroke={crownBorder} 
              strokeWidth="1.2" 
            />
          ) : type === 'canine' ? (
            <path 
              d="M15 45 C14 55 16 68 25 78 C34 68 36 55 35 45 C30 44 20 44 15 45 Z" 
              fill={isCrown ? `url(#crownGrad-${meta.number})` : `url(#enamelGrad-${meta.number})`} 
              stroke={crownBorder} 
              strokeWidth="1.2" 
            />
          ) : (
            // Incisor (flat edge)
            <path 
              d="M14 45 C13 54 13 70 14 75 C20 76 30 76 36 75 C37 70 37 54 36 45 C30 44 20 44 14 45 Z" 
              fill={isCrown ? `url(#crownGrad-${meta.number})` : `url(#enamelGrad-${meta.number})`} 
              stroke={crownBorder} 
              strokeWidth="1.2" 
            />
          )
        ) : (
          // Mandibular Crown (y: 4 to 38)
          type === 'molar' ? (
            <path 
              d="M10 37 C9 27 10 12 14 8 C18 4 22 7 25 4 C28 7 32 4 36 8 C40 12 41 27 40 37 C35 38 15 38 10 37 Z" 
              fill={isCrown ? `url(#crownGrad-${meta.number})` : `url(#enamelGrad-${meta.number})`} 
              stroke={crownBorder} 
              strokeWidth="1.2" 
            />
          ) : type === 'premolar' ? (
            <path 
              d="M13 37 C12 27 13 13 18 8 C22 4 28 4 32 8 C37 13 38 27 37 37 C33 38 17 38 13 37 Z" 
              fill={isCrown ? `url(#crownGrad-${meta.number})` : `url(#enamelGrad-${meta.number})`} 
              stroke={crownBorder} 
              strokeWidth="1.2" 
            />
          ) : type === 'canine' ? (
            <path 
              d="M15 37 C14 27 16 14 25 4 C34 14 36 27 35 37 C30 38 20 38 15 37 Z" 
              fill={isCrown ? `url(#crownGrad-${meta.number})` : `url(#enamelGrad-${meta.number})`} 
              stroke={crownBorder} 
              strokeWidth="1.2" 
            />
          ) : (
            // Incisor (flat edge)
            <path 
              d="M15 37 C14 28 14 12 15 7 C20 6 30 6 35 7 C36 12 36 28 35 37 C30 38 20 38 15 37 Z" 
              fill={isCrown ? `url(#crownGrad-${meta.number})` : `url(#enamelGrad-${meta.number})`} 
              stroke={crownBorder} 
              strokeWidth="1.2" 
            />
          )
        )}
      </g>

      {/* ======================================================== */}
      {/* 5. RESTORATION OVERLAYS (AMALGAM / CARIES / RESIN)       */}
      {/* ======================================================== */}
      {isAmalgam && (
        <g>
          {isUpper ? (
            <path d="M19 56 C17 62 18 68 25 70 C32 68 33 62 31 56 C27 58 23 58 19 56 Z" fill={`url(#amalgamGrad-${meta.number})`} stroke="#020617" strokeWidth="1" />
          ) : (
            <path d="M19 26 C17 20 18 14 25 12 C32 14 33 20 31 26 C27 24 23 24 19 26 Z" fill={`url(#amalgamGrad-${meta.number})`} stroke="#020617" strokeWidth="1" />
          )}
        </g>
      )}

      {isCaries && (
        <g>
          {isUpper ? (
            <circle cx="25" cy="62" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
          ) : (
            <circle cx="25" cy="20" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
          )}
        </g>
      )}

      {/* ======================================================== */}
      {/* 6. MISSING TOOTH SURGICAL EXTRACTION CROSS              */}
      {/* ======================================================== */}
      {isMissing && (
        <g stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round">
          <line x1="8" y1="8" x2="42" y2="74" />
          <line x1="42" y1="8" x2="8" y2="74" />
        </g>
      )}

      {/* ======================================================== */}
      {/* 7. NEURAL THERAPY ENERGY BADGE                           */}
      {/* ======================================================== */}
      {record.neuralTherapy && (
        <g>
          <circle cx="39" cy={isUpper ? "15" : "67"} r="6" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
          <path d={isUpper ? "M39 12 L40 15 L43 15 L40.5 17 L41.5 20 L39 18 L36.5 20 L37.5 17 L35 15 L38 15 Z" : "M39 64 L40 67 L43 67 L40.5 69 L41.5 72 L39 70 L36.5 72 L37.5 69 L35 67 L38 67 Z"} fill="#ffffff" />
        </g>
      )}
    </svg>
  );
}

// ==========================================
// 5-FACET OCCLUSAL CIRCLE COMPONENT
// ==========================================
function Occlusal5FacesCircle({ status }: { status: ToothStatus }) {
  const isAmalgam = status === 'amalgam';
  const isEndo = status === 'endodontic';
  const isCaries = status === 'caries';
  const isCrown = status === 'ceramic_crown';
  const isMissing = status === 'missing';

  const centerColor = isAmalgam ? '#1e293b' : isEndo ? '#ea580c' : isCaries ? '#f59e0b' : isCrown ? '#0d9488' : '#ffffff';

  return (
    <svg viewBox="0 0 30 30" className={cn("w-5 h-5 transition-transform", isMissing && "opacity-25")}>
      {/* Outer Circle */}
      <circle cx="15" cy="15" r="13" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
      {/* 4 Diagonal dividing lines */}
      <line x1="6" y1="6" x2="11" y2="11" stroke="#94a3b8" strokeWidth="1" />
      <line x1="24" y1="6" x2="19" y2="11" stroke="#94a3b8" strokeWidth="1" />
      <line x1="6" y1="24" x2="11" y2="19" stroke="#94a3b8" strokeWidth="1" />
      <line x1="24" y1="24" x2="19" y2="19" stroke="#94a3b8" strokeWidth="1" />
      {/* Central Square (Oclusal) */}
      <rect x="11" y="11" width="8" height="8" fill={centerColor} stroke="#94a3b8" strokeWidth="1" />
      {isMissing && (
        <line x1="5" y1="5" x2="25" y2="25" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

interface Props {
  data?: OdontogramData;
  onChange: (data: OdontogramData) => void;
  readOnly?: boolean;
  compact?: boolean;
  onSelectToothCallback?: (tooth: ToothMeta, record?: ToothRecord) => void;
}

export default function InteractiveOdontogram({
  data = {},
  onChange,
  readOnly = false,
  compact = false,
  onSelectToothCallback
}: Props) {
  const [selectedToothNum, setSelectedToothNum] = useState<number | null>(16);
  const [filterStatus, setFilterStatus] = useState<ToothStatus | 'all'>('all');
  const [showPanoramicBanner, setShowPanoramicBanner] = useState<boolean>(true);
  const [show3DViewer, setShow3DViewer] = useState<boolean>(false);

  const teethRecords = data.teeth || {};

  const handleSelectTooth = (num: number) => {
    if (selectedToothNum === num) {
      setSelectedToothNum(null);
      return;
    }
    setSelectedToothNum(num);
    if (onSelectToothCallback) {
      onSelectToothCallback(TOOTH_METADATA[num], teethRecords[num]);
    }
  };

  const updateToothRecord = (num: number, patch: Partial<ToothRecord>) => {
    const current = teethRecords[num] || { id: num, status: 'healthy' };
    const updated = {
      ...teethRecords,
      [num]: { ...current, ...patch, id: num }
    };
    onChange({
      ...data,
      teeth: updated
    });
  };

  const clearToothRecord = (num: number) => {
    const updated = { ...teethRecords };
    delete updated[num];
    onChange({
      ...data,
      teeth: updated
    });
  };

  const currentToothMeta = selectedToothNum ? TOOTH_METADATA[selectedToothNum] : null;
  const currentToothRecord = selectedToothNum ? (teethRecords[selectedToothNum] || { id: selectedToothNum, status: 'healthy' }) : null;

  // Counters for statistics
  const counts = Object.values(teethRecords).reduce((acc, t) => {
    const s = normalizeToothStatus(t?.status);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<ToothStatus, number>);

  const totalFlagged = Object.values(teethRecords).filter(t => normalizeToothStatus(t?.status) !== 'healthy').length;

  const renderToothCard = (num: number) => {
    const meta = TOOTH_METADATA[num];
    const rawRec = teethRecords[num] || { id: num, status: 'healthy' };
    const normStatus = normalizeToothStatus(rawRec.status);
    const rec: ToothRecord = { ...rawRec, status: normStatus };
    const config = getStatusConfig(normStatus);
    const isSelected = selectedToothNum === num;

    return (
      <div
        key={num}
        onClick={() => handleSelectTooth(num)}
        title={`${meta?.number || num} - ${meta?.name || 'Dente'} | ${config.label}`}
        className={cn(
          "group relative flex flex-col items-center justify-between p-1 rounded-2xl border transition-all select-none cursor-pointer bg-white",
          isSelected 
            ? "ring-2 ring-emerald-600 ring-offset-2 scale-105 z-20 shadow-lg border-emerald-500 bg-emerald-50/20" 
            : "hover:border-emerald-400 hover:shadow-md border-slate-200",
          compact ? "w-11 md:w-13" : "w-12 md:w-15"
        )}
      >
        {/* Tooth number badge */}
        <div className={cn(
          "w-full text-center py-0.5 rounded-t-xl text-[11px] font-black leading-tight transition-colors relative",
          isSelected ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-800 group-hover:bg-emerald-100 group-hover:text-emerald-950"
        )}>
          {num}

          {/* Galvanism microvoltage badge */}
          {rec.galvanismo_mv !== undefined && rec.galvanismo_mv !== null && (
            <span 
              title={`Galvanismo: ${rec.galvanismo_mv > 0 ? `+${rec.galvanismo_mv}` : rec.galvanismo_mv} mV`}
              className={cn(
                "absolute -top-2 -right-1 px-1 py-0.2 rounded-md text-[7.5px] font-black font-mono shadow-xs border flex items-center gap-0.5 z-30",
                Math.abs(rec.galvanismo_mv) > 100 
                  ? "bg-rose-600 text-white border-rose-700 animate-pulse" 
                  : Math.abs(rec.galvanismo_mv) >= 40 
                    ? "bg-amber-500 text-white border-amber-600" 
                    : "bg-emerald-600 text-white border-emerald-700"
              )}
            >
              <Zap size={7} />
              {rec.galvanismo_mv > 0 ? `+${rec.galvanismo_mv}` : rec.galvanismo_mv}
            </span>
          )}
        </div>

        {/* Realistic Anatomical Tooth Graphic */}
        <div className="w-9 h-14 md:w-11 md:h-16 my-1 flex items-center justify-center">
          <RealisticAnatomicalToothSVG meta={meta} record={rec} isSelected={isSelected} />
        </div>

        {/* 5-Facet Occlusal Circle (Miniature) */}
        <div className="my-0.5">
          <Occlusal5FacesCircle status={rec.status} />
        </div>

        {/* Status Indicator Pill */}
        <div className={cn(
          "w-full text-[8px] tracking-tight font-extrabold uppercase truncate text-center py-0.5 rounded-b-xl border-t transition-colors",
          rec.status === 'healthy' 
            ? "bg-slate-50 text-slate-500 border-slate-100" 
            : `${config.badgeColor} ${config.badgeText} ${config.badgeBorder}`
        )}>
          {config.shortLabel}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 md:p-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 shadow-2xs">
            <Layers size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Odontograma Anatômico Digital & Relação Sistêmica (FDI 11 a 48)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                Dra. Lucy &bull; Odontologia Biológica
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualização anatômica com raízes, canais, implantes cerâmicos, amálgamas e correlação dente-órgão.
            </p>
          </div>
        </div>

        {/* Action badges / summary */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 3D Interativo Toggle Button */}
          <button
            type="button"
            onClick={() => setShow3DViewer(!show3DViewer)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer shadow-xs",
              show3DViewer 
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 text-white border-sky-500 ring-2 ring-sky-400/40" 
                : "bg-slate-900 hover:bg-slate-850 text-sky-300 border-slate-700 hover:text-white"
            )}
            title="Alternar entre o Odontograma 2D Anatômico e o Visualizador 3D Interativo Voxel (Three.js)"
          >
            <Box size={14} className={show3DViewer ? "text-amber-300 animate-bounce" : "text-sky-400"} />
            <span>{show3DViewer ? 'Voltar para Odontograma 2D' : '🧊 Visualizador 3D Interativo'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPanoramicBanner(!showPanoramicBanner)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer",
              showPanoramicBanner ? "bg-slate-900 text-white border-slate-950 shadow-xs" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            )}
          >
            <Scan size={14} />
            <span>{showPanoramicBanner ? 'Ocultar Panorâmica' : 'Ver Panorâmica/CBCT'}</span>
          </button>

          <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Elementos com Achados: <strong>{totalFlagged}</strong> de 32</span>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja redefinir todos os dentes para Saudável/Hígido?')) {
                  onChange({ ...data, teeth: {} });
                }
              }}
              className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
              title="Redefinir odontograma"
            >
              <RotateCcw size={12} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* PAINEL 3D INTERATIVO (QUANDO ATIVADO) */}
      {show3DViewer && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <Dental3DViewer
            odontogramData={data}
            selectedToothNumber={selectedToothNum}
            onSelectTooth={(num) => handleSelectTooth(num)}
            onScanAiRequest={() => setShowPanoramicBanner(true)}
          />
        </div>
      )}

      {/* Optional Panoramic / CBCT Banner View (Simulando Laudo Tomográfico Superior) */}
      {showPanoramicBanner && (
        <div className="p-3 bg-slate-950 text-white rounded-2xl border border-slate-800 flex items-center justify-between gap-4 overflow-hidden relative shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-emerald-400">
              <Scan size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Laudo Tomográfico CBCT & Radiografia Panorâmica</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-mono">
                  CORRELAÇÃO ATIVA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Clique nos dentes abaixo para inspecionar canais tratados, focos de NICO e planejar remoções SMART ou implantes de Zircônia.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Canal</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500"></span> Amálgama</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Zircônia</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> NICO</span>
          </div>
        </div>
      )}

      {/* Main Interactive Dental Arch Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center Area: Dental Arch (Upper & Lower) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Legenda de Status / Cores */}
          <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Filtro / Legenda:</span>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(filterStatus === key ? 'all' : (key as ToothStatus))}
                className={cn(
                  "px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all border cursor-pointer",
                  filterStatus === key ? "ring-2 ring-emerald-500 shadow-xs" : "",
                  key === 'healthy' ? "bg-white border-slate-200 text-slate-700" : `${cfg.badgeColor} ${cfg.badgeBorder} ${cfg.badgeText}`
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", key === 'healthy' ? "bg-slate-400" : "bg-white")} />
                <span>{cfg.shortLabel}</span>
                {counts[key as ToothStatus] ? (
                  <span className="ml-0.5 px-1 py-0.2 bg-black/20 rounded text-[9px] font-mono">
                    {counts[key as ToothStatus]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* ARCADA SUPERIOR (MAXILA) */}
          <div className="p-4 bg-gradient-to-b from-emerald-50/40 via-slate-50/50 to-white rounded-3xl border border-emerald-200/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5 text-emerald-950">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                Arcada Superior (Maxila) &bull; Q1 / Q2
              </span>
              <span className="text-[10px] font-bold text-slate-400 lowercase">
                Direita do Paciente (18 &rarr; 11) &bull; Linha Média &bull; (21 &rarr; 28) Esquerda do Paciente
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1 md:gap-1.5 py-1">
              {/* Quadrante 1 (Direito) */}
              <div className="flex items-center gap-1 md:gap-1.5">
                {UPPER_RIGHT_TEETH.map(renderToothCard)}
              </div>

              {/* Linha Média Central */}
              <div className="h-20 w-0.5 bg-emerald-400/80 mx-1 rounded-full flex flex-col justify-between items-center py-1">
                <span className="text-[8px] font-black text-emerald-700">&bull;</span>
                <span className="text-[8px] font-black text-emerald-700">&bull;</span>
              </div>

              {/* Quadrante 2 (Esquerdo) */}
              <div className="flex items-center gap-1 md:gap-1.5">
                {UPPER_LEFT_TEETH.map(renderToothCard)}
              </div>
            </div>
          </div>

          {/* ARCADA INFERIOR (MANDÍBULA) */}
          <div className="p-4 bg-gradient-to-t from-emerald-50/40 via-slate-50/50 to-white rounded-3xl border border-emerald-200/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5 text-emerald-950">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                Arcada Inferior (Mandíbula) &bull; Q4 / Q3
              </span>
              <span className="text-[10px] font-bold text-slate-400 lowercase">
                Direita do Paciente (48 &rarr; 41) &bull; Linha Média &bull; (31 &rarr; 38) Esquerda do Paciente
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1 md:gap-1.5 py-1">
              {/* Quadrante 4 (Direito) */}
              <div className="flex items-center gap-1 md:gap-1.5">
                {LOWER_RIGHT_TEETH.map(renderToothCard)}
              </div>

              {/* Linha Média Central */}
              <div className="h-20 w-0.5 bg-teal-400/80 mx-1 rounded-full flex flex-col justify-between items-center py-1">
                <span className="text-[8px] font-black text-teal-700">&bull;</span>
                <span className="text-[8px] font-black text-teal-700">&bull;</span>
              </div>

              {/* Quadrante 3 (Esquerdo) */}
              <div className="flex items-center gap-1 md:gap-1.5">
                {LOWER_LEFT_TEETH.map(renderToothCard)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Tooth Inspector & Clinical Correlator */}
        <div className="lg:col-span-4 bg-slate-50/90 rounded-3xl border border-slate-200 p-5 space-y-4">
          {currentToothMeta && currentToothRecord ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Header of selected tooth */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-2xl bg-emerald-800 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {currentToothMeta.number}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {currentToothMeta.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {currentToothMeta.arch === 'superior' ? 'Maxila (Superior)' : 'Mandíbula (Inferior)'} &bull; {currentToothMeta.rootsCount} {currentToothMeta.rootsCount > 1 ? 'raízes' : 'raiz'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "px-2.5 py-1 rounded-xl text-[10px] font-bold border",
                    getStatusConfig(currentToothRecord.status).badgeColor,
                    getStatusConfig(currentToothRecord.status).badgeBorder,
                    getStatusConfig(currentToothRecord.status).badgeText
                  )}>
                    {getStatusConfig(currentToothRecord.status).shortLabel}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedToothNum(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer"
                    title="Fechar / Deselecionar dente"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Status Changer Buttons (One-Click with Toggle) */}
              {!readOnly && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Condição Clínica (Dente {currentToothMeta.number})
                    </label>
                    {currentToothRecord.status !== 'healthy' && (
                      <button
                        type="button"
                        onClick={() => clearToothRecord(currentToothMeta.number)}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        title="Remover marcação e retornar dente a Hígido/Saudável"
                      >
                        <RotateCcw size={10} />
                        Limpar / Desmarcar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const isActive = currentToothRecord.status === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (isActive && key !== 'healthy') {
                              clearToothRecord(currentToothMeta.number);
                            } else {
                              updateToothRecord(currentToothMeta.number, { status: key as ToothStatus });
                            }
                          }}
                          className={cn(
                            "p-2 rounded-xl text-[11px] font-bold text-left flex items-center gap-1.5 transition-all border cursor-pointer",
                            isActive 
                              ? `${cfg.badgeColor} ${cfg.badgeBorder} ${cfg.badgeText} shadow-xs ring-1 ring-emerald-500` 
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70"
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full shrink-0", isActive ? "bg-white" : cfg.dotColor)} />
                          <span className="truncate">{cfg.shortLabel}</span>
                          {isActive && <Check size={12} className="ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Systemic Organ-Meridian Correlation (Medicina Integrativa) */}
              <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wider">
                  <Sparkles size={14} className="text-emerald-700" />
                  <span>Relação Órgão-Dente (Medicina Sistêmica)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Órgão Principal:</span>
                    <strong className="text-slate-800">{currentToothMeta.organ}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Meridiano Acupuntura:</span>
                    <strong className="text-slate-800">{currentToothMeta.meridian}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Segmento Vertebral:</span>
                    <span className="text-slate-700 font-medium">{currentToothMeta.vertebrae}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Emoção / Psique:</span>
                    <span className="text-slate-700 font-medium">{currentToothMeta.emotion}</span>
                  </div>
                </div>

                <div className="pt-1 border-t border-emerald-200/60 text-[10px] text-slate-600">
                  <strong>Tecidos Relacionados:</strong> {currentToothMeta.tissue}
                </div>
              </div>

              {/* MEDIÇÃO DE GALVANISMO BUCAL (MICROVOLTAGEM EM mV) */}
              {!readOnly && (
                <div className="p-3.5 bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/50 rounded-2xl border border-amber-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-600" />
                      <span>Galvanismo Bucal / Microvoltagem (mV)</span>
                    </label>
                    {currentToothRecord.galvanismo_mv !== undefined && (
                      <button
                        type="button"
                        onClick={() => updateToothRecord(currentToothMeta.number, { galvanismo_mv: undefined })}
                        className="text-[9px] text-rose-600 hover:text-rose-700 font-bold hover:underline"
                        title="Limpar medição de voltagem"
                      >
                        Zerar mV
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight">
                    Medição da carga eletromagnética do elemento (Oral Potential Meter / Milivoltímetro). Valores &gt; ±100 mV indicam correntes galvânicas ativas e prioridade de remoção SMART.
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="1"
                        value={currentToothRecord.galvanismo_mv !== undefined ? currentToothRecord.galvanismo_mv : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                          updateToothRecord(currentToothMeta.number, { galvanismo_mv: isNaN(val as any) ? undefined : val });
                        }}
                        placeholder="Ex: +250 ou -120"
                        className={cn(
                          "w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all",
                          currentToothRecord.galvanismo_mv !== undefined
                            ? Math.abs(currentToothRecord.galvanismo_mv) > 100
                              ? "bg-rose-50 border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500"
                              : Math.abs(currentToothRecord.galvanismo_mv) >= 40
                                ? "bg-amber-50 border-amber-300 text-amber-900 focus:ring-2 focus:ring-amber-500"
                                : "bg-emerald-50 border-emerald-300 text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                            : "bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-amber-500"
                        )}
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400">mV</span>
                    </div>

                    {/* Botões de polaridade rápida */}
                    <button
                      type="button"
                      onClick={() => {
                        const cur = currentToothRecord.galvanismo_mv || 0;
                        updateToothRecord(currentToothMeta.number, { galvanismo_mv: cur === 0 ? 100 : -cur });
                      }}
                      className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 shadow-2xs transition-all"
                      title="Inverter polaridade (+ / -)"
                    >
                      +/-
                    </button>
                  </div>

                  {/* Botões de pré-seleção rápida */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[9px] font-bold text-slate-400 mr-1">Rápido:</span>
                    {[+280, +150, +70, -110, 0].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateToothRecord(currentToothMeta.number, { galvanismo_mv: preset })}
                        className={cn(
                          "px-1.5 py-0.5 rounded-lg text-[9px] font-mono font-bold transition-all border",
                          currentToothRecord.galvanismo_mv === preset
                            ? "bg-amber-600 text-white border-amber-700"
                            : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {preset > 0 ? `+${preset}` : preset} mV
                      </button>
                    ))}
                  </div>

                  {/* Diagnóstico em tempo real de Galvanismo */}
                  {currentToothRecord.galvanismo_mv !== undefined && (
                    <div className={cn(
                      "p-2 rounded-xl border text-[10px] space-y-0.5",
                      Math.abs(currentToothRecord.galvanismo_mv) > 100
                        ? "bg-rose-100/80 border-rose-300 text-rose-950 font-medium"
                        : Math.abs(currentToothRecord.galvanismo_mv) >= 40
                          ? "bg-amber-100/80 border-amber-300 text-amber-950 font-medium"
                          : "bg-emerald-100/80 border-emerald-300 text-emerald-950 font-medium"
                    )}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1">
                          <Zap size={11} className={Math.abs(currentToothRecord.galvanismo_mv) > 100 ? "text-rose-600 animate-bounce" : "text-amber-600"} />
                          {Math.abs(currentToothRecord.galvanismo_mv) > 100 
                            ? "⚠️ Alto Potencial Galvânico (Bateria Bucal)" 
                            : Math.abs(currentToothRecord.galvanismo_mv) >= 40 
                              ? "⚡ Carga Galvânica Moderada" 
                              : "✅ Carga Basal / Fisiológica"}
                        </span>
                        <span className="font-mono">{currentToothRecord.galvanismo_mv > 0 ? `+${currentToothRecord.galvanismo_mv}` : currentToothRecord.galvanismo_mv} mV</span>
                      </div>
                      <p className="text-[9.5px] opacity-90">
                        {Math.abs(currentToothRecord.galvanismo_mv) > 100
                          ? "Prioridade Alta para remoção com protocolo SMART da IAOMT. Gera correntes elétricas na saliva sobrecarregando o sistema nervoso e meridianos."
                          : Math.abs(currentToothRecord.galvanismo_mv) >= 40
                            ? "Microvoltagem ativa. Recomenda-se acompanhamento e troca programada por material cerâmico metal-free."
                            : "Potencial eletromagnético aceitável e de baixa interferência biológica."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tomography CBCT / Notes Field for this specific tooth */}
              {!readOnly && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      <span>Achados na Tomografia CBCT / Raio-X</span>
                      <FileText size={12} className="text-emerald-600" />
                    </label>
                    <input
                      type="text"
                      value={currentToothRecord.cbctFindings || ''}
                      onChange={(e) => updateToothRecord(currentToothMeta.number, { cbctFindings: e.target.value })}
                      placeholder="Ex: Área hipodensa no ápice da raiz / NICO"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      <span>Plano Biológico / Conduta</span>
                      <Award size={12} className="text-emerald-600" />
                    </label>
                    <input
                      type="text"
                      value={currentToothRecord.biologicalPlan || ''}
                      onChange={(e) => updateToothRecord(currentToothMeta.number, { biologicalPlan: e.target.value })}
                      placeholder="Ex: Remoção SMART + Implante cerâmico Zircônia"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Terapia Neural Checkbox */}
                  <label
                    onClick={() => updateToothRecord(currentToothMeta.number, { neuralTherapy: !currentToothRecord.neuralTherapy })}
                    className={cn(
                      "cursor-pointer p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all select-none",
                      currentToothRecord.neuralTherapy 
                        ? "bg-purple-50 border-purple-300 text-purple-900 shadow-2xs font-bold" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {currentToothRecord.neuralTherapy ? (
                      <CheckCircle2 size={15} className="text-purple-600 shrink-0" />
                    ) : (
                      <CircleDot size={15} className="text-slate-400 shrink-0" />
                    )}
                    <span>Infiltração Terapia Neural (Procaína 0.5%) neste polo</span>
                  </label>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => clearToothRecord(currentToothMeta.number)}
                      className="flex-1 py-2 px-3 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <RotateCcw size={13} className="text-slate-400 group-hover:text-rose-600" />
                      <span>Limpar Marcação</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedToothNum(null)}
                      className="py-2 px-3 bg-slate-200/70 hover:bg-slate-300/80 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Layers size={32} className="mb-2 opacity-50 text-emerald-700" />
              <p className="text-xs font-bold text-slate-700">Nenhum dente selecionado</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Clique em qualquer dente na arcada anatômica para visualizar raízes, canais, órgão e planejar condutas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flagged Teeth List Summary Table */}
      {totalFlagged > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-700" />
              Resumo dos Elementos com Condições Ativas ({totalFlagged})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {Object.values(teethRecords)
              .filter(t => normalizeToothStatus(t?.status) !== 'healthy')
              .map((t) => {
                const meta = TOOTH_METADATA[t.id];
                const cfg = getStatusConfig(t.status);
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTooth(t.id)}
                    className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-2xl border border-slate-200 cursor-pointer transition-all space-y-1 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-[10px]">
                          {t.id}
                        </span>
                        <span>{meta?.name?.split('(')[0] || `Dente ${t.id}`}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border", cfg.badgeColor, cfg.badgeBorder, cfg.badgeText)}>
                          {cfg.shortLabel}
                        </span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearToothRecord(t.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Remover registro deste dente"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 line-clamp-1">
                      <strong>Órgão:</strong> {meta?.organ}
                    </div>

                    {t.cbctFindings && (
                      <div className="text-[10px] text-emerald-800 bg-emerald-50/90 border border-emerald-200 px-2 py-0.5 rounded-lg font-medium">
                        <strong>TC:</strong> {t.cbctFindings}
                      </div>
                    )}

                    {t.galvanismo_mv !== undefined && (
                      <div className={cn(
                        "text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold flex items-center justify-between border",
                        Math.abs(t.galvanismo_mv) > 100 
                          ? "bg-rose-50 text-rose-800 border-rose-200" 
                          : Math.abs(t.galvanismo_mv) >= 40 
                            ? "bg-amber-50 text-amber-800 border-amber-200" 
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      )}>
                        <span className="flex items-center gap-1">
                          <Zap size={10} className={Math.abs(t.galvanismo_mv) > 100 ? "text-rose-600" : "text-amber-600"} />
                          Galvanismo:
                        </span>
                        <span>{t.galvanismo_mv > 0 ? `+${t.galvanismo_mv}` : t.galvanismo_mv} mV</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* PAINEL DE GALVANISMO BUCAL E ORDEM DE REMOÇÃO CIRÚRGICA SMART (IAOMT) */}
      {(() => {
        const galvanismTeeth = Object.values(teethRecords)
          .filter(t => t?.galvanismo_mv !== undefined && t?.galvanismo_mv !== null)
          .sort((a, b) => Math.abs(b.galvanismo_mv || 0) - Math.abs(a.galvanismo_mv || 0));

        if (galvanismTeeth.length === 0) return null;

        return (
          <div className="pt-4 border-t border-amber-100 space-y-3 p-4 bg-gradient-to-br from-amber-50/80 via-slate-50 to-orange-50/60 rounded-3xl border border-amber-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Zap size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Galvanismo Bucal & Sequência de Remoção SMART ({galvanismTeeth.length} elementos medidos)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Na Odontologia Biológica, restaurações com maior microvoltagem (baterias orais) devem ser priorizadas para cessar a dispersão eletromagnética.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                Protocolo IAOMT & Voll
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {galvanismTeeth.map((t, idx) => {
                const meta = TOOTH_METADATA[t.id];
                const mv = t.galvanismo_mv || 0;
                const absMv = Math.abs(mv);
                const isHigh = absMv > 100;
                const isMed = absMv >= 40 && !isHigh;

                return (
                  <div 
                    key={t.id}
                    onClick={() => handleSelectTooth(t.id)}
                    className={cn(
                      "p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-2xs hover:scale-[1.01]",
                      isHigh 
                        ? "bg-rose-50/90 border-rose-300 hover:border-rose-400" 
                        : isMed 
                          ? "bg-amber-50/90 border-amber-300 hover:border-amber-400" 
                          : "bg-white border-slate-200 hover:border-emerald-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className={cn(
                          "w-5 h-5 rounded-lg text-white font-mono text-[10px] font-black flex items-center justify-center",
                          isHigh ? "bg-rose-600" : isMed ? "bg-amber-600" : "bg-emerald-600"
                        )}>
                          #{idx + 1}
                        </span>
                        Dente {t.id} - {meta?.name?.split('(')[0]}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-mono font-black border",
                        isHigh ? "bg-rose-600 text-white border-rose-700 animate-pulse" : isMed ? "bg-amber-500 text-white border-amber-600" : "bg-emerald-600 text-white border-emerald-700"
                      )}>
                        {mv > 0 ? `+${mv}` : mv} mV
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-600">
                      <strong>Meridiano / Órgão:</strong> {meta?.organ} ({meta?.meridian})
                    </div>

                    <div className="text-[10px] font-semibold flex items-center gap-1">
                      {isHigh ? (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <AlertCircle size={11} className="shrink-0" />
                          1ª Prioridade: Remoção Segura SMART Imediata
                        </span>
                      ) : isMed ? (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <Activity size={11} className="shrink-0" />
                          2ª Prioridade: Carga moderada / Programar troca
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} className="shrink-0" />
                          Carga Basal / Sem efeito bateria imediato
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
