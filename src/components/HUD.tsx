import React, { useState } from 'react';
import {
  PaintBucket,
  Pipette,
  Shield,
  Radio,
  Undo2,
  Trash2,
  Check,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { BodyPart, PoseType } from '../types/game';

interface HUDProps {
  phase: 'lobby' | 'hide' | 'seek' | 'ended';
  timer: number;
  whistleTimeRemaining: number;
  whistleProgress: number;
  currentPose: PoseType;
  isFrozen: boolean;
  isAlive: boolean;
  is3DEyedropperActive: boolean;
  backdropName: string;
  backdropMatchPercent: number;
  activeColor: string;
  brushSize: number;
  onSelectColor: (color: string) => void;
  onFillWholeBody: (color: string) => void;
  onFillPart: (part: BodyPart, color: string) => void;
  onSetBrushSize: (size: number) => void;
  onToggleFreeze: () => void;
  onSelectPose: (pose: PoseType) => void;
  onActivate3DEyedropper: () => void;
  onUndo: () => void;
  onClearPaint: () => void;
  onZoomCamera: (delta: number) => void;
  onRotateCamera: (deltaH: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  phase,
  timer,
  whistleTimeRemaining,
  whistleProgress,
  currentPose,
  isFrozen,
  isAlive,
  is3DEyedropperActive,
  backdropName,
  backdropMatchPercent,
  activeColor,
  brushSize,
  onSelectColor,
  onFillWholeBody,
  onFillPart,
  onSetBrushSize,
  onToggleFreeze,
  onSelectPose,
  onActivate3DEyedropper,
  onUndo,
  onClearPaint,
  onZoomCamera,
  onRotateCamera,
}) => {
  const [showToolbar, setShowToolbar] = useState(true);

  const curatedColors = [
    { label: 'Lam Đêm Van Gogh', color: '#1e3a8a' },
    { label: 'Trăng Vàng', color: '#eab308' },
    { label: 'Cam Lửa Munch', color: '#ea580c' },
    { label: 'Lam Sóng Kanagawa', color: '#0284c7' },
    { label: 'Nâu Cổ Mona Lisa', color: '#78350f' },
    { label: 'Vàng Gỗ Quý', color: '#d97706' },
    { label: 'Bạch Cẩm Thạch', color: '#f8fafc' },
  ];

  const poses: { id: PoseType; label: string; desc: string }[] = [
    { id: 'standing', label: 'Đứng Yên', desc: 'Thường' },
    { id: 'statue_classical', label: 'Tượng Cổ', desc: 'Bệ Đá' },
    { id: 'wall_hug', label: 'Áp Tường', desc: 'Sát Tranh' },
    { id: 'thinker', label: 'Suy Tư', desc: 'Tượng Vàng' },
    { id: 'crouch_bush', label: 'Thu Gọn', desc: 'Góc Trưng Bày' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* 1. TOP STATUS GAUGES */}
      <div className="mt-14 w-full max-w-4xl mx-auto flex flex-col gap-2 pointer-events-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Phase & Main Timer */}
          <div className="bg-slate-950/85 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/10 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-amber-400">
                {phase === 'hide' ? '⏱️ Thời Gian Trốn' : '🔍 Thợ Săn Đang Tìm'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white mt-0.5">
              {timer}s
            </div>
          </div>

          {/* Periodic Whistle Progress */}
          <div className="bg-slate-950/85 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/10 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Radio className={`w-3.5 h-3.5 ${whistleTimeRemaining <= 5 ? 'text-amber-400 animate-ping' : 'text-sky-400'}`} />
                Huýt Sáo Tự Động
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-300">
                {Math.ceil(whistleTimeRemaining)}s
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  whistleTimeRemaining <= 5 ? 'bg-amber-400 animate-pulse' : 'bg-sky-400'
                }`}
                style={{ width: `${Math.round(whistleProgress * 100)}%` }}
              />
            </div>
          </div>

          {/* Camouflage Quality Meter */}
          <div className="hidden sm:flex bg-slate-950/85 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/10 flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Độ Tiệp Tranh Nền</span>
              <span className="font-mono font-bold text-amber-300">{backdropMatchPercent}%</span>
            </div>
            <div className="text-xs font-semibold text-white mt-0.5 truncate">
              {backdropName || 'Hãy lại gần kiệt tác tranh!'}
            </div>
          </div>
        </div>

        {/* Live Tips Banner */}
        <div className="bg-slate-900/90 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-slate-200 flex items-center justify-between shadow-md">
          <span className="truncate">
            👉 <strong className="text-amber-300">Cách vẽ:</strong> Chạm/nhấp trực tiếp vào bất kỳ vị trí nào trên cơ thể nhân vật 3D để tô vẽ, hoặc bấm <strong>"Tô Toàn Thân"</strong>!
          </span>
          <span className="text-[10px] text-sky-300 shrink-0 font-bold ml-2">
            {isFrozen ? '🔒 ĐANG ĐỨNG YÊN' : '🏃 ĐANG DI CHUYỂN'}
          </span>
        </div>

        {/* Spectator Notification */}
        {!isAlive && (
          <div className="bg-rose-950/90 backdrop-blur-md border border-rose-500/40 p-2.5 rounded-2xl text-center text-xs text-rose-200 font-semibold shadow-xl">
            💀 BẠN ĐÃ BỊ THỢ SĂN BẮT! Đang xem trận đấu dưới góc nhìn Khán Giả...
          </div>
        )}
      </div>

      {/* 2. BOTTOM CAMOUFLAGE & PAINT TOOLBAR */}
      {isAlive && (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-1.5 pointer-events-auto">
          {/* Collapse toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowToolbar(!showToolbar)}
              className="px-2.5 py-1 text-xs bg-slate-900/85 backdrop-blur-sm text-slate-300 hover:text-white rounded-t-lg border-t border-x border-white/10 flex items-center gap-1 cursor-pointer"
            >
              <span>{showToolbar ? 'Thu Gọn Bảng Vẽ' : 'Mở Bảng Vẽ'}</span>
              <ChevronUp className={`w-3.5 h-3.5 transition-transform ${showToolbar ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showToolbar && (
            <div className="bg-slate-950/95 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/15 shadow-2xl flex flex-col gap-2.5">
              {/* Row 1: Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                {/* Fill Whole Body Button */}
                <button
                  onClick={() => onFillWholeBody(activeColor)}
                  className="flex-1 min-w-[140px] py-2.5 px-3.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Đổ màu hiện tại phủ kín toàn bộ cơ thể"
                >
                  <PaintBucket className="w-4 h-4 fill-current" />
                  <span>TÔ TOÀN THÂN</span>
                </button>

                {/* 3D Eyedropper on Painting */}
                <button
                  onClick={onActivate3DEyedropper}
                  className={`py-2.5 px-3.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    is3DEyedropperActive
                      ? 'bg-sky-500 text-slate-950 border-sky-300 ring-2 ring-sky-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-white/10'
                  }`}
                  title="Nhấp vào bất kỳ bức tranh nào trên tường để hút mã màu"
                >
                  <Pipette className="w-4 h-4 text-sky-400" />
                  <span>{is3DEyedropperActive ? 'Nhấp Vào Tranh...' : 'Hút Màu Tranh 3D'}</span>
                </button>

                {/* Big Freeze Pose Toggle */}
                <button
                  onClick={onToggleFreeze}
                  className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    isFrozen
                      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 ring-2 ring-sky-300 ring-offset-2 ring-offset-slate-950 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/15'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>{isFrozen ? 'ĐANG KHÓA TƯ THẾ' : 'KHÓA TƯ THẾ (SPACE)'}</span>
                </button>

                {/* Camera Zoom buttons for desktop/tablet */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => onRotateCamera(Math.PI / 6)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Xoay góc nhìn 3D"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onZoomCamera(-0.6)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Phóng to"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onZoomCamera(0.6)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Thu nhỏ"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Part-specific fill buttons */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] text-slate-400 mr-1">Tô Nhanh Vùng:</span>
                {(['head', 'torso', 'arms', 'legs'] as BodyPart[]).map(part => {
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
                      onClick={() => onFillPart(part, activeColor)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Tô {labels[part]}
                    </button>
                  );
                })}
              </div>

              {/* Row 3: Color Palette & Brush Size */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1">Màu Sơn:</span>
                  {curatedColors.map(c => {
                    const isSelected = activeColor.toLowerCase() === c.color.toLowerCase();
                    return (
                      <button
                        key={c.color}
                        onClick={() => onSelectColor(c.color)}
                        className={`w-7 h-7 rounded-lg border transition-transform cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'scale-115 border-white ring-2 ring-amber-400 shadow-md'
                            : 'border-white/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                      </button>
                    );
                  })}

                  <input
                    type="color"
                    value={activeColor}
                    onChange={e => onSelectColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    title="Pha màu tùy chọn"
                  />
                </div>

                {/* Brush Size & Undo Actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-white/10">
                    <span className="text-[10px] text-slate-400">Cỡ Cọ:</span>
                    <input
                      type="range"
                      min="8"
                      max="36"
                      value={brushSize}
                      onChange={e => onSetBrushSize(Number(e.target.value))}
                      className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <span className="text-[10px] font-mono text-slate-300">{brushSize}px</span>
                  </div>

                  <button
                    onClick={onUndo}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-white/10 cursor-pointer"
                    title="Hoàn tác nét vẽ"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Hoàn Tác</span>
                  </button>
                  <button
                    onClick={onClearPaint}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-300 flex items-center gap-1 border border-white/10 cursor-pointer"
                    title="Xóa hết về màu trắng ban đầu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 4: Poses */}
              <div className="flex items-center justify-between gap-1.5 border-t border-white/5 pt-2 overflow-x-auto">
                <span className="text-[11px] text-slate-400 shrink-0 mr-1">Tư Thế:</span>
                <div className="flex items-center gap-1.5 flex-1">
                  {poses.map(p => {
                    const isActive = currentPose === p.id && isFrozen;
                    return (
                      <button
                        key={p.id}
                        onClick={() => onSelectPose(p.id)}
                        className={`px-2.5 py-1 text-xs rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold'
                            : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{p.label}</span>
                        <span className="hidden sm:inline text-[10px] text-slate-400 ml-1">({p.desc})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
