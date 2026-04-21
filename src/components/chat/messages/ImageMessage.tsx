import { Image as AntImage, Spin } from 'antd';
import { Download } from 'lucide-react';
import React from 'react';
import type { Attachment } from '../../../types/chat.types';

interface ImageMessageProps {
  attachments?: Attachment[];
}

export const ImageMessage: React.FC<ImageMessageProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className={`grid gap-2 ${attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} max-w-full`}>
        {attachments.map((att, idx) => (
          <div key={att.id || idx} className="relative rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 min-h-[150px] flex items-center justify-center group/img">
            <AntImage
              src={att.url}
              alt={att.name || 'chat attachment'}
              className="max-h-[300px] w-auto object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-300"
              placeholder={
                <div className="flex items-center justify-center w-full h-full bg-black/10 backdrop-blur-sm min-h-[150px]">
                   <Spin size="small" />
                </div>
              }
              fallback="https://via.placeholder.com/400x300?text=Image+Not+Found"
              onError={(e) => {
                console.error("Image load failed:", att.url);
              }}
            />
            {/* Overlay for failed images or hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/20 pointer-events-none">
               <a href={att.url} target="_blank" rel="noreferrer" className="p-2 bg-white/20 backdrop-blur-md rounded-full pointer-events-auto hover:bg-white/30 text-white">
                 <Download size={16} />
               </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
