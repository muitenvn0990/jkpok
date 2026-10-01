import React, { useState } from 'react';
import { Users, Copy, Check, Play, UserCheck, Shield, Eye, Bot, Sparkles } from 'lucide-react';
import { RoomState } from '../network/multiplayerClient';

interface LobbyModalProps {
  isOpen: boolean;
  room: RoomState | null;
  localPlayerId: string | null;
  onClose: () => void;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  onSetRole: (role: 'hider' | 'seeker') => void;
  onStartGame: () => void;
  onStartSoloPractice: () => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  isOpen,
  room,
  localPlayerId,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onSetRole,
  onStartGame,
  onStartSoloPractice,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>('Họa Sĩ Trốn');
  const [joinCode, setJoinCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = room?.hostId === localPlayerId;
  const localPlayer = room?.players.find(p => p.id === localPlayerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {!room ? (
          // 1. NO ROOM JOINED: CREATE OR JOIN ROOM
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                PHÒNG CHƠI TRỐN TÌM TRỰC TUYẾN
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel'] tracking-wide mt-0.5">
                SẢNH CHỜ MULTIPLAYER
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tự vẽ tay ngụy trang và so tài trốn tìm thời gian thực cùng bạn bè
              </p>
            </div>

            {/* Quick Practice Mode Highlight */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500/15 to-sky-500/15 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-amber-400" />
                  Chơi Đơn Luyện Vẽ (Solo Practice)
                </span>
                <span className="text-[11px] text-slate-300">
                  Luyện tập vẽ tay tiệp tranh và trốn trước Thợ săn AI
                </span>
              </div>
              <button
                onClick={onStartSoloPractice}
                className="px-3.5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                Vào Ngay
              </button>
            </div>

            {/* Tabs: Create / Join */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-white/10">
              <button
                onClick={() => setTab('create')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  tab === 'create' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tạo Phòng Mới
              </button>
              <button
                onClick={() => setTab('join')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  tab === 'join' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tham Gia Bằng Mã
              </button>
            </div>

            {/* Player Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">Tên của bạn:</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Nhập biệt danh..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {tab === 'create' ? (
              <button
                onClick={() => onCreateRoom(playerName)}
                className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>TẠO PHÒNG MỚI (LÀM CHỦ PHÒNG)</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">Mã phòng (5 ký tự):</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="Ví dụ: ABCD9"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-center uppercase tracking-widest font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  onClick={() => onJoinRoom(joinCode, playerName)}
                  disabled={!joinCode.trim()}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    joinCode.trim()
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>VÀO PHÒNG CHƠI</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // 2. IN ACTIVE ROOM LOBBY
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Mã Phòng Của Bạn:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-mono font-black text-amber-300 tracking-wider">
                    {room.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Sao chép mã phòng"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[11px] text-slate-400">Số Người Chơi:</span>
                <span className="text-lg font-bold text-white font-mono">{room.players.length}</span>
              </div>
            </div>

            {/* Role Toggle for Local Player */}
            <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-2xl border border-white/10">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Vai Trò Của Bạn:</span>
                <span className="text-[11px] text-slate-400">
                  {localPlayer?.role === 'seeker' ? 'Thợ Săn (Kẻ Đi Tìm)' : 'Họa Sĩ Trốn (Ngụy Trang)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSetRole('hider')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    localPlayer?.role === 'hider'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Người Trốn</span>
                </button>

                <button
                  onClick={() => onSetRole('seeker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    localPlayer?.role === 'seeker'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Thợ Săn</span>
                </button>
              </div>
            </div>

            {/* Connected Players List */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400">Danh Sách Thành Viên Trong Phòng:</span>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {room.players.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      p.id === localPlayerId
                        ? 'bg-slate-800/80 border-amber-400/40'
                        : 'bg-slate-950/60 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          p.role === 'seeker' ? 'bg-rose-400' : 'bg-sky-400'
                        }`}
                      />
                      <span className="font-semibold text-white">
                        {p.name} {p.id === localPlayerId ? '(Bạn)' : ''}
                      </span>
                      {p.isHost && (
                        <span className="text-[10px] text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded">
                          Chủ Phòng
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-semibold ${
                        p.role === 'seeker' ? 'text-rose-400' : 'text-sky-400'
                      }`}
                    >
                      {p.role === 'seeker' ? 'THỢ SĂN' : 'NGƯỜI TRỐN'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Game Action */}
            {isHost ? (
              <button
                onClick={onStartGame}
                className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>BẮT ĐẦU TRẬN ĐẤU (35s TRỐN + 90s TÌM)</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-950 text-center text-xs text-slate-400">
                Đang chờ Chủ phòng bắt đầu trận đấu...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
