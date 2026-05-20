import React from 'react';
import { ExternalLink } from 'lucide-react';

interface LinkMessageProps {
  content: string;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };
}

export const LinkMessage: React.FC<LinkMessageProps> = ({ content, metadata }) => {
  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  const url = isUrl(content) ? content : '#';

  if (!metadata || (!metadata.title && !metadata.image)) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-blue-200 hover:text-white hover:underline underline-offset-4 break-all transition-colors decoration-blue-200/50"
      >
        <ExternalLink className="w-4 h-4 shrink-0 opacity-70" />
        <span className="font-medium">{content}</span>
      </a>
    );
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex flex-col gap-0 overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group no-underline text-current max-w-sm"
    >
      {metadata.image && (
        <div className="relative aspect-video w-full overflow-hidden border-b border-white/5">
          <img 
            src={metadata.image} 
            alt={metadata.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-3 flex flex-col gap-1">
        {metadata.siteName && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
            {metadata.siteName}
          </span>
        )}
        <h4 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {metadata.title}
        </h4>
        {metadata.description && (
          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
            {metadata.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2 opacity-40 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3 h-3" />
          <span className="text-[10px] lowercase truncate">{new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
};
