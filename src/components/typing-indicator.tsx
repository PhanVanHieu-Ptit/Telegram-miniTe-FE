

import { memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  usersTyping: string[];
}

function TypingIndicatorComponent({ usersTyping }: TypingIndicatorProps) {
  const { t } = useTranslation();

  if (usersTyping.length === 0) return null;

  let label = "";
  if (usersTyping.length === 1) {
    label = t("typing_single", { name: usersTyping[0] });
  } else if (usersTyping.length === 2) {
    label = t("typing_double", { name1: usersTyping[0], name2: usersTyping[1] });
  } else {
    label = t("typing_multiple", { name: usersTyping[0], count: usersTyping.length - 1 });
  }

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
