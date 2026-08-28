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
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import InteractiveOdontogram, { OdontogramData } from './InteractiveOdontogram';

interface MediaItem {
  id: string;
  title: string;
  type: 'tomography' | 'radiograph' | 'photo' | 'document';
  url: string;
  date: string;
  description?: string;
}

const DEFAULT_SAMPLE_MEDIA: MediaItem[] = [
  {
    id: '1',
    title: 'Tomografia Computadorizada Maxilofacial / Coluna',
    type: 'tomography',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1000',
    date: '04/08/2026',
    description: 'Documentação de Tomografia Computadorizada - Avaliação Óssea e Articular'
  },
  {
    id: '2',
    title: 'Fotografia de Rosto & Análise Estética Facial',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1000',
    date: '04/08/2026',
    description: 'Análise Facial & Planejamento Integrativo'
  },
  {
    id: '3',
    title: 'Radiografia Panorâmica e Periapical (Raio-X)',
    type: 'radiograph',
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1000',
    date: '16/06/2026',
    description: 'Avaliação de integridade radiográfica, raízes e estruturas anexas'
  }
];

// Helper para obter chave de persistência de anexos do paciente
function getPatientMediaStorageKey(patientName: string): string {
  const clean = (patientName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `ambulatorio_media_gallery_${clean || 'geral'}`;
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

  // Inicializa com dados persistidos do paciente se existirem
  const [items, setItems] = useState<MediaItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar galeria salva:', err);
      }
    }
    return DEFAULT_SAMPLE_MEDIA;
  });

  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(() => items[0] || DEFAULT_SAMPLE_MEDIA[0]);
  const [activeTab, setActiveTab] = useState<'all' | 'tomography' | 'radiograph' | 'photo'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAnnotateModal, setShowAnnotateModal] = useState(false);
  const [showOdontogram, setShowOdontogram] = useState<boolean>(false);
  const [localOdontogram, setLocalOdontogram] = useState<OdontogramData>(initialOdontogram || {
    teeth: {
      16: { id: 16, status: 'amalgam', cbctFindings: 'Amálgama com microinfiltração visível na TC', biologicalPlan: 'Troca Segura SMART (IAOMT)' },
      21: { id: 21, status: 'zirconia_implant', cbctFindings: 'Espessura óssea favorável para implante cerâmico', biologicalPlan: 'Implante Zircônia Metal-Free' },
      38: { id: 38, status: 'cavitation_nico', cbctFindings: 'Área hipodensa NICO em leito de siso extraído', biologicalPlan: 'Curetagem + Ozônio + Terapia Neural', neuralTherapy: true }
    }
  });

  // Recarrega galeria quando o paciente selecionado mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
            setSelectedItem(parsed[0] || null);
            return;
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar galeria do paciente:', err);
      }
      setItems(DEFAULT_SAMPLE_MEDIA);
      setSelectedItem(DEFAULT_SAMPLE_MEDIA[0]);
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
    const rawUrl = uploadedFileDataUrl || newUrl || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1000';
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

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Deseja realmente remover este exame da galeria do paciente?')) {
      const next = items.filter(i => i.id !== id);
      persistItems(next);
      setSelectedItem(next[0] || null);
      toast.success('Exame removido com sucesso.');
    }
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

        <div className="flex items-center gap-2">
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
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('tomography')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'tomography'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tomografias (TC)
        </button>
        <button
          onClick={() => setActiveTab('radiograph')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'radiograph'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Radiografias / Raio-X
        </button>
        <button
          onClick={() => setActiveTab('photo')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'photo'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Fotos Extraorais / Corporais
        </button>
      </div>

      {/* Main Dual Area: Enlarged Viewer & Thumbnails Strip */}
      {selectedItem ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Large Image Display */}
          <div className="lg:col-span-2 bg-slate-950 rounded-2xl p-4 flex flex-col justify-between min-h-[440px] relative group overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between text-white text-xs z-10 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-sky-400" />
                <span className="font-bold truncate max-w-[200px] sm:max-w-[280px]">{selectedItem.title}</span>
              </div>

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

              <span className="text-slate-400 text-[11px]">{selectedItem.date}</span>
            </div>

            <div className="my-auto py-4 flex items-center justify-center overflow-auto relative max-h-[420px] custom-scrollbar-emerald">
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
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-2xl block"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="text-white text-xs z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2">
              <p className="text-slate-300 italic text-[11px] truncate max-w-[280px]">{selectedItem.description}</p>
              
              <div className="flex items-center gap-2">
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

                {/* Download High Res Button */}
                <button
                  type="button"
                  onClick={() => downloadHighResImage(selectedItem.url, selectedItem.title)}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-slate-700/20 cursor-pointer border border-slate-600"
                  title="Baixar imagem original em alta resolução (preserva qualidade)"
                >
                  <Download size={14} />
                  Baixar HD
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
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Excluir imagem"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnail List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documentos na Pasta</h3>
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar-blue">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    selectedItem.id === item.id
                      ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.date}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <FolderOpen size={40} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-500">Nenhum exame cadastrado</p>
          <p className="text-xs text-slate-400">Clique em "Anexar Nova Imagem" para subir a tomografia ou foto do paciente.</p>
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
    </div>
  );
}

