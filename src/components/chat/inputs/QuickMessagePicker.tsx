import React from 'react';
import { Zap } from 'lucide-react';

interface QuickMessagePickerProps {
  onSelect: (text: string) => void;
}

export const QuickMessagePicker: React.FC<QuickMessagePickerProps> = ({ onSelect }) => {
  const messages = [
    "Chào bạn! 👋",
    "Mình đang bận một chút, sẽ nhắn lại sau nhé.",
    "OK, mình đã nhận được.",
    "Cảm ơn bạn rất nhiều! 🙏",
    "Vâng ạ.",
    "Chúc bạn một ngày tốt lành! ✨",
    "Bạn đang ở đâu thế?",
    "Để mình xem lại rồi báo bạn nhé.",
  ];

  return (
    <div className="flex flex-col gap-3 w-72 bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="text-cyan-400" size={18} />
        <h3 className="text-white font-bold text-sm">Tin nhắn nhanh</h3>
      </div>
      
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
        {messages.map((msg, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(msg)}
            className="text-left px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/90 text-xs transition-colors border border-transparent hover:border-white/10"
          >
            {msg}
          </button>
        ))}
      </div>
    </div>
  );
};
