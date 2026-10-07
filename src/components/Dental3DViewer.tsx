import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  RefreshCw,
  UploadCloud,
  Camera,
  Box,
  Compass,
  ArrowLeft,
  ArrowRight,
  MousePointerClick,
  CheckCircle2,
  X,
  HeartPulse,
  Scan,
  Maximize2,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  TOOTH_METADATA, 
  STATUS_CONFIG, 
  ToothStatus, 
  OdontogramData, 
  normalizeToothStatus 
} from './InteractiveOdontogram';

// Tipo de Ângulo Clínico Realístico
export type ClinicalDentalAngle = 
  | 'maxilla'      // Arcada Superior Oclusal (Maxila)
  | 'mandible'     // Arcada Inferior Oclusal (Mandíbula)
  | 'frontal'      // Visão Frontal (Oclusão & Sorriso)
  | 'typodont'     // Manequim Articulado de Mentoria
  | 'cbct'         // Tomografia Computadorizada 3D
  | 'stl_scanner'; // Malha STL Real de Scanner Intraoral

// Coordenadas interativas (% left e top) para cada ângulo clínico
const MAXILLA_COORDINATES: Record<number, { left: number; top: number; labelPos?: 'top' | 'bottom' | 'left' | 'right' }> = {
  18: { left: 23, top: 78, labelPos: 'left' },
  17: { left: 24, top: 66, labelPos: 'left' },
  16: { left: 26, top: 54, labelPos: 'left' },
  15: { left: 30, top: 43, labelPos: 'left' },
  14: { left: 35, top: 33, labelPos: 'left' },
  13: { left: 40, top: 25, labelPos: 'top' },
  12: { left: 45, top: 20, labelPos: 'top' },
  11: { left: 49, top: 18, labelPos: 'top' },
  21: { left: 53, top: 18, labelPos: 'top' },
  22: { left: 57, top: 20, labelPos: 'top' },
  23: { left: 62, top: 25, labelPos: 'top' },
  24: { left: 67, top: 33, labelPos: 'right' },
  25: { left: 72, top: 43, labelPos: 'right' },
  26: { left: 75, top: 54, labelPos: 'right' },
  27: { left: 77, top: 66, labelPos: 'right' },
  28: { left: 78, top: 78, labelPos: 'right' }
};

const MANDIBLE_COORDINATES: Record<number, { left: number; top: number; labelPos?: 'top' | 'bottom' | 'left' | 'right' }> = {
  48: { left: 24, top: 23, labelPos: 'left' },
  47: { left: 25, top: 35, labelPos: 'left' },
  46: { left: 27, top: 48, labelPos: 'left' },
  45: { left: 31, top: 60, labelPos: 'left' },
  44: { left: 36, top: 69, labelPos: 'left' },
  43: { left: 41, top: 75, labelPos: 'bottom' },
  42: { left: 46, top: 80, labelPos: 'bottom' },
  41: { left: 49, top: 82, labelPos: 'bottom' },
  31: { left: 52, top: 82, labelPos: 'bottom' },
  32: { left: 55, top: 80, labelPos: 'bottom' },
  33: { left: 60, top: 75, labelPos: 'bottom' },
  34: { left: 65, top: 69, labelPos: 'right' },
  35: { left: 70, top: 60, labelPos: 'right' },
  36: { left: 74, top: 48, labelPos: 'right' },
  37: { left: 76, top: 35, labelPos: 'right' },
  38: { left: 77, top: 23, labelPos: 'right' }
};

const FRONTAL_COORDINATES: Record<number, { left: number; top: number }> = {
  14: { left: 20, top: 41 },
  13: { left: 27, top: 39 },
  12: { left: 35, top: 38 },
  11: { left: 45, top: 37 },
  21: { left: 55, top: 37 },
  22: { left: 65, top: 38 },
  23: { left: 73, top: 39 },
  24: { left: 80, top: 41 },
  43: { left: 30, top: 62 },
  42: { left: 38, top: 63 },
  41: { left: 46, top: 64 },
  31: { left: 54, top: 64 },
  32: { left: 62, top: 63 },
  33: { left: 70, top: 62 }
};

