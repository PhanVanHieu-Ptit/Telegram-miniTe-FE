

import { useState, useRef, useCallback } from "react";
import { Input } from "antd";
import { SendHorizontal, Smile } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { getMqttBridge } from "@/lib/mqtt-bridge";
import type { Message } from "@/lib/types";

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const [text, setText] = useState("");
  const typingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const currentUserId = useChatStore((s) => s.currentUserId);

  // ── Typing indicator management ──────────────────────────────────

  const emitTyping = useCallback(
    (active: boolean) => {
      try {
        const bridge = getMqttBridge({
          url: process.env.NEXT_PUBLIC_MQTT_URL ?? "ws://localhost:9001",
        });
        void bridge.publishTyping(conversationId, active);
      } catch {
        // MQTT not connected — ignore silently
      }
    },
    [conversationId]
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

  // ── Send ─────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    stopTyping();

    // Build message
    const message: Message = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      senderId: currentUserId,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
    };

    // Commit locally via store
    sendMessage(conversationId, trimmed);

    // Publish over MQTT
    try {
      const bridge = getMqttBridge({
        url: process.env.NEXT_PUBLIC_MQTT_URL ?? "ws://localhost:9001",
      });
      void bridge.publishMessage(conversationId, message);
    } catch {
      // MQTT not connected — local‑only is fine
    }

    setText("");
  }, [text, conversationId, currentUserId, sendMessage, stopTyping]);

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
