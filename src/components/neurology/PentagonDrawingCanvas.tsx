import React, { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, PenTool, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  initialImage?: string | null;
  onSave: (base64Image: string) => void;
}

export default function PentagonDrawingCanvas({ initialImage, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1e293b'); // slate-800
  const [penWidth, setPenWidth] = useState(2);
  const [history, setHistory] = useState<string[]>([]);
  const [showTemplate, setShowTemplate] = useState(true);

  // Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set display resolution
    canvas.width = 380;
    canvas.height = 200;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveHistory();
      };
      img.src = initialImage;
    } else {
      drawReferencePentagons(ctx);
      saveHistory();
    }
  }, []);

  const drawReferencePentagons = (ctx: CanvasRenderingContext2D) => {
    if (!showTemplate) return;
    ctx.save();
    ctx.strokeStyle = '#cbd5e1'; // light slate outline
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Pentagon 1
    ctx.beginPath();
    ctx.moveTo(100, 40);
    ctx.lineTo(150, 70);
    ctx.lineTo(130, 130);
    ctx.lineTo(70, 130);
    ctx.lineTo(50, 70);
    ctx.closePath();
    ctx.stroke();

    // Pentagon 2 (intersecting)
    ctx.beginPath();
    ctx.moveTo(180, 40);
    ctx.lineTo(230, 70);
    ctx.lineTo(210, 130);
    ctx.lineTo(150, 130);
    ctx.lineTo(130, 70);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setHistory(prev => [...prev.slice(-10), dataUrl]);
    onSave(dataUrl);
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
    if (showTemplate) drawReferencePentagons(ctx);
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
      onSave(last);
    };
    img.src = last;
  };

  return (
    <div className="border border-slate-300 rounded-2xl p-3 bg-slate-50 space-y-2 max-w-md">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <PenTool size={14} className="text-purple-600" />
          Desenho dos Pentágonos (MEEM)
        </span>

        {/* Toolbar controls */}
        <div className="flex items-center gap-1">
          {['#1e293b', '#dc2626', '#2563eb'].map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setPenColor(color)}
              className={cn(
                "w-5 h-5 rounded-full border border-white transition-transform",
                penColor === color ? "scale-125 ring-2 ring-slate-400" : ""
              )}
              style={{ backgroundColor: color }}
            />
          ))}

          <div className="w-[1px] h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={undo}
            disabled={history.length <= 1}
            title="Desfazer"
            className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-40"
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            onClick={clearCanvas}
            title="Limpar Tela"
            className="p-1 rounded text-slate-600 hover:bg-slate-200"
          >
            <Eraser size={14} />
          </button>
        </div>
      </div>

      <div className="relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-inner flex justify-center">
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

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <span>Instrução: Peça ao paciente para copiar os pentágonos acima.</span>
        <button
          type="button"
          onClick={() => {
            setShowTemplate(!showTemplate);
            clearCanvas();
          }}
          className="text-purple-700 font-bold hover:underline"
        >
          {showTemplate ? 'Ocultar Modelo' : 'Mostrar Modelo'}
        </button>
      </div>
    </div>
  );
}
