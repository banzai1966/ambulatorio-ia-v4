import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Tv,
  Stethoscope,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Contrast,
  Download,
  Plus,
  Trash2,
  Loader2,
  Sun,
  Moon,
  Pill,
  Zap,
  Crosshair,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import dermaSampleImg from '../assets/images/derma_sample_skin_1794672271864.jpg';

export type DermaCategory = 'melasma' | 'acne' | 'pores_texture' | 'vascular' | 'alopecia' | 'lesion';

export interface DermaZone {
  id: string;
  category: DermaCategory;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  confidence?: number;
  patientFriendlyTitle: string;
  patientExplanation: string;
  clinicalFinding: string;
  treatmentOptions?: { name: string; benefit: string; priority?: string }[];
}

export interface DermatologyData {
  area_avaliada?: 'face' | 'scalp' | 'body';
  fototipo_fitzpatrick?: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
  escala_glogau?: 'I' | 'II' | 'III' | 'IV';
  diagnostico_principal?: string;
  tricoscopia_achados?: string;
  rotina_manha?: string;
  rotina_noite?: string;
  procedimentos_consultorio?: string;
  suplementacao_oral_in?: string;
  observacoes_dermato?: string;
  imageUrl?: string;
  skinHealthScore?: number;
  patientSummary?: string;
  clinicalSummary?: string;
  detectedZones?: DermaZone[];
}

interface Props {
  data: DermatologyData;
  onChange: (data: DermatologyData) => void;
  patientName?: string;
}

const CATEGORY_STYLE: Record<
  DermaCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  melasma: {
    label: 'Pigmentação / Melasma',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.18)',
    border: 'border-amber-500/50'
  },
  acne: {
    label: 'Acne / Inflamação',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.20)',
    border: 'border-rose-500/50'
  },
  pores_texture: {
    label: 'Poros & Textura',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.18)',
    border: 'border-cyan-500/50'
  },
  vascular: {
    label: 'Vascular / Rosácea',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.18)',
    border: 'border-pink-500/50'
  },
  alopecia: {
    label: 'Rarefação Capilar',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.20)',
    border: 'border-purple-500/50'
  },
  lesion: {
    label: 'Lesão / Nevo',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.18)',
    border: 'border-emerald-500/50'
  }
};

const FITZPATRICK_SCALE: { grade: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI'; swatch: string; desc: string }[] = [
  { grade: 'I', swatch: '#fde7d6', desc: 'Muito clara' },
  { grade: 'II', swatch: '#f5cfa8', desc: 'Clara' },
  { grade: 'III', swatch: '#dfb080', desc: 'Morena clara' },
  { grade: 'IV', swatch: '#b97e4f', desc: 'Morena moderada' },
  { grade: 'V', swatch: '#85512d', desc: 'Morena escura' },
  { grade: 'VI', swatch: '#4a2a18', desc: 'Negra' }
];