const TYPODONT_COORDINATES: Record<number, { left: number; top: number }> = {
  // Arcada Superior
  18: { left: 24, top: 22 },
  17: { left: 27, top: 20 },
  16: { left: 31, top: 18 },
  15: { left: 36, top: 17 },
  14: { left: 41, top: 16 },
  13: { left: 46, top: 15 },
  12: { left: 50, top: 15 },
  11: { left: 54, top: 15 },
  21: { left: 58, top: 15 },
  22: { left: 62, top: 15 },
  23: { left: 66, top: 15 },
  24: { left: 71, top: 16 },
  25: { left: 76, top: 17 },
  26: { left: 81, top: 18 },
  27: { left: 85, top: 20 },
  28: { left: 88, top: 22 },
  // Arcada Inferior
  48: { left: 24, top: 62 },
  47: { left: 27, top: 65 },
  46: { left: 31, top: 67 },
  45: { left: 36, top: 69 },
  44: { left: 41, top: 71 },
  43: { left: 46, top: 72 },
  42: { left: 50, top: 72 },
  41: { left: 54, top: 72 },
  31: { left: 58, top: 72 },
  32: { left: 62, top: 72 },
  33: { left: 66, top: 72 },
  34: { left: 71, top: 71 },
  35: { left: 76, top: 69 },
  36: { left: 81, top: 67 },
  37: { left: 85, top: 65 },
  38: { left: 88, top: 62 },
};

// Ordem dos dentes para barra de seleção rápida
const ALL_TEETH_ORDER = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38
];

interface Dental3DViewerProps {
  odontogramData?: OdontogramData;
  onSelectTooth?: (toothNumber: number) => void;
  selectedToothNumber?: number | null;
  onScanAiRequest?: () => void;
  className?: string;
}

