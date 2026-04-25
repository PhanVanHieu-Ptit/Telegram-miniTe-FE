import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '../../../types/chat.types';
import { TextMessage } from './TextMessage';
import { ImageMessage } from './ImageMessage';
import { VideoMessage } from './VideoMessage';
import { VoiceMessage } from './VoiceMessage';
import { FileMessage } from './FileMessage';
import { LocationMessage } from './LocationMessage';
import { PollMessage } from './PollMessage';
import { BankMessage } from './BankMessage';
import { ContactMessage } from './ContactMessage';
import { LinkMessage } from './LinkMessage';
import { GifMessage } from './GifMessage';

interface MessageRendererProps {
  message: Message;
  isHidden?: boolean;
  isRevealed?: boolean;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({ message, isHidden, isRevealed }) => {
  const { t } = useTranslation();
  const { effectiveType, parsedPayload } = useMemo(() => {
    const rawType = (message.type || 'TEXT').toUpperCase();
    const hasAttachments = !!(message.attachments && message.attachments.length > 0);

    let payload = null;
    if (message.content && (message.content.startsWith('{') || message.content.startsWith('['))) {
      try {
        payload = JSON.parse(message.content);
      } catch (e) { /* not JSON */ }
    }

    const content = (message.content || '').trim();
    const urlFromContent = content.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|ogg|mov|mp3|wav|m4a)$/i) ? content : '';

    let type = rawType;

    if (type === 'TEXT' || type === 'FILE' || !type) {
      if (hasAttachments || message.mediaUrl || urlFromContent) {
        const firstType = message.attachments?.[0]?.type || '';
        const firstName = message.attachments?.[0]?.name || '';
        // Use localUrl (blob) first — it's available immediately after file pick
        const url = message.attachments?.[0]?.localUrl || message.attachments?.[0]?.url || message.mediaUrl || urlFromContent || '';

        if (firstType.startsWith('image/') || url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
          type = (firstName.toLowerCase().endsWith('.gif') || url.toLowerCase().endsWith('.gif') || url.includes('gif')) ? 'GIF' : 'IMAGE';
        }
        else if (firstType.startsWith('video/') || url.match(/\.(mp4|webm|ogg|mov)$/i)) type = 'VIDEO';
        else if (firstType.startsWith('audio/') || url.match(/\.(webm|ogg|mp3|wav|m4a)$/i) || url.toLowerCase().includes('voice-note')) {
          type = 'VOICE';
        }
        else {
          type = 'FILE';
        }
      } else if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
        if ('lat' in payload && 'lng' in payload) type = 'LOCATION';
        else if ('question' in payload && 'options' in payload) type = 'POLL';
        else if ('bankName' in payload && 'accountNumber' in payload) type = 'BANK';
        else if ('phone' in payload && 'name' in payload) type = 'CONTACT';
        else if ('reminderAt' in payload) type = 'REMINDER';
      } else if (content && (content.startsWith('http://') || content.startsWith('https://'))) {
        type = 'LINK';
      }
    }

