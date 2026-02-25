

import { memo } from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  usersTyping: string[];
}

function formatLabel(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
  return `${names[0]} and ${names.length - 1} others are typing`;
}

function TypingIndicatorComponent({ usersTyping }: TypingIndicatorProps) {
  if (usersTyping.length === 0) return null;

  const label = formatLabel(usersTyping);

  return (
    <div className="flex items-center gap-1.5 px-4 pb-1 pt-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-[3px]" aria-label="typing">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "inline-block h-[5px] w-[5px] rounded-full bg-muted-foreground",
              "animate-[typing-dot_1.4s_ease-in-out_infinite]"
            )}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
    </div>
  );
}

export const TypingIndicator = memo(TypingIndicatorComponent);
