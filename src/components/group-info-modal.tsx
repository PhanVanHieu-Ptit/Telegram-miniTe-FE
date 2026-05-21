import React, { useState, useMemo } from 'react';
import { Modal, Avatar, Button, Input, List, message } from 'antd';
import { Search, UserPlus, UserMinus, ShieldAlert, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import type { Conversation, User } from '@/types/chat.types';
import { searchUsers } from '@/api/user.api';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export function GroupInfoModal({ isOpen, onClose, conversation }: GroupInfoModalProps) {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const removeMember = useChatStore((s) => s.removeMember);
  const addMembers = useChatStore((s) => s.addMembers);

  const [isAddMode, setIsAddMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const currentMemberInfo = useMemo(() => {
    return conversation.members?.find((m) => m.id === currentUser?.id);
  }, [conversation.members, currentUser?.id]);

  const canManage = currentMemberInfo?.role === 'owner' || currentMemberInfo?.role === 'admin';

  const handleRemove = (memberId: string) => {
    Modal.confirm({
      title: t('remove_member_confirm', { defaultValue: 'Are you sure you want to remove this member?' }),
      onOk: async () => {
        try {
          await removeMember(conversation.id, memberId);
          message.success(t('member_removed_success', { defaultValue: 'Member removed successfully' }));
        } catch (error) {
          message.error(t('failed_to_remove_member', { defaultValue: 'Failed to remove member' }));
        }
      }
    });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchUsers({ query });
      // Filter out existing members
      const existingIds = new Set(conversation.members?.map(m => m.id) || []);
      setSearchResults(results.filter(u => !existingIds.has(u.id)));
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await addMembers(conversation.id, [userId]);
      message.success(t('member_added_success', { defaultValue: 'Member added successfully' }));
      // Remove from search results locally
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      // Switch back after successful add
      setIsAddMode(false);
    } catch (error) {
      message.error(t('failed_to_add_member', { defaultValue: 'Failed to add member' }));
    }
  };

  // Reset state when closing
  React.useEffect(() => {
    if (!isOpen) {
      setIsAddMode(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const getInitials = (name: string) => name ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : '';

  return (
    <Modal
      title={isAddMode ? t('add_members', { defaultValue: 'Add Members' }) : t('group_info', { defaultValue: 'Group Info' })}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      className="premium-modal"
    >
      {!isAddMode ? (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-semibold">{t('members', { defaultValue: 'Members' })} ({conversation.members?.length || 0})</h3>
            {canManage && (
              <Button type="primary" size="small" icon={<UserPlus className="w-4 h-4" />} onClick={() => setIsAddMode(true)}>
                {t('add', { defaultValue: 'Add' })}
              </Button>
            )}
          </div>
          <List
            className="max-h-[60vh] overflow-y-auto custom-scrollbar"
            itemLayout="horizontal"
            dataSource={conversation.members || []}
            renderItem={(item) => {
              const isOwner = item.role === 'owner';
              const isAdmin = item.role === 'admin';
              const isMe = item.id === currentUser?.id;
              return (
                <List.Item
                  actions={[
                    canManage && !isOwner && !isMe ? (
                      <Button
                        key="remove"
                        type="text"
                        danger
                        icon={<UserMinus className="w-4 h-4" />}
                        onClick={() => handleRemove(item.id)}
                      />
                    ) : null
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatarUrl}>{!item.avatarUrl && getInitials(item.fullName)}</Avatar>}
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[14px] text-foreground/90">
                          {item.fullName} {isMe && `(${t('you', { defaultValue: 'You' })})`}
                        </span>
                        {isOwner && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                        {isAdmin && !isOwner && <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                    }
                    description={<span className="text-xs text-muted-foreground">{item.email}</span>}
                  />
                </List.Item>
              );
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          <Input
            prefix={<Search className="w-4 h-4 text-muted-foreground" />}
            placeholder={t('search_users', { defaultValue: 'Search users...' })}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10"
          />
          <List
            loading={isSearching}
            className="max-h-[50vh] overflow-y-auto custom-scrollbar"
            itemLayout="horizontal"
            dataSource={searchResults}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="add"
                    type="primary"
                    size="small"
                    onClick={() => handleAddMember(item.id)}
                  >
                    {t('add', { defaultValue: 'Add' })}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.avatarUrl}>{!item.avatarUrl && getInitials(item.displayName || item.username || '')}</Avatar>}
                  title={<span className="font-semibold text-[14px] text-foreground/90">{item.displayName || item.username}</span>}
                  description={<span className="text-xs text-muted-foreground">{item.email}</span>}
                />
              </List.Item>
            )}
            locale={{ emptyText: searchQuery ? t('no_results', { defaultValue: 'No results found' }) : t('type_to_search', { defaultValue: 'Type to search...' }) }}
          />
          <Button onClick={() => setIsAddMode(false)} className="mt-2">
            {t('back', { defaultValue: 'Back' })}
          </Button>
        </div>
      )}
    </Modal>
  );
}
