import React from 'react';

interface TextMessageProps {
  content?: string;
}

export const TextMessage: React.FC<TextMessageProps> = ({ content }) => {
  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {content || ''}
    </div>
  );
};
