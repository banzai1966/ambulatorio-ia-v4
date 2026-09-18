import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Layers, 
  Sparkles, 
  Info, 
  ShieldCheck, 
  Activity, 
  Zap,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sun,
  Flame,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileCode,
  ArrowUp,
  ArrowDown,
  MoveVertical
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  TOOTH_METADATA, 
  STATUS_CONFIG, 
  ToothStatus, 
  OdontogramData, 
  normalizeToothStatus 
} from './InteractiveOdontogram';

// Cores odontológicas biológicas em hexadecimal para materiais Three.js
const STATUS_COLORS_3D: Record<ToothStatus, number> = {
  healthy: 0xf8fafc,         // Esmalte dental natural marfim/pérola
  amalgam: 0x334155,         // Metal escuro metálico
  zirconia_implant: 0x38bdf8,// Zircônia pura cerâmica brilhante azul claro
  titanium_implant: 0x64748b,// Titânio acinzentado fosco
  endodontic: 0xf97316,      // Guta-percha laranja vibrante
  cavitation_nico: 0xe11d48, // NICO / Isquemia óssea vermelho-rubi
  missing: 0x94a3b8,         // Translúcido fantasma
  caries: 0xd97706,          // Cárie / resina âmbar
  ceramic_crown: 0x0d9488    // Coroa cerâmica verde-azulado
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const teethMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const boneMeshesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  // Estados interativos
  const [boneTransparency, setBoneTransparency] = useState<number>(0.35); // 0 = invisível, 1 = opaco
  const [showNerves, setShowNerves] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activeArchView, setActiveArchView] = useState<'both' | 'upper' | 'lower'>('both');
  const [viewAngle, setViewAngle] = useState<'front' | 'occlusal_upper' | 'occlusal_lower' | 'right' | 'left'>('front');
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);

  // Dente ativo selecionado
  const activeTooth = selectedToothNumber ? TOOTH_METADATA[selectedToothNumber] : null;
  const activeRecord = selectedToothNumber && odontogramData.teeth ? odontogramData.teeth[selectedToothNumber] : null;

  // Estatísticas rápidas da arcada 3D
  const stats = useMemo(() => {
    const teeth = odontogramData.teeth || {};
    let amalgams = 0;
    let zirconias = 0;
    let nicos = 0;
    let endos = 0;
    let galvanismHigh = 0;

    Object.values(teeth).forEach(t => {
      if (t.status === 'amalgam') amalgams++;
      if (t.status === 'zirconia_implant') zirconias++;
      if (t.status === 'cavitation_nico') nicos++;
      if (t.status === 'endodontic') endos++;
      if (t.galvanismo_mv && Math.abs(t.galvanismo_mv) > 100) galvanismHigh++;
    });

    return { amalgams, zirconias, nicos, endos, galvanismHigh };
  }, [odontogramData]);

  // Inicialização da Cena 3D Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d); // Fundo escuro azul-noite médico cirúrgico
    sceneRef.current = scene;

    // Grid sutil no chão cirúrgico
    const gridHelper = new THREE.GridHelper(260, 26, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -65;
    scene.add(gridHelper);

    // 2. Câmera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 20, 220);
    cameraRef.current = camera;

    // 3. Renderer WebGL com antialias e cores vibrantes
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Iluminação Cirúrgica Odontológica
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainSpot = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    mainSpot.position.set(60, 100, 140);
    scene.add(mainSpot);

    const rimLight = new THREE.DirectionalLight(0x0284c7, 1.2);
    rimLight.position.set(-80, -40, -100);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 0.6, 300);
    fillLight.position.set(0, 0, 80);
    scene.add(fillLight);

    // 5. Construção Anatômica dos Arcos Dentários (Maxila e Mandíbula)
    buildDentalAnatomy(scene);

    // 6. Loop de Renderização e Controles Manuais com Mouse/Touch
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0.1;
    let targetRotationY = 0;
    let currentRotationX = 0.1;
    let currentRotationY = 0;
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      setIsDragging(true);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      // Raycasting para detectar dente sob o cursor
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const meshes = Array.from(teethMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const toothNum = hit.userData.toothNumber;
        setHoveredTooth(toothNum || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredTooth(null);
        renderer.domElement.style.cursor = isMouseDown ? 'grabbing' : 'grab';
      }

      if (!isMouseDown) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;
      targetRotationX = Math.max(-Math.PI / 1.8, Math.min(Math.PI / 1.8, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isMouseDown = false;
      setIsDragging(false);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.12;
      camera.position.z = Math.max(80, Math.min(380, camera.position.z));
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const meshes = Array.from(teethMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const toothNum = hit.userData.toothNumber;
        if (toothNum && onSelectTooth) {
          onSelectTooth(toothNum);
        }
      }
    };

    // Suporte a Touch em dispositivos móveis e tablets
    let touchStartPos = { x: 0, y: 0 };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isMouseDown = true;
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isMouseDown) {
        const deltaX = e.touches[0].clientX - touchStartPos.x;
        const deltaY = e.touches[0].clientY - touchStartPos.y;

        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        targetRotationX = Math.max(-Math.PI / 1.8, Math.min(Math.PI / 1.8, targetRotationX));

        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchEnd = () => {
      isMouseDown = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Função de Animação
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (autoRotate && !isMouseDown) {
        targetRotationY += 0.005;
      }

      // Suavização da rotação da cena
      currentRotationX += (targetRotationX - currentRotationX) * 0.1;
      currentRotationY += (targetRotationY - currentRotationY) * 0.1;

      scene.rotation.x = currentRotationX;
      scene.rotation.y = currentRotationY;

      renderer.render(scene, camera);
    };

    animate();

    // Redimensionamento responsivo
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
    };
  }, []);

  // Atualização dos Materiais e Cores dos dentes quando o odontograma muda
  useEffect(() => {
    teethMeshesRef.current.forEach((mesh, toothNum) => {
      const rec = odontogramData.teeth ? odontogramData.teeth[toothNum] : undefined;
      const status = normalizeToothStatus(rec?.status);
      const isSelected = selectedToothNumber === toothNum;
      const isHovered = hoveredTooth === toothNum;

      const baseColor = STATUS_COLORS_3D[status] || 0xf8fafc;
      const material = mesh.material as THREE.MeshStandardMaterial;

      if (material) {
        if (isSelected) {
          material.color.setHex(0x10b981); // Verde esmeralda brilhante para dente selecionado
          material.emissive.setHex(0x065f46);
          material.emissiveIntensity = 0.6;
        } else if (isHovered) {
          material.color.setHex(0x38bdf8); // Ciano no hover
          material.emissive.setHex(0x0284c7);
          material.emissiveIntensity = 0.4;
        } else if (status === 'cavitation_nico') {
          material.color.setHex(0xe11d48);
          material.emissive.setHex(0x881337);
          material.emissiveIntensity = 0.5;
        } else if (status === 'amalgam') {
          material.color.setHex(0x334155);
          material.metalness = 0.9;
          material.roughness = 0.25;
          material.emissive.setHex(0x000000);
        } else if (status === 'zirconia_implant') {
          material.color.setHex(0xf0fdfa);
          material.metalness = 0.1;
          material.roughness = 0.1;
          material.emissive.setHex(0x0284c7);
          material.emissiveIntensity = 0.2;
        } else {
          material.color.setHex(baseColor);
          material.metalness = 0.2;
          material.roughness = 0.35;
          material.emissive.setHex(0x000000);
          material.emissiveIntensity = 0;
        }
      }
    });
  }, [odontogramData, selectedToothNumber, hoveredTooth]);

  // Atualização da transparência do osso
  useEffect(() => {
    boneMeshesRef.current.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = boneTransparency;
        mat.transparent = boneTransparency < 0.98;
      }
    });
  }, [boneTransparency]);

  // Construção procedural do modelo anatômico 3D da arcada dentária
  const buildDentalAnatomy = (scene: THREE.Scene) => {
    teethMeshesRef.current.clear();
    boneMeshesRef.current = [];

    // Grupo Geral
    const dentalGroup = new THREE.Group();
    dentalGroup.name = 'dental_anatomy_group';

    // 1. MODELAGEM DA MAXILA (Osso Superior)
    const upperBoneGeo = new THREE.TorusGeometry(52, 14, 16, 40, Math.PI);
    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: boneTransparency
    });
    const upperBoneMesh = new THREE.Mesh(upperBoneGeo, boneMaterial);
    upperBoneMesh.rotation.x = Math.PI / 2;
    upperBoneMesh.rotation.z = Math.PI;
    upperBoneMesh.position.set(0, 18, -10);
    dentalGroup.add(upperBoneMesh);
    boneMeshesRef.current.push(upperBoneMesh);

    // 2. MODELAGEM DA MANDÍBULA (Osso Inferior)
    const lowerBoneGeo = new THREE.TorusGeometry(48, 13, 16, 40, Math.PI);
    const lowerBoneMesh = new THREE.Mesh(lowerBoneGeo, boneMaterial.clone());
    lowerBoneMesh.rotation.x = Math.PI / 2;
    lowerBoneMesh.rotation.z = Math.PI;
    lowerBoneMesh.position.set(0, -18, -10);
    dentalGroup.add(lowerBoneMesh);
    boneMeshesRef.current.push(lowerBoneMesh);

    // 3. CANAIS NERVOSOS (Nervo Alveolar Inferior e Seio Maxilar)
    if (showNerves) {
      // Nervo mandibular direito e esquerdo (amarelo bioelétrico)
      const nerveCurveRight = new THREE.CatmullRomCurve3([
        new THREE.Vector3(42, -22, -30),
        new THREE.Vector3(34, -26, 0),
        new THREE.Vector3(18, -26, 26),
        new THREE.Vector3(0, -26, 32)
      ]);
      const nerveCurveLeft = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-42, -22, -30),
        new THREE.Vector3(-34, -26, 0),
        new THREE.Vector3(-18, -26, 26),
        new THREE.Vector3(0, -26, 32)
      ]);

      const nerveMaterial = new THREE.MeshStandardMaterial({
        color: 0xfacc15, // Amarelo nervo cirúrgico
        emissive: 0xca8a04,
        emissiveIntensity: 0.4,
        roughness: 0.3
      });

      const nerveTubeRight = new THREE.Mesh(new THREE.TubeGeometry(nerveCurveRight, 20, 1.8, 8, false), nerveMaterial);
      const nerveTubeLeft = new THREE.Mesh(new THREE.TubeGeometry(nerveCurveLeft, 20, 1.8, 8, false), nerveMaterial);
      dentalGroup.add(nerveTubeRight);
      dentalGroup.add(nerveTubeLeft);
    }

    // 4. POSICIONAMENTO ANATÔMICO DOS 32 DENTES (FDI 11 a 48)
    const upperTeethOrder = [
      18, 17, 16, 15, 14, 13, 12, 11,
      21, 22, 23, 24, 25, 26, 27, 28
    ];

    const lowerTeethOrder = [
      48, 47, 46, 45, 44, 43, 42, 41,
      31, 32, 33, 34, 35, 36, 37, 38
    ];

    // Arco Superior (Maxila)
    upperTeethOrder.forEach((num, index) => {
      const angle = (Math.PI / 16) * (index + 0.5); // Distribuição parabólica
      const radiusX = 46;
      const radiusZ = 40;

      const posX = -Math.cos(angle) * radiusX;
      const posZ = Math.sin(angle) * radiusZ - 10;
      const posY = 14;

      const toothMesh = createAnatomicalToothMesh(num, 'superior');
      toothMesh.position.set(posX, posY, posZ);
      toothMesh.rotation.y = -(angle - Math.PI / 2);
      toothMesh.userData = { toothNumber: num, arch: 'superior' };

      dentalGroup.add(toothMesh);
      teethMeshesRef.current.set(num, toothMesh);
    });

    // Arco Inferior (Mandíbula)
    lowerTeethOrder.forEach((num, index) => {
      const angle = (Math.PI / 16) * (index + 0.5);
      const radiusX = 43;
      const radiusZ = 37;

      const posX = -Math.cos(angle) * radiusX;
      const posZ = Math.sin(angle) * radiusZ - 10;
      const posY = -14;

      const toothMesh = createAnatomicalToothMesh(num, 'inferior');
      toothMesh.position.set(posX, posY, posZ);
      toothMesh.rotation.y = -(angle - Math.PI / 2);
      toothMesh.userData = { toothNumber: num, arch: 'inferior' };

      dentalGroup.add(toothMesh);
      teethMeshesRef.current.set(num, toothMesh);
    });

    scene.add(dentalGroup);
  };

  // Criação da geometria refinada de cada dente (Coroa + Raiz)
  const createAnatomicalToothMesh = (toothNumber: number, arch: 'superior' | 'inferior'): THREE.Mesh => {
    const meta = TOOTH_METADATA[toothNumber];
    const isMolar = meta?.type === 'molar';
    const isPremolar = meta?.type === 'premolar';
    const isCanine = meta?.type === 'canine';

    // Dimensões proporcionais por tipo de elemento dental
    let crownWidth = 5.2;
    let crownHeight = 7.5;
    let rootLength = 11.5;

    if (isMolar) {
      crownWidth = 8.5;
      crownHeight = 6.8;
      rootLength = 13.0;
    } else if (isPremolar) {
      crownWidth = 6.2;
      crownHeight = 7.2;
      rootLength = 12.0;
    } else if (isCanine) {
      crownWidth = 5.8;
      crownHeight = 9.0;
      rootLength = 15.0; // Canino tem a maior raiz da arcada
    }

    // Geometria Composta: Coroa esférica facetada + Raiz cônica
    const toothGeometry = new THREE.BufferGeometry();
    
    // Coroa
    const crownGeo = isMolar
      ? new THREE.BoxGeometry(crownWidth, crownHeight, crownWidth * 0.9, 2, 2, 2)
      : new THREE.CylinderGeometry(crownWidth * 0.45, crownWidth * 0.6, crownHeight, 8);

    // Raiz apontando para dentro do osso
    const rootGeo = new THREE.ConeGeometry(crownWidth * 0.4, rootLength, 6);
    
    // Orientação correta da raiz (Superior aponta para cima +Y, Inferior aponta para baixo -Y)
    if (arch === 'superior') {
      rootGeo.translate(0, crownHeight / 2 + rootLength / 2, 0);
    } else {
      rootGeo.rotateX(Math.PI);
      rootGeo.translate(0, -(crownHeight / 2 + rootLength / 2), 0);
    }

    const rec = odontogramData.teeth ? odontogramData.teeth[toothNumber] : undefined;
    const status = normalizeToothStatus(rec?.status);
    const color = STATUS_COLORS_3D[status] || 0xf8fafc;

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: status === 'amalgam' ? 0.9 : 0.15,
    });

    const mesh = new THREE.Mesh(crownGeo, material);
    const rootMesh = new THREE.Mesh(rootGeo, material);
    mesh.add(rootMesh);

    return mesh;
  };

  // Controles de câmera rápidos (Ângulos Pré-definidos)
  const setCameraAngle = (angle: 'front' | 'occlusal_upper' | 'occlusal_lower' | 'right' | 'left') => {
    setViewAngle(angle);
    if (!cameraRef.current || !sceneRef.current) return;

    const camera = cameraRef.current;
    const scene = sceneRef.current;

    switch (angle) {
      case 'front':
        camera.position.set(0, 10, 220);
        scene.rotation.set(0.1, 0, 0);
        break;
      case 'occlusal_upper':
        camera.position.set(0, 180, 20);
        scene.rotation.set(Math.PI / 2.3, 0, 0);
        break;
      case 'occlusal_lower':
        camera.position.set(0, -180, 20);
        scene.rotation.set(-Math.PI / 2.3, 0, 0);
        break;
      case 'right':
        camera.position.set(220, 10, 0);
        scene.rotation.set(0, Math.PI / 2, 0);
        break;
      case 'left':
        camera.position.set(-220, 10, 0);
        scene.rotation.set(0, -Math.PI / 2, 0);
        break;
    }
  };

  // Reset de Visualização
  const handleResetCamera = () => {
    if (!cameraRef.current || !sceneRef.current) return;
    cameraRef.current.position.set(0, 20, 220);
    sceneRef.current.rotation.set(0.1, 0, 0);
    setViewAngle('front');
  };

  // Upload simulado/real de arquivo 3D (STL ou escaneamento intraoral)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportedFileName(file.name);
      // Feedback visual elegante de importação 3D
    }
  };

  return (
    <div className={cn("bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative", className)}>
      {/* Barra de Ferramentas Superior do Visualizador 3D */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-sky-600 to-emerald-600 text-white rounded-xl shadow-md shadow-sky-900/40">
            <Layers size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                Visualizador 3D Interativo Voxel & WebGL
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                60 FPS &bull; REAL-TIME
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gire a mandíbula em 360°, regule a transparência óssea e clique nos elementos para correlacionar.
            </p>
          </div>
        </div>

        {/* Resumo de Achados na Arcada 3D */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
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
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> {stats.nicos} NICO/Focos
            </span>
          )}
        </div>

        {/* Controles de Câmera e Scanner IA */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onScanAiRequest && (
            <button
              type="button"
              onClick={onScanAiRequest}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/30 transition-all cursor-pointer active:scale-95"
              title="Analisar este ângulo tridimensional com a Inteligência Artificial Odontológica"
            >
              <Sparkles size={13} className="text-amber-300" />
              <span>Scanner IA neste Ângulo</span>
            </button>
          )}

          {/* Botão de Auto-Rotação */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={cn(
              "px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer",
              autoRotate 
                ? "bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30" 
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
            )}
            title="Ativar/desativar rotação contínua automática para demonstração ao paciente"
          >
            <RefreshCw size={13} className={autoRotate ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Girar 360°</span>
          </button>

          {/* Reset da Câmera */}
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
            title="Restaurar posição original da câmera frontal"
          >
            <RotateCcw size={14} />
          </button>

          {/* Zoom In / Out */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => {
                if (!cameraRef.current) return;
                cameraRef.current.position.z = Math.max(80, cameraRef.current.position.z - 25);
              }}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Aproximar Zoom (+)"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!cameraRef.current) return;
                cameraRef.current.position.z = Math.min(380, cameraRef.current.position.z + 25);
              }}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Afastar Zoom (-)"
            >
              <ZoomOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Palco Principal do WebGL */}
      <div className="relative w-full h-[460px] md:h-[520px] select-none">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Overlay Lateral: Ângulos Rápidos de Visão Cirúrgica */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Vistas Anatômicas:
          </span>
          <button
            type="button"
            onClick={() => setCameraAngle('front')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all text-left border cursor-pointer",
              viewAngle === 'front' 
                ? "bg-sky-600 text-white border-sky-400 shadow-sm" 
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 backdrop-blur-sm"
            )}
          >
            Frontal (Sorriso)
          </button>
          <button
            type="button"
            onClick={() => setCameraAngle('occlusal_upper')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all text-left border cursor-pointer",
              viewAngle === 'occlusal_upper' 
                ? "bg-sky-600 text-white border-sky-400 shadow-sm" 
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 backdrop-blur-sm"
            )}
          >
            Oclusal Superior (Palato)
          </button>
          <button
            type="button"
            onClick={() => setCameraAngle('occlusal_lower')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all text-left border cursor-pointer",
              viewAngle === 'occlusal_lower' 
                ? "bg-sky-600 text-white border-sky-400 shadow-sm" 
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 backdrop-blur-sm"
            )}
          >
            Oclusal Inferior (Língua)
          </button>
          <button
            type="button"
            onClick={() => setCameraAngle('right')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all text-left border cursor-pointer",
              viewAngle === 'right' 
                ? "bg-sky-600 text-white border-sky-400 shadow-sm" 
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 backdrop-blur-sm"
            )}
          >
            Lateral Direita
          </button>
          <button
            type="button"
            onClick={() => setCameraAngle('left')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all text-left border cursor-pointer",
              viewAngle === 'left' 
                ? "bg-sky-600 text-white border-sky-400 shadow-sm" 
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 backdrop-blur-sm"
            )}
          >
            Lateral Esquerda
          </button>
        </div>

        {/* Overlay Inferior Esquerdo: Controle Cirúrgico de Transparência Óssea */}
        <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-white text-xs space-y-2 z-10 max-w-xs shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <Eye size={14} className="text-sky-400" />
              Transparência Óssea:
            </span>
            <span className="font-mono text-[11px] text-sky-400 font-bold">
              {Math.round((1 - boneTransparency) * 100)}% Raio-X
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={boneTransparency}
            onChange={(e) => setBoneTransparency(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Osso Total (Opaco)</span>
            <span>Ver Raízes & Nervos</span>
          </div>
        </div>

        {/* Overlay do Dente Selecionado com Correlação Sistêmica Biológica */}
        {activeTooth && (
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/40 text-white text-xs max-w-xs z-10 shadow-2xl space-y-2 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black font-mono flex items-center justify-center text-sm shadow-md">
                  {activeTooth.number}
                </span>
                <div>
                  <h5 className="font-extrabold text-xs text-white leading-tight">
                    {activeTooth.name}
                  </h5>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {STATUS_CONFIG[normalizeToothStatus(activeRecord?.status)].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex items-start gap-1">
                <strong className="text-slate-400 shrink-0">Meridiano:</strong>
                <span className="text-amber-300 font-semibold">{activeTooth.meridian}</span>
              </div>
              <div className="flex items-start gap-1">
                <strong className="text-slate-400 shrink-0">Órgão Alvo:</strong>
                <span>{activeTooth.organ}</span>
              </div>
              <div className="flex items-start gap-1">
                <strong className="text-slate-400 shrink-0">Vértebras:</strong>
                <span className="font-mono text-slate-400">{activeTooth.vertebrae}</span>
              </div>
              {activeRecord?.galvanismo_mv !== undefined && (
                <div className="flex items-center gap-1.5 pt-1 text-sky-300 font-mono">
                  <Zap size={12} className="text-amber-400" />
                  <span>Galvanismo: <strong>{activeRecord.galvanismo_mv} mV</strong></span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
              Clique em outro elemento 3D na arcada para inspecionar.
            </p>
          </div>
        )}

        {/* Tooltip Dinâmico do Hover sobre o dente */}
        {hoveredTooth && !activeTooth && (
          <div className="absolute bottom-16 right-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-500/50 text-white text-xs font-mono z-10 pointer-events-none shadow-lg">
            Dente #{hoveredTooth} - {TOOTH_METADATA[hoveredTooth]?.name}
          </div>
        )}

        {/* Guia de Navegação Interativa no Canto Inferior Direito */}
        <div className="absolute bottom-4 right-4 hidden sm:flex items-center gap-2 bg-slate-900/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
          <span>🖱️ Arraste para girar</span>
          <span>&bull;</span>
          <span>📜 Roda do mouse para zoom</span>
          <span>&bull;</span>
          <span>🎯 Clique no dente</span>
        </div>
      </div>

      {/* Rodapé Informativo e Importador Opcional de Arquivos 3D (STL/OBJ/DICOM) */}
      <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Renderização nativa WebGL sem envio de imagens para servidores terceiros (Sigilo Total LGPD).</span>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 cursor-pointer bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors">
          <UploadCloud size={13} />
          <span>{importedFileName ? `Malha: ${importedFileName}` : 'Carregar STL / Escaneamento Intraoral'}</span>
          <input 
            type="file" 
            accept=".stl,.obj,.ply,.dcm" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </label>
      </div>
    </div>
  );
}
