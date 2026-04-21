import React, { useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { Button, Input, message } from 'antd';

interface ReminderCreatorProps {
  onSend: (text: string, time: string) => void;
}

export const ReminderCreator: React.FC<ReminderCreatorProps> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSend = () => {
    const newErrors = {
      text: !text.trim(),
      date: !date,
      time: !time,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(v => v)) {
      message.error('Vui lòng nhập đầy đủ thông tin nhắc nhở');
      return;
    }

    const dt = new Date(`${date}T${time}`);
    if (isNaN(dt.getTime())) {
      message.error('Thời gian không hợp lệ');
      return;
    }
    
    if (dt < new Date()) {
      message.error('Thời gian nhắc nhở phải ở tương lai');
      return;
    }

    onSend(text, dt.toISOString());
  };

  return (
    <div className="flex flex-col gap-4 w-72 bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="text-indigo-500" size={18} />
        <h3 className="text-white font-bold text-sm">Đặt nhắc nhở</h3>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Nội dung</label>
          <Input 
            placeholder="Ví dụ: Gọi điện cho mẹ..."
            value={text} 
            onChange={e => { setText(e.target.value); setErrors(p => ({...p, text: false})); }} 
            status={errors.text ? 'error' : ''}
            variant="filled"
            className="bg-white/5 border-none text-white h-9"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Ngày</label>
          <Input 
            type="date"
            placeholder="Chọn ngày..."
            value={date} 
            onChange={e => { setDate(e.target.value); setErrors(p => ({...p, date: false})); }} 
            status={errors.date ? 'error' : ''}
            variant="filled"
            className="bg-white/5 border-none text-white h-9 w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Giờ</label>
          <Input 
            type="time"
            placeholder="Chọn giờ..."
            value={time} 
            onChange={e => { setTime(e.target.value); setErrors(p => ({...p, time: false})); }} 
            status={errors.time ? 'error' : ''}
            variant="filled"
            className="bg-white/5 border-none text-white h-9 w-full"
          />
        </div>
      </div>

      <Button 
        type="primary"
        className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 border-none font-bold flex items-center justify-center gap-2"
        onClick={handleSend}
      >
        <Send size={16} />
        Tạo nhắc nhở
      </Button>
    </div>
  );
};