const DEMO_DERMA_ZONES: DermaZone[] = [
  {
    id: 'demo_z1',
    category: 'melasma',
    box_2d: [430, 270, 560, 440],
    confidence: 94,
    patientFriendlyTitle: 'Hiperpigmentação Malar Direita (Melasma)',
    patientExplanation:
      'Acúmulo superficial e dérmico de melanina na região da maçã do rosto, sensível à radiação solar e luz visível.',
    clinicalFinding:
      'Mácula hipercrômica acastanhada de contornos irregulares em região malar direita compatível com melasma epidérmico/misto.',
    treatmentOptions: [
      {
        name: 'Protocolo Clareador + Antioxidante Oral (In & Out)',
        benefit: 'Uniformiza o tom da pele reduzindo risco de efeito rebote.',
        priority: 'Recomendado'
      },
      {
        name: 'Drug Delivery Clareador / Laser Não-Ablativo',
        benefit: 'Acelera a fragmentação do pigmento e renovação epidérmica.',
        priority: 'Complementar'
      }
    ]
  },
  {
    id: 'demo_z2',
    category: 'melasma',
    box_2d: [435, 560, 565, 730],
    confidence: 92,
    patientFriendlyTitle: 'Hiperpigmentação Malar Esquerda',
    patientExplanation:
      'Distribuição simétrica de pigmento em região zigomática esquerda, comum em fototipos intermediários.',
    clinicalFinding:
      'Componente pigmentar simétrico em região malar esquerda com leve contraste sob iluminação direta.',
    treatmentOptions: [
      {
        name: 'Ácido Tranexâmico Tópico + Fotoproteção com Cor',
        benefit: 'Bloqueia sinalização melanogênica induzida por luz visível.',
        priority: 'Recomendado'
      }
    ]
  },
  {
    id: 'demo_z3',
    category: 'pores_texture',
    box_2d: [220, 340, 340, 660],
    confidence: 88,
    patientFriendlyTitle: 'Zona Frontal — Textura & Linhas Finas',
    patientExplanation:
      'Área com leve perda de viço e microtextura superficial que responde rápido a bioestimulação e hidratação profunda.',
    clinicalFinding:
      'Textura epidérmica irregular leve e linhas dinâmicas iniciais em região frontal (Glogau II).',
    treatmentOptions: [
      {
        name: 'Bioestimulador Suave / Skinbooster',
        benefit: 'Melhora firmeza, hidratação e luminosidade natural.',
        priority: 'Opcional'
      }
    ]
  }
];

