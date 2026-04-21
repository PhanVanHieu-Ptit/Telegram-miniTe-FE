import React, { useState } from 'react';
import { CreditCard, Send } from 'lucide-react';
import { Button, Input, message } from 'antd';

interface BankInfoFormProps {
  onSend: (data: { bankName: string, accountNumber: string, accountName: string, qrUrl?: string }) => void;
}

export const BankInfoForm: React.FC<BankInfoFormProps> = ({ onSend }) => {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSend = () => {
    const newErrors: Record<string, boolean> = {
      bankName: !bankName.trim(),
      accountNumber: !accountNumber.trim(),
      accountName: !accountName.trim(),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(v => v)) {
      message.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    const qrUrl = `https://img.vietqr.io/image/${bankName}-${accountNumber}-compact.jpg?accountName=${encodeURIComponent(accountName)}`;
    onSend({ bankName, accountNumber, accountName, qrUrl });
  };

  return (
    <div className="flex flex-col gap-4 w-72 bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="text-pink-500" size={18} />
        <h3 className="text-white font-bold text-sm">Thông tin ngân hàng</h3>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Tên ngân hàng</label>
          <Input 
            placeholder="VD: Techcombank, VCB..."
            value={bankName} 
            onChange={e => { setBankName(e.target.value); setErrors(prev => ({ ...prev, bankName: false })); }} 
            status={errors.bankName ? 'error' : ''}
            variant="filled"
            className="bg-white/5 border-none text-white h-9"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Số tài khoản</label>
          <Input 
            placeholder="Nhập số tài khoản..."
            value={accountNumber} 
            onChange={e => { setAccountNumber(e.target.value); setErrors(prev => ({ ...prev, accountNumber: false })); }} 
            status={errors.accountNumber ? 'error' : ''}
            variant="filled"
            className="bg-white/5 border-none text-white h-9"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Chủ tài khoản</label>
          <Input 
            placeholder="Nhập tên không dấu..."
            value={accountName} 
            onChange={e => { setAccountName(e.target.value); setErrors(prev => ({ ...prev, accountName: false })); }} 
            status={errors.accountName ? 'error' : ''}
            variant="filled"
            className="bg-white/5 border-none text-white h-9"
          />
        </div>
      </div>

      <Button 
        type="primary"
        className="h-10 rounded-xl bg-pink-600 hover:bg-pink-500 border-none font-bold flex items-center justify-center gap-2"
        onClick={handleSend}
      >
        <Send size={16} />
        Gửi thông tin
      </Button>
    </div>
  );
};
