import React from 'react';

interface TextMessageProps {
  content?: string;
  mentions?: string[];
}

export const TextMessage: React.FC<TextMessageProps> = ({ content }) => {
  if (!content) return null;

  // Render text with mentions highlighted
  // We look for @Name patterns or just use a simple regex for @word
  // If mentions array is provided, we might highlight only those, but for UI simplicity we highlight all @mentions
  const renderContent = () => {
    const parts = content.split(/(@[\w\u00C0-\u017F]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-500 font-semibold cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {renderContent()}
    </div>
  );
};
