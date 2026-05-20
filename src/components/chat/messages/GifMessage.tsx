import React from 'react';
import type { Attachment } from '../../../types/chat.types';

interface GifMessageProps {
  attachments?: Attachment[];
}

export const GifMessage: React.FC<GifMessageProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl overflow-hidden shadow-lg border border-white/10">
      {attachments.map((att, idx) => (
        <div key={att.id || idx} className="relative aspect-auto max-w-full overflow-hidden bg-black/20">
          <img 
            src={att.url} 
            alt="GIF" 
            className="w-full h-auto object-contain cursor-default"
            loading="lazy"
          />
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-tighter pointer-events-none border border-white/20">
            GIF
          </div>
        </div>
      ))}
    </div>
  );
};