    return { effectiveType: type, parsedPayload: payload };
  }, [message]);

  /**
   * Resolve a path/URL to something the browser can load.
   * blob: and data: URLs are returned as-is (local preview).
   * https: URLs are returned as-is (CDN / Firebase).
   * Relative paths are mapped to Firebase Storage or the API.
   */
  const getFullUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;

    const firebaseBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'app-3hchat.firebasestorage.app';
    if (url.includes('chat-media/') || url.includes('uploads/')) {
      return `https://firebasestorage.googleapis.com/v0/b/${firebaseBucket}/o/${encodeURIComponent(url)}?alt=media`;
    }

    const baseUrl = import.meta.env.VITE_API_URL || '';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}/uploads${cleanUrl}`;
  };

  /**
   * Resolve one attachment's display URL.
   * Ưu tiên localUrl (Blob) vì nó không bao giờ bị lỗi CORS.
   */
  const resolveAttachmentUrl = (att: NonNullable<Message['attachments']>[number]): string => {
    return getFullUrl(att.localUrl || att.url);
  };

  const isUploading = message.status === 'uploading';

  const renderContent = () => {
    const content = (message.content || '').trim();
    const urlFromContent = content.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|ogg|mov|mp3|wav|m4a)$/i) ? content : '';

    const firstAtt = message.attachments?.[0];
    // Ưu tiên localUrl (Blob) ngay cả khi đã gửi xong nếu nó vẫn còn trong state
    const rawUrl = firstAtt?.localUrl || firstAtt?.url || message.mediaUrl || urlFromContent;
    const resolvedUrl = getFullUrl(rawUrl);

    if (
      effectiveType !== 'TEXT' &&
      effectiveType !== 'LINK' &&
      !rawUrl &&
      !message.attachments?.length &&
      !parsedPayload
    ) {
      return <TextMessage content={message.content} mentions={message.mentions} />;
    }

    const effectiveAttachments = message.attachments?.length
      ? message.attachments.map(att => ({ ...att, url: resolveAttachmentUrl(att) }))
      : rawUrl
        ? [{ url: resolvedUrl }] as any[]
        : undefined;

    // Spinner overlay while an attachment is uploading
    const uploadOverlay = isUploading && firstAtt !== undefined
      ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin mb-2" />
          {firstAtt.uploadProgress !== undefined && (
            <span className="text-[10px] text-white/80 font-mono">{firstAtt.uploadProgress}%</span>
          )}
        </div>
      )
      : null;
    const withOverlay = (node: React.ReactNode) =>
      uploadOverlay
        ? <div className="relative">{node}{uploadOverlay}</div>
        : <>{node}</>;

    const withSpoiler = (node: React.ReactNode, type: string) => {
      if (!isHidden || isRevealed) return node;
      
      const isMedia = ['IMAGE', 'VIDEO', 'GIF', 'VOICE'].includes(type);
      
      return (
        <div className="relative group/spoiler select-none overflow-hidden rounded-xl">
           <div className={cn(
             "transition-all duration-500 filter",
             isMedia ? "blur-3xl opacity-40 scale-110" : "blur-[8px] opacity-20 pointer-events-none"
           )}>
             {node}
           </div>
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover/spoiler:bg-white/20 transition-all shadow-xl">
                <EyeOff className="w-4 h-4 text-white" />
              </div>
              <span className="text-[9px] font-bold text-white/50 tracking-[0.2em] uppercase">
                {isMedia ? t('sensitive_media') : t('hidden_message')}
              </span>
           </div>
        </div>
      );
    }

    switch (effectiveType) {
      case 'IMAGE':
        return withSpoiler(withOverlay(<ImageMessage attachments={effectiveAttachments} />), 'IMAGE');
      case 'GIF':
        return withSpoiler(withOverlay(<GifMessage attachments={effectiveAttachments} />), 'GIF');
      case 'VIDEO':
        return withSpoiler(withOverlay(<VideoMessage attachments={effectiveAttachments} />), 'VIDEO');
      case 'VOICE':
        return withSpoiler(withOverlay(
          <VoiceMessage
            url={resolvedUrl}
            duration={message.metadata?.duration}
          />
        ), 'VOICE');
      case 'FILE':
        return withSpoiler(withOverlay(<FileMessage attachments={effectiveAttachments} />), 'FILE');
      case 'LOCATION':
        return withSpoiler(<LocationMessage payload={parsedPayload || {}} />, 'LOCATION');
      case 'POLL':
        return withSpoiler(<PollMessage payload={parsedPayload || {}} />, 'POLL');
      case 'BANK':
        return withSpoiler(<BankMessage payload={parsedPayload || {}} />, 'BANK');
      case 'CONTACT':
        return withSpoiler(<ContactMessage payload={parsedPayload || {}} />, 'CONTACT');
      case 'REMINDER':
        return withSpoiler(
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <div className="flex flex-col">
              <span className="font-bold opacity-60 uppercase tracking-tighter">Reminder</span>
              <span className="opacity-90">{message.content}</span>
            </div>
          </div>, 'REMINDER'
        );
      case 'LINK':
        return withSpoiler(<LinkMessage content={message.content} metadata={message.metadata} />, 'LINK');
      case 'TEXT':
      default:
        if (urlFromContent && effectiveType === 'TEXT') {
          if (urlFromContent.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return withSpoiler(<ImageMessage attachments={[{ url: resolvedUrl }]} />, 'IMAGE');
          if (urlFromContent.match(/\.(mp4|webm|ogg|mp3|wav|m4a)$/i)) return withSpoiler(<VoiceMessage url={resolvedUrl} />, 'VOICE');
        }
        return withSpoiler(<TextMessage content={message.content} mentions={message.mentions} />, 'TEXT');
    }
  };

  return (
    <div className="message-content-wrapper w-full">
      {renderContent()}
    </div>
  );
};
