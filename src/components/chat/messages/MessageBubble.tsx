import React from 'react';
import type { Message } from '../../../types/chat';
import { TextMessage } from './TextMessage';
import { ImageMessage } from './ImageMessage';
import { VoiceMessage } from './VoiceMessage';
import { FileMessage } from './FileMessage';
import { LocationMessage } from './LocationMessage';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isConsecutive?: boolean;
}

const Avatar = ({ src, fallback }: { src?: string, fallback: string }) => (
  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-gray-900 overflow-hidden shrink-0">
    {src ? <img src={src} alt={fallback} className="w-full h-full object-cover" /> : fallback}
  </div>
);

const MessageStatus = ({ status }: { status?: string }) => {
  if (!status) return null;
  switch (status) {
    case 'sending': return <span className="opacity-50 text-[10px]">🕒</span>;
    case 'sent': return <span className="opacity-70 text-[10px]">✓</span>;
    case 'delivered': return <span className="opacity-70 text-[10px]">✓✓</span>;
    case 'read': return <span className="text-blue-400 text-[10px]">✓✓</span>;
    default: return null;
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, isConsecutive = false }) => {
  const renderMessageContent = () => {
    switch (message.type) {
      case 'TEXT':
        return <TextMessage content={message.content} />;
      case 'IMAGE':
        return <ImageMessage attachments={message.attachments} />;
      case 'VOICE':
        return <VoiceMessage url={message.attachments?.[0]?.url} duration={message.metadata?.duration} />;
      case 'FILE':
        return <FileMessage attachments={message.attachments} />;
      case 'LOCATION':
        let payload;
        try {
          payload = JSON.parse(message.content || '{}');
        } catch(e) { payload = {}; }
        return <LocationMessage payload={payload} />;
      default:
        return <div className="text-sm opacity-80 italic">Unsupported message type</div>;
    }
  };

  return (
    <div className={`flex w-full mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && !isConsecutive && (
        <div className="mr-2 self-end mb-1">
          <Avatar 
            src={message.sender?.avatarUrl} 
            fallback={message.sender?.username?.[0]?.toUpperCase() || '?'} 
          />
        </div>
      )}
      
      {!isOwn && isConsecutive && <div className="w-8 mr-2 shrink-0" />}

      <div className={`group relative max-w-[75%] md:max-w-[65%] lg:max-w-[55%] transition-all ${isConsecutive ? 'mt-[2px]' : 'mt-2'}`}>
        
        {/* Sender Name for group chats if not own and not consecutive */}
        {!isOwn && !isConsecutive && message.sender?.username && (
          <div className="text-[11px] font-semibold text-gray-500 ml-1 mb-1">
            {message.sender.username}
          </div>
        )}

        {/* The Bubble */}
        <div className={`
          px-4 py-2 shadow-sm
          ${isOwn 
            ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' 
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-800/50'
          }
        `}>
          {renderMessageContent()}
          
          <div className={`text-[10px] mt-1 flex items-center gap-1 ${isOwn ? 'justify-end text-blue-100' : 'justify-end text-gray-400'}`}>
            {format(new Date(message.createdAt), 'HH:mm')}
            {isOwn && <MessageStatus status={message.status} />}
          </div>
        </div>

        {/* Hover Actions Desktop (Reply, React) */}
        <div className={`
          absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1
          ${isOwn ? '-left-16' : '-right-16'}
        `}>
           <button title="React" className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition hover:scale-110">
             😀
           </button>
           <button title="Reply" className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition hover:scale-110">
             ↩️
           </button>
        </div>
      </div>
    </div>
  );
};
