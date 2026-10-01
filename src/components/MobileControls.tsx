import React, { useEffect, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw
} from 'lucide-react';

interface MobileControlsProps {
  onDirectionMove: (dx: number, dz: number) => void;
  onZoom: (delta: number) => void;
  onRotateCamera: (deltaH: number) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionMove,
  onZoom,
  onRotateCamera,
}) => {
  const activeMoveRef = useRef<{ dx: number; dz: number } | null>(null);

  const startMove = (dx: number, dz: number) => {
    activeMoveRef.current = { dx, dz };
    onDirectionMove(dx, dz);
  };

  const stopMove = () => {
    if (activeMoveRef.current) {
      activeMoveRef.current = null;
      onDirectionMove(0, 0);
    }
  };

  // Global window pointerup to prevent any stuck movement
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      stopMove();
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute bottom-6 left-3 sm:left-6 z-20 flex flex-col gap-2 select-none">
      {/* Camera Rotate & Zoom helper pills */}
      <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl self-start">
        <button
          onClick={() => onRotateCamera(-Math.PI / 6)}
          className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          title="Xoay Trái"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onRotateCamera(Math.PI / 6)}
          className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          title="Xoay Phải"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onZoom(-0.8)}
          className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          title="Gần lại"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onZoom(0.8)}
          className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          title="Xa ra"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Directional D-PAD with PROMINENT UP (ĐI LÊN / TIẾN) BUTTON */}
      <div className="pointer-events-auto flex flex-col items-center gap-1 p-2 bg-slate-950/90 backdrop-blur-md rounded-3xl border-2 border-slate-700/80 shadow-2xl">
        {/* NÚT ĐI LÊN (TIẾN / UP) */}
        <button
          onPointerDown={e => {
            e.preventDefault();
            startMove(0, -1);
          }}
          className="w-14 h-13 sm:w-15 sm:h-14 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-90 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg transition-transform cursor-pointer border-2 border-white/60"
          title="Đi Lên / Tiến Tới"
        >
          <ArrowUp className="w-6 h-6 stroke-[3]" />
          <span className="text-[9px] uppercase tracking-tighter -mt-0.5">TIẾN</span>
        </button>

        {/* MIDDLE ROW: TRÁI, LÙI, PHẢI */}
        <div className="flex items-center gap-1.5">
          {/* NÚT QUA TRÁI */}
          <button
            onPointerDown={e => {
              e.preventDefault();
              startMove(-1, 0);
            }}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-slate-850 bg-slate-800 hover:bg-slate-700 active:scale-90 text-white font-bold flex flex-col items-center justify-center shadow-md transition-transform cursor-pointer border border-white/20"
            title="Qua Trái"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[8px] uppercase tracking-tighter -mt-0.5 text-slate-300">TRÁI</span>
          </button>

          {/* NÚT ĐI LÙI (DOWN) */}
          <button
            onPointerDown={e => {
              e.preventDefault();
              startMove(0, 1);
            }}
            className="w-13 h-12 sm:w-14 sm:h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white font-bold flex flex-col items-center justify-center shadow-md transition-transform cursor-pointer border border-white/20"
            title="Đi Lùi"
          >
            <ArrowDown className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[8px] uppercase tracking-tighter -mt-0.5 text-slate-300">LÙI</span>
          </button>

          {/* NÚT QUA PHẢI */}
          <button
            onPointerDown={e => {
              e.preventDefault();
              startMove(1, 0);
            }}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white font-bold flex flex-col items-center justify-center shadow-md transition-transform cursor-pointer border border-white/20"
            title="Qua Phải"
          >
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[8px] uppercase tracking-tighter -mt-0.5 text-slate-300">PHẢI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