export default function DermatologyModule({ data, onChange, patientName }: Props) {
  const [viewMode, setViewMode] = useState<'tv' | 'clinical'>('tv');
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    () => data.detectedZones?.[0]?.id || DEMO_DERMA_ZONES[0].id
  );
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [newMarkerCategory, setNewMarkerCategory] = useState<DermaCategory>('melasma');
  const [zoom, setZoom] = useState(1);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoCleared, setDemoCleared] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const area = data.area_avaliada || 'face';
  const effectiveImageUrl = data.imageUrl || (!demoCleared ? dermaSampleImg : undefined);
  const zones =
    data.detectedZones && data.detectedZones.length > 0
      ? data.detectedZones
      : !data.imageUrl && !demoCleared
      ? DEMO_DERMA_ZONES
      : [];
  const effectiveFitzpatrick =
    data.fototipo_fitzpatrick || (!data.imageUrl && !demoCleared ? 'III' : undefined);
  const effectiveGlogau =
    data.escala_glogau || (!data.imageUrl && !demoCleared ? 'II' : undefined);
  const effectiveScore =
    data.skinHealthScore || (!data.imageUrl && !demoCleared ? 76 : undefined);
  const effectivePatientSummary =
    data.patientSummary ||
    (!data.imageUrl && !demoCleared
      ? 'Caso modelo demonstrativo: identificamos focos simétricos de pigmentação malar e textura frontal leve — todos com excelente resposta ao protocolo combinado In & Out.'
      : undefined);
  const effectiveClinicalSummary =
    data.clinicalSummary ||
    (!data.imageUrl && !demoCleared
      ? 'Pele fototipo III com fotoenvelhecimento Glogau II, apresentando máculas hipercrômicas malares bilaterais e textura frontal discreta. Indicado manejo despigmentante gradual sem efeito rebote.'
      : undefined);

  const update = (patch: Partial<DermatologyData>) => {
    onChange({ ...data, ...patch });
  };

  const analyzeImageBase64 = async (base64Url: string, mimeType = 'image/jpeg', focus = area) => {
    setIsAnalyzing(true);
    try {
      const resp = await axios.post(
        '/api/analyze-dermatology-image',
        {
          imageBase64: base64Url,
          mimeType,
          focusArea: focus,
          patientName
        },
        { timeout: 60000 }
      );
      const res = resp.data;
      const prot = res.recommendedInOutProtocol || {};
      const nextZones: DermaZone[] = Array.isArray(res.detectedZones) ? res.detectedZones : [];
      update({
        imageUrl: base64Url,
        area_avaliada: focus,
        fototipo_fitzpatrick: res.fitzpatrickEstimate || data.fototipo_fitzpatrick || 'III',
        escala_glogau: res.glogauEstimate || data.escala_glogau || 'II',
        skinHealthScore: Number(res.skinHealthScore || 78),
        patientSummary: res.patientSummary || '',
        clinicalSummary: res.clinicalSummary || '',
        detectedZones: nextZones,
        rotina_manha: data.rotina_manha || (Array.isArray(prot.morningRoutine) ? prot.morningRoutine.join('\n') : ''),
        rotina_noite: data.rotina_noite || (Array.isArray(prot.nightRoutine) ? prot.nightRoutine.join('\n') : ''),
        procedimentos_consultorio:
          data.procedimentos_consultorio ||
          (Array.isArray(prot.inClinicProcedures) ? prot.inClinicProcedures.join('\n') : ''),
        suplementacao_oral_in:
          data.suplementacao_oral_in || (Array.isArray(prot.oralInSupplements) ? prot.oralInSupplements.join('\n') : '')
      });
      if (nextZones.length > 0) setSelectedZoneId(nextZones[0].id);
      toast.success('Mapeamento visual dermatológico concluído!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao analisar foto clínica.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máximo 15MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev.target?.result as string;
      update({ imageUrl: url });
      await analyzeImageBase64(url, file.type || 'image/jpeg', area);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const loadDemoSkinCase = async () => {
    try {
      setIsAnalyzing(true);
      const res = await fetch(dermaSampleImg);
      const blob = await res.blob();
      const base64Url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      await analyzeImageBase64(base64Url, 'image/jpeg', 'face');
    } catch {
      toast.error('Não foi possível carregar o caso de demonstração.');
      setIsAnalyzing(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingMarker || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clickX = ((e.clientX - rect.left) / rect.width) * 1000;
    const clickY = ((e.clientY - rect.top) / rect.height) * 1000;

    const boxSize = 110;
    const ymin = Math.max(0, Math.round(clickY - boxSize / 2));
    const xmin = Math.max(0, Math.round(clickX - boxSize / 2));
    const ymax = Math.min(1000, Math.round(clickY + boxSize / 2));
    const xmax = Math.min(1000, Math.round(clickX + boxSize / 2));

    const style = CATEGORY_STYLE[newMarkerCategory];
    const customZone: DermaZone = {
      id: `manual_${Date.now()}`,
      category: newMarkerCategory,
      box_2d: [ymin, xmin, ymax, xmax],
      confidence: 100,
      patientFriendlyTitle: `Área Selecionada — ${style.label}`,
      patientExplanation: 'Região demarcada manualmente em consulta para tratamento focal direcionado.',
      clinicalFinding: `Marcação clínica focal (${style.label}) para procedimento ou acompanhamento evolutivo.`,
      treatmentOptions: [
        { name: 'Protocolo Focal Personalizado', benefit: 'Atuação direta sobre a área demarcada.', priority: 'Recomendado' }
      ]
    };

    update({ detectedZones: [...zones, customZone] });
    setSelectedZoneId(customZone.id);
    setIsAddingMarker(false);
    toast.success('Marcação adicionada na fotografia!');
  };

  const removeZone = (id: string) => {
    const next = zones.filter((z) => z.id !== id);
    update({ detectedZones: next });
    if (selectedZoneId === id) setSelectedZoneId(next[0]?.id || null);
  };

  const exportAnnotatedPng = () => {
    if (!imageRef.current || !effectiveImageUrl) return;
    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1000;
    canvas.height = img.naturalHeight || 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (showOverlays) {
      zones.forEach((z) => {
        const [ymin, xmin, ymax, xmax] = z.box_2d;
        const x = (xmin / 1000) * canvas.width;
        const y = (ymin / 1000) * canvas.height;
        const w = ((xmax - xmin) / 1000) * canvas.width;
        const h = ((ymax - ymin) / 1000) * canvas.height;
        const st = CATEGORY_STYLE[z.category] || CATEGORY_STYLE.melasma;

        ctx.fillStyle = st.bg;
        ctx.fillRect(x, y, w, h);
        ctx.lineWidth = Math.max(3, canvas.width * 0.004);
        ctx.strokeStyle = st.color;
        ctx.strokeRect(x, y, w, h);

        ctx.font = `bold ${Math.max(14, Math.round(canvas.width * 0.018))}px sans-serif`;
        const label = z.patientFriendlyTitle;
        const tw = ctx.measureText(label).width + 14;
        ctx.fillStyle = st.color;
        ctx.fillRect(x, Math.max(0, y - 24), tw, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + 7, Math.max(17, y - 7));
      });
    }

    const link = document.createElement('a');
    link.download = `dermatologia_mapeamento_${(patientName || 'paciente').replace(/[^a-z0-9]/gi, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Imagem dermatológica marcada exportada!');
  };

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0] || null;

  return (
    <div className="space-y-6">
      {/* Header do Estúdio Dermatológico */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
            <Sparkles size={15} />
            <span>Dermatologia & Tricologia Visual IA</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">Mapeamento em Tela & Protocolo In & Out</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Estúdio Visual de Pele, Manchas & Couro Cabeludo
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Região */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            {[
              { id: 'face', label: 'Face / Melasma' },
              { id: 'scalp', label: 'Couro Cabeludo' },
              { id: 'body', label: 'Corporal / Lesões' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => update({ area_avaliada: tab.id as any })}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                  area === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toggle Modo TV / Clínico */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('tv')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                viewMode === 'tv' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Tv size={13} />
              <span>Modo TV</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('clinical')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                viewMode === 'clinical' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Stethoscope size={13} />
              <span>Modo Clínico</span>
            </button>
          </div>
        </div>
      </div>

      {/* ESTÚDIO VISUAL DERMATOLÓGICO (DARK TV VIEWPORT + PAINEL LATERAL) */}
      <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{isAnalyzing ? 'Mapeando Pele...' : 'Subir Foto Clínica'}</span>
            </button>

            <button
              type="button"
              onClick={loadDemoSkinCase}
              disabled={isAnalyzing}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Analisar Amostra com IA
            </button>

            {effectiveImageUrl && (
              <>
                <button
                  type="button"
                  onClick={() => setShowOverlays(!showOverlays)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border cursor-pointer whitespace-nowrap',
                    showOverlays
                      ? 'bg-pink-600/20 text-pink-200 border-pink-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  )}
                >
                  {showOverlays ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{showOverlays ? 'Marcações IA: Visíveis' : 'Marcações IA: Ocultas'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddingMarker(!isAddingMarker)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border cursor-pointer whitespace-nowrap',
                    isAddingMarker
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  )}
                >
                  <Crosshair size={14} />
                  <span>{isAddingMarker ? 'Clique na Foto para Marcar' : 'Marcar Região'}</span>
                </button>

                {isAddingMarker && (
                  <select
                    value={newMarkerCategory}
                    onChange={(e) => setNewMarkerCategory(e.target.value as DermaCategory)}
                    className="px-2.5 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-xs text-white"
                  >
                    {Object.entries(CATEGORY_STYLE).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setDemoCleared(true);
                    update({ imageUrl: undefined, detectedZones: [] });
                  }}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Limpar Foto
                </button>
              </>
            )}
          </div>

          {effectiveImageUrl && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer"
                title="Reduzir Zoom"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs font-mono tabular-nums text-slate-300 px-1">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setHighContrastMode(!highContrastMode)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border cursor-pointer',
                  highContrastMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                )}
                title="Realce de Contraste Pigmento / Vascular"
              >
                <Contrast size={13} />
                <span>Realce Pigmento</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setHighContrastMode(false);
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer"
                title="Resetar visualização"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={exportAnnotatedPng}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Baixar PNG</span>
              </button>
            </div>
          )}
        </div>

        {effectiveImageUrl ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Viewport da Foto com Overlays */}
            <div className="lg:col-span-7 bg-black rounded-xl border border-slate-800 p-3 flex items-center justify-center overflow-auto max-h-[500px]">
              <div
                onClick={handleImageClick}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
                className={cn(
                  'relative inline-block transition-transform duration-150',
                  isAddingMarker ? 'cursor-crosshair' : 'cursor-default'
                )}
              >
                <img
                  ref={imageRef}
                  src={effectiveImageUrl}
                  alt="Avaliação Dermatológica"
                  className="max-h-[450px] w-auto object-contain rounded-lg block"
                  style={{
                    filter: highContrastMode ? 'contrast(1.45) saturate(1.35)' : 'none'
                  }}
                />
                {showOverlays &&
                  zones.map((z) => {
                    const [ymin, xmin, ymax, xmax] = z.box_2d;
                    const st = CATEGORY_STYLE[z.category] || CATEGORY_STYLE.melasma;
                    const isSelected = selectedZone?.id === z.id;
                    return (
                      <div
                        key={z.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedZoneId(z.id);
                        }}
                        style={{
                          top: `${ymin / 10}%`,
                          left: `${xmin / 10}%`,
                          height: `${Math.max(4, (ymax - ymin) / 10)}%`,
                          width: `${Math.max(4, (xmax - xmin) / 10)}%`,
                          borderColor: st.color,
                          backgroundColor: st.bg
                        }}
                        className={cn(
                          'absolute rounded-lg border-2 cursor-pointer transition-all',
                          isSelected ? 'ring-2 ring-white shadow-lg z-20' : 'z-10 opacity-85 hover:opacity-100'
                        )}
                      >
                        <span
                          style={{ backgroundColor: st.color }}
                          className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-xs"
                        >
                          {z.patientFriendlyTitle}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Painel Lateral de Diagnóstico Visual */}
            <div className="lg:col-span-5 space-y-3">
              {(effectivePatientSummary || effectiveClinicalSummary) && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-rose-400">
                    <span>{viewMode === 'tv' ? 'Resumo para o Paciente (TV)' : 'Parecer Dermatológico IA'}</span>
                    {effectiveScore !== undefined && (
                      <span className="font-mono tabular-nums text-emerald-400">
                        Qualidade Cutânea: {effectiveScore}/100
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {viewMode === 'tv' ? effectivePatientSummary : effectiveClinicalSummary}
                  </p>
                </div>
              )}

              {zones.length > 0 && (
                <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                  {zones.map((z) => {
                    const st = CATEGORY_STYLE[z.category] || CATEGORY_STYLE.melasma;
                    const active = selectedZone?.id === z.id;
                    return (
                      <div
                        key={z.id}
                        onClick={() => setSelectedZoneId(z.id)}
                        className={cn(
                          'p-3 rounded-xl border cursor-pointer transition-colors flex items-start justify-between gap-2',
                          active
                            ? 'bg-slate-900 border-white/40'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: st.color }} />
                            <span className="truncate">{z.patientFriendlyTitle}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                            {viewMode === 'tv' ? z.patientExplanation : z.clinicalFinding}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            removeZone(z.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
                          title="Remover marcação"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedZone && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="text-xs font-bold text-white">{selectedZone.patientFriendlyTitle}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {viewMode === 'tv' ? selectedZone.patientExplanation : selectedZone.clinicalFinding}
                  </p>
                  {selectedZone.treatmentOptions && selectedZone.treatmentOptions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-semibold text-rose-400 block">
                        Opções Terapêuticas Sugeridas
                      </span>
                      {selectedZone.treatmentOptions.map((opt, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-xs font-semibold text-white">{opt.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{opt.benefit}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 px-4 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
            <p className="text-sm font-semibold text-slate-200">
              Suba uma fotografia clínica da face, lesão ou couro cabeludo (tricoscopia)
            </p>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              A IA identifica manchas, acne, poros, eritema ou rarefação folicular direto na imagem para explicar o protocolo ao paciente na tela.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload size={14} />
                <span>Enviar Foto Clínica</span>
              </button>
              <button
                type="button"
                onClick={loadDemoSkinCase}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold cursor-pointer"
              >
                Testar Caso Demonstração (Pele / Melasma)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ESCALAS DERMATOLÓGICAS (FITZPATRICK + GLOGAU) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Fototipo de Fitzpatrick</h3>
            <span className="text-xs font-mono text-slate-500">
              Selecionado: {effectiveFitzpatrick || 'Não definido'}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {FITZPATRICK_SCALE.map((f) => {
              const active = effectiveFitzpatrick === f.grade;
              return (
                <button
                  key={f.grade}
                  type="button"
                  onClick={() => update({ fototipo_fitzpatrick: f.grade })}
                  className={cn(
                    'p-2.5 rounded-xl border text-center cursor-pointer transition-all',
                    active ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500' : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div
                    className="w-7 h-7 rounded-full mx-auto border border-black/10 mb-1.5"
                    style={{ backgroundColor: f.swatch }}
                  />
                  <div className="text-xs font-bold text-slate-900">Tipo {f.grade}</div>
                  <div className="text-[10px] text-slate-500 truncate">{f.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Escala de Fotoenvelhecimento (Glogau)</h3>
            <span className="text-xs font-mono text-slate-500">
              Grau: {effectiveGlogau || 'Não definido'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { g: 'I', title: 'Tipo I', desc: 'Sem rugas (20–30 anos)' },
              { g: 'II', title: 'Tipo II', desc: 'Rugas em movimento (30–40)' },
              { g: 'III', title: 'Tipo III', desc: 'Rugas em repouso (50+)' },
              { g: 'IV', title: 'Tipo IV', desc: 'Rugas difusas / severo' }
            ].map((item) => {
              const active = effectiveGlogau === item.g;
              return (
                <button
                  key={item.g}
                  type="button"
                  onClick={() => update({ escala_glogau: item.g as any })}
                  className={cn(
                    'p-3 rounded-xl border text-left cursor-pointer transition-all',
                    active ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500' : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className="text-xs font-bold text-slate-900">{item.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PROTOCOLO IN & OUT (MANHÃ, NOITE, PROCEDIMENTOS, ORAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sun size={15} className="text-amber-500" />
            <span>Skincare Diurno (Manhã & Fotoproteção)</span>
          </label>
          <textarea
            rows={4}
            value={data.rotina_manha || ''}
            onChange={(e) => update({ rotina_manha: e.target.value })}
            placeholder="Limpeza suave, antioxidantes (Vit C / Ferúlico), protetor com cor FPS 60+..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Moon size={15} className="text-indigo-500" />
            <span>Tratamento Noturno (Renovadores & Clareadores)</span>
          </label>
          <textarea
            rows={4}
            value={data.rotina_noite || ''}
            onChange={(e) => update({ rotina_noite: e.target.value })}
            placeholder="Ácido tranexâmico, niacinamida, retinoides, fórmulas manipuladas..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Zap size={15} className="text-rose-600" />
            <span>Procedimentos em Consultório (Lasers / Bioestimuladores / MMP)</span>
          </label>
          <textarea
            rows={4}
            value={data.procedimentos_consultorio || ''}
            onChange={(e) => update({ procedimentos_consultorio: e.target.value })}
            placeholder="Plano de sessões em clínica (Laser Lavieen, Microagulhamento Drug Delivery, Toxina, MMP capilar)..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Pill size={15} className="text-emerald-600" />
            <span>Protocolo Oral "In" (Antioxidantes / Nutricosméticos)</span>
          </label>
          <textarea
            rows={4}
            value={data.suplementacao_oral_in || ''}
            onChange={(e) => update({ suplementacao_oral_in: e.target.value })}
            placeholder="Polypodium leucotomos, Picnogenol, Biotina, Silício Orgânico, Peptídeos de Colágeno..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
        <label className="text-xs font-bold text-slate-800">
          Diagnóstico Dermatológico / Tricoscopia & Observações
        </label>
        <textarea
          rows={3}
          value={data.observacoes_dermato || ''}
          onChange={(e) => update({ observacoes_dermato: e.target.value })}
          placeholder="Histórico dermatológico, sensibilidades, achados de dermatoscopia/tricoscopia..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
