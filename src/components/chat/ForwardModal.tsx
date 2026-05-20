import React, { useState } from 'react';
import { Modal, Input, Checkbox, Avatar, List } from 'antd';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useChatStore } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';
import type { Message } from '@/types/chat.types';

interface ForwardModalProps {
  message: Message | null;
  onClose: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ message, onClose }) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const conversations = useChatStore(state => state.conversations);
  const getUser = useChatStore(state => state.getUser);
  const currentUser = useAuthStore(state => state.user);
  const sendMessage = useChatStore(state => state.sendMessage);

  if (!message || !currentUser) return null;

  // Get the original sender's name robustly
  const getOriginalSenderName = () => {
    if (message.sender?.displayName) return message.sender.displayName;
    const storeUser = getUser(message.senderId);
    if (storeUser?.displayName) return storeUser.displayName;
    return "User"; // Minimal fallback that isn't "Someone"
  };

  const filtered = conversations.filter(c =>
    c.chatName.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    const senderName = getOriginalSenderName();
    for (const conversationId of selectedIds) {
      await sendMessage({
        conversationId,
        content: message.content,
        senderId: currentUser.id,
        type: message.type,
        attachments: message.attachments,
        forwardedFrom: message.id,
        metadata: {
          ...message.metadata,
          forwardedFromName: senderName
        }
      });
    }
    onClose();
  };

  return (
    <Modal
      title={t('forward_message')}
      open={!!message}
      onCancel={onClose}
      onOk={handleForward}
      okText={t('forward')}
      cancelText={t('cancel')}
      okButtonProps={{ disabled: selectedIds.length === 0 }}
      className="dark-modal"
    >
      <div className="space-y-4">
        <Input
          prefix={<Search size={16} />}
          placeholder={t('search_conversations')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border-white/10 text-white"
        />

        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <List
            dataSource={filtered}
            renderItem={convo => (
              <List.Item
                className="hover:bg-white/5 rounded-lg px-2 cursor-pointer transition-colors border-none"
                onClick={() => toggleSelect(convo.id)}
              >
                <div className="flex items-center gap-3 w-full py-1">
                  <Checkbox checked={selectedIds.includes(convo.id)} />
                  <Avatar src={convo.members[0]?.avatarUrl} size="large">
                    {convo?.chatName?.[0]?.toUpperCase()}
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{convo.chatName}</span>
                    <span className="text-xs text-white/40">
                      {t('members_count', { count: convo.members.length })}
                    </span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
    </Modal>
  );
};
