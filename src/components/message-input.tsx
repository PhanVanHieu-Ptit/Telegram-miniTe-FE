

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "antd";
import { SendHorizontal, Smile, Paperclip, X, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const EMOJI_LIST = ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😋', '😎', '😢', '😭', '😡', '👍', '👎', '❤️', '🔥', '✨', '💯', '🙏', '🎉', '👀', 'rocket'];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
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

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && files.length === 0) || !currentUserId) return;

    stopTyping();
    
    let attachments: any[] = [];
    let messageType: any = "TEXT";
    
    if (files.length > 0) {
       // Mock UI object URLs, simulating an uploaded presigned-url return output
       attachments = files.map(f => ({
           id: Math.random().toString(),
           url: URL.createObjectURL(f), 
           name: f.name,
           size: f.size,
           type: f.type
       }));
       
       if (files[0].type.startsWith("image/")) messageType = "IMAGE";
       else if (files[0].type.startsWith("audio/")) messageType = "VOICE";
       else messageType = "FILE";
    }

    void sendMessage({ 
      conversationId, 
      content: trimmed || (files.length > 0 ? files.map(f => f.name).join(', ') : ""), 
      senderId: currentUserId,
      type: messageType,
      attachments: attachments.length > 0 ? attachments : undefined
    });
    
    setText("");
    setFiles([]);
  }, [text, files, conversationId, sendMessage, stopTyping, currentUserId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const toggleRecording = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
          setFiles(prev => [...prev, file]);
          stream.getTracks().forEach(t => t.stop());
        };

        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Microphone access denied", error);
        alert("Please allow microphone access to record voice messages.");
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

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
    <footer className="shrink-0 border-t border-white/10 shrink-0 backdrop-blur-md" style={{ background: "rgba(10, 15, 25, 0.4)" }}>
      {/* File Preview Strip */}
      {files.length > 0 && (
        <div className="flex gap-2 px-6 py-2 overflow-x-auto border-b border-white/5">
          {files.map((file, idx) => (
            <div key={idx} className="relative flex-shrink-0 w-16 h-16 bg-white/10 rounded-lg overflow-hidden group">
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-white/70 p-1">
                  <span className="truncate w-full text-center">{file.name}</span>
                </div>
              )}
              <button 
                type="button" 
                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto flex max-w-2xl px-3 py-2.5 md:px-6 items-end gap-2">
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10"
          aria-label={t('attach_file')}
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={toggleRecording}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            isRecording 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse' 
              : 'text-muted-foreground hover:bg-white/10'
          }`}
          aria-label={t('record_voice')}
        >
          <Mic className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${showEmojiPicker ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/10'}`}
            aria-label={t('emoji')}
          >
            <Smile className="h-5 w-5" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50 w-64 bg-[#1e2330] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-xl">
               <div className="grid grid-cols-5 gap-1">
                 {EMOJI_LIST.filter(em => em !== 'rocket').map((em) => (
                   <button 
                     key={em} 
                     type="button"
                     onClick={() => insertEmoji(em)}
                     className="text-xl hover:bg-white/10 rounded-lg py-1 transition-colors"
                   >
                     {em}
                   </button>
                 ))}
                 <button 
                   type="button"
                   onClick={() => insertEmoji('🚀')}
                   className="text-xl hover:bg-white/10 rounded-lg py-1 transition-colors"
                 >
                   🚀
                 </button>
               </div>
            </div>
          )}
        </div>

        <Input.TextArea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t('type_a_message')}
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
          disabled={!text.trim() && files.length === 0}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(168,85,247,0.4)] transition-all hover:scale-110 disabled:scale-90 disabled:opacity-40 disabled:bg-white/10"
          aria-label={t('send_message')}
        >
          <SendHorizontal className="h-5 w-5 ml-0.5" />
        </button>
      </div>
    </footer>
  );
}
