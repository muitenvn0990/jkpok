import React, { useRef, useEffect, useState } from 'react';
import {
  Paintbrush,
  PaintBucket,
  Eraser,
  Undo2,
  Redo2,
  Pipette,
  Check,
  RotateCw,
  Sparkles,
  Sliders,
  Trash2,
  Eye
} from 'lucide-react';
import { BodyPart } from '../types/game';
import { PaintEngine, PaintTool } from '../game/paintEngine';
import { MASTERPIECES } from '../game/famousPaintings';

interface PaintStudioProps {
  isOpen: boolean;
  onClose: () => void;
  paintEngine: PaintEngine;
  onRotatePreview: (deltaY: number) => void;
  onActivate3DEyedropper: () => void;
  onFinishPaint: () => void;
}

export const PaintStudio: React.FC<PaintStudioProps> = ({
  isOpen,
  onClose,
  paintEngine,
  onRotatePreview,
  onActivate3DEyedropper,
  onFinishPaint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<PaintTool>('brush');
  const [currentColor, setCurrentColor] = useState<string>(paintEngine.config.color);
  const [brushSize, setBrushSize] = useState<number>(paintEngine.config.brushSize);
  const [brushOpacity, setBrushOpacity] = useState<number>(paintEngine.config.brushOpacity);
  const [activePart, setActivePart] = useState<BodyPart>('all');
  const [canUndo, setCanUndo] = useState<boolean>(paintEngine.canUndo());
  const [canRedo, setCanRedo] = useState<boolean>(paintEngine.canRedo());

  // Masterpiece curated color palettes for easy reference
  const curatedPalettes = [
    { name: 'Đêm Đầy Sao', colors: ['#1e3a8a', '#eab308', '#0f172a', '#38bdf8', '#14532d'] },
    { name: 'Mona Lisa', colors: ['#3b2f2f', '#78350f', '#ca8a04', '#1f2937', '#cca47e'] },
    { name: 'Tiếng Thét', colors: ['#ea580c', '#f97316', '#1e293b', '#0369a1', '#7c2d12'] },
    { name: 'Sóng Kanagawa', colors: ['#1e40af', '#60a5fa', '#f8fafc', '#78350f', '#0f172a'] },
    { name: 'Nụ Hôn', colors: ['#d97706', '#fef08a', '#b45309', '#065f46', '#ec4899'] },
  ];

  // Sync internal paintEngine config
  useEffect(() => {
    paintEngine.config.tool = activeTool;
    paintEngine.config.color = currentColor;
    paintEngine.config.brushSize = brushSize;
    paintEngine.config.brushOpacity = brushOpacity;
    paintEngine.config.activePart = activePart;
  }, [activeTool, currentColor, brushSize, brushOpacity, activePart, paintEngine]);

  // Keep studio canvas in sync with paintEngine canvas
  const syncCanvasDisplay = () => {
    if (!canvasRef.current) return;
    const destCtx = canvasRef.current.getContext('2d')!;
    destCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    destCtx.drawImage(paintEngine.canvas, 0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw subtle quadrant demarcation lines
    destCtx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    destCtx.lineWidth = 1.5;
    destCtx.setLineDash([4, 4]);

    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    // Cross lines
    destCtx.beginPath();
    destCtx.moveTo(w / 2, 0);
    destCtx.lineTo(w / 2, h);
    destCtx.moveTo(0, h / 2);
    destCtx.lineTo(w, h / 2);
    destCtx.stroke();
    destCtx.setLineDash([]);

    // Update undo/redo availability
    setCanUndo(paintEngine.canUndo());
    setCanRedo(paintEngine.canRedo());
  };

  useEffect(() => {
    if (isOpen) {
      syncCanvasDisplay();
    }
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = paintEngine.canvas.width / rect.width;
    const scaleY = paintEngine.canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (activeTool === 'eyedropper') {
      const sampled = paintEngine.sampleColorAt(x, y);
      setCurrentColor(sampled);
      setActiveTool('brush');
      return;
    }

    if (activeTool === 'bucket') {
      paintEngine.fillRegion(activePart, currentColor);
      syncCanvasDisplay();
      return;
    }

    paintEngine.startStroke(x, y);
    syncCanvasDisplay();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return; // Only if mouse down or finger touching
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = paintEngine.canvas.width / rect.width;
    const scaleY = paintEngine.canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    paintEngine.continueStroke(x, y);
    syncCanvasDisplay();
  };

  const handlePointerUp = () => {
    paintEngine.endStroke();
    syncCanvasDisplay();
  };

  const handleUndo = () => {
    paintEngine.undo();
    syncCanvasDisplay();
  };

  const handleRedo = () => {
    paintEngine.redo();
    syncCanvasDisplay();
  };

  const handleClear = () => {
    paintEngine.clearAll();
    syncCanvasDisplay();
  };

  const handleSelectColor = (color: string) => {
    setCurrentColor(color);
    if (activeTool === 'eraser') {
      setActiveTool('brush');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-end p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm pointer-events-none select-none">
      {/* Studio Drawer Panel */}
      <div className="pointer-events-auto relative w-full max-w-lg md:max-w-md bg-slate-900/95 border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 max-h-[96vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Cinzel'] tracking-wide">
                BẢNG VẼ TAY THỦ CÔNG
              </h2>
              <p className="text-[11px] text-slate-400">Tô trực tiếp lên cơ thể ma-nơ-canh 3D</p>
            </div>
          </div>

          <button
            onClick={() => onRotatePreview(Math.PI / 4)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/10 cursor-pointer"
            title="Xoay mô hình 3D 45 độ"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Xoay 3D</span>
          </button>
        </div>

        {/* 2D Interactive Mannequin Canvas Area */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-inner flex items-center justify-center touch-none">
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-full cursor-crosshair"
            />

            {/* Quadrant Body Area Overlay Labels */}
            <div className="pointer-events-none absolute top-1.5 left-2 text-[10px] font-semibold text-slate-400/80 uppercase">
              VÙNG ĐẦU
            </div>
            <div className="pointer-events-none absolute top-1.5 right-2 text-[10px] font-semibold text-slate-400/80 uppercase">
              THÂN TRÊN
            </div>
            <div className="pointer-events-none absolute bottom-1.5 left-2 text-[10px] font-semibold text-slate-400/80 uppercase">
              HAI TAY
            </div>
            <div className="pointer-events-none absolute bottom-1.5 right-2 text-[10px] font-semibold text-slate-400/80 uppercase">
              HAI CHÂN
            </div>
          </div>

          <span className="text-[10px] text-slate-400 text-center">
            Vẽ bằng ngón tay hoặc chuột trực tiếp lên vùng cơ thể
          </span>
        </div>

        {/* Tool Selector Bar */}
        <div className="flex items-center justify-between gap-1 p-1 bg-slate-950/80 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTool('brush')}
            className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTool === 'brush'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span className="text-[10px]">Cọ Vẽ</span>
          </button>

          <button
            onClick={() => setActiveTool('bucket')}
            className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTool === 'bucket'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <PaintBucket className="w-4 h-4" />
            <span className="text-[10px]">Thùng Sơn</span>
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTool === 'eraser'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="text-[10px]">Cục Tẩy</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onActivate3DEyedropper();
            }}
            className="flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-xs font-medium text-sky-300 hover:text-sky-200 transition-colors cursor-pointer"
            title="Hút màu trực tiếp trên tường hoặc tranh 3D"
          >
            <Pipette className="w-4 h-4 text-sky-400" />
            <span className="text-[10px]">Hút Màu 3D</span>
          </button>

          {/* Undo & Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
              canUndo ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Hoàn tác (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
              canRedo ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Làm lại (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            className="p-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            title="Xóa hết về thạch cao trắng"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Part Selection (For Bucket Fill or Targeted Painting) */}
        {activeTool === 'bucket' && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Đổ Màu:</span>
            {(['all', 'head', 'torso', 'arms', 'legs'] as BodyPart[]).map(part => {
              const labels: Record<BodyPart, string> = {
                all: 'Toàn Thân',
                head: 'Đầu',
                torso: 'Thân',
                arms: 'Tay',
                legs: 'Chân',
              };
              return (
                <button
                  key={part}
                  onClick={() => setActivePart(part)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    activePart === part
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {labels[part]}
                </button>
              );
            })}
          </div>
        )}

        {/* Brush Sliders (Size & Opacity) */}
        {activeTool === 'brush' && (
          <div className="grid grid-cols-2 gap-3 p-2 bg-slate-950/60 rounded-xl border border-white/5 text-xs text-slate-300">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Cỡ Cọ:</span>
                <span className="font-mono">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="44"
                value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Độ Mờ (Opacity):</span>
                <span className="font-mono">{Math.round(brushOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={brushOpacity}
                onChange={e => setBrushOpacity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        )}

        {/* Masterpiece Curated Color Palettes */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Bảng Màu Kiệt Tác Tranh
            </span>
            <div className="flex items-center gap-1.5">
              <span>Tự Chọn:</span>
              <input
                type="color"
                value={currentColor}
                onChange={e => handleSelectColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
            {curatedPalettes.map(p => (
              <div key={p.name} className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 w-24 truncate">{p.name}:</span>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  {p.colors.map(col => (
                    <button
                      key={col}
                      onClick={() => handleSelectColor(col)}
                      className={`w-6 h-6 rounded-md border transition-transform cursor-pointer ${
                        currentColor.toLowerCase() === col.toLowerCase()
                          ? 'scale-110 border-white ring-2 ring-amber-400 shadow-sm'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button: Finish / Sync */}
        <button
          onClick={() => {
            onFinishPaint();
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>HOÀN TẤT & KHÓA NÉT VẼ</span>
        </button>
      </div>
    </div>
  );
};
