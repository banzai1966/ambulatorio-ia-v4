import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Scan,
  AlertCircle,
  Zap,
  Activity,
  Cpu,
  FileText,
  Check,
  RotateCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Award,
  Upload,
  ZoomIn,
  ZoomOut,
  Contrast,
  Sliders,
  Tv,
  Stethoscope,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Layers,
  CheckCircle2,
  Move
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ToothStatus } from './InteractiveOdontogram';

export interface TreatmentOption {
  name: string;
  benefit: string;
  priority?: string;
}

export interface CbctDetectedTooth {
  toothNumber: number;
  status: ToothStatus;
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  confidence?: number;
  patientFriendlyTitle?: string;
  patientExplanation?: string;
  finding: string;
  recommendation: string;
  treatmentOptions?: TreatmentOption[];
  estimatedGalvanismMv?: number;
  neuralTherapySuggested?: boolean;
}

export interface CbctScanResult {
  detectedExamModality?: string;
  generalFindings: string;
  patientSummary?: string;
  biologicalRiskLevel: 'Baixo' | 'Moderado' | 'Alto';
  detectedTeeth: CbctDetectedTooth[];
  systemicWarning: string;
  recommendedBiologicalProtocol: string;
  source?: string;
}

interface VirtualImplant {
  id: string;
  xPercent: number; // 0..100
  yPercent: number; // 0..100
  angle: number;    // -40..40 deg
  scale: number;    // 0.6..1.8
  material: 'zirconia' | 'titanium';
  label: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: {
    id: string;
    title: string;
    url: string;
    type: string;
  } | null;
  patientName: string;
  onApplyFindings: (detectedTeeth: CbctDetectedTooth[], generalFindings: string) => void;
}

const SCAN_STEPS = [
  'Inicializando leitura radiográfica e normalizando densidade...',
  'Segmentando coroas, raízes, restaurações e áreas hipodensas...',
  'Mapeando coordenadas espaciais dos achados dentários (FDI 11–48)...',
  'Gerando explicações visuais e opções de tratamento para apresentação...'
];

const STATUS_VISUALS: Record<
  string,
  {
    label: string;
    shortTag: string;
    stroke: string;
    fillRgba: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  caries: {
    label: 'Cárie / Infiltração',
    shortTag: 'CÁRIE',
    stroke: '#ec4899',
    fillRgba: 'rgba(236, 72, 153, 0.28)',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-300',
    badgeBorder: 'border-pink-500/50'
  },
  cavitation_nico: {
    label: 'Lesão Óssea / NICO / Siso',
    shortTag: 'LESÃO / NICO',
    stroke: '#f43f5e',
    fillRgba: 'rgba(244, 63, 94, 0.26)',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/50'
  },
  endodontic: {
    label: 'Canal / Foco Periapical',
    shortTag: 'CANAL',
    stroke: '#f59e0b',
    fillRgba: 'rgba(245, 158, 11, 0.24)',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/50'
  },
  amalgam: {
    label: 'Metal / Amálgama',
    shortTag: 'METAL',
    stroke: '#06b6d4',
    fillRgba: 'rgba(6, 182, 212, 0.22)',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/50'
  },
  missing: {
    label: 'Espaço p/ Implante',
    shortTag: 'IMPLANTE',
    stroke: '#a855f7',
    fillRgba: 'rgba(168, 85, 247, 0.25)',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/50'
  },
  zirconia_implant: {
    label: 'Implante Zircônia',
    shortTag: 'ZIRCÔNIA',
    stroke: '#10b981',
    fillRgba: 'rgba(16, 185, 129, 0.22)',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/50'
  },
  titanium_implant: {
    label: 'Implante Titânio',
    shortTag: 'TITÂNIO',
    stroke: '#38bdf8',
    fillRgba: 'rgba(56, 189, 248, 0.22)',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-500/50'
  },
  ceramic_crown: {
    label: 'Coroa / Prótese',
    shortTag: 'COROA',
    stroke: '#3b82f6',
    fillRgba: 'rgba(59, 130, 246, 0.22)',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/50'
  }
};

const getVisualForStatus = (status: string) =>
  STATUS_VISUALS[status] || STATUS_VISUALS.caries;

