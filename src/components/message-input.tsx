

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "antd";
import { SendHorizontal, Smile } from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const [text, setText] = useState("");
  const typingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { id: currentUserId } = useAuthStore((state) => state.user) || {};

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
    }, 3000); // 3 seconds inactivity
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
    if (!trimmed || !currentUserId) return;

    stopTyping();
    void sendMessage({ conversationId, content: trimmed, senderId: currentUserId });
    setText("");
  }, [text, conversationId, sendMessage, stopTyping, currentUserId]);

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
    <footer className="shrink-0 border-t border-white/10 px-3 py-2.5 md:px-6 backdrop-blur-md" style={{ background: "rgba(10, 15, 25, 0.4)" }}>
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
          placeholder="Type a message..."
          autoSize={{ minRows: 1, maxRows: 5 }}
          variant="filled"
          className="elevated-input"
          styles={{
            textarea: {
              backgroundColor: "transparent",
              padding: "10px 16px",
              resize: "none",
              fontSize: "14px",
              lineHeight: "1.5",
              color: "white",
              border: "none",
            },
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(168,85,247,0.4)] transition-all hover:scale-110 disabled:scale-90 disabled:opacity-40 disabled:bg-white/10"
          aria-label="Send message"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </footer>
  );
}
