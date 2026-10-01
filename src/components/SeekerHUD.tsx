import React from 'react';
import { Eye, EyeOff, Target, AlertCircle, ShieldAlert } from 'lucide-react';

interface SeekerHUDProps {
  phase: 'lobby' | 'hide' | 'seek' | 'ended';
  timer: number;
  isPenalty: boolean;
  penaltyDuration: number;
  livingHidersCount: number;
  totalHidersCount: number;
  onTagAttempt: () => void;
}

export const SeekerHUD: React.FC<SeekerHUDProps> = ({
  phase,
  timer,
  isPenalty,
  penaltyDuration,
  livingHidersCount,
  totalHidersCount,
  onTagAttempt,
}) => {
  // 1. BLINDFOLDED OVERLAY DURING HIDE PHASE
  if (phase === 'hide') {
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/98 backdrop-blur-2xl text-center select-none animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-rose-500/15 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-4 animate-pulse">
          <EyeOff className="w-10 h-10" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
          VAI TRÒ: THỢ SĂN (SEEKER)
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Cinzel'] tracking-wide mt-1">
          BẠN ĐANG BỊ BỊT MẮT!
        </h1>

        <div className="my-6">
          <div className="text-6xl sm:text-7xl font-mono font-black text-amber-300 tabular-nums">
            {timer}s
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            Các Họa Sĩ đang tranh thủ chạy tới các kiệt tác tranh (Mona Lisa, Đêm Đầy Sao...),
            hút màu, tự vẽ tay ngụy trang và khóa tư thế đứng yên!
          </p>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-2xl border border-white/10 text-xs text-slate-300 max-w-xs">
          ⚡ <span className="font-semibold text-white">Nhiệm vụ:</span> Khi hết giờ, hãy quan sát kỹ các nét vẽ
          nguệch ngoạc hoặc lệch màu để bắt trúng Hiders!
        </div>
      </div>
    );
  }

  // 2. SEEK PHASE CROSSHAIR & TAGGING HUD
  if (phase === 'seek') {
    return (
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 select-none">
        {/* Top Status */}
        <div className="flex items-center justify-between max-w-md mx-auto w-full bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-white">TRUY LÙNG:</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">
              Còn sống: <strong className="text-amber-300 font-mono">{livingHidersCount}</strong> / {totalHidersCount}
            </span>
            <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
              {timer}s
            </span>
          </div>
        </div>

        {/* Center Crosshair for Aiming */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Crosshair ring */}
            <div
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                isPenalty ? 'border-rose-500 scale-90' : 'border-amber-400 scale-100 shadow-md'
              }`}
            />
            {/* Center dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>

        {/* Penalty Freeze Warning */}
        {isPenalty && (
          <div className="fixed inset-0 z-25 flex items-center justify-center bg-rose-950/40 pointer-events-none">
            <div className="px-5 py-3 rounded-2xl bg-rose-900/95 border-2 border-rose-400 text-white shadow-2xl flex items-center gap-2 animate-bounce">
              <ShieldAlert className="w-6 h-6 text-rose-300" />
              <div className="flex flex-col">
                <span className="text-sm font-bold">BẮT SAI VẬT THỂ!</span>
                <span className="text-xs text-rose-200">
                  Phạt đóng băng di chuyển ({penaltyDuration.toFixed(1)}s)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Tag Button */}
        <div className="max-w-xs mx-auto w-full pointer-events-auto pb-4">
          <button
            onClick={onTagAttempt}
            disabled={isPenalty}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all cursor-pointer ${
              isPenalty
                ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                : 'bg-rose-500 hover:bg-rose-400 text-white border-2 border-rose-300 ring-4 ring-rose-500/30'
            }`}
          >
            <Target className="w-5 h-5" />
            <span>BẮT NGAY (TAG / SPACE)</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
