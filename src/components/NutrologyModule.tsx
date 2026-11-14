import React, { useState, useRef } from 'react';
import {
  Activity,
  Upload,
  Sparkles,
  Tv,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Scale,
  Flame,
  Pill,
  Utensils
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export interface LabBiomarker {
  name: string;
  value: string;
  unit: string;
  labRange: string;
  optimalRange: string;
  status: 'optimal' | 'suboptimal' | 'critical';
  patientExplanation: string;
  clinicalAction: string;
}

export interface NutrologyData {
  peso_kg?: string;
  altura_cm?: string;
  gordura_corporal_pct?: string;
  massa_muscular_kg?: string;
  gordura_visceral?: string;
  tmb_kcal?: string;
  circunferencia_abdominal_cm?: string;
  objetivo_principal?: string;
  habitos_alimentares?: string;
  qualidade_sono?: string;
  intestino_habito?: string;
  suplementacao_prescrita?: string;
  plano_alimentar_orientacoes?: string;
  observacoes_clinicas?: string;
  radar_metabolico?: {
    energia: number;
    sono: number;
    intestino: number;
    glicemia: number;
    imunidade: number;
  };
  labAnalysis?: {
    metabolicScore: number;
    patientSummary: string;
    clinicalSummary: string;
    biomarkers: LabBiomarker[];
    suggestedSupplements: string[];
    lifestyleFocus: string[];
  };
}

interface Props {
  data: NutrologyData;
  onChange: (data: NutrologyData) => void;
  patientName?: string;
}

const DEMO_LAB_RESULT: NonNullable<NutrologyData['labAnalysis']> = {
  metabolicScore: 68,
  patientSummary:
    'Seus exames mostram reservas de energia e ferro abaixo da faixa ideal funcional, além de sinal inicial de resistência à insulina. Ajustando vitaminas e rotina alimentar, você recupera disposição e acelera o metabolismo.',
  clinicalSummary:
    'Insuficiência funcional de 25-OH-Vitamina D e Vitamina B12 associada a ferritina limítrofe, hiperinsulinemia basal compensatória (HOMA-IR elevado) e inflamação subclínica leve.',
  biomarkers: [
    {
      name: 'Vitamina D (25-OH)',
      value: '23.4',
      unit: 'ng/mL',
      labRange: 'Acima de 20 ng/mL',
      optimalRange: '50 a 80 ng/mL',
      status: 'suboptimal',
      patientExplanation: 'Para o laboratório aparece como normal, mas para energia, imunidade e metabolismo ósseo está abaixo da metade do ideal.',
      clinicalAction: 'Colecalciferol 10.000 UI/dia + K2 MK-7 100 mcg por 60 dias.'
    },
    {
      name: 'Insulina Basal',
      value: '14.8',
      unit: 'uUI/mL',
      labRange: '2.0 a 25.0 uUI/mL',
      optimalRange: '2.0 a 5.5 uUI/mL',
      status: 'critical',
      patientExplanation: 'O pâncreas está trabalhando em dobro para segurar a glicose — principal trava silenciosa do emagrecimento.',
      clinicalAction: 'Berberina 500 mg 2x/dia + ajuste de carga glicêmica + treino de força.'
    },
    {
      name: 'Ferritina Sérica',
      value: '34',
      unit: 'ng/mL',
      labRange: '15 a 150 ng/mL',
      optimalRange: '70 a 150 ng/mL',
      status: 'suboptimal',
      patientExplanation: 'Estoque baixo de ferro explica cansaço vespertino, queda capilar e menor oxigenação muscular.',
      clinicalAction: 'Ferro Quelado (Bisglicinato) 30 mg + Vitamina C 250 mg longe do café.'
    },
    {
      name: 'Vitamina B12',
      value: '310',
      unit: 'pg/mL',
      labRange: '200 a 900 pg/mL',
      optimalRange: '600 a 950 pg/mL',
      status: 'suboptimal',
      patientExplanation: 'Nível baixo para foco mental, memória e produção celular de energia.',
      clinicalAction: 'Metilcobalamina sublingual 1.000 mcg/dia.'
    },
    {
      name: 'Homocisteína',
      value: '11.8',
      unit: 'umol/L',
      labRange: 'Até 15.0 umol/L',
      optimalRange: 'Abaixo de 7.0 umol/L',
      status: 'suboptimal',
      patientExplanation: 'Marcador inflamatório cardiovascular e de metilação que responde muito bem ao complexo B ativo.',
      clinicalAction: 'Metilfolato 800 mcg + Piridoxal-5-Fosfato 25 mg.'
    },
    {
      name: 'TSH Ultra-Sensível',
      value: '1.85',
      unit: 'mUI/L',
      labRange: '0.4 a 4.5 mUI/L',
      optimalRange: '0.8 a 2.2 mUI/L',
      status: 'optimal',
      patientExplanation: 'Função tireoidiana central dentro da faixa ótima metabólica.',
      clinicalAction: 'Manter acompanhamento de rotina com selênio e iodo fisiológico.'
    }
  ],
  suggestedSupplements: [
    'Vitamina D3 10.000 UI + Vitamina K2 MK-7 100 mcg — 1 cápsula após o almoço',
    'Berberina 500 mg — 1 cápsula 15 min antes do almoço e jantar',
    'Metilcobalamina 1.000 mcg + Metilfolato 800 mcg — 1 cápsula sublingual pela manhã',
    'Magnésio Bisglicinato 300 mg — 1 dose 1 hora antes de dormir'
  ],
  lifestyleFocus: [
    'Aporte proteico mínimo de 1,6 g/kg/dia priorizando café da manhã com 30g de proteína',
    'Treino resistido (musculação) 3 a 4x/semana para sensibilizar receptores GLUT4',
    'Higiene do sono: reduzir telas 45 min antes de deitar e jantar até 20h'
  ]
};

export default function NutrologyModule({ data, onChange, patientName }: Props) {
  const [viewMode, setViewMode] = useState<'tv' | 'clinical'>('tv');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawLabText, setRawLabText] = useState('');
  const [showTextLabBox, setShowTextLabBox] = useState(false);
  const [newMarkerName, setNewMarkerName] = useState('');
  const [newMarkerValue, setNewMarkerValue] = useState('');
  const [newMarkerUnit, setNewMarkerUnit] = useState('');
  const [newMarkerOptimal, setNewMarkerOptimal] = useState('');
  const [demoCleared, setDemoCleared] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const radar = data.radar_metabolico || {
    energia: 6,
    sono: 6,
    intestino: 7,
    glicemia: 6,
    imunidade: 7
  };

  const update = (patch: Partial<NutrologyData>) => {
    onChange({ ...data, ...patch });
  };

  const updateRadar = (key: keyof NonNullable<NutrologyData['radar_metabolico']>, val: number) => {
    update({
      radar_metabolico: {
        ...radar,
        [key]: val
      }
    });
  };

  // Cálculo automático do IMC
  const pesoNum = parseFloat(String(data.peso_kg || '').replace(',', '.'));
  const alturaCmNum = parseFloat(String(data.altura_cm || '').replace(',', '.'));
  const imcValue =
    pesoNum > 0 && alturaCmNum > 50
      ? pesoNum / Math.pow(alturaCmNum / 100, 2)
      : null;

  const getImcClassification = (imc: number) => {
    if (imc < 18.5) return { label: 'Abaixo do peso', tone: 'text-amber-700' };
    if (imc < 25) return { label: 'Eutrófico (Ideal)', tone: 'text-emerald-700' };
    if (imc < 30) return { label: 'Sobrepeso', tone: 'text-amber-700' };
    return { label: 'Obesidade', tone: 'text-rose-700' };
  };

  const handleLabFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máximo 15MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      await runLabAnalysis({
        imageBase64: dataUrl,
        mimeType: file.type || 'image/jpeg',
        rawText: rawLabText.trim() || undefined
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const runLabAnalysis = async (payload: { imageBase64?: string; mimeType?: string; rawText?: string }) => {
    setIsAnalyzing(true);
    try {
      const resp = await axios.post('/api/analyze-nutrology-labs', {
        ...payload,
        patientName
      }, { timeout: 60000 });

      const result = resp.data;
      if (result?.biomarkers) {
        const supList = Array.isArray(result.suggestedSupplements) ? result.suggestedSupplements.join('\n') : '';
        const lifeList = Array.isArray(result.lifestyleFocus) ? result.lifestyleFocus.join('\n') : '';
        update({
          labAnalysis: {
            metabolicScore: Number(result.metabolicScore || 75),
            patientSummary: result.patientSummary || '',
            clinicalSummary: result.clinicalSummary || '',
            biomarkers: result.biomarkers || [],
            suggestedSupplements: result.suggestedSupplements || [],
            lifestyleFocus: result.lifestyleFocus || []
          },
          suplementacao_prescrita: data.suplementacao_prescrita || supList,
          plano_alimentar_orientacoes: data.plano_alimentar_orientacoes || lifeList
        });
        setShowTextLabBox(false);
        toast.success(`${result.biomarkers.length} biomarcadores analisados com sucesso!`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao analisar exame laboratorial.';
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadDemoLab = () => {
    update({
      peso_kg: data.peso_kg || '78.4',
      altura_cm: data.altura_cm || '172',
      gordura_corporal_pct: data.gordura_corporal_pct || '26.8',
      massa_muscular_kg: data.massa_muscular_kg || '31.2',
      gordura_visceral: data.gordura_visceral || '11',
      tmb_kcal: data.tmb_kcal || '1640',
      circunferencia_abdominal_cm: data.circunferencia_abdominal_cm || '92',
      objetivo_principal: data.objetivo_principal || 'Emagrecimento & Sensibilidade à Insulina',
      radar_metabolico: {
        energia: 5,
        sono: 6,
        intestino: 6,
        glicemia: 4,
        imunidade: 6
      },
      labAnalysis: DEMO_LAB_RESULT,
      suplementacao_prescrita: DEMO_LAB_RESULT.suggestedSupplements.join('\n'),
      plano_alimentar_orientacoes: DEMO_LAB_RESULT.lifestyleFocus.join('\n')
    });
    toast.success('Painel demonstrativo de Nutrologia carregado para apresentação!');
  };

  const applyPreset = (preset: 'emagrecimento' | 'fadiga' | 'hipertrofia') => {
    if (preset === 'emagrecimento') {
      update({
        objetivo_principal: 'Emagrecimento & Controle Insulínico',
        suplementacao_prescrita:
          'Berberina 500 mg — 1 cáps antes do almoço e jantar\nPicolinato de Cromo 200 mcg + Ácido Alfa-Lipóico 300 mg — manhã\nMagnésio Dimalato 300 mg — noite',
        plano_alimentar_orientacoes:
          'Déficit calórico leve (-350 kcal) preservando proteína 1,8 g/kg\nPriorizar vegetais fibrosos antes dos carboidratos nas refeições principais\nTreino de força 4x/semana + 8.000 passos/dia'
      });
    } else if (preset === 'fadiga') {
      update({
        objetivo_principal: 'Fadiga Crônica & Modulação Mitocondrial',
        suplementacao_prescrita:
          'Coenzima Q10 (Ubiquinol) 100 mg — após café da manhã\nVitamina D3 10.000 UI + K2 MK-7 100 mcg — almoço\nComplexo B Metilado (B12 1000 mcg + Metilfolato 800 mcg) — manhã\nMagnésio Treonato 250 mg — antes de dormir',
        plano_alimentar_orientacoes:
          'Exposição solar matinal 15 min para ajuste circadiano\nRefeição noturna leve 2h30 antes de dormir\nHidratação fracionada 35 ml/kg/dia'
      });
    } else {
      update({
        objetivo_principal: 'Hipertrofia & Otimização Hormonal',
        suplementacao_prescrita:
          'Creatina Monohidratada (Creapure) 5 g/dia\nÔmega-3 EPA/DHA 2.000 mg/dia — junto às refeições\nZinco Quelado 30 mg + Boro 3 mg — noite\nWhey Protein Isolado 30 g pós-treino se necessário para meta proteica',
        plano_alimentar_orientacoes:
          'Proteína fracionada em 4 refeições (2,0 g/kg/dia)\nCarboidrato estratégico pré e pós-treino\nSono mínimo de 7h30 para pico de GH e recuperação muscular'
      });
    }
    toast.success('Protocolo nutrológico aplicado!');
  };

  const addManualBiomarker = () => {
    if (!newMarkerName.trim() || !newMarkerValue.trim()) {
      toast.error('Informe o nome e o valor do exame.');
      return;
    }
    const existing = data.labAnalysis || {
      metabolicScore: 78,
      patientSummary: 'Marcadores laboratoriais em acompanhamento nutrológico funcional.',
      clinicalSummary: 'Avaliação metabólica individualizada.',
      biomarkers: [],
      suggestedSupplements: [],
      lifestyleFocus: []
    };
    const nextItem: LabBiomarker = {
      name: newMarkerName.trim(),
      value: newMarkerValue.trim(),
      unit: newMarkerUnit.trim() || '-',
      labRange: 'Conforme laudo',
      optimalRange: newMarkerOptimal.trim() || 'Faixa ótima individual',
      status: 'suboptimal',
      patientExplanation: 'Marcador acompanhado para otimização funcional e energética.',
      clinicalAction: 'Avaliar ajuste nutricional e suplementar conforme clínica.'
    };
    update({
      labAnalysis: {
        ...existing,
        biomarkers: [nextItem, ...existing.biomarkers]
      }
    });
    setNewMarkerName('');
    setNewMarkerValue('');
    setNewMarkerUnit('');
    setNewMarkerOptimal('');
  };

  const removeBiomarker = (idx: number) => {
    if (!data.labAnalysis) return;
    update({
      labAnalysis: {
        ...data.labAnalysis,
        biomarkers: data.labAnalysis.biomarkers.filter((_, i) => i !== idx)
      }
    });
  };

  // Coordenadas do Radar SVG (5 eixos)
  const radarAxes: { key: keyof typeof radar; label: string }[] = [
    { key: 'energia', label: 'Energia' },
    { key: 'sono', label: 'Sono' },
    { key: 'intestino', label: 'Intestino' },
    { key: 'glicemia', label: 'Glicemia' },
    { key: 'imunidade', label: 'Imunidade' }
  ];

  const cx = 110;
  const cy = 105;
  const maxR = 72;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / radarAxes.length - Math.PI / 2;
    const r = (Math.max(1, Math.min(10, value)) / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  const radarPolygon = radarAxes
    .map((ax, i) => {
      const p = getPoint(i, radar[ax.key]);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  const lab = data.labAnalysis || (!demoCleared ? DEMO_LAB_RESULT : undefined);
  const isDemoLab = !data.labAnalysis && !demoCleared;

  return (
    <div className="space-y-6">
      {/* Header do Estúdio Nutrológico */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <Activity size={15} />
            <span>Nutrologia & Medicina Metabólica</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">Leitura Funcional de Exames & Bioimpedância</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Painel Metabólico & Otimização Nutrológica
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Modo TV / Modo Clínico */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('tv')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap',
                viewMode === 'tv' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Tv size={13} />
              <span>Modo TV (Paciente)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('clinical')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap',
                viewMode === 'clinical' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Stethoscope size={13} />
              <span>Modo Clínico</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => applyPreset('emagrecimento')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            Preset Emagrecimento
          </button>
          <button
            type="button"
            onClick={() => applyPreset('fadiga')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            Preset Fadiga / Mitocôndria
          </button>
          <button
            type="button"
            onClick={() => applyPreset('hipertrofia')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            Preset Hipertrofia
          </button>
        </div>
      </div>

      {/* BLOCO 1: LEITOR VISUAL DE EXAMES LABORATORIAIS (MODO TV) */}
      <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-5 md:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Sparkles size={15} />
              <span>Leitor IA de Exames de Sangue · Referência Comum vs Faixa Ótima Funcional</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Mapeamento Laboratorial Comparativo na Tela
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleLabFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{isAnalyzing ? 'Lendo Exame...' : 'Enviar Foto / PDF do Exame'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTextLabBox(!showTextLabBox)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Colar Resultados em Texto
            </button>

            <button
              type="button"
              onClick={loadDemoLab}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Restaurar Caso Demo
            </button>
            {lab && (
              <button
                type="button"
                onClick={() => {
                  setDemoCleared(true);
                  update({ labAnalysis: undefined });
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Limpar para Paciente Real
              </button>
            )}
          </div>
        </div>

        {showTextLabBox && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <textarea
              rows={4}
              value={rawLabText}
              onChange={(e) => setRawLabText(e.target.value)}
              placeholder="Cole os valores do exame (ex: Vitamina D 24 ng/mL, Ferritina 32, Insulina Basal 15, B12 310, Homocisteína 12, TSH 2.1)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTextLabBox(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isAnalyzing || !rawLabText.trim()}
                onClick={() => runLabAnalysis({ rawText: rawLabText.trim() })}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Interpretar Valores com IA
              </button>
            </div>
          </div>
        )}

        {lab ? (
          <div className="space-y-4">
            {/* Score + Summary Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Índice Metabólico Funcional
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-mono tabular-nums font-bold text-emerald-400">
                    {lab.metabolicScore}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/ 100 pts</span>
                </div>
              </div>

              <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  {viewMode === 'tv' ? 'Explicação Clara para o Paciente (TV)' : 'Síntese Técnica Nutrológica'}
                </span>
                <p className="text-sm text-slate-100 mt-1 leading-relaxed">
                  {viewMode === 'tv' ? lab.patientSummary : lab.clinicalSummary}
                </p>
              </div>
            </div>

            {/* Biomarker Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {lab.biomarkers.map((item, idx) => {
                const isOptimal = item.status === 'optimal';
                const isCritical = item.status === 'critical';
                return (
                  <div
                    key={`${item.name}-${idx}`}
                    className={cn(
                      'rounded-xl border p-4 space-y-2.5 bg-slate-900/90',
                      isOptimal
                        ? 'border-emerald-500/30'
                        : isCritical
                        ? 'border-rose-500/40'
                        : 'border-amber-500/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-mono tabular-nums font-bold text-white">
                            {item.value}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border',
                            isOptimal
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : isCritical
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          )}
                        >
                          {isOptimal ? (
                            <CheckCircle2 size={12} />
                          ) : isCritical ? (
                            <AlertCircle size={12} />
                          ) : (
                            <AlertTriangle size={12} />
                          )}
                          <span>{isOptimal ? 'Ótimo' : isCritical ? 'Prioritário' : 'Subótimo'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBiomarker(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Remover marcador"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Ref. Laboratório</span>
                        <span className="font-mono tabular-nums text-slate-300">{item.labRange}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 block">Faixa Ótima</span>
                        <span className="font-mono tabular-nums font-semibold text-emerald-300">
                          {item.optimalRange}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                      {viewMode === 'tv' ? item.patientExplanation : item.clinicalAction}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Adicionar Marcador Manual Rápido */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Marcador (ex: PCR-us)"
                value={newMarkerName}
                onChange={(e) => setNewMarkerName(e.target.value)}
                className="flex-1 min-w-[140px] bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Valor"
                value={newMarkerValue}
                onChange={(e) => setNewMarkerValue(e.target.value)}
                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
              <input
                type="text"
                placeholder="Unid."
                value={newMarkerUnit}
                onChange={(e) => setNewMarkerUnit(e.target.value)}
                className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
              <input
                type="text"
                placeholder="Faixa Ótima"
                value={newMarkerOptimal}
                onChange={(e) => setNewMarkerOptimal(e.target.value)}
                className="w-36 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={addManualBiomarker}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-10 px-4 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
            <p className="text-sm font-semibold text-slate-200">
              Suba a foto ou PDF do exame de sangue para comparar com a Faixa Ótima Nutrológica
            </p>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              A IA extrai os marcadores automaticamente e traduz para o paciente na TV por que "estar dentro da referência comum" muitas vezes ainda gera cansaço ou trava metabólica.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload size={14} />
                <span>Enviar Exame (JPG/PNG/PDF)</span>
              </button>
              <button
                type="button"
                onClick={loadDemoLab}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold cursor-pointer"
              >
                Abrir Exame Demonstração (TV)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BLOCO 2: BIOIMPEDÂNCIA + RADAR METABÓLICO SVG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bioimpedância */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale size={16} className="text-emerald-600" />
              <span>Bioimpedância & Composição Corporal</span>
            </h3>
            {imcValue !== null && (
              <div className="text-xs font-mono tabular-nums text-slate-700">
                IMC: <strong>{imcValue.toFixed(1)}</strong>{' '}
                <span className={cn('font-sans font-semibold ml-1', getImcClassification(imcValue).tone)}>
                  ({getImcClassification(imcValue).label})
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Peso (kg)</label>
              <input
                type="text"
                value={data.peso_kg || ''}
                onChange={(e) => update({ peso_kg: e.target.value })}
                placeholder="Ex: 78.4"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Altura (cm)</label>
              <input
                type="text"
                value={data.altura_cm || ''}
                onChange={(e) => update({ altura_cm: e.target.value })}
                placeholder="Ex: 172"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">% Gordura Corporal</label>
              <input
                type="text"
                value={data.gordura_corporal_pct || ''}
                onChange={(e) => update({ gordura_corporal_pct: e.target.value })}
                placeholder="Ex: 24.5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Massa Muscular (kg)</label>
              <input
                type="text"
                value={data.massa_muscular_kg || ''}
                onChange={(e) => update({ massa_muscular_kg: e.target.value })}
                placeholder="Ex: 32.0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Gordura Visceral (Nível)</label>
              <input
                type="text"
                value={data.gordura_visceral || ''}
                onChange={(e) => update({ gordura_visceral: e.target.value })}
                placeholder="Ex: 9"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">TMB (kcal/dia)</label>
              <input
                type="text"
                value={data.tmb_kcal || ''}
                onChange={(e) => update({ tmb_kcal: e.target.value })}
                placeholder="Ex: 1640"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Objetivo Nutrológico Principal</label>
              <input
                type="text"
                value={data.objetivo_principal || ''}
                onChange={(e) => update({ objetivo_principal: e.target.value })}
                placeholder="Ex: Emagrecimento, Hipertrofia, Longevidade..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Circunferência Abdominal (cm)</label>
              <input
                type="text"
                value={data.circunferencia_abdominal_cm || ''}
                onChange={(e) => update({ circunferencia_abdominal_cm: e.target.value })}
                placeholder="Ex: 90"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* SVG Radar Metabólico */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame size={16} className="text-emerald-600" />
              <span>Radar Metabólico (1–10)</span>
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              Média {((radar.energia + radar.sono + radar.intestino + radar.glicemia + radar.imunidade) / 5).toFixed(1)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 my-auto pt-3">
            <svg width="220" height="210" viewBox="0 0 220 210" className="shrink-0">
              {[2.5, 5, 7.5, 10].map((level) => (
                <polygon
                  key={level}
                  points={radarAxes
                    .map((_, i) => {
                      const p = getPoint(i, level);
                      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              ))}
              {radarAxes.map((ax, i) => {
                const outer = getPoint(i, 10);
                const labelPos = getPoint(i, 12.2);
                return (
                  <g key={ax.key}>
                    <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#cbd5e1" strokeWidth="1" />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-600 text-[10px] font-semibold"
                    >
                      {ax.label}
                    </text>
                  </g>
                );
              })}
              <polygon
                points={radarPolygon}
                fill="rgba(16, 185, 129, 0.22)"
                stroke="#059669"
                strokeWidth="2"
              />
              {radarAxes.map((ax, i) => {
                const p = getPoint(i, radar[ax.key]);
                return <circle key={ax.key} cx={p.x} cy={p.y} r="3.5" fill="#059669" />;
              })}
            </svg>

            <div className="flex-1 w-full space-y-2.5">
              {radarAxes.map((ax) => (
                <div key={ax.key} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                    <span>{ax.label}</span>
                    <span className="font-mono tabular-nums text-emerald-700">{radar[ax.key]}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={radar[ax.key]}
                    onChange={(e) => updateRadar(ax.key, Number(e.target.value))}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 3: SUPLEMENTAÇÃO & PLANO ALIMENTAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Pill size={15} className="text-emerald-600" />
            <span>Prescrição Nutrológica & Suplementação Ativa</span>
          </label>
          <textarea
            rows={5}
            value={data.suplementacao_prescrita || ''}
            onChange={(e) => update({ suplementacao_prescrita: e.target.value })}
            placeholder="Fórmulas manipuladas, vitaminas, aminoácidos e horários..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Utensils size={15} className="text-emerald-600" />
            <span>Conduta Alimentar, Hábitos & Treino</span>
          </label>
          <textarea
            rows={5}
            value={data.plano_alimentar_orientacoes || ''}
            onChange={(e) => update({ plano_alimentar_orientacoes: e.target.value })}
            placeholder="Distribuição proteica, ciclo circadiano, intestino, atividade física..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <FileText size={15} className="text-slate-600" />
          <span>Observações Clínicas & Evolução</span>
        </label>
        <textarea
          rows={3}
          value={data.observacoes_clinicas || ''}
          onChange={(e) => update({ observacoes_clinicas: e.target.value })}
          placeholder="Histórico clínico, medicações em uso, metas para retorno em 45-60 dias..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
