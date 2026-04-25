import { memo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Avatar, Dropdown, Tooltip, Modal, App } from "antd";
import type { MenuProps } from "antd";
import { 
  Check, 
  CheckCheck, 
  SmilePlus, 
  RefreshCw, 
  Pin, 
  EyeOff, 
  MoreVertical, 
  PinOff,
  Copy,
  Reply,
  Edit2,
  Trash2,
  Forward
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, User } from "@/types/chat.types";
import dayjs from "dayjs";
import { MessageRenderer } from "./chat/messages/MessageRenderer";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  seen: boolean;
  sender?: User;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = [
    "#5B8DEF",
    "#E57373",
    "#81C784",
    "#FFB74D",
    "#BA68C8",
    "#4DB6AC",
    "#F06292",
    "#AED581",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const RepliedMessagePreview = memo(({ replyToId, isOwnMessage }: { replyToId: string; isOwnMessage: boolean }) => {
  const repliedMsg = useChatStore(
    useShallow((s) => s.messages.find(m => m.id === replyToId))
  );

  const currentUserId = useAuthStore.getState().user?.id;
  const currentUserName = useAuthStore.getState().user?.displayName || "Me";

  if (!repliedMsg) return (
    <div className={cn("mb-2 p-2 rounded-lg border-l-4 bg-white/5 opacity-50 italic text-[10px]", isOwnMessage ? "border-white/40" : "border-primary")}>
      Message not found
    </div>
  );

  const senderName = repliedMsg.sender?.displayName || (repliedMsg.senderId === currentUserId ? currentUserName : "User");

  return (
    <div 
      className={cn(
        "mb-2 p-1 pl-3 rounded-r-lg border-l-[3px] bg-black/10 dark:bg-white/5 cursor-pointer hover:bg-white/10 transition-all flex flex-col gap-0 overflow-hidden relative",
        isOwnMessage ? "border-white" : "border-primary"
      )}
      onClick={(e) => {
         e.stopPropagation();
         const el = document.getElementById(`message-${replyToId}`);
         if (el) {
           el.scrollIntoView({ behavior: 'smooth', block: 'center' });
           el.classList.add('highlight-message');
           setTimeout(() => el.classList.remove('highlight-message'), 2000);
         }
      }}
    >
      <span className={cn("text-[12px] font-bold truncate leading-tight", isOwnMessage ? "text-white" : "text-primary")}>
        {senderName}
      </span>
      <span className="text-[12px] opacity-80 truncate line-clamp-1 leading-normal">
        {repliedMsg.content}
      </span>
    </div>
  );
});

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  showTimestamp,
  seen,
  sender,
}: MessageBubbleProps) {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { 
    reactMessage, 
    pinMessage, 
    unpinMessage, 
    hideMessage,
    setReplyingToMessage,
    setEditingMessage,
    setForwardingMessage,
    deleteMessage
  } = useChatStore(
    useShallow((s) => ({
      reactMessage: s.reactMessage,
      pinMessage: s.pinMessage,
      unpinMessage: s.unpinMessage,
      hideMessage: s.hideMessage,
      setReplyingToMessage: s.setReplyingToMessage,
      setEditingMessage: s.setEditingMessage,
      setForwardingMessage: s.setForwardingMessage,
      deleteMessage: s.deleteMessage,
    }))
  );

  const currentUserId = useAuthStore((state) => state.user?.id);
  const isHidden = !!(currentUserId && message.hiddenBy?.includes(currentUserId));
  const [isRevealed, setIsRevealed] = useState(false);
  
  const REACTION_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const copyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(message.content).then(() => {
        toast.success("Copied to clipboard");
      }).catch(() => fallbackCopy(message.content));
    } else {
      fallbackCopy(message.content);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy");
    }
    document.body.removeChild(textArea);
  };

  const handleReact = (emoji: string) => {
    setShowEmojiPicker(false);
    if (!message.id) return;
    void reactMessage(message.conversationId, message.id, emoji);
  };

  const handleActionClick: MenuProps['onClick'] = (e) => {
    if (!message.id) return;
    switch (e.key) {
      case 'reply':
        setReplyingToMessage(message);
        break;
      case 'copy':
        copyToClipboard();
        break;
      case 'edit':
        setEditingMessage(message);
        break;
      case 'forward':
        setForwardingMessage(message);
        break;
      case 'pin':
        void pinMessage(message.conversationId, message.id);
        break;
      case 'unpin':
        void unpinMessage(message.conversationId, message.id);
        break;
      case 'hide':
        void hideMessage(message.conversationId, message.id);
        break;
      case 'delete_everyone':
        modal.confirm({
          title: t('delete_for_everyone'),
          content: t('delete_message_everyone_confirm'),
          okText: t('delete'),
          okType: 'danger',
          cancelText: t('cancel'),
          centered: true,
          className: 'dark-modal',
          onOk: () => {
            if (message.id) void deleteMessage(message.id, 'everyone');
          }
        });
        break;
      case 'delete_self':
        modal.confirm({
          title: t('delete_for_me'),
          content: t('delete_message_self_confirm'),
          okText: t('delete'),
          okType: 'danger',
          cancelText: t('cancel'),
          centered: true,
          className: 'dark-modal',
          onOk: () => {
            if (message.id) void deleteMessage(message.id, 'self');
          }
        });
        break;
    }
  };

  const actionItems: MenuProps['items'] = [
    { key: 'reply', label: t('reply'), icon: <Reply className="w-4 h-4" /> },
    { key: 'copy', label: t('copy_text'), icon: <Copy className="w-4 h-4" /> },
    isOwnMessage && !message.isDeleted && { key: 'edit', label: t('edit_message'), icon: <Edit2 className="w-4 h-4" /> },
    { key: 'forward', label: t('forward'), icon: <Forward className="w-4 h-4" /> },
    { type: 'divider' },
    message.isPinned
      ? { key: 'unpin', label: t('unpin_message'), icon: <PinOff className="w-4 h-4" /> }
      : { key: 'pin', label: t('pin_message'), icon: <Pin className="w-4 h-4" /> },
    { key: 'hide', label: isOwnMessage ? t('hide_for_everyone') : t('hide_for_me'), icon: <EyeOff className="w-4 h-4" /> },
    { type: 'divider' },
    { key: 'delete_self', label: t('delete_for_me'), icon: <Trash2 className="w-4 h-4" />, danger: true },
    isOwnMessage && { key: 'delete_everyone', label: t('delete_for_everyone'), icon: <Trash2 className="w-4 h-4" />, danger: true },
  ].filter(Boolean) as MenuProps['items'];

  if (message.isDeleted) {
    return (
      <div className={cn("flex w-full mb-1", isOwnMessage ? "justify-end" : "justify-start")}>
        <div className="px-4 py-2 italic text-[12px] opacity-40 bg-white/5 border border-white/5 rounded-2xl">
          {t('message_deleted_placeholder', { defaultValue: 'This message was deleted' })}
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "flex items-end gap-2 group mb-1",
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar slot */}
      <div className="w-8 shrink-0">
        {!isOwnMessage && showAvatar && sender ? (
          <Avatar
            size={32}
            src={sender.avatarUrl || undefined}
            style={{
              backgroundColor: sender.avatarUrl
                ? undefined
                : getAvatarColor(sender.id),
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {!sender.avatarUrl && getInitials(sender.displayName)}
          </Avatar>
        ) : null}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[75%] px-4 py-2.5 text-sm leading-relaxed md:max-w-[60%] backdrop-blur-xl transition-all group/inner",
          isOwnMessage
            ? "rounded-2xl rounded-br-sm bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20"
            : "rounded-2xl rounded-bl-sm bg-white/5 text-white/90 border border-white/10 shadow-sm",
          showAvatar
            ? ""
            : isOwnMessage
              ? "rounded-br-2xl"
              : "rounded-bl-2xl"
        )}
      >
        {message.isPinned && (
          <div className="absolute -top-2 -right-2 bg-yellow-500/90 rounded-full p-1 shadow-sm text-white border border-yellow-400 z-10">
            <Pin className="w-3 h-3 fill-current" />
          </div>
        )}

        {message.forwardedFrom && (
           <div className="text-[10px] italic opacity-50 mb-1 flex items-center gap-1">
             <Forward className="w-3 h-3" />
             <span>
               {t('forwarded_from', { 
                 name: message.metadata?.forwardedFromName || t('someone') 
               })}
             </span>
           </div>
        )}

        {message.replyTo && (
           <RepliedMessagePreview 
             replyToId={message.replyTo} 
             isOwnMessage={isOwnMessage} 
           />
        )}

        <div className={cn(
          "transition-all duration-500",
          isHidden ? "cursor-pointer" : ""
        )} onClick={() => isHidden && setIsRevealed(!isRevealed)}>
          <MessageRenderer 
            message={message} 
            isHidden={isHidden}
            isRevealed={isRevealed}
          />
        </div>

        {/* Timestamp + seen indicator */}
        <div className={cn(
          "flex items-center gap-1 mt-1 justify-end",
          isOwnMessage ? "text-white/60" : "text-white/40"
        )}>
           {message.editedAt && <span className="text-[10px] italic opacity-70">(edited)</span>}
           <span className="text-[10px]">
             {dayjs(message.timestamp).format("HH:mm")}
           </span>
           {isOwnMessage && message.status !== 'uploading' && (
             seen ? (
               <CheckCheck className="h-3 w-3 text-primary" />
             ) : (
               <Check className="h-3 w-3" />
             )
           )}
        </div>

        {/* Uploading/Failed indicators */}
        {message.status === 'uploading' && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-inherit flex items-center justify-center">
            <RefreshCw className="w-4 h-4 animate-spin text-white/70" />
          </div>
        )}

        {/* Quick Actions (Desktop Hover) */}
        <div className={cn(
          "absolute -top-10 opacity-0 group-hover/inner:opacity-100 transition-all duration-200 z-20 flex gap-1",
          isOwnMessage ? "right-0" : "left-0"
        )}>
          <div className="flex bg-[#1e293b]/95 backdrop-blur-md rounded-full shadow-2xl border border-white/10 p-1 gap-0.5">
             <Tooltip title={t('reply')} mouseEnterDelay={0.5}>
               <button onClick={() => setReplyingToMessage(message)} className="p-1.5 rounded-full hover:bg-white/10 text-white/70 transition-colors">
                 <Reply className="w-3.5 h-3.5" />
               </button>
             </Tooltip>
             <Tooltip title={t('copy')} mouseEnterDelay={0.5}>
               <button onClick={copyToClipboard} className="p-1.5 rounded-full hover:bg-white/10 text-white/70 transition-colors">
                 <Copy className="w-3.5 h-3.5" />
               </button>
             </Tooltip>
             <Tooltip title={t('react')} mouseEnterDelay={0.5}>
               <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 rounded-full hover:bg-white/10 text-white/70 transition-colors">
                 <SmilePlus className="w-3.5 h-3.5" />
               </button>
             </Tooltip>
             <Tooltip title={t('more_actions')} mouseEnterDelay={0.5}>
               <Dropdown menu={{ items: actionItems, onClick: handleActionClick }} trigger={['click']} placement="top">
                 <button className="p-1.5 rounded-full hover:bg-white/10 text-white/70 transition-colors">
                   <MoreVertical className="w-3.5 h-3.5" />
                 </button>
               </Dropdown>
             </Tooltip>
          </div>
        </div>
        
        {/* Emoji Picker Overlay */}
        {showEmojiPicker && (
          <div className={cn(
            "absolute -top-12 z-50 flex gap-1 bg-[#1e293b] border border-white/10 rounded-full p-1.5 shadow-2xl animate-in fade-in zoom-in duration-200",
            isOwnMessage ? "right-0" : "left-0"
          )}>
            {REACTION_LIST.map(em => (
               <button key={em} onClick={() => handleReact(em)} className="text-lg hover:scale-125 transition-transform hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center">
                 {em}
               </button>
            ))}
          </div>
        )}

        {/* Reactions Render */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={cn("absolute -bottom-3 flex gap-1 bg-[#1e2330] p-0.5 px-1 rounded-full border border-white/10 shadow-sm z-10 scale-90", isOwnMessage ? "right-2 origin-bottom-right" : "left-2 origin-bottom-left")}>
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <div key={emoji} className="flex items-center gap-1 bg-white/5 rounded-full px-1.5 py-0.5">
                <span className="text-xs">{emoji}</span>
                <span className="text-[10px] text-white/70 font-semibold">{users.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