export default function Dental3DViewer({
  odontogramData = {},
  onSelectTooth,
  selectedToothNumber,
  onScanAiRequest,
  className = ''
}: Dental3DViewerProps) {
  // Ângulo Clínico Selecionado (Padrão: Arcada Superior Oclusal HD)
  const [activeAngle, setActiveAngle] = useState<ClinicalDentalAngle>('maxilla');
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [localSelectedTooth, setLocalSelectedTooth] = useState<number | null>(selectedToothNumber ?? 16);
  
  // Controle de Zoom e Pan na Imagem Realística
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Estado para Arquivo STL de Scanner Intraoral Real
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [stlLoading, setStlLoading] = useState<boolean>(false);
  const [stlError, setStlError] = useState<string | null>(null);
  const stlContainerRef = useRef<HTMLDivElement>(null);
  const stlRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stlSceneRef = useRef<THREE.Scene | null>(null);
  const stlCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const stlMeshRef = useRef<THREE.Mesh | null>(null);
  const stlAnimFrameRef = useRef<number | null>(null);

  // Sincroniza dente selecionado externo
  useEffect(() => {
    if (selectedToothNumber !== undefined && selectedToothNumber !== null) {
      setLocalSelectedTooth(selectedToothNumber);
      // Se for dente inferior e estiver na arcada superior, sugere alternar se desejado
      if (selectedToothNumber >= 31 && selectedToothNumber <= 48 && activeAngle === 'maxilla') {
        setActiveAngle('mandible');
      } else if (selectedToothNumber >= 11 && selectedToothNumber <= 28 && activeAngle === 'mandible') {
        setActiveAngle('maxilla');
      }
    }
  }, [selectedToothNumber]);

  // Estatísticas de achados biológicos
  const stats = useMemo(() => {
    let amalgams = 0;
    let zirconias = 0;
    let nicos = 0;
    let endodontics = 0;
    let others = 0;

    if (odontogramData.teeth) {
      Object.values(odontogramData.teeth).forEach(tooth => {
        const s = normalizeToothStatus(tooth?.status);
        if (s === 'amalgam') amalgams++;
        else if (s === 'zirconia_implant') zirconias++;
        else if (s === 'cavitation_nico') nicos++;
        else if (s === 'endodontic') endodontics++;
        else if (s !== 'healthy') others++;
      });
    }

    return { amalgams, zirconias, nicos, endodontics, others };
  }, [odontogramData.teeth]);

  // Ângulos disponíveis para navegação clínica
  const ANGLES_LIST: { id: ClinicalDentalAngle; label: string; icon: string; desc: string }[] = [
    { id: 'maxilla', label: 'Arcada Superior', icon: '🦷', desc: 'Maxila Oclusal (Dentes 18 a 28)' },
    { id: 'mandible', label: 'Arcada Inferior', icon: '🦷', desc: 'Mandíbula Oclusal (Dentes 48 a 38)' },
    { id: 'frontal', label: 'Visão Frontal', icon: '👄', desc: 'Sorriso e Oclusão Anterior' },
    { id: 'typodont', label: 'Manequim Completo', icon: '✨', desc: 'Modelo Articulado 32 Dentes' },
    { id: 'cbct', label: 'Tomografia CBCT', icon: '🩻', desc: 'Cortes Tomográficos e Raio-X' },
    { id: 'stl_scanner', label: 'Scanner 3D (.STL)', icon: '📦', desc: 'Malha 3D Real do Scanner' }
  ];

  // Alterna para o próximo/anterior ângulo
  const cycleAngle = (direction: 'prev' | 'next') => {
    const currentIndex = ANGLES_LIST.findIndex(a => a.id === activeAngle);
    if (currentIndex === -1) return;
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = ANGLES_LIST.length - 1;
    if (nextIndex >= ANGLES_LIST.length) nextIndex = 0;
    setActiveAngle(ANGLES_LIST[nextIndex].id);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Trata seleção de dente
  const handleSelectToothInternal = (toothNum: number) => {
    setLocalSelectedTooth(toothNum);
    if (onSelectTooth) {
      onSelectTooth(toothNum);
    }
  };

  // Controles de Zoom
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.35, 2.8));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.35, 1));
  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Handlers de Pan (Arrastar a imagem)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // Manipulação de upload de arquivo .STL de Scanner Intraoral Real
  const handleStlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.stl')) {
      setStlError('Selecione um arquivo de malha 3D .STL válido gerado pelo scanner (ex: iTero, Trios, Medit).');
      return;
    }

    setStlFile(file);
    setStlError(null);
    setActiveAngle('stl_scanner');
    loadStlMesh(file);
  };

  // Carrega e renderiza o arquivo STL Real no Three.js
  const loadStlMesh = (file: File) => {
    if (!stlContainerRef.current) return;
    setStlLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const contents = event.target?.result as ArrayBuffer;
        const loader = new STLLoader();
        const geometry = loader.parse(contents);

        geometry.computeVertexNormals();
        geometry.center();

        // Inicializa cena Three.js para o STL
        initStlViewer(geometry);
        setStlLoading(false);
      } catch (err) {
        console.error('Erro ao processar STL:', err);
        setStlError('Não foi possível ler o arquivo STL. Verifique se o arquivo não está corrompido.');
        setStlLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Inicializa visualizador Three.js dedicado para o arquivo STL do Scanner
  const initStlViewer = (geometry: THREE.BufferGeometry) => {
    if (!stlContainerRef.current) return;

    // Limpa render anterior se existir
    if (stlRendererRef.current && stlContainerRef.current) {
      stlContainerRef.current.innerHTML = '';
      if (stlAnimFrameRef.current) cancelAnimationFrame(stlAnimFrameRef.current);
    }

    const width = stlContainerRef.current.clientWidth || 800;
    const height = stlContainerRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate 950
    stlSceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 150);
    stlCameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stlContainerRef.current.appendChild(renderer.domElement);
    stlRendererRef.current = renderer;

    // Luzes clínicas cirúrgicas
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(100, 100, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight2.position.set(-100, -50, -100);
    scene.add(dirLight2);

    // Material cerâmico de esmalte de alta definição
    const material = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    stlMeshRef.current = mesh;

    // Rotação orbital
    let isMouseDown = false;
    let prevMousePos = { x: 0, y: 0 };

    const domElem = renderer.domElement;
    domElem.onmousedown = (e) => {
      isMouseDown = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    domElem.onmousemove = (e) => {
      if (!isMouseDown || !mesh) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      mesh.rotation.y += deltaX * 0.01;
      mesh.rotation.x += deltaY * 0.01;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    domElem.onmouseup = () => { isMouseDown = false; };
    domElem.onmouseleave = () => { isMouseDown = false; };

    // Animação de rotação suave
    const animate = () => {
      stlAnimFrameRef.current = requestAnimationFrame(animate);
      if (!isMouseDown && mesh) {
        mesh.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();
  };

  // Coordenadas ativas com base no ângulo clínico selecionado
  const activeCoordinates = useMemo(() => {
    switch (activeAngle) {
      case 'maxilla':
        return MAXILLA_COORDINATES;
      case 'mandible':
        return MANDIBLE_COORDINATES;
      case 'frontal':
        return FRONTAL_COORDINATES;
      case 'typodont':
        return TYPODONT_COORDINATES;
      default:
        return {};
    }
  }, [activeAngle]);

  // Imagem correspondente ao ângulo
  const activeImagePath = useMemo(() => {
    switch (activeAngle) {
      case 'maxilla':
        return '/dental_arch_maxilla_hd.jpg';
      case 'mandible':
        return '/dental_arch_mandible_hd.jpg';
      case 'frontal':
        return '/dental_frontal_smile_hd.jpg';
      case 'typodont':
        return '/typodont_dental_model.jpg';
      case 'cbct':
        return '/sample_cbct_scan.jpg';
      default:
        return '/dental_arch_maxilla_hd.jpg';
    }
  }, [activeAngle]);

  // Dados do dente ativo selecionado
  const activeToothNumber = localSelectedTooth ?? selectedToothNumber ?? 16;
  const activeToothMeta = TOOTH_METADATA[activeToothNumber];
  const activeToothRecord = odontogramData.teeth ? odontogramData.teeth[activeToothNumber] : undefined;
  const activeToothStatus = normalizeToothStatus(activeToothRecord?.status);
  const activeToothConfig = STATUS_CONFIG[activeToothStatus];

  return (
    <div className={cn(
      "w-full bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col relative",
      className
    )}>
      {/* HEADER SUPERIOR: SELETOR DE ÂNGULOS CLÍNICOS E CONTROLES DE ZOOM */}
      <div className="p-3.5 md:p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Lado Esquerdo: Título e Ângulos de Inspeção */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black">
            🦷
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm md:text-base text-slate-100 flex items-center gap-1.5">
                Arcada Anatômica Realística HD
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                Grau Clínico
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Fotografia de alta definição e laudo biológico interativo • Clique nos dentes para examinar
            </p>
          </div>
        </div>

        {/* Centro / Direita: Seletor de Ângulos Clínicos */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 flex-wrap">
          {ANGLES_LIST.map((ang) => {
            const isActive = activeAngle === ang.id;
            return (
              <button
                key={ang.id}
                type="button"
                onClick={() => {
                  setActiveAngle(ang.id);
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/40 ring-1 ring-emerald-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                )}
                title={ang.desc}
              >
                <span>{ang.icon}</span>
                <span>{ang.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ações: Scanner IA, Lupa, Reset e Upload de STL */}
        <div className="flex items-center gap-2 flex-wrap">
          {onScanAiRequest && (
            <button
              type="button"
              onClick={onScanAiRequest}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/30 transition-all cursor-pointer active:scale-95"
              title="Analisar achados biológicos com IA"
            >
              <Sparkles size={13} className="text-amber-300" />
              <span>Scanner IA</span>
            </button>
          )}

          {/* Navegação entre ângulos */}
          <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5">
            <button
              type="button"
              onClick={() => cycleAngle('prev')}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Ângulo anterior"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => cycleAngle('next')}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Próximo ângulo"
            >
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Zoom In, Out e Reset */}
          <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5">
            <button
              type="button"
              onClick={zoomIn}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Aproximar Lupa Zoom (+)"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Afastar Zoom (-)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Resetar Zoom (1x)"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Upload do Arquivo STL do Scanner Intraoral */}
          <label className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer" title="Importar arquivo 3D real exportado pelo scanner da Dra. Lucy (.STL)">
            <UploadCloud size={13} className="text-sky-400" />
            <span className="hidden sm:inline">Importar .STL</span>
            <input 
              type="file" 
              accept=".stl" 
              className="hidden" 
              onChange={handleStlUpload} 
            />
          </label>
        </div>
      </div>

      {/* PALCO PRINCIPAL DE VISUALIZAÇÃO INTERATIVA */}
      <div 
        className={cn(
          "relative w-full h-[460px] md:h-[540px] select-none bg-radial from-slate-900 to-slate-950 overflow-hidden flex items-center justify-center",
          zoomLevel > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* CASO 1: VISUALIZAÇÃO DE SCANNER STL 3D REAL (QUANDO IMPORTADO) */}
        {activeAngle === 'stl_scanner' ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            {stlFile ? (
              <div className="relative w-full h-full">
                <div ref={stlContainerRef} className="w-full h-full" />
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700 text-white text-xs shadow-xl flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
                  <div>
                    <p className="font-bold text-sky-200">Malha 3D Real do Scanner Intraoral: {stlFile.name}</p>
                    <p className="text-[10px] text-slate-400">Clique e arraste com o mouse para girar em 360° no espaço tridimensional</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md p-6 bg-slate-900/90 border border-slate-800 rounded-3xl text-center shadow-2xl flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
                  <Box size={32} />
                </div>
                <h4 className="text-base font-bold text-slate-100 mb-1">
                  Carregador de Scanner Intraoral 3D (.STL)
                </h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  O scanner odontológico da Dra. Lucy (iTero, Trios, Medit) gera um arquivo <strong>.STL</strong> com a malha 3D real da boca do paciente. Arraste o arquivo aqui para inspecionar com rotação em 360°.
                </p>
                <label className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-sky-600/30 cursor-pointer flex items-center gap-2">
                  <UploadCloud size={16} />
                  <span>Selecionar Arquivo .STL do Scanner</span>
                  <input type="file" accept=".stl" className="hidden" onChange={handleStlUpload} />
                </label>
                {stlError && (
                  <p className="text-xs text-rose-400 mt-3 font-semibold bg-rose-950/50 p-2 rounded-xl border border-rose-900">
                    {stlError}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* CASO 2: VISUALIZAÇÃO FOTOGRÁFICA REALÍSTICA HD COM PINOS E ZONAS INTERATIVAS */
          <div 
            className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-100"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`
            }}
          >
            {/* Imagem Fotográfica de Altíssima Definição */}
            <img 
              src={activeImagePath} 
              alt={`Arcada Dentária Realística - ${activeAngle}`}
              className="max-h-[460px] md:max-h-[520px] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800/80 pointer-events-none transition-all duration-300"
            />

            {/* Pinos e Zonas de Clique Interativas nos Dentes */}
            <div className="absolute inset-0 pointer-events-auto">
              {Object.entries(activeCoordinates).map(([numStr, coords]) => {
                const toothNum = parseInt(numStr, 10);
                const meta = TOOTH_METADATA[toothNum];
                const rec = odontogramData.teeth ? odontogramData.teeth[toothNum] : undefined;
                const status = normalizeToothStatus(rec?.status);
                const isSelected = activeToothNumber === toothNum;
                const isHovered = hoveredTooth === toothNum;
                const hasFinding = status !== 'healthy';

                // Cor do anel indicador biológico
                let badgeBg = 'bg-slate-900/90 text-white border-slate-600 shadow-slate-900/50';
                let glowColor = 'ring-emerald-400 shadow-emerald-500/50';
                
                if (status === 'amalgam') {
                  badgeBg = 'bg-slate-800 text-slate-100 border-slate-400';
                  glowColor = 'ring-slate-400 shadow-slate-400/50';
                } else if (status === 'zirconia_implant') {
                  badgeBg = 'bg-sky-600 text-white border-sky-300';
                  glowColor = 'ring-sky-400 shadow-sky-500/50';
                } else if (status === 'cavitation_nico') {
                  badgeBg = 'bg-rose-600 text-white border-rose-300';
                  glowColor = 'ring-rose-400 shadow-rose-500/50';
                } else if (status === 'endodontic') {
                  badgeBg = 'bg-amber-600 text-white border-amber-300';
                  glowColor = 'ring-amber-400 shadow-amber-500/50';
                } else if (status === 'caries') {
                  badgeBg = 'bg-yellow-600 text-white border-yellow-300';
                  glowColor = 'ring-yellow-400 shadow-yellow-500/50';
                } else if (status === 'ceramic_crown') {
                  badgeBg = 'bg-teal-600 text-white border-teal-300';
                  glowColor = 'ring-teal-400 shadow-teal-500/50';
                }

                return (
                  <button
                    key={toothNum}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectToothInternal(toothNum);
                    }}
                    onMouseEnter={() => setHoveredTooth(toothNum)}
                    onMouseLeave={() => setHoveredTooth(null)}
                    style={{
                      left: `${coords.left}%`,
                      top: `${coords.top}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={cn(
                      "absolute transition-all duration-150 flex flex-col items-center group cursor-pointer z-20",
                      isSelected && "scale-125 z-30",
                      isHovered && !isSelected && "scale-115 z-25"
                    )}
                    title={`#${toothNum} - ${meta?.name} (${STATUS_CONFIG[status].label})`}
                  >
                    {/* Botão de Notação FDI do Dente */}
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-[10px] border shadow-xl transition-all",
                      badgeBg,
                      isSelected ? `ring-4 ${glowColor} scale-115 shadow-2xl` : "opacity-85 group-hover:opacity-100",
                      !hasFinding && !isSelected && "bg-slate-950/80 border-slate-700 text-slate-300"
                    )}>
                      {toothNum}
                    </div>

                    {/* Ponto indicador de alerta para dentes com achados clínicos */}
                    {hasFinding && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping absolute -top-1 -right-1" />
                    )}

                    {/* Tooltip anatômico ao passar o mouse */}
                    {isHovered && !isSelected && (
                      <div className="absolute -bottom-8 bg-slate-950/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700 text-[10px] text-white whitespace-nowrap shadow-2xl z-40 pointer-events-none">
                        <strong className="text-emerald-300">#{toothNum}</strong>: {STATUS_CONFIG[status].label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BADGE DE CONTROLE E DICAS (CANTO SUPERIOR ESQUERDO) */}
        <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-800 text-white text-[11px] shadow-2xl flex items-center gap-2.5 pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <div>
            <p className="font-bold text-slate-100 leading-tight">
              {activeAngle === 'maxilla' && 'Arcada Superior Oclusal (Maxila)'}
              {activeAngle === 'mandible' && 'Arcada Inferior Oclusal (Mandíbula)'}
              {activeAngle === 'frontal' && 'Visão Frontal Oclusal (Sorriso)'}
              {activeAngle === 'typodont' && 'Manequim Articulado Completo'}
              {activeAngle === 'cbct' && 'Tomografia Computadorizada 3D'}
              {activeAngle === 'stl_scanner' && 'Scanner Intraoral (.STL)'}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {zoomLevel > 1 
                ? `Zoom: ${zoomLevel.toFixed(1)}x • Arraste com o mouse para mover` 
                : 'Clique diretamente em qualquer dente para abrir o laudo'}
            </p>
          </div>
        </div>

        {/* RESUMO DOS ACHADOS BIOLÓGICOS (CANTO SUPERIOR DIREITO) */}
        <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 text-white text-xs shadow-2xl flex items-center gap-2">
          {stats.amalgams > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> {stats.amalgams} Amálgamas
            </span>
          )}
          {stats.zirconias > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-sky-950/80 text-sky-300 border border-sky-800 font-mono text-[10px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span> {stats.zirconias} Zircônias
            </span>
          )}
          {stats.nicos > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 font-mono text-[10px] flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> {stats.nicos} NICO
            </span>
          )}
        </div>
      </div>

      {/* BARRA DE SELEÇÃO RÁPIDA DE DENTES (FDI 11 a 48) */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-1">
          Dentes FDI:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {ALL_TEETH_ORDER.map((num) => {
            const isSelected = activeToothNumber === num;
            const rec = odontogramData.teeth ? odontogramData.teeth[num] : undefined;
            const status = normalizeToothStatus(rec?.status);
            const hasFinding = status !== 'healthy';

            let btnColor = "bg-slate-800 text-slate-300 hover:bg-slate-700";
            if (status === 'amalgam') btnColor = "bg-slate-700 text-slate-100 border border-slate-500";
            if (status === 'zirconia_implant') btnColor = "bg-sky-600 text-white";
            if (status === 'cavitation_nico') btnColor = "bg-rose-600 text-white animate-pulse";
            if (status === 'endodontic') btnColor = "bg-amber-600 text-white";

            return (
              <button
                key={num}
                type="button"
                onClick={() => handleSelectToothInternal(num)}
                className={cn(
                  "w-7 h-7 rounded-xl font-mono text-[11px] font-black transition-all flex items-center justify-center shrink-0 cursor-pointer relative",
                  btnColor,
                  isSelected && "ring-2 ring-emerald-400 scale-110 shadow-lg shadow-emerald-500/40 z-10"
                )}
                title={`Selecionar Dente #${num}`}
              >
                {num}
                {hasFinding && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 absolute top-0.5 right-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CARD CLÍNICO DO DENTE SELECIONADO: LAUDO INTEGRATIVO E DENTE-ÓRGÃO */}
      {activeToothMeta && (
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-lg border shadow-xl shrink-0",
              activeToothStatus === 'amalgam' && "bg-slate-800 text-slate-200 border-slate-600",
              activeToothStatus === 'zirconia_implant' && "bg-sky-600 text-white border-sky-400 shadow-sky-600/30",
              activeToothStatus === 'cavitation_nico' && "bg-rose-600 text-white border-rose-400 shadow-rose-600/30",
              activeToothStatus === 'endodontic' && "bg-amber-600 text-white border-amber-400 shadow-amber-600/30",
              activeToothStatus === 'healthy' && "bg-slate-900 text-emerald-400 border-emerald-500/40"
            )}>
              #{activeToothNumber}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-slate-100 text-sm md:text-base">
                  {activeToothMeta.name}
                </h4>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1",
                  activeToothConfig.badgeColor,
                  activeToothConfig.badgeBorder,
                  activeToothConfig.badgeText
                )}>
                  {activeToothConfig.label}
                </span>
                {activeToothRecord?.neuralTherapy && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-900/70 text-teal-300 border border-teal-700 text-xs font-semibold">
                    Terapia Neural
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Meridiano: <strong className="text-sky-300">{activeToothMeta.meridian}</strong></span>
                <span>•</span>
                <span>Órgão: <strong className="text-emerald-300">{activeToothMeta.organ}</strong></span>
                <span>•</span>
                <span>Vértebras: <span className="text-slate-300">{activeToothMeta.vertebrae}</span></span>
              </p>
            </div>
          </div>

          {/* Plano Biológico e Ações */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {activeToothRecord?.biologicalPlan && (
              <div className="text-right hidden sm:block max-w-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Conduta Planejada:</p>
                <p className="text-xs text-slate-200 truncate">{activeToothRecord.biologicalPlan}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (onSelectTooth) onSelectTooth(activeToothNumber);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/30 cursor-pointer flex items-center gap-1.5"
            >
              <span>Editar Dente no Odontograma</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
