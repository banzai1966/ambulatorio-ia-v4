import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  ZoomIn, 
  ZoomOut,
  Download, 
  FolderOpen, 
  Image as ImageIcon, 
  Maximize2,
  Minimize2,
  Pencil,
  RotateCcw,
  RotateCw,
  Save,
  Palette,
  Eraser,
  Sparkles,
  Move,
  Contrast,
  ShieldCheck,
  UserCheck,
  Eye,
  Layers,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import InteractiveOdontogram, { OdontogramData } from './InteractiveOdontogram';
import CbctAiScannerModal, { CbctDetectedTooth } from './CbctAiScannerModal';
import panoramicDentalRx from '../assets/images/panoramic_dental_rx_1789739027711.jpg';
import cbctDentalScan from '../assets/images/cbct_dental_scan_1789739011366.jpg';

interface MediaItem {
  id: string;
  title: string;
  type: 'tomography' | 'radiograph' | 'photo' | 'document';
  url: string;
  date: string;
  description?: string;
}

const BUILT_IN_DEMO_MEDIA: MediaItem[] = [
  {
    id: 'demo_panoramica_1',
    title: 'Radiografia Panorâmica HD (Demonstração)',
    type: 'radiograph',
    url: panoramicDentalRx,
    date: 'Caso Modelo',
    description: 'Exame pronto para demonstração — clique em Scanner Visual IA (Modo TV) ou simule implantes 360°.'
  },
  {
    id: 'demo_cbct_1',
    title: 'Tomografia Cone Beam CBCT (Demonstração)',
    type: 'tomography',
    url: cbctDentalScan,
    date: 'Caso Modelo',
    description: 'Cortes tomográficos modelo para avaliação de canais, lesões ósseas e implantes.'
  }
];

// Helper para obter chave de persistência de anexos do paciente
function getPatientMediaStorageKey(patientName: string): string {
  const clean = (patientName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `studio_media_gallery_v2_${clean || 'geral'}`;
}

const LEGACY_SEEDED_IDS = new Set(['tc_cbct_1', 'rx_panoramica_1', 'foto_extraoral_1']);

function cleanStoredMediaItems(parsed: any[]): MediaItem[] {
  return parsed.filter((item: any) => {
    if (!item || typeof item !== 'object') return false;
    const id = String(item.id || '');
    const title = String(item.title || '').toLowerCase();
    const desc = String(item.description || '').toLowerCase();
    const url = String(item.url || '');

    if (id.startsWith('dsd_') || title.includes('simulação dsd') || desc.includes('planejamento digital do sorriso')) {
      return false;
    }
    if (
      LEGACY_SEEDED_IDS.has(id) ||
      url.includes('1544005313-94ddf0286df2') ||
      url.includes('516549655169-df83a0774514') ||
      url.includes('588776814546-1ffcf47267a5')
    ) {
      return false;
    }
    return true;
  });
}

// Compressão inteligente de imagem para não estourar o limite de armazenamento
async function compressImageForStorage(dataUrl: string, maxWidth = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    // Se for URL externa, não precisa comprimir
    if (dataUrl.startsWith('http')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxWidth || h > maxWidth) {
        if (w > h) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        } else {
          w = Math.round((w * maxWidth) / h);
          h = maxWidth;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
  });
}

