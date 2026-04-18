import React, { useState } from 'react';
import type { Attachment } from '../../../types/chat';

interface ImageMessageProps {
  attachments?: Attachment[];
}

export const ImageMessage: React.FC<ImageMessageProps> = ({ attachments }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className={`grid gap-1 ${attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} max-w-full`}>
        {attachments.map((att, idx) => (
          <img
            key={att.id || idx}
            src={att.url}
            alt="chat attachment"
            className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition max-h-[250px] w-full"
            onClick={() => {
              setSelectedImage(att.url);
              setIsOpen(true);
            }}
          />
        ))}
      </div>
      
      {/* Lightbox / Modal can be extracted later */}
      {isOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <img 
            src={selectedImage} 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
            alt="Full size"
          />
        </div>
      )}
    </div>
  );
};
