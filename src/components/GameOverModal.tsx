import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Award, CheckCircle2, XCircle, Timer, Shield, Radio, Eye } from 'lucide-react';
import { Difficulty, GameStats, GameStatus } from '../types/game';

interface GameOverModalProps {
  status: GameStatus;
  stats: GameStats | null;
  difficulty: Difficulty;
  onRestart: () => void;
  onSelectDifficulty: (diff: Difficulty) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  stats,
  difficulty,
  onRestart,
  onSelectDifficulty,
}) => {
  const isVictory = status === 'victory';

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isVictory]);

  if (status !== 'victory' && status !== 'caught') {
    return null;
  }

  const rankColors: Record<string, string> = {
    S: 'from-amber-300 via-yellow-400 to-amber-500 text-slate-950',
    A: 'from-emerald-300 via-teal-400 to-emerald-500 text-slate-950',
    B: 'from-sky-300 via-blue-400 to-sky-500 text-slate-950',
    C: 'from-slate-300 via-slate-400 to-slate-500 text-slate-950',
    D: 'from-rose-400 via-red-500 to-rose-600 text-white',
  };

  const rankTitle: Record<string, string> = {
    S: 'Tắc Kè Hoa Thần Thánh (Chameleon God)',
    A: 'Bậc Thầy Ngụy Trang (Master of Disguise)',
    B: 'Hòa Mình Xuất Sắc (Fine Camouflage)',
    C: 'Trốn Tìm Cơ Bản (Novice Hider)',
    D: 'Dễ Bị Phát Hiện (Spotted)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Victory / Defeat Icon Header */}
        <div className="mb-3">
          {isVictory ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Cinzel'] tracking-wide">
          {isVictory ? 'NGỤY TRANG THẮNG LỢI!' : 'BẠN ĐÃ BỊ BẮT!'}
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          {isVictory
            ? 'Bạn đã sống sót qua toàn bộ thời gian truy quét của thợ săn và trở thành huyền thoại phòng tranh!'
            : 'Thợ săn đã phát hiện ra bạn! Hãy thử phối màu tiệp hơn và khóa tư thế đứng yên hoàn toàn.'}
        </p>

        {/* Rank Badge */}
        {stats && (
          <div className="my-5 flex flex-col items-center">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
              Xếp Hạng Ngụy Trang
            </span>
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br shadow-xl flex items-center justify-center font-['Cinzel'] text-3xl font-black ${
                rankColors[stats.rank] || rankColors.C
              }`}
            >
              {stats.rank}
            </div>
            <span className="text-xs font-medium text-amber-300 mt-2">
              {rankTitle[stats.rank] || 'Hoàn thành'}
            </span>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full my-4 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
            <div className="flex flex-col items-center p-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Timer className="w-3.5 h-3.5 text-sky-400" />
                <span>Thời Gian</span>
              </div>
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {stats.timeSurvived}s
              </span>
            </div>

            <div className="flex flex-col items-center p-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tiệp Màu Tốt Nhất</span>
              </div>
              <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                {stats.bestMatch}%
              </span>
            </div>

            <div className="flex flex-col items-center p-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>Huýt Sáo Đã Vượt</span>
              </div>
              <span className="font-mono text-base font-bold text-amber-300 tabular-nums">
                {stats.whistlesSurvived}
              </span>
            </div>

            <div className="flex flex-col items-center p-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Pha Lướt Qua</span>
              </div>
              <span className="font-mono text-base font-bold text-purple-300 tabular-nums">
                {stats.closeCalls}
              </span>
            </div>
          </div>
        )}

        {/* Change Difficulty for Next Round */}
        <div className="flex items-center justify-center gap-1.5 my-2">
          <span className="text-xs text-slate-400 mr-1">Độ khó:</span>
          {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => {
            const labels: Record<Difficulty, string> = {
              easy: 'Dễ (60s)',
              normal: 'Vừa (75s)',
              hard: 'Khó (90s)',
            };
            return (
              <button
                key={d}
                onClick={() => onSelectDifficulty(d)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  difficulty === d
                    ? 'bg-amber-400 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {labels[d]}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-400/20 transition-all cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>CHƠI LƯỢT MỚI</span>
        </button>
      </div>
    </div>
  );
};
