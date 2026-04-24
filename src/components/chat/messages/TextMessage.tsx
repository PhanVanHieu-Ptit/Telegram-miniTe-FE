import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TextMessageProps {
  content?: string;
  mentions?: string[];
}

export const TextMessage: React.FC<TextMessageProps> = ({ content }) => {
  if (!content) return null;

  // Helper to render text with mentions highlighted
  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@[\w\u00C0-\u017F]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-500 font-semibold cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="text-sm leading-relaxed overflow-hidden">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-1 last:mb-0 whitespace-pre-wrap break-words">
              {React.Children.map(children, child => {
                if (typeof child === 'string') {
                  return renderTextWithMentions(child);
                }
                return child;
              })}
            </p>
          ),
          li: ({ children }) => (
            <li className="mb-1 ml-1">
              {React.Children.map(children, child => {
                if (typeof child === 'string') {
                  return renderTextWithMentions(child);
                }
                return child;
              })}
            </li>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="bg-black/10 dark:bg-white/10 px-1 rounded font-mono text-[13px]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-black/10 dark:bg-white/10 p-2 rounded-lg my-2 overflow-x-auto font-mono text-[13px]">
              {children}
            </pre>
          ),
          ul: ({ children }) => <ul className="list-disc ml-4 my-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 my-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-white/20 pl-3 italic opacity-80 my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
