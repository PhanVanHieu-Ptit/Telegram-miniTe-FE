import React from 'react';
import { 
  Image, 
  MapPin, 
  BarChart2, 
  CreditCard, 
  User, 
  Bell, 
  Smile, 
  Layers,
  FileText,
  Zap
} from 'lucide-react';
import { Popover, Tooltip } from 'antd';

interface AttachmentMenuProps {
  onSelect: (type: string) => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ onSelect }) => {
  const items = [
    { id: 'image', icon: <Image size={20} />, label: 'Hình ảnh/Video', color: 'bg-blue-500' },
    { id: 'file', icon: <FileText size={20} />, label: 'Tệp tin', color: 'bg-purple-500' },
    { id: 'location', icon: <MapPin size={20} />, label: 'Vị trí', color: 'bg-green-500' },
    { id: 'poll', icon: <BarChart2 size={20} />, label: 'Bình chọn', color: 'bg-orange-500' },
    { id: 'bank', icon: <CreditCard size={20} />, label: 'Số tài khoản', color: 'bg-pink-500' },
    { id: 'contact', icon: <User size={20} />, label: 'Danh bạ', color: 'bg-teal-500' },
    { id: 'reminder', icon: <Bell size={20} />, label: 'Nhắc nhở', color: 'bg-indigo-500' },
    { id: 'draw', icon: <Layers size={20} />, label: 'Vẽ tay', color: 'bg-amber-500' },
    { id: 'gif', icon: <Smile size={20} />, label: 'Giphy', color: 'bg-yellow-500' },
    { id: 'quick', icon: <Zap size={20} />, label: 'Tin nhắn nhanh', color: 'bg-cyan-500' },
  ];

  const content = (
    <div className="grid grid-cols-4 gap-4 p-4 w-72 bg-[#1a1f2e] border border-white/10 rounded-2xl backdrop-blur-xl">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className="flex flex-col items-center gap-2 group transition-all"
        >
          <div className={`${item.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-active:scale-95 transition-transform`}>
            {item.icon}
          </div>
          <span className="text-[10px] text-white/70 font-medium text-center leading-tight">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <Popover 
      content={content} 
      trigger="click" 
      placement="topLeft"
      overlayClassName="attachment-popover"
      color="transparent"

    >
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10"
      >
        <Tooltip title="Tiện ích">
          <Layers className="h-5 w-5" />
        </Tooltip>
      </button>
    </Popover>
  );
};
