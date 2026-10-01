import React from 'react';
import { X, Paintbrush, Pipette, Shield, Radio, Eye, Target, Check } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    {
      icon: <Paintbrush className="w-5 h-5 text-amber-400" />,
      title: '1. Tự Vẽ Tay Thủ Công (Manual Paint Suite)',
      desc: 'Tuyệt đối không dùng tính năng dán ảnh tự động! Người trốn phải mở Bảng Vẽ Tay, dùng Cọ Vẽ (Brush) vẽ từng nét chi tiết, Thùng Sơn (Bucket) đổ màu vùng, Cục Tẩy (Eraser) và Hoàn Tác (Undo/Redo).',
    },
    {
      icon: <Pipette className="w-5 h-5 text-sky-400" />,
      title: '2. Hút Màu Kiệt Tác Tranh 3D (3D Eyedropper)',
      desc: 'Chạm hoặc nhấp chuột vào bất kỳ tác phẩm nổi tiếng nào trong phòng (Mona Lisa, Đêm Đầy Sao, Tiếng Thét, Sóng Lớn, Nụ Hôn) để lấy đúng mã màu RGB của tranh và vẽ lên cơ thể.',
    },
    {
      icon: <Eye className="w-5 h-5 text-rose-400" />,
      title: '3. Giai Đoạn Trốn (Hide Phase - 35 giây)',
      desc: 'Thợ săn (Seeker) sẽ bị Bịt Mắt hoàn toàn. Hiders nhanh chóng chạy đến kiệt tác tranh phù hợp, vẽ ngụy trang cơ thể, xoay đúng hướng và nhấn [SPACE] Khóa Tư Thế đứng yên.',
    },
    {
      icon: <Target className="w-5 h-5 text-emerald-400" />,
      title: '4. Giai Đoạn Truy Lùng (Seek Phase - 90 giây)',
      desc: 'Thợ săn được giải phóng và bắt đầu soi tìm khắp bảo tàng! Seeker nhắm tâm ngắm và bấm [BẮT]. Bắt sai một bức tượng/vật thể thật sẽ bị phạt đóng băng 2 giây!',
    },
    {
      icon: <Radio className="w-5 h-5 text-purple-400" />,
      title: '5. Cơ Chế Huýt Sáo Tự Động (Periodic Whistle)',
      desc: 'Cứ mỗi 22 giây trong giai đoạn tìm kiếm, những Hiders còn sống sẽ tự động phát ra tiếng huýt sáo và vòng sóng âm 3D lan tỏa để chỉ điểm vị trí cho Seeker.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel'] tracking-wide text-amber-300">
              LUẬT CHƠI TỰ VẼ TAY NGỤY TRANG
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Online Multiplayer & 3D Camouflage Hide and Seek</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 my-2">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-950/60 border border-white/5"
            >
              <div className="p-2 rounded-xl bg-slate-900 border border-white/10 shrink-0">
                {rule.icon}
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-white">{rule.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>ĐÃ RÕ LUẬT CHƠI, VÀO PHÒNG NGAY!</span>
        </button>
      </div>
    </div>
  );
};
