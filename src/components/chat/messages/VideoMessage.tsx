import React, { useState } from 'react';
import { Play, Maximize2, AlertCircle } from 'lucide-react';
import type { Attachment } from '../../../types/chat.types';

interface VideoMessageProps {
  attachments?: Attachment[];
}

export const VideoMessage: React.FC<VideoMessageProps> = ({ attachments }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 max-w-full">
      {attachments.map((att, idx) => (
        <div 
          key={att.id || idx} 
          className="relative group cursor-pointer aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/5" 
          onClick={() => setIsOpen(true)}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
               <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white/50 p-4 text-center gap-2">
               <AlertCircle className="w-8 h-8 mb-1" />
               <span className="text-xs">Failed to load video</span>
               <a 
                 href={att.url} 
                 target="_blank" 
                 rel="noreferrer" 
                 className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white transition-all uppercase tracking-widest font-bold"
                 onClick={(e) => e.stopPropagation()}
               >
                 Download
               </a>
            </div>
          ) : (
            <video 
              src={att.url} 
              className="w-full h-full object-cover"
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
              onMouseOut={(e) => {
                 const v = (e.target as HTMLVideoElement);
                 v.pause();
                 v.currentTime = 0;
              }}
              muted
              playsInline
            />
          )}

          {!hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 group-hover:scale-110 group-hover:bg-primary/30 group-hover:border-primary/40 transition-all shadow-2xl">
                 <Play className="w-6 h-6 fill-current ml-1" />
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4 text-white/70" />
              </div>
            </div>
          )}
        </div>
      ))}

      {isOpen && attachments[0] && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[85vh] group" onClick={(e) => e.stopPropagation()}>
            <video 
              src={attachments[0].url} 
              className="max-w-full max-h-[85vh] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" 
              controls 
              autoPlay
            />
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 flex items-center gap-2 text-white/50 hover:text-white transition-all font-medium tracking-tight"
            >
              <span className="text-sm">DISMISS</span>
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-lg">&times;</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
