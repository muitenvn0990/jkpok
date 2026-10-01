import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
  Pipette,
  PaintBucket,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';

interface MobileControlsProps {
  onDirectionMove: (dx: number, dz: number) => void;
  onFreezeToggle: () => void;
  onFillWholeBody: () => void;
  onActivateEyedropper: () => void;
  onZoom: (delta: number) => void;
  onRotateCamera: (deltaH: number) => void;
  isFrozen: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionMove,
  onFreezeToggle,
  onFillWholeBody,
  onActivateEyedropper,
  onZoom,
  onRotateCamera,
  isFrozen,
}) => {
  // Handlers for touch directional buttons
  const startMove = (dx: number, dz: number) => {
    onDirectionMove(dx, dz);
  };

  const stopMove = () => {
    onDirectionMove(0, 0);
  };

  return (
    <div className="md:hidden pointer-events-none absolute inset-x-0 bottom-36 z-20 flex items-end justify-between px-3 select-none">
      {/* LEFT: Directional D-PAD with clear UP [Đi Lên/Tiến], Down, Left, Right buttons */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 p-2 bg-slate-950/80 backdrop-blur-md rounded-3xl border-2 border-white/20 shadow-2xl">
        {/* UP BUTTON (NÚT ĐI LÊN / TIẾN) */}
        <button
          onTouchStart={() => startMove(0, -1)}
          onTouchEnd={stopMove}
          onMouseDown={() => startMove(0, -1)}
          onMouseUp={stopMove}
          className="w-14 h-14 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-90 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg transition-transform cursor-pointer border-2 border-white/40"
          title="Đi Lên / Tiến Tới"
        >
          <ArrowUp className="w-7 h-7 stroke-[3]" />
          <span className="text-[9px] uppercase tracking-tighter -mt-1">TIẾN</span>
        </button>

        {/* MIDDLE ROW: LEFT, CENTER, RIGHT */}
        <div className="flex items-center gap-2">
          {/* LEFT BUTTON (TRÁI) */}
          <button
            onTouchStart={() => startMove(-1, 0)}
            onTouchEnd={stopMove}
            onMouseDown={() => startMove(-1, 0)}
            onMouseUp={stopMove}
            className="w-13 h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white font-bold flex flex-col items-center justify-center shadow-md transition-transform cursor-pointer border border-white/20"
            title="Qua Trái"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* DOWN BUTTON (LÙI) */}
          <button
            onTouchStart={() => startMove(0, 1)}
            onTouchEnd={stopMove}
            onMouseDown={() => startMove(0, 1)}
            onMouseUp={stopMove}
            className="w-14 h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white font-bold flex flex-col items-center justify-center shadow-md transition-transform cursor-pointer border border-white/20"
            title="Đi Lùi"
          >
            <ArrowDown className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[9px] uppercase tracking-tighter -mt-0.5">LÙI</span>
          </button>

          {/* RIGHT BUTTON (PHẢI) */}
          <button
            onTouchStart={() => startMove(1, 0)}
            onTouchEnd={stopMove}
            onMouseDown={() => startMove(1, 0)}
            onMouseUp={stopMove}
            className="w-13 h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white font-bold flex flex-col items-center justify-center shadow-md transition-transform cursor-pointer border border-white/20"
            title="Qua Phải"
          >
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* RIGHT: Quick Action Buttons & Camera Zoom */}
      <div className="pointer-events-auto flex flex-col gap-2 items-end">
        {/* Camera Zoom & Rotate Row */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-white/10">
          <button
            onClick={() => onRotateCamera(Math.PI / 6)}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center active:scale-90"
            title="Xoay Camera"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onZoom(-0.8)}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center active:scale-90"
            title="Gần lại"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => onZoom(0.8)}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center active:scale-90"
            title="Xa ra"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Action: Fill Whole Body */}
        <button
          onClick={onFillWholeBody}
          className="w-13 h-13 rounded-2xl bg-amber-500/80 border-2 border-white/40 text-slate-950 font-black text-[10px] flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform"
          title="Đổ màu toàn thân"
        >
          <PaintBucket className="w-4 h-4 text-white" />
          <span className="text-white mt-0.5">TÔ MÀU</span>
        </button>

        {/* Action: 3D Eyedropper */}
        <button
          onClick={onActivateEyedropper}
          className="w-13 h-13 rounded-2xl bg-sky-500/80 border-2 border-white/30 text-white font-bold text-[10px] flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform"
          title="Hút màu tranh 3D"
        >
          <Pipette className="w-4 h-4" />
          <span className="mt-0.5">HÚT</span>
        </button>

        {/* Action: Big Freeze Toggle */}
        <button
          onClick={onFreezeToggle}
          className={`w-16 h-16 rounded-2xl border-2 text-white font-bold text-xs flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform ${
            isFrozen
              ? 'bg-sky-500 border-sky-300 ring-4 ring-sky-300/50'
              : 'bg-slate-900/90 border-white/30'
          }`}
        >
          <Shield className="w-5 h-5 mb-0.5" />
          <span>{isFrozen ? 'MỞ' : 'KHÓA'}</span>
        </button>
      </div>
    </div>
  );
};