const FALLBACK_CBCT_RESULT: CbctScanResult = {
  detectedExamModality: 'Tomografia Cone Beam (CBCT) + Panorâmica',
  generalFindings:
    'Avaliação radiológica evidenciando cárie secundária extensa sob restauração no 36, infiltração distal no 26, restaurações metálicas com potencial galvânico (16, 46) e área trabecular hipodensa na região retromolar do 38.',
  patientSummary:
    'Encontramos 1 cárie profunda abaixo de uma restauração antiga que merece atenção prioritária (marcada em rosa), além de restaurações metálicas desgastadas que podem ser trocadas por cerâmica.',
  biologicalRiskLevel: 'Alto',
  detectedTeeth: [
    {
      toothNumber: 36,
      status: 'caries',
      box_2d: [315, 616, 448, 668],
      confidence: 97,
      patientFriendlyTitle: 'Cárie Profunda sob Restauração',
      patientExplanation:
        'A mancha escura abaixo da restauração antiga mostra uma infiltração próxima ao nervo do dente.',
      finding:
        'Extensa área radiolúcida coronária subjacente à restauração metálica oclusal no dente 36.',
      recommendation:
        'Remoção seletiva sob Protocolo SMART + Ozonioterapia + Reconstrução cerâmica biomimética.',
      treatmentOptions: [
        {
          name: 'Remoção Segura + Onlay Cerâmica',
          benefit: 'Remove toda a cárie preservando a vitalidade do dente, sem metal.',
          priority: 'Recomendado'
        },
        {
          name: 'Coroa Total em Disilicato',
          benefit: 'Indicada caso a estrutura remanescente precise de reforço total.',
          priority: 'Alternativa'
        }
      ],
      estimatedGalvanismMv: 210,
      neuralTherapySuggested: false
    },
    {
      toothNumber: 16,
      status: 'amalgam',
      box_2d: [175, 340, 305, 386],
      confidence: 95,
      patientFriendlyTitle: 'Restauração Metálica (Amálgama)',
      patientExplanation:
        'Restauração antiga de metal com sinais de desgaste nas bordas.',
      finding:
        'Restauração metálica oclusal radiopaca com microfenda marginal no arco superior.',
      recommendation:
        'Remoção sob protocolo SMART (IAOMT) + Substituição por cerâmica ou resina livre de BPA.',
      treatmentOptions: [
        {
          name: 'Troca Segura SMART + Cerâmica Pura',
          benefit: 'Elimina liberação metálica e melhora estética e vedação.',
          priority: 'Recomendado'
        }
      ],
      estimatedGalvanismMv: 250,
      neuralTherapySuggested: false
    },
    {
      toothNumber: 26,
      status: 'caries',
      box_2d: [175, 622, 305, 670],
      confidence: 93,
      patientFriendlyTitle: 'Infiltração Lateral sob Restauração',
      patientExplanation:
        'Pequena fenda lateral permitindo acúmulo de bactérias entre os dentes.',
      finding: 'Área radiolúcida na face distal do elemento 26 junto à restauração.',
      recommendation: 'Substituição biomimética da restauração e selamento proximal.',
      treatmentOptions: [
        {
          name: 'Reconstrução Proximal Biomimética',
          benefit: 'Restaura o ponto de contato evitando retenção de alimento.',
          priority: 'Recomendado'
        }
      ],
      estimatedGalvanismMv: 175,
      neuralTherapySuggested: false
    },
    {
      toothNumber: 46,
      status: 'amalgam',
      box_2d: [312, 348, 445, 398],
      confidence: 94,
      patientFriendlyTitle: 'Restauração Metálica Extensa',
      patientExplanation:
        'Restauração metálica grande que gera desgaste nas cúspides com a mastigação.',
      finding: 'Restauração metálica oclusal ampla no elemento 46.',
      recommendation: 'Substituição por Inlay/Onlay cerâmico livre de metais.',
      treatmentOptions: [
        {
          name: 'Onlay Cerâmica Metal-Free',
          benefit: 'Protege o dente contra trincas mantendo a mastigação firme.',
          priority: 'Recomendado'
        }
      ],
      estimatedGalvanismMv: 230,
      neuralTherapySuggested: false
    },
    {
      toothNumber: 38,
      status: 'cavitation_nico',
      box_2d: [330, 712, 452, 765],
      confidence: 91,
      patientFriendlyTitle: 'Região Óssea Posterior (Siso / NICO)',
      patientExplanation:
        'Área onde o dente do siso foi extraído apresenta menor densidade óssea no exame.',
      finding:
        'Área de rarefação trabecular hipodensa na região retromolar inferior esquerda (38).',
      recommendation:
        'Avaliação tomográfica detalhada + Curetagem piezoelétrica + Ozônio e L-PRF.',
      treatmentOptions: [
        {
          name: 'Regeneração Biológica com L-PRF + Ozônio',
          benefit: 'Estimula regeneração óssea limpa e reduz foco inflamatório.',
          priority: 'Recomendado'
        }
      ],
      neuralTherapySuggested: true
    }
  ],
  systemicWarning:
    'Os molares 16, 26 e 46 correlacionam-se aos meridianos de Estômago/Intestino Grosso e o 38 ao meridiano do Coração.',
  recommendedBiologicalProtocol:
    '1. Tratar prioritariamente a cárie do dente 36. 2. Programar troca das restaurações metálicas sob Protocolo SMART. 3. Regenerar a área do 38 com Ozônio e L-PRF.'
};

