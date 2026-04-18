import React from 'react';

interface BankPayload {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount?: number;
  message?: string;
  qrUrl?: string;
}

interface BankMessageProps {
  payload?: BankPayload;
}

export const BankMessage: React.FC<BankMessageProps> = ({ payload }) => {
  if (!payload || !payload.accountNumber) return null;

  return (
    <div className="flex flex-col gap-2 min-w-[240px] max-w-[280px] p-1">
      <div className="flex items-center justify-between mb-1 border-b border-white/10 pb-2">
        <span className="font-bold text-sm tracking-wide">📦 CHUYỂN KHOẢN</span>
        <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">{payload.bankName}</span>
      </div>
      
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="opacity-70 text-xs">Chủ TK:</span>
          <span className="font-semibold uppercase">{payload.accountName}</span>
        </div>
        <div className="flex justify-between items-center group">
          <span className="opacity-70 text-xs">Số TK:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium">{payload.accountNumber}</span>
          </div>
        </div>
        {payload.amount && (
          <div className="flex justify-between mt-1">
            <span className="opacity-70 text-xs">Số tiền:</span>
            <span className="font-bold text-green-400">{payload.amount.toLocaleString('vi-VN')} VND</span>
          </div>
        )}
      </div>

      {payload.qrUrl && (
        <div className="mt-2 flex justify-center bg-white p-2 rounded-lg pointer-events-none select-none">
          <img src={payload.qrUrl} alt="Bank QR Code" className="w-32 h-32 object-contain" />
        </div>
      )}
    </div>
  );
};
