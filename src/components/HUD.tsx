import React from 'react';
import { PaintTool } from '../game/player';
import { PoseType } from '../types/game';
import { RotateCcw, Trash2, Eye } from 'lucide-react';

interface HUDProps {
  phase: 'lobby' | 'hide' | 'seek' | 'ended';
  timer: number;
  whistleTimeRemaining: number;
  whistleProgress: number;
  currentPose: PoseType;
  isFrozen: boolean;
  isAlive: boolean;
  roomCode?: string;
  activeTool: PaintTool;
  activeColor: string;
  brushSize: number;
  isPaintFocus: boolean;
  backdropName: string;
  backdropMatchPercent: number;
  onSelectTool: (tool: PaintTool) => void;
  onSelectColor: (color: string) => void;
  onSelectBrushSize: (size: number) => void;
  onToggleFreeze: () => void;
  onSelectPose: (pose: PoseType) => void;
  onTogglePaintFocus: () => void;
  onUndo: () => void;
  onClearPaint: () => void;
  onOpenLobby: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  phase,
  timer,
  whistleTimeRemaining,
  whistleProgress,
  currentPose,
  isFrozen,
  isAlive,
  roomCode,
  activeTool,
  activeColor,
  brushSize,
  isPaintFocus,
  backdropName,
  backdropMatchPercent,
  onSelectTool,
  onSelectColor,
  onSelectBrushSize,
  onToggleFreeze,
  onSelectPose,
  onTogglePaintFocus,
  onUndo,
  onClearPaint,
  onOpenLobby,
}) => {
  // Format mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const paletteColors = [
    '#ef4444', // Carmine Red
    '#10b981', // Emerald Green
    '#eab308', // Sunflower Yellow
    '#3a2e2b', // Dark Earth / Mona Lisa Umber
    '#1e3a8a', // Van Gogh Starry Blue
    '#f8fafc', // Plaster White
  ];

  const poses: { id: PoseType; label: string; icon: string }[] = [
    { id: 'standing', label: 'Đứng Thẳng', icon: '🧍' },
    { id: 'statue_classical', label: 'Tượng Cổ Điển', icon: '🏛️' },
    { id: 'wall_hug', label: 'Áp Tường', icon: '🧱' },
    { id: 'thinker', label: 'Người Suy Tưởng', icon: '🤔' },
    { id: 'crouch_bush', label: 'Cúi Thu Gọn', icon: '🪴' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP CENTER: ĐỒNG HỒ & THANH HUÝT SÁO (Capsule Container from SVG)     */}
      {/* ========================================================================= */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="relative w-[280px] sm:w-[320px] h-[86px] sm:h-[94px] rounded-[48px] bg-slate-950/90 backdrop-blur-md border-2 border-slate-700/80 shadow-[0_12px_24px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center px-4 py-1.5">
          {/* Label */}
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[2px] text-slate-400 uppercase">
            {phase === 'hide' ? 'THỜI GIAN TRỐN' : 'THỜI GIAN TRUY TÌM'}
          </span>

          {/* Large Gold Time */}
          <span className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 font-mono tabular-nums leading-none my-1">
            {formatTime(timer)}
          </span>

          {/* Progress Bar (Whistle timer / Phase timer) */}
          <div className="w-[180px] sm:w-[210px] h-[6px] rounded-full bg-slate-800/90 overflow-hidden mt-0.5">
            <div
              className={`h-full transition-all duration-200 ${
                whistleTimeRemaining <= 5 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.round(whistleProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* Camouflage Quality Indicator Badge */}
        {isAlive && (
          <div className="mt-1 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm border border-white/10 text-[10px] sm:text-xs text-slate-300 shadow-md">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tiệp màu:</span>
            <span className="font-bold text-white">{backdropName}</span>
            <span
              className={`font-mono font-bold ${
                backdropMatchPercent >= 80
                  ? 'text-emerald-400'
                  : backdropMatchPercent >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {backdropMatchPercent}%
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP RIGHT: THÔNG TIN MÃ PHÒNG (Room Code Pill from SVG)                */}
      {/* ========================================================================= */}
      <div className="absolute top-4 right-4 sm:right-6 pointer-events-auto">
        <button
          onClick={onOpenLobby}
          className="w-[150px] sm:w-[180px] h-[60px] sm:h-[68px] rounded-[22px] bg-slate-950/90 backdrop-blur-md border-2 border-slate-700/80 shadow-[0_12px_24px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center p-2 hover:border-indigo-400 transition-colors cursor-pointer group"
        >
          <span className="text-[10px] font-bold tracking-[1px] text-slate-400 group-hover:text-slate-300 uppercase">
            MÃ PHÒNG
          </span>
          <span className="text-base sm:text-lg font-extrabold text-indigo-400 font-mono tracking-wide mt-0.5">
            {roomCode ? `ROOM-${roomCode}` : 'SOLO-8821'}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP LEFT: BỘ BẢNG CÔNG CỤ VẼ THỦ CÔNG (Vertical Toolbar from SVG)      */}
      {/* ========================================================================= */}
      <div className="absolute top-4 left-3 sm:left-6 pointer-events-auto">
        <div className="w-[80px] sm:w-[92px] py-3.5 px-2 rounded-[30px] bg-slate-950/90 backdrop-blur-md border-2 border-slate-700/80 shadow-[0_12px_24px_rgba(0,0,0,0.6)] flex flex-col items-center gap-2.5">
          {/* Cọ Vẽ (Brush) */}
          <button
            onClick={() => onSelectTool('brush')}
            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'brush'
                ? 'bg-blue-600 shadow-[0_0_16px_rgba(59,130,246,0.85)] scale-105 border-2 border-white'
                : 'bg-slate-900 border-2 border-slate-700 hover:border-slate-500'
            }`}
            title="Cọ Vẽ (Brush) - Chạm/vuốt lên nhân vật để tô màu trực tiếp"
          >
            <span className="text-2xl sm:text-3xl">🖌️</span>
          </button>

          {/* Hút Màu (Eyedropper) */}
          <button
            onClick={() => onSelectTool('eyedropper')}
            className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'eyedropper'
                ? 'bg-blue-600 shadow-[0_0_16px_rgba(59,130,246,0.85)] scale-105 border-2 border-white'
                : 'bg-slate-900 border-2 border-slate-700 hover:border-slate-500'
            }`}
            title="Hút Màu Tranh 3D (Eyedropper) - Nhấp vào tranh hoặc tường để lấy màu"
          >
            <span className="text-xl sm:text-2xl">🧪</span>
          </button>

          {/* Thùng Sơn (Bucket Fill) */}
          <button
            onClick={() => onSelectTool('bucket')}
            className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'bucket'
                ? 'bg-blue-600 shadow-[0_0_16px_rgba(59,130,246,0.85)] scale-105 border-2 border-white'
                : 'bg-slate-900 border-2 border-slate-700 hover:border-slate-500'
            }`}
            title="Thùng Sơn Đổ Màu (Paint Bucket) - Nhấp vào nhân vật để đổ màu vùng đó"
          >
            <span className="text-xl sm:text-2xl">🪣</span>
          </button>

          {/* Cục Tẩy (Eraser) */}
          <button
            onClick={() => onSelectTool('eraser')}
            className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'eraser'
                ? 'bg-blue-600 shadow-[0_0_16px_rgba(59,130,246,0.85)] scale-105 border-2 border-white'
                : 'bg-slate-900 border-2 border-slate-700 hover:border-slate-500'
            }`}
            title="Cục Tẩy (Eraser) - Tẩy sơn về màu thạch cao trắng"
          >
            <span className="text-xl sm:text-2xl">🧹</span>
          </button>

          {/* Divider */}
          <div className="w-10 h-[2px] bg-slate-800 rounded-full my-0.5" />

          {/* BẢNG MÀU (COLOR PALETTE) */}
          <div className="grid grid-cols-2 gap-1.5 p-0.5">
            {paletteColors.map(color => {
              const isActive = activeColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  onClick={() => onSelectColor(color)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'scale-110 border-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.9)] ring-2 ring-blue-400'
                      : 'border border-white/20 hover:scale-105 opacity-85'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              );
            })}
          </div>

          {/* Custom color picker input */}
          <div className="flex items-center justify-center">
            <input
              type="color"
              value={activeColor}
              onChange={e => onSelectColor(e.target.value)}
              className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
              title="Pha màu tùy chọn"
            />
          </div>

          {/* Divider */}
          <div className="w-10 h-[2px] bg-slate-800 rounded-full my-0.5" />

          {/* Brush Sizes */}
          <div className="flex items-center gap-1">
            {[10, 18, 28].map(sz => (
              <button
                key={sz}
                onClick={() => onSelectBrushSize(sz)}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  brushSize === sz
                    ? 'bg-blue-500 text-white font-bold ring-1 ring-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title={`Cỡ cọ ${sz}px`}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: sz === 10 ? 4 : sz === 18 ? 7 : 10, height: sz === 10 ? 4 : sz === 18 ? 7 : 10 }}
                />
              </button>
            ))}
          </div>

          {/* Undo & Clear Action Buttons */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              onClick={onUndo}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-90 transition-transform"
              title="Hoàn tác (Undo)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClearPaint}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 flex items-center justify-center active:scale-90 transition-transform"
              title="Xóa hết sơn"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. POSE SELECTION BAR (When Frozen)                                       */}
      {/* ========================================================================= */}
      {isFrozen && (
        <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-emerald-500/50 shadow-2xl animate-in fade-in duration-200">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Tư Thế:
          </span>
          {poses.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectPose(p.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                currentPose === p.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md scale-105'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{p.icon}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BOTTOM RIGHT: NÚT HÀNH ĐỘNG ("VẼ" & "KHÓA" from SVG)                   */}
      {/* ========================================================================= */}
      <div className="absolute bottom-6 right-4 sm:right-8 pointer-events-auto flex items-end gap-3 sm:gap-4">
        {/* Nút VẼ (Toggle Paint Focus Camera Zoom / 360 Mode) */}
        <button
          onClick={onTogglePaintFocus}
          className="flex flex-col items-center cursor-pointer group transition-transform active:scale-90"
        >
          <div
            className={`w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-[3px] border-blue-300 shadow-[0_12px_24px_rgba(0,0,0,0.6)] flex items-center justify-center text-3xl sm:text-4xl transition-all ${
              isPaintFocus ? 'ring-4 ring-blue-300 scale-105 shadow-[0_0_24px_rgba(59,130,246,0.9)]' : 'group-hover:scale-105'
            }`}
          >
            🎨
          </div>
          <span className="text-white text-[11px] sm:text-xs font-black tracking-wider mt-1 drop-shadow uppercase">
            {isPaintFocus ? 'XONG VẼ' : 'VẼ'}
          </span>
        </button>

        {/* Nút KHÓA TƯ THẾ (FREEZE - Green Glowing Rounded Square from SVG) */}
        <button
          onClick={onToggleFreeze}
          className="flex flex-col items-center cursor-pointer group transition-transform active:scale-95"
        >
          <div
            className={`w-[104px] h-[104px] sm:w-[124px] sm:h-[124px] rounded-[36px] sm:rounded-[44px] bg-gradient-to-br from-emerald-500 to-emerald-700 border-[4px] border-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.7)] flex flex-col items-center justify-center transition-all ${
              isFrozen
                ? 'ring-4 ring-emerald-300 scale-105 shadow-[0_0_36px_rgba(16,185,129,1)]'
                : 'group-hover:scale-105'
            }`}
          >
            <span className="text-4xl sm:text-5xl leading-none">🧊</span>
            <span className="text-white text-xs sm:text-sm font-black tracking-[1.5px] mt-1 uppercase">
              {isFrozen ? 'ĐÃ KHÓA' : 'KHÓA'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