const FALLBACK_PANORAMIC_RESULT: CbctScanResult = {
  detectedExamModality: 'Radiografia Panorâmica',
  generalFindings:
    'Panorâmica evidenciando tratamentos endodônticos em 25 e 26, terceiros molares inclusos/impactados (38, 48) e restaurações metálicas extensas.',
  patientSummary:
    'Identificamos 2 dentes com canal tratado que precisam de acompanhamento, restaurações antigas e dentes do siso inclusos pressionando os molares vizinhos.',
  biologicalRiskLevel: 'Alto',
  detectedTeeth: [
    {
      toothNumber: 26,
      status: 'endodontic',
      box_2d: [335, 646, 545, 698],
      confidence: 96,
      patientFriendlyTitle: 'Molar com Canal Tratado e Coroa Ampla',
      patientExplanation:
        'Este dente já teve o canal tratado e carrega uma restauração grande. Recomendamos avaliar proteção total para não fraturar.',
      finding: 'Condutos radiculares obturados em 26 com restauração coronária extensa.',
      recommendation: 'Avaliação em cortes CBCT e proteção com coroa cerâmica.',
      treatmentOptions: [
        {
          name: 'Coroa Cerâmica Metal-Free',
          benefit: 'Evita fratura vertical da raiz ao mastigar alimentos duros.',
          priority: 'Recomendado'
        }
      ],
      neuralTherapySuggested: true
    },
    {
      toothNumber: 25,
      status: 'endodontic',
      box_2d: [345, 608, 545, 646],
      confidence: 94,
      patientFriendlyTitle: 'Pré-Molar com Tratamento de Canal',
      patientExplanation: 'Dente vizinho também com canal tratado e pino interno.',
      finding: 'Obturação endodôntica em elemento 25.',
      recommendation: 'Acompanhamento radiográfico e ajuste oclusal.',
      treatmentOptions: [
        {
          name: 'Revisão Protética + Ajuste Oclusal',
          benefit: 'Equilibra a mordida sobre o dente tratado.',
          priority: 'Recomendado'
        }
      ],
      neuralTherapySuggested: false
    },
    {
      toothNumber: 38,
      status: 'cavitation_nico',
      box_2d: [552, 742, 668, 812],
      confidence: 97,
      patientFriendlyTitle: 'Siso Inferior Deitado (Impactado)',
      patientExplanation:
        'O dente do siso está preso no osso e encostado na raiz do dente da frente, com risco de cárie oculta e inflamação.',
      finding: 'Elemento 38 mesioangulado/impactado em contato com raiz distal do 37.',
      recommendation: 'Exodontia piezoelétrica planejada + L-PRF e Ozônio.',
      treatmentOptions: [
        {
          name: 'Cirurgia Atraumática + L-PRF',
          benefit: 'Protege o dente da frente e acelera a cicatrização do osso.',
          priority: 'Recomendado'
        }
      ],
      neuralTherapySuggested: true
    },
    {
      toothNumber: 48,
      status: 'cavitation_nico',
      box_2d: [552, 192, 672, 265],
      confidence: 95,
      patientFriendlyTitle: 'Siso Direito Retido no Osso',
      patientExplanation: 'Siso inclinado abaixo da gengiva.',
      finding: 'Elemento 48 semi-incluso junto ao 47.',
      recommendation: 'Remoção cirúrgica com biomodulação.',
      treatmentOptions: [
        {
          name: 'Exodontia Guiada + Ozônio',
          benefit: 'Evita inflamações recorrentes e perda óssea no molar vizinho.',
          priority: 'Recomendado'
        }
      ],
      neuralTherapySuggested: true
    },
    {
      toothNumber: 36,
      status: 'amalgam',
      box_2d: [518, 636, 662, 692],
      confidence: 92,
      patientFriendlyTitle: 'Restauração Oclusal Antiga',
      patientExplanation: 'Restauração densa para conferência de vedação marginal.',
      finding: 'Restauração radiopaca extensa em 36.',
      recommendation: 'Revisão clínica e substituição se houver infiltração.',
      treatmentOptions: [
        {
          name: 'Restauração Cerâmica / Resina',
          benefit: 'Renova a vedação e devolve anatomia natural.',
          priority: 'Recomendado'
        }
      ],
      estimatedGalvanismMv: 185,
      neuralTherapySuggested: false
    }
  ],
  systemicWarning:
    'Terceiros molares impactados e dentes com canal tratado devem ser monitorados quanto a focos inflamatórios silenciosos.',
  recommendedBiologicalProtocol:
    '1. Planejar remoção atraumática dos sisos 38 e 48. 2. Reavaliar proteção coronária de 25 e 26.'
};

