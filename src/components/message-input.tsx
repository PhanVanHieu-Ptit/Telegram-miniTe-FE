

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "antd";
import { SendHorizontal, Smile } from "lucide-react";
import { useChatStore } from "@/lib/store";

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const [text, setText] = useState("");
  const typingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const setTypingActive = useChatStore((s) => s.setTypingActive);

  // ── Typing indicator management ──────────────────────────────────

  const emitTyping = useCallback(
    (active: boolean) => {
      void setTypingActive(conversationId, active);
    },
    [conversationId, setTypingActive]
  );

  const handleTypingStart = useCallback(() => {
    if (!typingRef.current) {
      typingRef.current = true;
      emitTyping(true);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      emitTyping(false);
    }, 3_000);
  }, [emitTyping]);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (typingRef.current) {
      typingRef.current = false;
      emitTyping(false);
    }
  }, [emitTyping]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (typingRef.current) {
        typingRef.current = false;
        emitTyping(false);
      }
    };
  }, [emitTyping]);

  // ── Send ─────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    stopTyping();
    void sendMessage(conversationId, trimmed);
    setText("");
  }, [text, conversationId, sendMessage, stopTyping]);

  // ── Keyboard ─────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      handleTypingStart();
    } else {
      stopTyping();
    }
  };

  // ── Render ───────────────────────────────────────────────────────

  return (
    <footer className="shrink-0 border-t border-border bg-card px-3 py-2.5 md:px-6">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
          aria-label="Emoji"
        >
          <Smile className="h-5 w-5" />
        </button>

        <Input.TextArea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message"
          autoSize={{ minRows: 1, maxRows: 5 }}
          variant="filled"
          styles={{
            textarea: {
              backgroundColor: "var(--input)",
              borderRadius: "18px",
              padding: "8px 14px",
              resize: "none",
              fontSize: "14px",
              lineHeight: "1.5",
              border: "none",
            },
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-all hover:bg-accent disabled:scale-90 disabled:opacity-40"
          aria-label="Send message"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </footer>
  );
}
