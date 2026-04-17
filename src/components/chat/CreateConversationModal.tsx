import { useState, useCallback, useMemo } from "react";
import { Modal, Form, Input, Button, Space, Typography, Tooltip } from "antd";
import { Camera, Users, User as UserIcon, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserSelector } from "./UserSelector";
import { SelectedUsers } from "./SelectedUsers";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import type { User } from "@/types/chat.types";
import { cn } from "@/lib/utils";

const { Text } = Typography;

interface CreateConversationModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateConversationModal = ({ open, onClose }: CreateConversationModalProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [type, setType] = useState<"private" | "group">("private");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const { createConversation, loading } = useCreateConversation();

  const handleClose = useCallback(() => {
    form.resetFields();
    setSelectedUsers([]);
    setType("private");
    onClose();
  }, [form, onClose]);

  const handleFinish = useCallback(async (values: any) => {
    const userIds = selectedUsers.map(u => u.id);
    const result = await createConversation({
      ...values,
      type,
      userIds,
    });
    if (result) {
      handleClose();
    }
  }, [selectedUsers, type, createConversation, handleClose]);

  const toggleUser = useCallback((user: User) => {
    setSelectedUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) return prev.filter(u => u.id !== user.id);
      return [...prev, user];
    });
  }, []);

  const removeUser = useCallback((userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const validationHelp = useMemo(() => {
    const count = selectedUsers.length;
    if (type === "private") {
      if (count === 0) return <Text type="danger" className="text-xs">{t('at_least_1_member')}</Text>;
      if (count > 1) return <Text type="warning" className="text-xs">{t('consider_group')}</Text>;
    } else {
      if (count < 2) return <Text type="danger" className="text-xs">{t('group_requires_2')}</Text>;
    }
    return null;
  }, [selectedUsers.length, type, t]);

  return (
    <Modal
      title={
        <Space align="center" size="middle" className="py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
            {type === "private" ? <UserIcon strokeWidth={2} className="h-5 w-5" /> : <Users strokeWidth={2} className="h-5 w-5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xl font-black tracking-tight leading-none mb-1">{type === "private" ? t('new_message') : t('new_group')}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#0ea5e9]/60">{t('secure_protocol')}</span>
          </div>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={480}
      centered
      className="saas-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ type: "private" }}
        className="p-8 pt-6"
      >
        <div className="mb-8">
          <div className="saas-switcher">
            <div
              className="saas-switcher-bg"
              style={{ transform: type === "group" ? "translateX(100%)" : "translateX(0)" }}
            />
            <div
              className={cn("saas-switcher-item", type === "private" && "active")}
              onClick={() => { setType("private"); form.setFieldValue("name", ""); }}
            >
              {t('private')}
            </div>
            <div
              className={cn("saas-switcher-item", type === "group" && "active")}
              onClick={() => setType("group")}
            >
              {t('group')}
            </div>
          </div>
        </div>

        {type === "group" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 mb-8">
            <Form.Item
              name="name"
              label={<span className="sub-header-premium text-[10px] ml-1">{t('group_identifier')}</span>}
              rules={[{ required: true, message: t('enter_group_name') }]}
            >
              <Input placeholder="e.g. Alpha Team, Project X..." size="large" className="premium-input !rounded-xl" />
            </Form.Item>
            <Form.Item
              name="avatar"
              label={<span className="sub-header-premium text-[10px] ml-1">{t('visualization_url')}</span>}
            >
              <Input
                placeholder="https://images.unsplash.com/..."
                size="large"
                className="premium-input !rounded-xl"
                prefix={<Camera strokeWidth={2} className="h-4 w-4 text-primary/60 mr-2" />}
              />
            </Form.Item>
          </div>
        )}

        <Form.Item
          label={
            <div className="flex justify-between items-center w-full mb-1 ml-1">
              <span className="sub-header-premium text-[10px]">{t('recipients')}</span>
              <Tooltip title={t('neural_network_user_selection')}>
                <HelpCircle strokeWidth={1.5} className="h-3.5 w-3.5 text-secondary cursor-help" />
              </Tooltip>
            </div>
          }
          className="mb-2"
        >
          <UserSelector
            selectedUserIds={selectedUsers.map(u => u.id)}
            onSelect={toggleUser}
            onDeselect={removeUser}
          />
          <div className="mt-3 flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="flex-1">{validationHelp}</div>
            <div className="flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
               <Text className="text-[9px] text-[#0ea5e9] font-black uppercase tracking-widest">
                 {t('units_selected', { count: selectedUsers.length })}
               </Text>
            </div>
          </div>
        </Form.Item>

        <div className="mb-10">
          <SelectedUsers users={selectedUsers} onRemove={removeUser} />
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
            className="h-14 mesh-btn rounded-2xl text-sm tracking-[0.2em] font-black"
          >
            {type === "group" ? t('establish_group') : t('initiate_transmission')}
          </Button>
          <button 
            type="button"
            onClick={handleClose} 
            className="h-10 text-[11px] text-secondary font-bold uppercase tracking-widest hover:text-white transition-all duration-300 opacity-60 hover:opacity-100 mt-2"
          >
            {t('abort_protocol')}
          </button>
        </div>
      </Form>
    </Modal>
  );
};
