import React, { useState, useRef, useEffect } from 'react';

interface VoiceMessageProps {
  url?: string;
  duration?: number;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ url, duration = 0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (url) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [url]);

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px] p-1">
      <button 
        onClick={togglePlay}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-current hover:bg-white/30 transition shadow-sm"
      >
        {isPlaying ? (
          <span className="text-sm font-bold">||</span>
        ) : (
          <span className="text-sm pl-1 font-bold">▶</span>
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Simple mock waveform */}
        <div className="h-5 flex items-center gap-[2px] w-full">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-1 rounded-full transition-all ${i / 20 * 100 < progress ? 'bg-current opacity-100' : 'bg-current opacity-40'}`}
              style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono opacity-80">
          {formatDuration(audioRef.current?.currentTime || duration)}
        </span>
      </div>
    </div>
  );
};