export default function PatientMediaGallery({ 
  patientName, 
  onClose,
  initialOdontogram,
  onOdontogramChange,
  hideEmbeddedOdontogram = false
}: { 
  patientName: string; 
  onClose?: () => void;
  initialOdontogram?: OdontogramData;
  onOdontogramChange?: (data: OdontogramData) => void;
  hideEmbeddedOdontogram?: boolean;
}) {
  const storageKey = getPatientMediaStorageKey(patientName);

  // Inicializa com exames salvos do paciente ou caso modelo pronto para demonstração
  const [items, setItems] = useState<MediaItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleaned = cleanStoredMediaItems(parsed);
            if (cleaned.length > 0) return cleaned;
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar galeria salva:', err);
      }
    }
    return BUILT_IN_DEMO_MEDIA;
  });

  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(() => items[0] || BUILT_IN_DEMO_MEDIA[0]);
  const [activeTab, setActiveTab] = useState<'all' | 'tomography' | 'radiograph' | 'photo'>('all');

  // Troca de Aba com sincronização estrita do item selecionado correspondente
  const handleTabChange = (tab: 'all' | 'tomography' | 'radiograph' | 'photo') => {
    setActiveTab(tab);
    setViewerZoom(1);
    const targetItems = tab === 'all' ? items : items.filter(item => item.type === tab);
    if (targetItems.length > 0) {
      // Se o item selecionado atual não pertencer à nova categoria, seleciona o primeiro da categoria
      if (!selectedItem || (tab !== 'all' && selectedItem.type !== tab)) {
        setSelectedItem(targetItems[0]);
      }
    } else {
      setSelectedItem(null);
    }
  };

  // Garante que o selectedItem pertença à aba ativa caso itens mudem
  useEffect(() => {
    if (activeTab !== 'all' && selectedItem && selectedItem.type !== activeTab) {
      const matching = items.filter(i => i.type === activeTab);
      setSelectedItem(matching[0] || null);
    }
  }, [activeTab, items, selectedItem]);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAnnotateModal, setShowAnnotateModal] = useState(false);
  const [showCbctScannerModal, setShowCbctScannerModal] = useState(false);
  const [forceDemoScanner, setForceDemoScanner] = useState(false);
  const [showOdontogram, setShowOdontogram] = useState<boolean>(false);
  const [localOdontogram, setLocalOdontogram] = useState<OdontogramData>(initialOdontogram || {
    teeth: {
      16: { id: 16, status: 'amalgam', cbctFindings: 'Amálgama com microinfiltração visível na TC', biologicalPlan: 'Troca Segura SMART (IAOMT)' },
      21: { id: 21, status: 'zirconia_implant', cbctFindings: 'Espessura óssea favorável para implante cerâmico', biologicalPlan: 'Implante Zircônia Metal-Free' },
      38: { id: 38, status: 'cavitation_nico', cbctFindings: 'Área hipodensa NICO em leito de siso extraído', biologicalPlan: 'Curetagem + Ozônio + Terapia Neural', neuralTherapy: true }
    }
  });

  // Aplicação dos achados do Scanner Tomográfico com IA diretamente no Odontograma 3D
  const handleApplyCbctFindings = (detectedTeeth: CbctDetectedTooth[], generalFindings: string) => {
    const currentTeeth = { ...(localOdontogram.teeth || {}) };

    detectedTeeth.forEach((t) => {
      const existing = currentTeeth[t.toothNumber] || { id: t.toothNumber, status: t.status };
      currentTeeth[t.toothNumber] = {
        ...existing,
        id: t.toothNumber,
        status: t.status,
        cbctFindings: t.finding,
        biologicalPlan: t.recommendation,
        galvanismo_mv: t.estimatedGalvanismMv !== undefined ? t.estimatedGalvanismMv : existing.galvanismo_mv,
        neuralTherapy: t.neuralTherapySuggested ?? (existing.neuralTherapy || t.status === 'cavitation_nico' || t.status === 'endodontic')
      };
    });

    const updatedOdontogram: OdontogramData = {
      ...localOdontogram,
      teeth: currentTeeth,
      cbctTomographyCorrelation: generalFindings || localOdontogram.cbctTomographyCorrelation
    };

    setLocalOdontogram(updatedOdontogram);
    if (onOdontogramChange) {
      onOdontogramChange(updatedOdontogram);
    }
    // Abre automaticamente a visualização do odontograma após aplicar achados
    setShowOdontogram(true);
  };

  // Recarrega galeria quando o paciente selecionado mudar
  useEffect(() => {
    setActiveTab('all');
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleaned = cleanStoredMediaItems(parsed);
            if (cleaned.length > 0) {
              setItems(cleaned);
              setSelectedItem(cleaned[0]);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar galeria do paciente:', err);
      }
      setItems(BUILT_IN_DEMO_MEDIA);
      setSelectedItem(BUILT_IN_DEMO_MEDIA[0]);
    }
  }, [patientName, storageKey]);

  // Salva no localStorage sempre que os itens mudarem
  const persistItems = (newItems: MediaItem[]) => {
    setItems(newItems);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newItems));
      } catch (err) {
        console.warn('Aviso: Limite de armazenamento atingido ao salvar imagens no navegador:', err);
        toast.error('Armazenamento local cheio. Recomendamos usar imagens mais leves.');
      }
    }
  };

  const handleOdontoUpdate = (newOdonto: OdontogramData) => {
    setLocalOdontogram(newOdonto);
    if (onOdontogramChange) {
      onOdontogramChange(newOdonto);
    }
  };

  // Upload Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'tomography' | 'radiograph' | 'photo' | 'document'>('tomography');
  const [newUrl, setNewUrl] = useState('');
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = useState<string | null>(null);

  // Drawing Canvas state
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<string>('#e11d48'); // red
  const [penLineWidth, setPenLineWidth] = useState<number>(4);
  const [drawMode, setDrawMode] = useState<'pen' | 'eraser'>('pen');

  // Zoom & Scale States
  const [viewerZoom, setViewerZoom] = useState<number>(1);
  const [annotateZoom, setAnnotateZoom] = useState<number>(1);

  // Fullscreen Lightbox Mode States
  const [showFullScreenModal, setShowFullScreenModal] = useState<boolean>(false);
  const [fullScreenZoom, setFullScreenZoom] = useState<number>(1);
  const [fullScreenRotation, setFullScreenRotation] = useState<number>(0);
  const [fullScreenInvert, setFullScreenInvert] = useState<boolean>(false);

  const downloadHighResImage = (url: string, filename: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/[^a-zA-Z0-9_\-]/g, '_')}_HD.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download em Alta Resolução iniciado com sucesso!');
    } catch {
      toast.error('Não foi possível iniciar o download automático.');
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  // File Upload Handler via Local Device File Picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('O arquivo é muito grande (máximo 15MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedFileDataUrl(result);
        if (!newTitle) {
          setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = uploadedFileDataUrl || newUrl.trim();
    if (!rawUrl) {
      toast.error('Selecione uma imagem do computador ou celular antes de salvar.');
      return;
    }
    if (!newTitle) {
      toast.error('Informe o título do anexo');
      return;
    }
    
    // Otimização e compressão para salvar no PC / navegador com segurança
    const finalUrl = rawUrl.startsWith('data:image') ? await compressImageForStorage(rawUrl, 1400, 0.85) : rawUrl;

    const newItem: MediaItem = {
      id: Date.now().toString(),
      title: newTitle,
      type: newCategory,
      url: finalUrl,
      date: new Date().toLocaleDateString('pt-BR'),
      description: 'Anexo adicionado ao prontuário do paciente'
    };
    const updated = [newItem, ...items];
    persistItems(updated);
    if (activeTab !== 'all' && newCategory !== 'document' && activeTab !== newCategory) {
      setActiveTab(newCategory);
    }
    setSelectedItem(newItem);
    setNewTitle('');
    setNewUrl('');
    setUploadedFileDataUrl(null);
    setShowUploadModal(false);
    toast.success('Imagem / Exame anexado e salvo com sucesso!');
  };

  // Canvas Initialization for Drawing (Two layers: bgCanvas for image, drawingCanvas for pen/eraser strokes)
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (showAnnotateModal && selectedItem) {
      const bgCanvas = bgCanvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      if (!bgCanvas || !drawingCanvas) return;
      
      const bgCtx = bgCanvas.getContext('2d');
      const drawingCtx = drawingCanvas.getContext('2d');
      if (!bgCtx || !drawingCtx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = selectedItem.url;
      img.onload = () => {
        const w = img.naturalWidth || 1000;
        const h = img.naturalHeight || 700;

        bgCanvas.width = w;
        bgCanvas.height = h;
        drawingCanvas.width = w;
        drawingCanvas.height = h;

        bgCtx.drawImage(img, 0, 0, w, h);
        drawingCtx.clearRect(0, 0, w, h);
      };
      img.onerror = () => {
        const w = 1000;
        const h = 700;
        bgCanvas.width = w;
        bgCanvas.height = h;
        drawingCanvas.width = w;
        drawingCanvas.height = h;

        bgCtx.fillStyle = '#0f172a';
        bgCtx.fillRect(0, 0, w, h);
        bgCtx.fillStyle = '#ffffff';
        bgCtx.font = '20px sans-serif';
        bgCtx.fillText(`Imagem: ${selectedItem.title}`, 40, 50);

        drawingCtx.clearRect(0, 0, w, h);
      };
    }
  }, [showAnnotateModal, selectedItem]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    if (drawMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = penLineWidth * 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penLineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const resetCanvasImage = () => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  };

  const handleSaveAnnotatedImage = async () => {
    const bgCanvas = bgCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!bgCanvas || !drawingCanvas || !selectedItem) return;

    // Merge both canvas layers into a single image
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = bgCanvas.width;
    mergedCanvas.height = bgCanvas.height;

    const mergedCtx = mergedCanvas.getContext('2d');
    if (!mergedCtx) return;

    mergedCtx.drawImage(bgCanvas, 0, 0);
    mergedCtx.drawImage(drawingCanvas, 0, 0);

    const rawDataUrl = mergedCanvas.toDataURL('image/jpeg', 0.88);
    const dataUrl = await compressImageForStorage(rawDataUrl, 1400, 0.85);

    const annotatedItem: MediaItem = {
      id: Date.now().toString(),
      title: `${selectedItem.title} (Anotado)`,
      type: selectedItem.type,
      url: dataUrl,
      date: new Date().toLocaleDateString('pt-BR'),
      description: `Anotação/Risco médico feito em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    };

    const updated = [annotatedItem, ...items];
    persistItems(updated);
    setSelectedItem(annotatedItem);
    setShowAnnotateModal(false);
    toast.success('Imagem anotada salva com sucesso na galeria!');
  };

  const handleDeleteItem = (item: MediaItem) => {
    setItemToDelete(item);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    const next = items.filter(i => i.id !== id);
    persistItems(next);
    const filtered = next.filter(i => activeTab === 'all' || i.type === activeTab);
    setSelectedItem(filtered[0] || null);
    setItemToDelete(null);
    toast.success('Exame removido com sucesso da galeria.');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
      {/* Top Gallery Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200/80 rounded-lg text-xs font-bold uppercase tracking-wider">
              Anexos & Exames de Imagem (RX / Tomografia / Fotos)
            </span>
            <span className="text-xs text-slate-400 font-medium">• {patientName}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Galeria Radiológica, Tomografias & Riscos Clínicos</h2>
          <p className="text-xs text-slate-500">Suba arquivos do seu PC/celular, visualize radiografias e desenhe/marque sobre as imagens.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {!hideEmbeddedOdontogram && (
            <button
              type="button"
              onClick={() => setShowOdontogram(!showOdontogram)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                showOdontogram 
                  ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-2xs' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Exibir ou ocultar a arcada dentária interativa para marcação de dentes durante a análise da tomografia"
            >
              <Layers size={15} className="text-sky-600" />
              <span>{showOdontogram ? 'Ocultar Odontograma' : 'Mapear Arcada Dentária'}</span>
            </button>
          )}

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Upload size={16} />
            Anexar Nova Imagem / RX
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos ({items.length})
        </button>
        <button
          onClick={() => handleTabChange('tomography')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'tomography'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tomografias (TC) ({items.filter(i => i.type === 'tomography').length})
        </button>
        <button
          onClick={() => handleTabChange('radiograph')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'radiograph'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Radiografias / Raio-X ({items.filter(i => i.type === 'radiograph').length})
        </button>
          <button
          onClick={() => handleTabChange('photo')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'photo'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Fotos Clínicas ({items.filter(i => i.type === 'photo').length})
        </button>
      </div>

      {/* Main Dual Area: Enlarged Viewer & Thumbnails Strip */}
      {selectedItem ? (
        (() => {
          const currentFilteredIndex = filteredItems.findIndex(i => i.id === selectedItem.id);
          const hasPrevItem = currentFilteredIndex > 0;
          const hasNextItem = currentFilteredIndex >= 0 && currentFilteredIndex < filteredItems.length - 1;

          const handlePrevItem = () => {
            if (hasPrevItem) {
              setSelectedItem(filteredItems[currentFilteredIndex - 1]);
            }
          };

          const handleNextItem = () => {
            if (hasNextItem) {
              setSelectedItem(filteredItems[currentFilteredIndex + 1]);
            }
          };

          return (
            <div className="space-y-3">
              {/* Full-Width Radiographic Image Display */}
              <div className="w-full bg-slate-950 rounded-2xl p-4 flex flex-col justify-between min-h-[480px] relative group overflow-hidden border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-white text-xs z-10 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-sky-400 shrink-0" />
                    <span className="font-bold truncate max-w-[180px] sm:max-w-[260px]">{selectedItem.title}</span>
                    {filteredItems.length > 1 && currentFilteredIndex >= 0 && (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                        {currentFilteredIndex + 1} de {filteredItems.length}
                      </span>
                    )}
                  </div>

                  {/* Top Bar Quick Controls: Prev/Next Image Navigation & Zoom */}
                  <div className="flex items-center gap-2">
                    {filteredItems.length > 1 && (
                      <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-700/80">
                        <button
                          type="button"
                          onClick={handlePrevItem}
                          disabled={!hasPrevItem}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            hasPrevItem ? 'text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
                          }`}
                          title="Exame anterior (←)"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextItem}
                          disabled={!hasNextItem}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            hasNextItem ? 'text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
                          }`}
                          title="Próximo exame (→)"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}

                    {/* Zoom & Scale Controls for Main Viewer */}
                    <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-700/80">
                      <button
                        type="button"
                        onClick={() => setViewerZoom(z => Math.max(0.5, z - 0.25))}
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                        title="Reduzir Zoom (-25%)"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span className="px-1 text-[11px] font-bold text-sky-400 min-w-[38px] text-center">
                        {Math.round(viewerZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewerZoom(z => Math.min(3.0, z + 0.25))}
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                        title="Aumentar Zoom (+25%)"
                      >
                        <ZoomIn size={14} />
                      </button>
                      {viewerZoom !== 1 && (
                        <button
                          type="button"
                          onClick={() => setViewerZoom(1)}
                          className="p-1 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-300 cursor-pointer"
                          title="Restaurar Zoom Original (100%)"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="text-slate-400 text-[11px]">{selectedItem.date}</span>
                </div>

                <div className="my-auto py-4 flex items-center justify-center overflow-auto relative max-h-[460px] custom-scrollbar-emerald">
                  {/* Navegação por Setas Flutuantes Sobre a Imagem */}
                  {filteredItems.length > 1 && (
                    <>
                      {hasPrevItem && (
                        <button
                          type="button"
                          onClick={handlePrevItem}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95 group/btn"
                          title="Ver exame anterior"
                        >
                          <ChevronLeft size={20} className="group-hover/btn:-translate-x-0.5 transition-transform" />
                        </button>
                      )}
                      {hasNextItem && (
                        <button
                          type="button"
                          onClick={handleNextItem}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95 group/btn"
                          title="Ver próximo exame"
                        >
                          <ChevronRight size={20} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </>
                  )}

                  <div 
                    style={{ 
                      transform: `scale(${viewerZoom})`, 
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease-out' 
                    }}
                    className="inline-block transition-transform"
                  >
                    <img 
                      src={selectedItem.url} 
                      alt={selectedItem.title} 
                      className="max-h-[430px] w-auto object-contain rounded-lg shadow-2xl block"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="text-white text-xs z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-slate-300 italic text-[11px] truncate max-w-[240px] sm:max-w-[280px]">{selectedItem.description}</p>
                  
                  <div className="flex items-center flex-wrap gap-2">
                    {/* AI Visual Radiology & CBCT Studio Button */}
                    <button
                      type="button"
                      onClick={() => setShowCbctScannerModal(true)}
                      className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                      title="Abrir Estúdio Radiológico Visual IA (Modo TV, Marcações Coloridas e Simulador de Implante)"
                    >
                      <Sparkles size={14} className="text-pink-200" />
                      <span>Scanner Visual IA (Modo TV)</span>
                    </button>

                    {/* Fullscreen Lightbox Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setFullScreenZoom(1);
                        setFullScreenRotation(0);
                        setFullScreenInvert(false);
                        setShowFullScreenModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                      title="Abrir em Tela Cheia no Monitor com contraste e rotação para diagnóstico"
                    >
                      <Eye size={14} />
                      Tela Cheia (Monitor)
                    </button>

                    {/* Annotate / Riscar Button */}
                    <button
                      type="button"
                      onClick={() => { setAnnotateZoom(1); setShowAnnotateModal(true); }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-slate-700/20 cursor-pointer border border-slate-600"
                      title="Abrir estúdio para riscar, desenhar e fazer marcações nesta imagem"
                    >
                      <Pencil size={14} />
                      Riscar / Anotar
                    </button>

                    {/* Download High Res Button (Destaque em Esmeralda/Azul com Ícone Claro) */}
                    <button
                      type="button"
                      onClick={() => downloadHighResImage(selectedItem.url, selectedItem.title)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer border border-emerald-500 hover:scale-105 active:scale-95"
                      title="Baixar imagem original em alta resolução (preserva qualidade para envio ou laudo externo)"
                    >
                      <Download size={14} className="text-emerald-100" />
                      <span>Baixar Imagem HD</span>
                    </button>

                    <a 
                      href={selectedItem.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
                      title="Abrir em tamanho real em nova aba"
                    >
                      <Maximize2 size={14} />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(selectedItem)}
                      className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Excluir imagem"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Faixa horizontal enxuta de miniaturas apenas quando houver 2 ou mais exames */}
              {filteredItems.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {filteredItems.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`shrink-0 flex items-center gap-2.5 p-2 pr-2.5 rounded-xl border cursor-pointer transition-all group max-w-[260px] ${
                        selectedItem.id === item.id
                          ? 'bg-sky-50 border-sky-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="w-12 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 relative">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[9px] font-mono tabular-nums font-bold px-1 rounded">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">{item.date}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                        title="Excluir exame"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="text-center py-14 px-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen size={24} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <p className="text-sm font-bold text-slate-700">Nenhum exame anexado neste prontuário</p>
            <p className="text-xs text-slate-500">
              Suba a radiografia panorâmica, tomografia Cone Beam ou foto do paciente para analisar em tela cheia ou com a IA.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Upload size={14} />
              <span>+ Anexar Novo Exame / RX</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setForceDemoScanner(true);
                setShowCbctScannerModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              title="Abrir o Estúdio Radiológico Visual IA usando uma imagem de amostra para demonstração na TV"
            >
              <Sparkles size={14} className="text-pink-100" />
              <span>Abrir Scanner Visual IA (Amostra Teste)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                persistItems(BUILT_IN_DEMO_MEDIA);
                setSelectedItem(BUILT_IN_DEMO_MEDIA[0]);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw size={14} />
              <span>Carregar Panorâmica & CBCT Modelo</span>
            </button>
          </div>
        </div>
      )}

      {/* ODONTOGRAMA SINCRONIZADO COM A TOMOGRAFIA / RX */}
      {!hideEmbeddedOdontogram && showOdontogram && (
        <div className="pt-2 animate-in fade-in duration-300">
          <InteractiveOdontogram
            data={localOdontogram}
            onChange={handleOdontoUpdate}
          />
        </div>
      )}

      {/* Upload Modal with File Picker */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Upload size={18} className="text-blue-600" />
                  Anexar Novo Exame / Imagem
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60">
                  <ShieldCheck size={13} className="text-blue-600 shrink-0" />
                  <span>Vinculado ao Prontuário: <strong>{patientName}</strong></span>
                </div>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="space-y-4">
              {/* File Upload Drop Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selecionar Imagem do Computador ou Celular</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-4 bg-slate-50 text-center transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="local-file-upload-input"
                  />
                  <label htmlFor="local-file-upload-input" className="cursor-pointer space-y-1 block">
                    <Upload size={24} className="mx-auto text-blue-600" />
                    <span className="text-xs font-bold text-slate-700 block">
                      {uploadedFileDataUrl ? "✅ Imagem Carregada! Clique para Trocar" : "Clique aqui para escolher a foto/exame"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Suporta JPG, PNG, WEBP e capturas de RX/Tomografia</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título do Exame / Documento</label>
                <input
                  type="text"
                  placeholder="Ex: Tomografia Cone Beam - Maxila / Raio-X Coluna"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                >
                  <option value="tomography">Tomografia (TC)</option>
                  <option value="radiograph">Radiografia / Raio-X</option>
                  <option value="photo">Foto Extraoral / Corporal</option>
                  <option value="document">Documentação Ortodôntica / Laudo</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Salvar Anexo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Drawing Canvas Modal for Annotating RX / Tomography Images */}
      {showAnnotateModal && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl p-4 w-full max-w-5xl shadow-2xl flex flex-col gap-4 border border-slate-800 max-h-[95vh] overflow-hidden">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-white">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Pencil size={18} className="text-rose-500" />
                  Estúdio de Marcação e Risco em Imagens
                </h3>
                <p className="text-xs text-slate-400">
                  Desenhe, marque focos de fratura, lesões ou alterações sobre o exame de {selectedItem.title}.
                </p>
              </div>

              {/* Color & Pen Controls */}
              <div className="flex items-center gap-2 flex-wrap bg-slate-800 p-2 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-1.5">
                  {(['#e11d48', '#f59e0b', '#06b6d4', '#10b981', '#ffffff'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setPenColor(c); setDrawMode('pen'); }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        penColor === c && drawMode === 'pen' ? 'scale-125 border-white shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Cor da caneta: ${c}`}
                    />
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setDrawMode('pen')}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                      drawMode === 'pen' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Pencil size={12} />
                    Caneta
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawMode('eraser')}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                      drawMode === 'eraser' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Eraser size={12} />
                    Borracha
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                {/* Line width picker */}
                <div className="flex items-center gap-1 text-xs text-slate-300">
                  <span>Espessura:</span>
                  {[2, 4, 8].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPenLineWidth(w)}
                      className={`w-6 h-6 rounded-md font-extrabold flex items-center justify-center cursor-pointer ${
                        penLineWidth === w ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={resetCanvasImage}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Limpar todos os riscos e restaurar imagem original"
                >
                  <RotateCcw size={12} />
                  Limpar
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                {/* Studio Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold mr-0.5">Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setAnnotateZoom(z => Math.max(0.75, z - 0.25))}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                    title="Reduzir Zoom (-25%)"
                  >
                    <ZoomOut size={12} />
                  </button>
                  <span className="px-1 font-bold text-rose-400 min-w-[36px] text-center text-[11px]">
                    {Math.round(annotateZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setAnnotateZoom(z => Math.min(3.0, z + 0.25))}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                    title="Aumentar Zoom (+25%)"
                  >
                    <ZoomIn size={12} />
                  </button>
                  {annotateZoom !== 1 && (
                    <button
                      type="button"
                      onClick={() => setAnnotateZoom(1)}
                      className="p-1 hover:bg-slate-700 rounded text-amber-400 hover:text-amber-300 cursor-pointer"
                      title="Restaurar Escala Normal (100%)"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowAnnotateModal(false)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Interactive Drawing Canvas Surface (Dual Layer: Background RX + Transparent Drawing Surface) */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/70 rounded-2xl p-4 border border-slate-800 min-h-[380px] max-h-[65vh] relative custom-scrollbar-emerald">
              <div 
                style={{ 
                  transform: `scale(${annotateZoom})`, 
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out' 
                }}
                className="relative inline-block max-w-full my-auto"
              >
                {/* Layer 1: Background Image Canvas (Protected from eraser) */}
                <canvas
                  ref={bgCanvasRef}
                  className="max-w-full max-h-[55vh] object-contain rounded-lg border border-slate-700 shadow-2xl block"
                />
                {/* Layer 2: Transparent Drawing Canvas (Caneta & Borracha) */}
                <canvas
                  ref={drawingCanvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="absolute inset-0 w-full h-full object-contain rounded-lg cursor-crosshair touch-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-3 gap-3">
              <p className="text-xs text-slate-400 italic">
                Pressione o botão do mouse ou aperte com o dedo para desenhar sobre a radiografia/tomografia.
                {annotateZoom > 1 && ' (Zoom ativo: deslize para navegar pelos detalhes do exame)'}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadHighResImage(selectedItem.url, selectedItem.title)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  title="Baixar imagem original em alta definição"
                >
                  <Download size={14} />
                  Baixar HD
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnnotateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAnnotatedImage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <Save size={14} />
                  Salvar Imagem Anotada no Prontuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Diagnostic Lightbox Modal (Modo Tela Cheia de Alta Resolução) */}
      {showFullScreenModal && selectedItem && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950 text-white animate-in fade-in duration-200">
          {/* Top Bar: Security & Control Toolbar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Patient & Exam Identification Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1.5 rounded-xl text-xs font-bold">
                <ShieldCheck size={16} className="text-sky-400" />
                <span>PRONTUÁRIO: <strong className="text-white uppercase">{patientName}</strong></span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <ImageIcon size={14} className="text-indigo-400" />
                <span className="font-semibold truncate max-w-[280px]">{selectedItem.title}</span>
                <span className="text-slate-500">• {selectedItem.date}</span>
              </div>
            </div>

            {/* Diagnostic Image Tools (Zoom, Rotate, Invert Contrast, Download) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setFullScreenZoom(z => Math.max(0.5, z - 0.25))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                  title="Reduzir Zoom (-25%)"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="px-2 font-bold text-sky-400 min-w-[42px] text-center text-xs">
                  {Math.round(fullScreenZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setFullScreenZoom(z => Math.min(4.0, z + 0.25))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                  title="Aumentar Zoom (+25%)"
                >
                  <ZoomIn size={14} />
                </button>
              </div>

              {/* Rotate Control */}
              <button
                type="button"
                onClick={() => setFullScreenRotation(r => (r + 90) % 360)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                title="Girar imagem em 90 graus"
              >
                <RotateCw size={14} />
                <span>Girar ({fullScreenRotation}°)</span>
              </button>

              {/* Invert Contrast Control for X-Ray/CT */}
              <button
                type="button"
                onClick={() => setFullScreenInvert(i => !i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  fullScreenInvert 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Inverter cores / Contraste negativo (Ideal para RX e Tomografia)"
              >
                <Contrast size={14} />
                <span>Contraste RX</span>
              </button>

              {/* Download HD */}
              <button
                type="button"
                onClick={() => downloadHighResImage(selectedItem.url, selectedItem.title)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
                title="Baixar em Alta Resolução"
              >
                <Download size={14} />
                <span>Baixar HD</span>
              </button>

              {/* Close Fullscreen */}
              <button
                type="button"
                onClick={() => setShowFullScreenModal(false)}
                className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition-colors cursor-pointer ml-2"
                title="Fechar Tela Cheia"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Fullscreen Canvas / Image Display Surface */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-black relative custom-scrollbar-blue">
            <div 
              style={{
                transform: `scale(${fullScreenZoom}) rotate(${fullScreenRotation}deg)`,
                filter: fullScreenInvert ? 'invert(1) hue-rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease-out, filter 0.2s ease-out'
              }}
              className="inline-block my-auto max-w-none"
            >
              <img 
                src={selectedItem.url} 
                alt={selectedItem.title} 
                className="max-h-[85vh] w-auto object-contain shadow-2xl rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Bottom Watermark Security Toast */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2 shadow-2xl pointer-events-none">
              <UserCheck size={14} className="text-sky-400" />
              <span>Exame certificado e vinculado exclusivamente ao paciente <strong>{patientName}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Scanner Tomográfico com IA Biológica */}
      <CbctAiScannerModal
        isOpen={showCbctScannerModal}
        onClose={() => {
          setShowCbctScannerModal(false);
          setForceDemoScanner(false);
        }}
        mediaItem={
          selectedItem ||
          (forceDemoScanner
            ? {
                id: 'demo_cbct',
                title: 'Exame de Demonstração (CBCT / Panorâmica)',
                url: '/sample_cbct_scan.jpg',
                type: 'tomography'
              }
            : null)
        }
        patientName={patientName}
        onApplyFindings={handleApplyCbctFindings}
      />

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div 
          id="delete-confirmation-modal"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={28} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">Remover Exame da Galeria?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Você está prestes a excluir <strong className="text-slate-700 font-semibold">{itemToDelete.title}</strong> da pasta da paciente <strong className="text-slate-700 font-semibold">{patientName}</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 text-left">
              <img 
                src={itemToDelete.url} 
                alt={itemToDelete.title} 
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-900 shrink-0" 
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{itemToDelete.title}</p>
                <p className="text-[10px] text-slate-500">{itemToDelete.date} • {itemToDelete.type.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Sim, Excluir Exame
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

