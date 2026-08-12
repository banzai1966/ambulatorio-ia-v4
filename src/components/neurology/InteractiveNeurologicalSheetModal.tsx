import React, { useRef, useState, useEffect } from 'react';
import { X, PenTool, Eraser, RotateCcw, Check, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  savedAnnotation?: string | null;
  onSaveAnnotation: (base64Image: string) => void;
}

export default function InteractiveNeurologicalSheetModal({ isOpen, onClose, savedAnnotation, onSaveAnnotation }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#dc2626'); // red for clinical annotations
  const [penWidth, setPenWidth] = useState(3);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1100;

    // Background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (savedAnnotation) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveHistory();
      };
      img.src = savedAnnotation;
    } else {
      drawNeurologicalSheetTemplate(ctx);
      saveHistory();
    }
  }, [isOpen]);

  const drawNeurologicalSheetTemplate = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';

    // Outer Page Frame
    ctx.strokeRect(20, 20, 760, 1060);

    // Header Title & Top Checklist
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('NEUROFOLHA - EXAME NEUROLÓGICO COMPLETO', 230, 42);

    ctx.font = '11px sans-serif';
    ctx.strokeRect(30, 52, 740, 32);
    ctx.fillText('Fáscies: [ ] Atípica  [ ] Típica    |    Atitude: [ ] Ativa  [ ] Passiva    |    Dominância: [ ] D  [ ] E    |    Marcha: [ ] Normal  [ ] Alterada', 40, 72);

    // SECTION 1: FORÇA MUSCULAR & WEXLER
    ctx.strokeRect(30, 92, 740, 330);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FORÇA MUSCULAR', 150, 110);
    ctx.fillText('REFLEXOS (WEXLER)', 590, 110);

    // Draw Detailed Anatomical Muscle Figure (Anterior & Posterior)
    // Anterior Muscle Figure
    ctx.strokeStyle = '#64748b';
    ctx.fillStyle = '#f87171'; // muscle highlight red
    // Head
    ctx.beginPath(); ctx.arc(100, 145, 12, 0, Math.PI * 2); ctx.stroke();
    // Torso/Chest (Pectorals red)
    ctx.fillRect(88, 160, 24, 25); ctx.strokeRect(88, 160, 24, 25);
    // Arms
    ctx.strokeRect(70, 160, 15, 45); ctx.strokeRect(115, 160, 15, 45);
    // Abs / Legs (Quadriceps red)
    ctx.fillRect(85, 210, 14, 40); ctx.fillRect(101, 210, 14, 40);
    ctx.strokeRect(85, 210, 14, 40); ctx.strokeRect(101, 210, 14, 40);
    ctx.strokeRect(88, 255, 10, 40); ctx.strokeRect(102, 255, 10, 40);
    ctx.fillStyle = '#0f172a';
    ctx.font = '9px sans-serif';
    ctx.fillText('Visão Anterior', 80, 305);

    // Posterior Muscle Figure
    ctx.fillStyle = '#f87171';
    ctx.beginPath(); ctx.arc(190, 145, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillRect(178, 160, 24, 30); ctx.strokeRect(178, 160, 24, 30); // Back/Latissimus
    ctx.strokeRect(160, 160, 15, 45); ctx.strokeRect(205, 160, 15, 45);
    ctx.fillRect(175, 210, 14, 35); ctx.fillRect(191, 210, 14, 35); // Gluteus/Hamstrings
    ctx.strokeRect(175, 210, 14, 35); ctx.strokeRect(191, 210, 14, 35);
    ctx.strokeRect(178, 250, 10, 40); ctx.strokeRect(192, 250, 10, 40);
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Visão Posterior', 170, 305);

    // Muscle Table
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(250, 120, 260, 280);
    const mRows = ['Face', 'Língua', 'MSD', 'MSE', 'MID', 'MIE', 'Coluna'];
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Região', 255, 135);
    ctx.fillText('Tônus', 295, 135);
    ctx.fillText('Trofismo', 335, 135);
    ctx.fillText('Mov.Anorm', 380, 135);
    ctx.fillText('Deform', 430, 135);
    ctx.fillText('Fatig', 475, 135);
    mRows.forEach((r, i) => {
      ctx.strokeRect(250, 142 + i * 36, 260, 36);
      ctx.fillText(r, 255, 164 + i * 36);
    });

    // Wexler Stickman & Primitive Reflexes
    ctx.beginPath();
    ctx.arc(610, 150, 15, 0, Math.PI * 2); // Head
    ctx.moveTo(610, 165); ctx.lineTo(610, 260); // Body
    ctx.moveTo(560, 190); ctx.lineTo(660, 190); // Shoulders
    ctx.moveTo(560, 190); ctx.lineTo(540, 250); // Arm R
    ctx.moveTo(660, 190); ctx.lineTo(680, 250); // Arm L
    ctx.moveTo(590, 260); ctx.lineTo(570, 340); // Leg R
    ctx.moveTo(630, 260); ctx.lineTo(650, 340); // Leg L
    ctx.stroke();

    ctx.font = '9px sans-serif';
    const refLabels = ['Axiais da face', 'Grasping', 'Groping', 'Hoffmann', 'Palmo mento', 'Wartenberg'];
    refLabels.forEach((lbl, i) => {
      ctx.fillText(`• ${lbl}`, 685, 160 + i * 22);
    });

    // SECTION 2: SENSIBILIDADE D/E & COORDENAÇÃO
    ctx.strokeRect(30, 430, 740, 240);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SENSIBILIDADE D/E & DERMÁTOMOS', 130, 448);
    ctx.fillText('COORDENAÇÃO', 590, 448);

    // Anatomical Dermatome Body Figure
    ctx.strokeStyle = '#64748b';
    ctx.strokeRect(40, 460, 180, 195);
    ctx.font = '9px sans-serif';
    ctx.fillText('C2-C8, T1-T12, L1-L5, S1-S5', 65, 475);
    ctx.beginPath();
    ctx.arc(130, 500, 14, 0, Math.PI * 2); // Head/Neck
    ctx.strokeRect(110, 518, 40, 75); // Spine & Dermatome bands
    ctx.stroke();
    for (let b = 0; b < 6; b++) {
      ctx.beginPath(); ctx.moveTo(110, 528 + b * 11); ctx.lineTo(150, 528 + b * 11); ctx.stroke();
    }
    ctx.strokeRect(90, 518, 18, 50); ctx.strokeRect(152, 518, 18, 50); // Arms
    ctx.strokeRect(112, 595, 16, 50); ctx.strokeRect(132, 595, 16, 50); // Legs

    // Sensibilidade Table
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(230, 460, 280, 195);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Região', 235, 475);
    ctx.fillText('Proprio', 285, 475);
    ctx.fillText('Vibrat', 330, 475);
    ctx.fillText('Temp', 375, 475);
    ctx.fillText('Dor', 420, 475);
    ctx.fillText('Toque', 465, 475);
    ['Cabeça', 'Tórax', 'MMSS', 'Abdome', 'MMII'].forEach((s, i) => {
      ctx.strokeRect(230, 482 + i * 34, 280, 34);
      ctx.fillText(s, 235, 502 + i * 34);
    });

    // Coordenação Box
    ctx.strokeRect(520, 460, 240, 195);
    ctx.font = '10px sans-serif';
    ctx.fillText('[ ] Normal', 530, 480);
    ctx.fillText('[ ] Alterado   D [ ]   E [ ]', 530, 500);
    ctx.fillText('[ ] Index-Nariz', 540, 525);
    ctx.fillText('[ ] Romberg', 540, 545);
    ctx.fillText('[ ] Calcanhar-Joelho', 540, 565);
    ctx.fillText('[ ] Diadococinesia', 540, 585);

    // SECTION 3: NERVOS CRANIANOS
    ctx.strokeRect(30, 680, 740, 100);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('NERVOS CRANIANOS', 40, 698);
    ctx.font = '9px sans-serif';
    const cNerves = ['II', 'III', 'IV', 'VI', 'V', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    cNerves.forEach((cn, i) => {
      ctx.fillText(cn, 40 + i * 40, 720);
      ctx.strokeRect(38 + i * 40, 725, 25, 18);
    });
    ctx.fillText('Pupilas: D _____ E _____', 500, 715);
    ctx.fillText('Fundo Olho: [ ] Normal  [ ] Alterado', 500, 738);
    ctx.fillText('Campo Visual: ___________________', 500, 760);

    // SECTION 4: COGNITIVO (MEEM) & PENTÁGONOS
    ctx.strokeRect(30, 790, 740, 270);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('AVALIAÇÃO COGNITIVA (MEEM - MINI-EXAME DO ESTADO MENTAL)', 40, 810);

    // MEEM Table
    ctx.strokeRect(40, 825, 460, 50);
    ctx.font = '8px sans-serif';
    const meemHeaders = ['Orient T', 'Orient E', 'Mem Imed', 'Cálculo', 'Mem Evoc', 'Nomeação', 'Repetição', 'Leitura', 'Comando'];
    meemHeaders.forEach((h, i) => {
      ctx.fillText(h, 45 + i * 50, 840);
      ctx.strokeRect(42 + i * 50, 845, 45, 25);
    });

    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('TOTAL: _____ / 30', 40, 895);
    ctx.font = '10px sans-serif';
    ctx.fillText('Fluência Verbal (s): [ ] 0-15   [ ] 15-30   [ ] 30-45   [ ] 45-60', 160, 895);

    // Intersecting Pentagons Drawing Box
    ctx.strokeRect(520, 825, 230, 215);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('Desenho dos Pentágonos (Cópia)', 530, 842);

    // Intersecting pentagons template outlines
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(580, 870); ctx.lineTo(620, 890); ctx.lineTo(605, 935); ctx.lineTo(555, 935); ctx.lineTo(540, 890);
    ctx.closePath(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(635, 870); ctx.lineTo(675, 890); ctx.lineTo(660, 935); ctx.lineTo(610, 935); ctx.lineTo(595, 890);
    ctx.closePath(); ctx.stroke();

    ctx.restore();

    ctx.restore();
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setHistory(prev => [...prev.slice(-10), dataUrl]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
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
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawNeurologicalSheetTemplate(ctx);
    saveHistory();
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const last = newHistory[newHistory.length - 1];
    setHistory(newHistory);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = last;
  };

  const handleSaveAndClose = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSaveAnnotation(dataUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
              <PenTool size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Prancha Interativa de Anotações Neurológicas</h3>
              <p className="text-xs text-slate-500">Desenhe, circule e faça anotações diretamente sobre a ficha clínica com caneta digital.</p>
            </div>
          </div>

          {/* Color & Tool Palette */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              {['#dc2626', '#2563eb', '#16a34a', '#1e293b', '#9333ea'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPenColor(c)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 border-white transition-transform",
                    penColor === c ? "scale-125 ring-2 ring-slate-400" : ""
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}

              <div className="w-[1px] h-5 bg-slate-200 mx-1" />

              {[2, 4, 6].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPenWidth(w)}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-bold transition-colors",
                    penWidth === w ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {w}px
                </button>
              ))}

              <div className="w-[1px] h-5 bg-slate-200 mx-1" />

              <button type="button" onClick={undo} disabled={history.length <= 1} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 text-slate-700" title="Desfazer">
                <RotateCcw size={16} />
              </button>
              <button type="button" onClick={clearCanvas} className="p-1.5 rounded hover:bg-slate-100 text-slate-700" title="Limpar Tudo">
                <Eraser size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveAndClose}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              <Check size={16} />
              Salvar Anotações
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 flex justify-center items-start">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-300 overflow-hidden my-auto">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair touch-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