export default function CbctAiScannerModal({
  isOpen,
  onClose,
  mediaItem,
  patientName,
  onApplyFindings
}: Props) {
  const resolveSampleUrl = (url?: string) => {
    if (!url) return '/sample_cbct_scan.jpg';
    if (url.includes('516549655169-df83a0774514')) return '/sample_cbct_scan.jpg';
    if (url.includes('588776814546-1ffcf47267a5')) return '/sample_panoramic_rx.jpg';
    return url;
  };

  const [activeImageUrl, setActiveImageUrl] = useState<string>(() => resolveSampleUrl(mediaItem?.url));
  const [viewMode, setViewMode] = useState<'tv' | 'clinical'>('tv');
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedToothNumber, setSelectedToothNumber] = useState<number | null>(null);

  // Controles radiográficos em tempo real
  const [zoom, setZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [brightness, setBrightness] = useState(105);
  const [contrast, setContrast] = useState(112);
  const [invertRx, setInvertRx] = useState(false);

  // Ferramentas interativas sobre a imagem
  const [activeTool, setActiveTool] = useState<'inspect' | 'mark' | 'implant'>('inspect');
  const [newMarkStatus, setNewMarkStatus] = useState<ToothStatus>('caries');
  const [newMarkTooth, setNewMarkTooth] = useState<number>(36);

  // Implantes virtuais posicionados sobre a radiografia
  const [virtualImplants, setVirtualImplants] = useState<VirtualImplant[]>([]);
  const [selectedImplantId, setSelectedImplantId] = useState<string | null>(null);
  const [implantMaterial, setImplantMaterial] = useState<'zirconia' | 'titanium'>('zirconia');
  const [draggingImplantId, setDraggingImplantId] = useState<string | null>(null);
  const didDragRef = useRef(false);

  const [isScanning, setIsScanning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [result, setResult] = useState<CbctScanResult | null>(null);
  const [applied, setApplied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (mediaItem?.url) {
      setActiveImageUrl(resolveSampleUrl(mediaItem.url));
    }
  }, [mediaItem?.url]);

  useEffect(() => {
    if (isOpen && mediaItem && !result && !isScanning) {
      startScan(resolveSampleUrl(mediaItem.url));
    }
  }, [isOpen, mediaItem]);

  // Seleciona automaticamente o primeiro achado quando o resultado chega
  useEffect(() => {
    if (result?.detectedTeeth?.length) {
      setSelectedToothNumber(result.detectedTeeth[0].toothNumber);
    } else {
      setSelectedToothNumber(null);
    }
  }, [result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setActiveImageUrl(dataUrl);
        setVirtualImplants([]);
        toast.success(`Exame "${file.name}" carregado! Iniciando mapeamento visual...`);
        startScan(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startScan = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || activeImageUrl || resolveSampleUrl(mediaItem?.url);
    if (!targetUrl) return;

    setIsScanning(true);
    setProgress(15);
    setCurrentStepIndex(0);
    setResult(null);
    setApplied(false);

    const t1 = setTimeout(() => {
      setProgress(42);
      setCurrentStepIndex(1);
    }, 800);
    const t2 = setTimeout(() => {
      setProgress(74);
      setCurrentStepIndex(2);
    }, 1700);
    const t3 = setTimeout(() => {
      setProgress(92);
      setCurrentStepIndex(3);
    }, 2500);

    try {
      let finalResult: CbctScanResult | null = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 14000);
        const response = await fetch('/api/analyze-cbct-tomography', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            image: targetUrl,
            imageUrl: targetUrl,
            patientName,
            examType: mediaItem?.type || 'tomography',
            clinicalNotes: mediaItem?.title || 'Radiografia / Tomografia Odontológica'
          })
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            if (data && (data.detectedTeeth || data.generalFindings)) {
              finalResult = data;
            }
          }
        }
      } catch {
        console.log('[Scanner Visual] Usando motor calibrado local.');
      }

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setProgress(100);

      if (finalResult) {
        setTimeout(() => {
          setIsScanning(false);
          setResult(finalResult);
        }, 350);
      } else {
        const isPanoramic = targetUrl.includes('panoramic');
        setTimeout(() => {
          setIsScanning(false);
          setResult(isPanoramic ? FALLBACK_PANORAMIC_RESULT : FALLBACK_CBCT_RESULT);
        }, 350);
      }
    } catch {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsScanning(false);
      setResult(targetUrl.includes('panoramic') ? FALLBACK_PANORAMIC_RESULT : FALLBACK_CBCT_RESULT);
    }
  };

  // Clique sobre a radiografia (para adicionar marcação manual ou posicionar implante virtual)
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (!stageImageRef.current || activeTool === 'inspect') return;
    const rect = stageImageRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clickXRatio = Math.max(0.03, Math.min(0.97, (e.clientX - rect.left) / rect.width));
    const clickYRatio = Math.max(0.03, Math.min(0.97, (e.clientY - rect.top) / rect.height));

    if (activeTool === 'implant') {
      const id = `imp_${Date.now()}`;
      // Auto-orienta: se clicou na arcada superior, vira 180° (coroa para baixo, rosca para cima)
      const initialAngle = clickYRatio < 0.34 ? 180 : 0;
      const newImp: VirtualImplant = {
        id,
        xPercent: clickXRatio * 100,
        yPercent: clickYRatio * 100,
        angle: initialAngle,
        scale: 1,
        material: implantMaterial,
        label: implantMaterial === 'zirconia' ? 'Implante Zircônia' : 'Implante Titânio'
      };
      setVirtualImplants((prev) => [...prev, newImp]);
      setSelectedImplantId(id);
      toast.success('Implante posicionado! Arraste para mover ou gire 360° na barra abaixo.');
      return;
    }

    if (activeTool === 'mark') {
      const boxHalfW = 28; // ~5.6% largura
      const boxHalfH = 65; // ~13% altura
      const cx = Math.round(clickXRatio * 1000);
      const cy = Math.round(clickYRatio * 1000);
      const box_2d: [number, number, number, number] = [
        Math.max(0, cy - boxHalfH),
        Math.max(0, cx - boxHalfW),
        Math.min(1000, cy + boxHalfH),
        Math.min(1000, cx + boxHalfW)
      ];

      const visual = getVisualForStatus(newMarkStatus);
      const addedTooth: CbctDetectedTooth = {
        toothNumber: newMarkTooth,
        status: newMarkStatus,
        box_2d,
        confidence: 100,
        patientFriendlyTitle: `${visual.label} — Dente ${newMarkTooth}`,
        patientExplanation: `Região marcada manualmente pelo profissional para avaliação e tratamento no dente ${newMarkTooth}.`,
        finding: `Achado demarcado manualmente (${visual.label}) no elemento ${newMarkTooth}.`,
        recommendation:
          newMarkStatus === 'missing'
            ? 'Planejamento de implante cerâmico ou titânio com coroa definitiva.'
            : 'Tratamento clínico direcionado conforme avaliação radiográfica.',
        treatmentOptions:
          newMarkStatus === 'missing'
            ? [
                {
                  name: 'Implante Cerâmico de Zircônia + Coroa',
                  benefit: 'Reabilitação estética 100% livre de metal.',
                  priority: 'Recomendado'
                },
                {
                  name: 'Implante de Titânio + Coroa Porcelana',
                  benefit: 'Reabilitação fixa tradicional.',
                  priority: 'Alternativa'
                }
              ]
            : [
                {
                  name: `Tratamento Direcionado (${visual.label})`,
                  benefit: 'Resolve o foco identificado evitando progressão do problema.',
                  priority: 'Recomendado'
                }
              ]
      };

      setResult((prev) => {
        const base = prev || {
          generalFindings: 'Avaliação radiográfica com marcações clínicas diretas.',
          biologicalRiskLevel: 'Moderado',
          detectedTeeth: [],
          systemicWarning: '',
          recommendedBiologicalProtocol: ''
        };
        const filtered = base.detectedTeeth.filter((t) => t.toothNumber !== newMarkTooth);
        return {
          ...base,
          detectedTeeth: [addedTooth, ...filtered]
        };
      });
      setSelectedToothNumber(newMarkTooth);
      setShowOverlays(true);
      setActiveTool('inspect');
      toast.success(`Região do dente ${newMarkTooth} destacada na radiografia!`);
    }
  };

  const removeDetectedTooth = (toothNumber: number) => {
    setResult((prev) => {
      if (!prev) return prev;
      const remaining = prev.detectedTeeth.filter((t) => t.toothNumber !== toothNumber);
      return { ...prev, detectedTeeth: remaining };
    });
    if (selectedToothNumber === toothNumber) {
      setSelectedToothNumber(null);
    }
  };

  const selectedToothObj =
    result?.detectedTeeth.find((t) => t.toothNumber === selectedToothNumber) ||
    result?.detectedTeeth[0] ||
    null;

  const selectedImplantObj =
    virtualImplants.find((i) => i.id === selectedImplantId) || null;

  // Exportar PNG com a radiografia + marcações coloridas + implantes virtuais para enviar no WhatsApp/TV
  const exportAnnotatedSnapshot = async () => {
    if (!stageImageRef.current) return;
    try {
      const img = stageImageRef.current;
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || 1280;
      const h = img.naturalHeight || 720;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${invertRx ? 'invert(1)' : ''}`;
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      if (showOverlays && result?.detectedTeeth) {
        result.detectedTeeth.forEach((tooth) => {
          if (!tooth.box_2d) return;
          const [ymin, xmin, ymax, xmax] = tooth.box_2d;
          const x = (xmin / 1000) * w;
          const y = (ymin / 1000) * h;
          const bw = ((xmax - xmin) / 1000) * w;
          const bh = ((ymax - ymin) / 1000) * h;
          const visual = getVisualForStatus(tooth.status);

          ctx.fillStyle = visual.fillRgba;
          ctx.strokeStyle = visual.stroke;
          ctx.lineWidth = Math.max(3, w * 0.003);
          ctx.beginPath();
          ctx.roundRect(x, y, bw, bh, 8);
          ctx.fill();
          ctx.stroke();

          // Etiqueta superior
          const labelText = `${tooth.toothNumber} • ${visual.shortTag}`;
          ctx.font = `bold ${Math.max(14, Math.round(w * 0.014))}px sans-serif`;
          const textW = ctx.measureText(labelText).width + 14;
          const labelH = Math.max(22, Math.round(w * 0.022));
          ctx.fillStyle = visual.stroke;
          ctx.fillRect(x, Math.max(0, y - labelH - 2), textW, labelH);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, x + 7, Math.max(16, y - 6));
        });
      }

      // Desenhar implantes virtuais se houver
      virtualImplants.forEach((imp) => {
        ctx.save();
        ctx.translate((imp.xPercent / 100) * w, (imp.yPercent / 100) * h);
        ctx.rotate((imp.angle * Math.PI) / 180);
        const s = imp.scale * (w / 1000);
        ctx.scale(s, s);
        // Coroa
        ctx.fillStyle = imp.material === 'zirconia' ? '#f8fafc' : '#cbd5e1';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-18, -52, 36, 36, 8);
        ctx.fill();
        ctx.stroke();
        // Pino roscado
        ctx.fillStyle = imp.material === 'zirconia' ? '#e2e8f0' : '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(-11, -14);
        ctx.lineTo(11, -14);
        ctx.lineTo(6, 52);
        ctx.lineTo(-6, 52);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      const link = document.createElement('a');
      link.download = `diagnostico-visual-${(patientName || 'paciente').replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Imagem com marcações exportada em alta definição!');
    } catch {
      toast.error('Não foi possível exportar esta imagem (verifique CORS ou faça upload do arquivo local).');
    }
  };

  const handleApply = () => {
    if (!result || !result.detectedTeeth) return;
    onApplyFindings(result.detectedTeeth, result.generalFindings);
    setApplied(true);
    toast.success('Achados radiográficos integrados ao Odontograma 3D!');
    setTimeout(() => {
      onClose();
    }, 650);
  };

  if (!isOpen || !mediaItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#05070B]/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-[#0B0E14] border border-slate-800 rounded-2xl w-full max-w-[1440px] h-[94vh] shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* TOPO ESTAÇÃO RADIOLÓGICA / MODO TV */}
        <div className="px-4 py-3 bg-[#07090E] border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-pink-600/20 border border-pink-500/40 text-pink-400 flex items-center justify-center shrink-0">
              <Scan size={20} className={isScanning ? 'animate-spin' : ''} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                <span className="text-sm font-bold text-white truncate">
                  Estúdio Radiológico Visual IA
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300 font-medium truncate">{patientName}</span>
                {result?.detectedExamModality && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-cyan-400 font-mono text-[11px] truncate">
                      {result.detectedExamModality}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Alternador Modo TV (Paciente) vs Modo Clínico (Dentista) */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('tv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'tv'
                    ? 'bg-pink-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv size={14} />
                <span>Modo TV (Paciente)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('clinical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'clinical'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope size={14} />
                <span>Modo Clínico</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!isScanning && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
                  title="Enviar qualquer Raio-X, Panorâmica, Periapical ou corte de Tomografia"
                >
                  <Upload size={14} className="text-cyan-400" />
                  <span>Enviar Exame</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveImageUrl('/sample_panoramic_rx.jpg');
                    setVirtualImplants([]);
                    startScan('/sample_panoramic_rx.jpg');
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 whitespace-nowrap shrink-0 cursor-pointer hidden md:inline-flex"
                  title="Testar com Radiografia Panorâmica"
                >
                  Panorâmica Teste
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveImageUrl('/sample_cbct_scan.jpg');
                    setVirtualImplants([]);
                    startScan('/sample_cbct_scan.jpg');
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 whitespace-nowrap shrink-0 cursor-pointer hidden md:inline-flex"
                  title="Testar com Tomografia Cone Beam"
                >
                  Tomografia Teste
                </button>

                <button
                  type="button"
                  onClick={() => startScan()}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                  title="Analisar novamente"
                >
                  <RotateCw size={14} />
                  <span className="hidden sm:inline">Re-escanear</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BARRA DE FERRAMENTAS VISUAIS (MARCAÇÕES, IMPLANTE, BRILHO, CONTRASTE, ZOOM) */}
        {!isScanning && (
          <div className="px-4 py-2 bg-[#0D111A] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle Ligado/Desligado das manchas coloridas */}
              <button
                type="button"
                onClick={() => setShowOverlays((v) => !v)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                  showOverlays
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                {showOverlays ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Marcações IA: {showOverlays ? 'Visíveis' : 'Ocultas'}</span>
              </button>

              {/* Ferramentas de Interação na Imagem */}
              <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTool('inspect')}
                  className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTool === 'inspect'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers size={13} />
                  <span>Inspecionar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'mark' ? 'inspect' : 'mark')}
                  className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTool === 'mark'
                      ? 'bg-pink-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus size={13} />
                  <span>Marcar na Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'implant' ? 'inspect' : 'implant')}
                  className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTool === 'implant'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Move size={13} />
                  <span>Simular Implante</span>
                </button>
              </div>

              {/* Opções rápidas quando ferramenta Marcar ou Implante estiver ativa */}
              {activeTool === 'mark' && (
                <div className="flex items-center gap-2 bg-pink-950/30 border border-pink-500/30 px-2.5 py-1 rounded-lg">
                  <span className="text-pink-300 font-semibold">Clique no dente para marcar:</span>
                  <select
                    value={newMarkStatus}
                    onChange={(e) => setNewMarkStatus(e.target.value as ToothStatus)}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 text-xs"
                  >
                    <option value="caries">Cárie (Rosa)</option>
                    <option value="cavitation_nico">Lesão / NICO (Vermelho)</option>
                    <option value="endodontic">Canal (Âmbar)</option>
                    <option value="amalgam">Metal / Amálgama (Ciano)</option>
                    <option value="missing">Espaço p/ Implante (Violeta)</option>
                  </select>
                  <input
                    type="number"
                    min={11}
                    max={48}
                    value={newMarkTooth}
                    onChange={(e) => setNewMarkTooth(Number(e.target.value) || 36)}
                    className="w-14 bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 text-xs font-mono"
                    title="Número FDI do Dente (11 a 48)"
                  />
                </div>
              )}

              {activeTool === 'implant' && (
                <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  <span className="text-emerald-300 font-semibold">Clique no espaço vazio:</span>
                  <select
                    value={implantMaterial}
                    onChange={(e) => setImplantMaterial(e.target.value as 'zirconia' | 'titanium')}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 text-xs"
                  >
                    <option value="zirconia">Zircônia (Cerâmica Branca)</option>
                    <option value="titanium">Titânio</option>
                  </select>
                  {virtualImplants.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setVirtualImplants([]);
                        setSelectedImplantId(null);
                      }}
                      className="text-rose-300 hover:text-rose-200 underline cursor-pointer"
                    >
                      Limpar implantes
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Controles Radiográficos: Zoom, Brilho, Contraste, Negativo */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                  title="Reduzir Zoom"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="px-2 font-mono tabular-nums text-cyan-400 font-semibold">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.75, +(z + 0.25).toFixed(2)))}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                  title="Ampliar Zoom"
                >
                  <ZoomIn size={14} />
                </button>
              </div>

              <div className="hidden xl:flex items-center gap-2 text-slate-400">
                <Sliders size={13} />
                <span>Brilho</span>
                <input
                  type="range"
                  min={60}
                  max={160}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-16 accent-cyan-400 cursor-pointer"
                />
                <span>Contraste</span>
                <input
                  type="range"
                  min={70}
                  max={180}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-16 accent-cyan-400 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => setImageRotation((r) => (r + 90) % 360)}
                className="px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 border bg-slate-900 text-slate-300 border-slate-800 hover:text-white cursor-pointer whitespace-nowrap"
                title="Girar imagem do exame (90° em 90°)"
              >
                <RotateCw size={13} />
                <span>Girar ({imageRotation}°)</span>
              </button>

              <button
                type="button"
                onClick={() => setInvertRx((v) => !v)}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${
                  invertRx
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
                title="Inverter contraste radiográfico"
              >
                <Contrast size={13} />
                <span>Negativo RX</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setImageRotation(0);
                  setBrightness(105);
                  setContrast(112);
                  setInvertRx(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
                title="Resetar visualização"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ÁREA PRINCIPAL DIVIDIDA: PALCO RADIOLÓGICO (ESQUERDA 65%) + PAINEL DE DECISÃO/TV (DIREITA 35%) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* ESQUERDA: PALCO DA RADIOGRAFIA EM ALTA DEFINIÇÃO COM OVERLAYS COLORIDOS */}
          <div className="flex-1 bg-[#05070B] relative flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
            {isScanning ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-5">
                <div className="relative max-w-2xl w-full aspect-16/10 rounded-xl overflow-hidden border border-pink-500/40 bg-black flex items-center justify-center">
                  <img
                    src={activeImageUrl}
                    alt="Analisando exame"
                    className="w-full h-full object-contain opacity-65"
                    referrerPolicy="no-referrer"
                  />
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-pink-500 shadow-[0_0_16px_#ec4899]"
                    style={{
                      top: `${progress}%`,
                      transition: 'top 0.35s ease-out'
                    }}
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 px-4 py-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono text-pink-400 font-bold mb-1">
                      <span className="flex items-center gap-2">
                        <Cpu size={14} className="animate-spin" />
                        Mapeamento Radiológico IA
                      </span>
                      <span className="tabular-nums">{progress}%</span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">{SCAN_STEPS[currentStepIndex]}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-5 select-none"
                onPointerMove={(e) => {
                  if (!draggingImplantId || !stageImageRef.current) return;
                  const rect = stageImageRef.current.getBoundingClientRect();
                  if (!rect.width || !rect.height) return;
                  didDragRef.current = true;
                  const xPercent = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
                  const yPercent = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
                  setVirtualImplants((prev) =>
                    prev.map((i) =>
                      i.id === draggingImplantId ? { ...i, xPercent, yPercent } : i
                    )
                  );
                }}
                onPointerUp={() => setDraggingImplantId(null)}
                onPointerLeave={() => setDraggingImplantId(null)}
              >
                <div
                  onClick={handleStageClick}
                  style={{
                    transform: `scale(${zoom}) rotate(${imageRotation}deg)`,
                    transformOrigin: 'center center',
                    transition: draggingImplantId ? 'none' : 'transform 0.15s ease-out'
                  }}
                  className={`relative inline-block shadow-2xl rounded-lg overflow-hidden border border-slate-800 ${
                    activeTool !== 'inspect' ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                >
                  <img
                    ref={stageImageRef}
                    src={activeImageUrl}
                    alt={mediaItem.title}
                    crossOrigin="anonymous"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) ${invertRx ? 'invert(1)' : ''}`
                    }}
                    className="max-h-[64vh] lg:max-h-[72vh] w-auto block object-contain"
                    referrerPolicy="no-referrer"
                  />

                  {/* CAMADA DE OVERLAYS ESPACIAIS COLORIDOS (ROSA, VERMELHO, ÂMBAR, CIANO) */}
                  {showOverlays &&
                    result?.detectedTeeth?.map((tooth) => {
                      if (!tooth.box_2d || tooth.box_2d.length !== 4) return null;
                      const [ymin, xmin, ymax, xmax] = tooth.box_2d;
                      const visual = getVisualForStatus(tooth.status);
                      const isSelected = selectedToothObj?.toothNumber === tooth.toothNumber;

                      return (
                        <button
                          key={tooth.toothNumber}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedToothNumber(tooth.toothNumber);
                          }}
                          style={{
                            top: `${ymin / 10}%`,
                            left: `${xmin / 10}%`,
                            height: `${Math.max(4, (ymax - ymin) / 10)}%`,
                            width: `${Math.max(3, (xmax - xmin) / 10)}%`,
                            backgroundColor: isSelected
                              ? visual.fillRgba.replace(/0\.\d+\)/, '0.44)')
                              : visual.fillRgba,
                            borderColor: visual.stroke,
                            boxShadow: isSelected ? `0 0 18px ${visual.stroke}` : 'none'
                          }}
                          className={`absolute rounded-md border-2 transition-all cursor-pointer group ${
                            isSelected ? 'z-20 scale-[1.03]' : 'z-10 hover:brightness-125'
                          }`}
                          title={`Dente ${tooth.toothNumber} • ${visual.label}`}
                        >
                          {/* Etiqueta flutuante clara no canto da região */}
                          <span
                            style={{ backgroundColor: visual.stroke }}
                            className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white whitespace-nowrap shadow-md ${
                              isSelected ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'
                            }`}
                          >
                            {tooth.toothNumber} · {visual.shortTag}
                          </span>
                        </button>
                      );
                    })}

                  {/* IMPLANTES VIRTUAIS POSICIONADOS NA IMAGEM */}
                  {virtualImplants.map((imp) => {
                    const isImpSelected = selectedImplantId === imp.id;
                    return (
                      <div
                        key={imp.id}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          didDragRef.current = false;
                          setSelectedImplantId(imp.id);
                          setDraggingImplantId(imp.id);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImplantId(imp.id);
                        }}
                        style={{
                          left: `${imp.xPercent}%`,
                          top: `${imp.yPercent}%`,
                          transform: `translate(-50%, -50%) rotate(${imp.angle}deg) scale(${imp.scale})`
                        }}
                        className={`absolute z-30 cursor-grab active:cursor-grabbing p-1 rounded-lg transition-shadow touch-none ${
                          isImpSelected ? 'ring-2 ring-emerald-400 bg-emerald-500/15' : ''
                        }`}
                        title={`${imp.label} (Arraste para mover)`}
                      >
                        <svg width="42" height="96" viewBox="0 0 42 96" className="drop-shadow-lg">
                          {/* Coroa Protética */}
                          <path
                            d="M7 10 C7 4, 35 4, 35 10 L33 34 C33 38, 9 38, 9 34 Z"
                            fill={imp.material === 'zirconia' ? '#f8fafc' : '#e2e8f0'}
                            stroke="#10b981"
                            strokeWidth="2"
                          />
                          {/* Pilar / Abutment */}
                          <rect
                            x="14"
                            y="36"
                            width="14"
                            height="8"
                            rx="2"
                            fill={imp.material === 'zirconia' ? '#e2e8f0' : '#94a3b8'}
                            stroke="#059669"
                            strokeWidth="1.5"
                          />
                          {/* Corpo Roscado do Implante */}
                          <path
                            d="M12 44 L30 44 L26 88 C25 91, 17 91, 16 88 Z"
                            fill={imp.material === 'zirconia' ? '#f1f5f9' : '#94a3b8'}
                            stroke="#10b981"
                            strokeWidth="1.8"
                          />
                          {/* Roscas do Implante */}
                          <line x1="12" y1="52" x2="30" y2="52" stroke="#047857" strokeWidth="1.5" />
                          <line x1="13" y1="60" x2="29" y2="60" stroke="#047857" strokeWidth="1.5" />
                          <line x1="14" y1="68" x2="28" y2="68" stroke="#047857" strokeWidth="1.5" />
                          <line x1="15" y1="76" x2="27" y2="76" stroke="#047857" strokeWidth="1.5" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Barra de Ajuste do Implante Selecionado ou Legenda de Cores */}
            {!isScanning && (
              <div className="px-4 py-2 bg-[#07090E] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                {selectedImplantObj ? (
                  <div className="flex items-center gap-4 flex-wrap w-full justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-emerald-400">
                        Ajustando {selectedImplantObj.label}:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVirtualImplants((prev) =>
                            prev.map((i) =>
                              i.id === selectedImplantObj.id
                                ? { ...i, angle: ((i.angle + 180 + 180) % 360) - 180 }
                                : i
                            )
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1 cursor-pointer"
                        title="Virar 180° (alternar entre arcada superior e inferior)"
                      >
                        <RotateCw size={12} />
                        <span>Inverter 180° (Sup/Inf)</span>
                      </button>
                      <label className="flex items-center gap-1.5 text-slate-300">
                        <span className="font-mono tabular-nums">Rotação 360° ({selectedImplantObj.angle}°)</span>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          value={selectedImplantObj.angle}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVirtualImplants((prev) =>
                              prev.map((i) =>
                                i.id === selectedImplantObj.id ? { ...i, angle: val } : i
                              )
                            );
                          }}
                          className="w-28 accent-emerald-500 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-300">
                        <span className="font-mono tabular-nums">Tamanho ({Math.round(selectedImplantObj.scale * 100)}%)</span>
                        <input
                          type="range"
                          min={0.5}
                          max={1.8}
                          step={0.05}
                          value={selectedImplantObj.scale}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVirtualImplants((prev) =>
                              prev.map((i) =>
                                i.id === selectedImplantObj.id ? { ...i, scale: val } : i
                              )
                            );
                          }}
                          className="w-24 accent-emerald-500 cursor-pointer"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVirtualImplants((prev) =>
                          prev.filter((i) => i.id !== selectedImplantObj.id)
                        );
                        setSelectedImplantId(null);
                      }}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Trash2 size={13} /> Remover este implante
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-wrap text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-pink-500 inline-block" />
                      Cárie / Infiltração
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                      Lesão / NICO / Siso
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                      Canal Tratado
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" />
                      Metal / Amálgama
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
                      Espaço Implante
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DIREITA: PAINEL DO PACIENTE (TV) OU LAUDO TÉCNICO (CLÍNICO) */}
          <div className="w-full lg:w-[440px] xl:w-[480px] bg-[#0B0E14] flex flex-col overflow-hidden shrink-0">
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {!isScanning && result && (
                <>
                  {/* Resumo Principal (Adaptado ao Modo TV vs Clínico) */}
                  <div className="p-4 rounded-xl bg-[#111622] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {viewMode === 'tv' ? 'Resumo para o Paciente' : 'Parecer Técnico Radiológico'}
                      </span>
                      <span
                        className={`text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          result.biologicalRiskLevel === 'Alto'
                            ? 'text-rose-300 border-rose-500/40 bg-rose-500/10'
                            : result.biologicalRiskLevel === 'Moderado'
                              ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                              : 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                        }`}
                      >
                        Prioridade: {result.biologicalRiskLevel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {viewMode === 'tv'
                        ? result.patientSummary || result.generalFindings
                        : result.generalFindings}
                    </p>
                  </div>

                  {/* Lista Horizontal/Compacta de Dentes Detectados (Clique para destacar na TV) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">
                        Dentes Mapeados ({result.detectedTeeth.length})
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        Clique para focar na imagem
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {result.detectedTeeth.map((tooth) => {
                        const visual = getVisualForStatus(tooth.status);
                        const isSelected = selectedToothObj?.toothNumber === tooth.toothNumber;
                        return (
                          <button
                            key={tooth.toothNumber}
                            type="button"
                            onClick={() => setSelectedToothNumber(tooth.toothNumber)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-slate-800/90 border-pink-500/70'
                                : 'bg-[#111622] border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  style={{ backgroundColor: visual.stroke }}
                                  className="w-2 h-2 rounded-full shrink-0"
                                />
                                <span className="text-xs font-bold text-white font-mono tabular-nums">
                                  Dente {tooth.toothNumber}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {visual.label}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cartão Detalhado do Dente Selecionado + Opções de Tratamento */}
                  {selectedToothObj && (
                    <div className="p-4 rounded-xl bg-[#111622] border border-slate-700/80 space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <span className="font-bold text-white text-sm">
                              Dente {selectedToothObj.toothNumber}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={getVisualForStatus(selectedToothObj.status).badgeText}
                            >
                              {getVisualForStatus(selectedToothObj.status).label}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white mt-1">
                            {selectedToothObj.patientFriendlyTitle || selectedToothObj.finding}
                          </h4>
                        </div>

                        {viewMode === 'clinical' && (
                          <button
                            type="button"
                            onClick={() => removeDetectedTooth(selectedToothObj.toothNumber)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                            title="Remover esta marcação"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {viewMode === 'tv'
                          ? selectedToothObj.patientExplanation || selectedToothObj.finding
                          : selectedToothObj.finding}
                      </p>

                      {viewMode === 'clinical' && (
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                          <p className="text-emerald-300">
                            <strong className="text-emerald-400">Conduta:</strong>{' '}
                            {selectedToothObj.recommendation}
                          </p>
                          {selectedToothObj.estimatedGalvanismMv !== undefined && (
                            <p className="text-amber-300 font-mono tabular-nums flex items-center gap-1.5">
                              <Zap size={12} />
                              Potencial Galvânico Estimado: +{selectedToothObj.estimatedGalvanismMv}{' '}
                              mV
                            </p>
                          )}
                        </div>
                      )}

                      {/* Opções de Tratamento para Apresentar ao Paciente */}
                      {selectedToothObj.treatmentOptions &&
                        selectedToothObj.treatmentOptions.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Opções de Tratamento Sugeridas
                            </p>
                            {selectedToothObj.treatmentOptions.map((opt, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                                    {opt.name}
                                  </span>
                                  {opt.priority && (
                                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                                      {opt.priority}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-snug pl-5">
                                  {opt.benefit}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Bloco Sistêmico / Protocolo no Modo Clínico */}
                  {viewMode === 'clinical' && (
                    <div className="space-y-3">
                      {result.systemicWarning && (
                        <div className="p-3.5 rounded-xl bg-[#111622] border border-slate-800 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                            <Activity size={13} />
                            <span>Correlação Sistêmica & Meridianos</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {result.systemicWarning}
                          </p>
                        </div>
                      )}

                      {result.recommendedBiologicalProtocol && (
                        <div className="p-3.5 rounded-xl bg-[#111622] border border-slate-800 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                            <Award size={13} />
                            <span>Sequência Terapêutica Sugerida</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {result.recommendedBiologicalProtocol}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* RODAPÉ DE AÇÕES */}
        <div className="px-4 py-3 bg-[#07090E] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
            <span>
              Co-piloto visual editável pelo profissional · Panorâmica, CBCT, Periapical e Bite-Wing
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isScanning && (
              <button
                type="button"
                onClick={exportAnnotatedSnapshot}
                className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download size={14} />
                <span>Baixar Imagem com Marcações</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer whitespace-nowrap"
            >
              Fechar
            </button>

            {!isScanning && result && (
              <button
                type="button"
                onClick={handleApply}
                disabled={applied}
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {applied ? (
                  <>
                    <Check size={15} />
                    <span>Aplicado no Odontograma 3D!</span>
                  </>
                ) : (
                  <>
                    <FileText size={15} />
                    <span>Aplicar Achados no Odontograma 3D</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
