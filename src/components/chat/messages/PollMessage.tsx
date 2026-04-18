import React, { useState } from 'react';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollPayload {
  question: string;
  options: PollOption[];
  totalVotes: number;
  allowMultiple?: boolean;
}

interface PollMessageProps {
  payload?: PollPayload;
}

export const PollMessage: React.FC<PollMessageProps> = ({ payload: initialPayload }) => {
  const [payload, setPayload] = useState<PollPayload | undefined>(initialPayload);
  const [votedId, setVotedId] = useState<string | null>(null);

  if (!payload || !payload.options) return null;

  const handleVote = (optionId: string) => {
    if (votedId === optionId) return; // Prevent double voting trivially
    
    // Optimistic UI state
    setPayload(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        totalVotes: prev.totalVotes + 1,
        options: prev.options.map(opt => 
          opt.id === optionId 
            ? { ...opt, votes: opt.votes + 1 }
            : (opt.id === votedId ? { ...opt, votes: Math.max(0, opt.votes - 1)} : opt)
        )
      }
    });
    setVotedId(optionId);
  };

  return (
    <div className="flex flex-col gap-3 min-w-[250px] p-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">📊</span>
        <span className="font-bold text-sm tracking-wide leading-tight">{payload.question}</span>
      </div>
      
      <div className="flex flex-col gap-2 mt-1">
        {payload.options.map((option) => {
          const percentage = payload.totalVotes > 0 
            ? Math.round((option.votes / payload.totalVotes) * 100) 
            : 0;
            
          const isSelected = votedId === option.id;
          
          return (
            <button 
              key={option.id}
              onClick={() => handleVote(option.id)}
              className="relative w-full overflow-hidden rounded-md bg-white/10 hover:bg-white/15 transition flex flex-col text-left group"
            >
              <div 
                className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ease-out ${isSelected ? 'bg-blue-500/40 border-r-2 border-blue-400' : 'bg-white/10'}`} 
                style={{ width: `${Math.max(percentage, 2)}%` }} 
              />
              <div className="relative z-10 flex justify-between items-center px-3 py-2 w-full">
                <span className={`text-sm font-medium z-10 ${isSelected ? 'text-white' : 'opacity-90'}`}>
                  {option.text}
                </span>
                {payload.totalVotes > 0 && (
                  <span className="text-xs font-semibold opacity-70 z-10">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="text-[10px] opacity-60 text-right mt-1">
        {payload.totalVotes} {payload.totalVotes === 1 ? 'vote' : 'votes'}
      </div>
    </div>
  );
};
