import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "antd";
import { SendHorizontal, X, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import { AttachmentMenu } from "./chat/inputs/AttachmentMenu";
import { GifPicker } from "./chat/inputs/GifPicker";
import { LocationPicker } from "./chat/inputs/LocationPicker";
import { PollCreator } from "./chat/inputs/PollCreator";
import { DrawingCanvas } from "./chat/inputs/DrawingCanvas";
import { QuickMessagePicker } from "./chat/inputs/QuickMessagePicker";
import { BankInfoForm } from "./chat/inputs/BankInfoForm";
import { ContactPicker } from "./chat/inputs/ContactPicker";
import { ReminderCreator } from "./chat/inputs/ReminderCreator";

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [activePicker, setActivePicker] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const typingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { id: currentUserId } = useAuthStore((state) => state.user) || {};

  const sendMessage = useChatStore((s) => s.sendMessage);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
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
    }, 3000);
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

  // ── General Send Logic ──────────────────────────────────────────

  const handleSend = useCallback(async (overrides?: {
    type?: any;
    content?: string;
    attachments?: any[];
    customPayload?: any;
  }) => {
    const trimmed = overrides?.content !== undefined ? overrides.content : text.trim();
    const capturedFiles = [...files];
    const hasFiles = capturedFiles.length > 0;

    if (!trimmed && !hasFiles && !overrides?.customPayload) return;
    if (!currentUserId) return;

    stopTyping();

    let messageType = overrides?.type || (hasFiles ? "IMAGE" : "TEXT");
    if (hasFiles && !overrides?.type) {
        if (capturedFiles[0].type.startsWith("image/")) messageType = "IMAGE";
        else if (capturedFiles[0].type.startsWith("video/")) messageType = "VIDEO";
        else if (capturedFiles[0].type.startsWith("audio/")) messageType = "VOICE";
        else messageType = "FILE";
    }

    const blobUrls = hasFiles ? capturedFiles.map((f) => URL.createObjectURL(f)) : [];
    const localAttachments = hasFiles
      ? capturedFiles.map((f, i) => ({
          id: `local-${i}-${Date.now()}`,
          url: blobUrls[i],
          localUrl: blobUrls[i],
          name: f.name,
          size: f.size,
          type: f.type,
          uploadProgress: 0,
        }))
      : overrides?.attachments;

    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const finalContent = trimmed || (overrides?.customPayload ? JSON.stringify(overrides.customPayload) : capturedFiles.map((f) => f.name).join(", "));

    // ── Phase 1: Add optimistic message ──
    addMessage({
      id: tempId,
      conversationId,
      senderId: currentUserId,
      content: finalContent,
      type: messageType,
      attachments: localAttachments,
      timestamp: new Date().toISOString(),
      status: (hasFiles || messageType === 'GIF') ? "uploading" : "sending",
    });

    setText("");
    setFiles([]);
    setActivePicker(null);

    try {
      let remoteAttachments: any[] | undefined = undefined;

      if (hasFiles) {
        const { uploadAttachments } = await import("@/lib/uploadMedia");
        const uploaded = await uploadAttachments(
          capturedFiles,
          conversationId,
          (fileIdx, pct) => {
            updateMessage(tempId, {
              attachments: localAttachments?.map((att: any, i: number) =>
                i === fileIdx ? { ...att, uploadProgress: pct } : att
              ),
            });
          }
        );

        remoteAttachments = uploaded.map((att, i) => ({
          ...att,
          localUrl: blobUrls[i],
          uploadProgress: undefined,
        }));

        updateMessage(tempId, { status: "sending", attachments: remoteAttachments });
      }

      // ── Phase 3: POST to backend ──
      const result = await sendMessage({
        conversationId,
        content: finalContent,
        senderId: currentUserId,
        type: messageType,
        attachments: remoteAttachments || localAttachments,
      });

      if (result) {
        updateMessage(tempId, {
          ...result,
          id: result.id ?? tempId,
          status: "sent",
        });
      }
    } catch (err) {
      console.error("[MessageInput] Failed to send message:", err);
      blobUrls.forEach((u) => URL.revokeObjectURL(u));
      updateMessage(tempId, { status: "failed" });
    }
  }, [text, files, conversationId, sendMessage, addMessage, updateMessage, stopTyping, currentUserId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
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
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const menuSelect = (id: string) => {
    if (id === 'image' || id === 'file') {
        fileInputRef.current?.click();
    } else {
        setActivePicker(id);
    }
  };

  return (
    <footer className="shrink-0 border-t border-white/10 backdrop-blur-md relative z-20" style={{ background: "rgba(10, 15, 25, 0.4)" }}>
      {/* Overlay Pickers */}
      {activePicker && (
        <div className="absolute bottom-full left-4 mb-4 animate-in slide-in-from-bottom-4 duration-300">
           {activePicker === 'gif' && <GifPicker onSelect={(url) => handleSend({ type: 'GIF', attachments: [{ url }] })} />}
           {activePicker === 'location' && <LocationPicker onSend={(lat, lng, isLive) => handleSend({ type: 'LOCATION', customPayload: { lat, lng, isLive } })} />}
           {activePicker === 'poll' && <PollCreator onSend={(question, options, allowMultiple) => handleSend({ type: 'POLL', customPayload: { question, options: options.map((t, i) => ({ id: i.toString(), text: t, votes: 0 })), totalVotes: 0, allowMultiple } })} />}
           {activePicker === 'draw' && <DrawingCanvas onSend={(blob) => {
               const file = new File([blob], `drawing-${Date.now()}.png`, { type: 'image/png' });
               setFiles([file]);
               handleSend({ type: 'IMAGE' });
           }} />}
           {activePicker === 'quick' && <QuickMessagePicker onSelect={(text) => handleSend({ content: text })} />}
           {activePicker === 'bank' && <BankInfoForm onSend={(data) => handleSend({ type: 'BANK', customPayload: data })} />}
           {activePicker === 'contact' && <ContactPicker onSend={(data) => handleSend({ type: 'CONTACT', customPayload: data })} />}
           {activePicker === 'reminder' && <ReminderCreator onSend={(text, time) => handleSend({ type: 'REMINDER', content: text, customPayload: { reminderAt: time } })} />}
           
           <button 
             onClick={() => setActivePicker(null)}
             className="absolute -top-2 -right-2 bg-black border border-white/20 rounded-full p-1 text-white/60 hover:text-white"
           >
             <X size={14} />
           </button>
        </div>
      )}

      {/* File Preview Strip */}
      {files.length > 0 && (
        <div className="flex gap-2 px-6 py-2 overflow-x-auto border-b border-white/5">
          {files.map((file, idx) => (
            <div key={idx} className="relative flex-shrink-0 w-16 h-16 bg-white/10 rounded-lg overflow-hidden group">
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-white/70 p-1">
                  <span className="truncate w-full text-center">{file.name}</span>
                </div>
              )}
              <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-100">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto flex max-w-2xl px-3 py-2.5 md:px-6 items-end gap-2">
        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

        <AttachmentMenu onSelect={menuSelect} />

        <button
          type="button"
          onClick={toggleRecording}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-muted-foreground hover:bg-white/10'
          }`}
        >
          <Mic className="h-5 w-5" />
        </button>

        <Input.TextArea
          value={text}
          onChange={(e) => { setText(e.target.value); handleTypingStart(); }}
          onKeyDown={handleKeyDown}
          placeholder={t('type_a_message')}
          autoSize={{ minRows: 1, maxRows: 5 }}
          variant="filled"
          className="elevated-input !bg-white/5 !border-none !text-white"
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
          onClick={() => void handleSend()}
          disabled={!text.trim() && files.length === 0}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-110 disabled:opacity-40"
        >
          <SendHorizontal className="h-5 w-5 ml-0.5" />
        </button>
      </div>
    </footer>
  );
}
