import React from 'react';

interface ContactPayload {
  name: string;
  phone: string;
  avatarUrl?: string;
}

interface ContactMessageProps {
  payload?: ContactPayload;
}

export const ContactMessage: React.FC<ContactMessageProps> = ({ payload }) => {
  if (!payload || !payload.phone) return null;

  return (
    <div className="flex flex-col gap-3 min-w-[200px] p-1">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
          {payload.avatarUrl ? (
             <img src={payload.avatarUrl} alt="Contact avatar" className="w-full h-full object-cover" />
          ) : (
             payload.name.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{payload.name}</span>
          <span className="text-xs opacity-80">{payload.phone}</span>
        </div>
      </div>
      <a 
        href={`tel:${payload.phone}`}
        className="w-full py-1.5 mt-1 bg-white/10 hover:bg-white/20 transition rounded-md text-center text-xs font-medium cursor-pointer no-underline text-inherit border border-white/20"
      >
        Lưu danh bạ
      </a>
    </div>
  );
};
