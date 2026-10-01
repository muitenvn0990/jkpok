import React from 'react';
import { Volume2, VolumeX, HelpCircle, Users, RotateCcw, Maximize, Shield, Eye } from 'lucide-react';
import { GameStatus } from '../types/game';

interface TopBarProps {
  status: GameStatus;
  roomCode?: string;
  role: 'hider' | 'seeker' | 'spectator';
  isHost: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenTutorial: () => void;
  onOpenLobby: () => void;
  onRestart: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  status,
  roomCode,
  role,
  isHost,
  isMuted,
  onToggleMute,
  onOpenTutorial,
  onOpenLobby,
  onRestart,
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 bg-slate-950/80 backdrop-blur-md border-b border-white/10 text-white select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5">
        <span className="font-['Cinzel'] text-sm sm:text-lg font-bold tracking-wider text-amber-300">
          MECCHA CHAMELEON
        </span>
        <span className="hidden md:inline text-xs text-slate-400">·</span>
        <span className="hidden md:inline text-xs text-slate-300">Tự Vẽ Tay Ngụy Trang 3D</span>
      </div>

      {/* Zone 2: Room code & Role status */}
      <div className="flex items-center gap-2">
        {roomCode && (
          <button
            onClick={onOpenLobby}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs font-mono font-semibold text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Phòng: {roomCode}</span>
          </button>
        )}

        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
            role === 'seeker'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : role === 'spectator'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
          }`}
        >
          {role === 'seeker' ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>THỢ SĂN</span>
            </>
          ) : role === 'spectator' ? (
            <span>KHÁN GIẢ</span>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5" />
              <span>HỌA SĨ TRỐN</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onOpenLobby}
          title="Sảnh Chờ Phòng / Đổi Phòng"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/10 transition-colors cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Phòng Chơi</span>
        </button>

        {isHost && (
          <button
            onClick={onRestart}
            title="Làm mới trận đấu"
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenTutorial}
          title="Hướng dẫn chơi"
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-white/10 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={onToggleMute}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-white/10 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toàn màn hình"
          className="hidden sm:flex p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-white/10 transition-colors cursor-pointer"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
