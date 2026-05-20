import React, { useState } from 'react';
import { User, Send } from 'lucide-react';
import { Button, Input, message } from 'antd';

interface ContactPickerProps {
  onSend: (data: { name: string, phone: string, avatarUrl?: string }) => void;
}

export const ContactPicker: React.FC<ContactPickerProps> = ({ onSend }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSend = () => {
    const newErrors = {
      name: !name.trim(),
      phone: !phone.trim(),
    };
    setErrors(newErrors);

    if (newErrors.name || newErrors.phone) {
      message.error('Vui lòng nhập tên và số điện thoại');
      return;
    }
    
    // Simple phone validation
    if (!/^\+?[\d\s-]{8,15}$/.test(phone)) {
      setErrors({ ...newErrors, phone: true });
      message.error('Số điện thoại không hợp lệ');
      return;
    }

    onSend({ name, phone });
  };

  return (
    <div className="flex flex-col gap-4 w-72 bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <User className="text-teal-500" size={18} />
        <h3 className="text-white font-bold text-sm">Chia sẻ danh bạ</h3>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Họ tên</label>
          <Input 
            placeholder="Nhập tên người liên hệ..."
            value={name} 
            onChange={e => { setName(e.target.value); setErrors(p => ({...p, name: false})); }} 
            status={errors.name ? 'error' : ''}
            variant="filled"
            className="bg-white/5 border-none text-white h-9"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Số điện thoại</label>
          <Input 
            placeholder="0987654321..."
            value={phone} 
            onChange={e => { setPhone(e.target.value); setErrors(p => ({...p, phone: false})); }} 
            status={errors.phone ? 'error' : ''}
            variant="filled"
            className="bg-white/5 border-none text-white h-9"
          />
        </div>
      </div>

      <Button 
        type="primary"
        className="h-10 rounded-xl bg-teal-600 hover:bg-teal-500 border-none font-bold flex items-center justify-center gap-2"
        onClick={handleSend}
      >
        <Send size={16} />
        Chia sẻ
      </Button>
    </div>
  );
};
