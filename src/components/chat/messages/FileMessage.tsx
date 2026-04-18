import React from 'react';
import type { Attachment } from '../../../types/chat';

interface FileMessageProps {
  attachments?: Attachment[];
}

export const FileMessage: React.FC<FileMessageProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (name?: string) => {
    if (!name) return '📄';
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📕';
      case 'doc':
      case 'docx': return '📘';
      case 'xls':
      case 'xlsx': return '📗';
      case 'zip':
      case 'rar': return '🗜️';
      default: return '📄';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((file, idx) => (
        <a 
          key={file.id || idx} 
          href={file.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 transition group no-underline"
        >
          <div className="text-3xl bg-white dark:bg-gray-800 rounded-full w-12 h-12 flex items-center justify-center shadow-sm">
            {getFileIcon(file.name)}
          </div>
          <div className="flex flex-col overflow-hidden text-current pr-4">
            <span className="font-semibold text-sm truncate opacity-90 group-hover:underline">
              {file.name || 'document'}
            </span>
            <span className="text-xs opacity-60">
              {formatSize(file.size)}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
};
