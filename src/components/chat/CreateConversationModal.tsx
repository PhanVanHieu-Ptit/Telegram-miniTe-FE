import { useState, useCallback, useMemo } from "react";
import { Modal, Form, Input, Button, Space, Typography, Tooltip } from "antd";
import { Camera, Users, User as UserIcon, HelpCircle } from "lucide-react";
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
  const [form] = Form.useForm();
  const [type, setType] = useState<"private" | "group">("private");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const { createConversation, loading } = useCreateConversation();

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
  }, [selectedUsers, type, createConversation]);

  const handleClose = useCallback(() => {
    form.resetFields();
    setSelectedUsers([]);
    setType("private");
    onClose();
  }, [form, onClose]);

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
      if (count === 0) return <Text type="danger" className="text-xs">At least 1 member required</Text>;
      if (count > 1) return <Text type="warning" className="text-xs">Consider a Group chat instead.</Text>;
    } else {
      if (count < 2) return <Text type="danger" className="text-xs">Group requires ≥ 2 members</Text>;
    }
    return null;
  }, [selectedUsers.length, type]);

  return (
    <Modal
      title={
        <Space align="center" size="small">
          {type === "private" ? <UserIcon strokeWidth={1.5} className="h-5 w-5 text-indigo-400" /> : <Users strokeWidth={1.5} className="h-5 w-5 text-indigo-400" />}
          <span className="headline-premium text-lg">{type === "private" ? "New Message" : "New Group"}</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={460}
      centered
      className="saas-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ type: "private" }}
        className="p-6 pt-2"
      >
        <div className="mb-6">
          <div className="saas-switcher bg-white/5 border border-white/10">
            <div
              className="saas-switcher-bg !bg-white/10"
              style={{ transform: type === "group" ? "translateX(100%)" : "translateX(0)" }}
            />
            <div
              className={cn("saas-switcher-item", type === "private" && "active !text-white")}
              onClick={() => { setType("private"); form.setFieldValue("name", ""); }}
            >
              Private
            </div>
            <div
              className={cn("saas-switcher-item", type === "group" && "active !text-white")}
              onClick={() => setType("group")}
            >
              Group
            </div>
          </div>
        </div>

        {type === "group" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
            <Form.Item
              name="name"
              label={<span className="sub-header-premium text-[10px]">Group Name</span>}
              rules={[{ required: true, message: "Enter group name" }]}
            >
              <Input placeholder="Team Synergy, Family..." size="large" className="premium-input !rounded-xl" />
            </Form.Item>
            <Form.Item
              name="avatar"
              label={<span className="sub-header-premium text-[10px]">Cover Image URL</span>}
            >
              <Input
                placeholder="https://..."
                size="large"
                className="premium-input !rounded-xl"
                prefix={<Camera strokeWidth={1.5} className="h-4 w-4 text-secondary mr-1" />}
              />
            </Form.Item>
          </div>
        )}

        <Form.Item
          label={
            <div className="flex justify-between items-center w-full">
              <span className="sub-header-premium text-[10px]">Recipients</span>
              <Tooltip title="Select users to start chatting">
                <HelpCircle strokeWidth={1.5} className="h-3.5 w-3.5 text-secondary cursor-help" />
              </Tooltip>
            </div>
          }
        >
          <UserSelector
            selectedUserIds={selectedUsers.map(u => u.id)}
            onSelect={toggleUser}
            onDeselect={removeUser}
          />
          <div className="mt-2 flex justify-between">
            {validationHelp}
            <Text className="text-[10px] text-secondary font-bold uppercase tracking-wider">{selectedUsers.length} Selected</Text>
          </div>
        </Form.Item>

        <div className="mb-8">
          <SelectedUsers users={selectedUsers} onRemove={removeUser} />
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
            className="h-12 mesh-btn rounded-xl"
          >
            {type === "group" ? "CREATE GROUP" : "START CHAT"}
          </Button>
          <Button onClick={handleClose} type="text" block className="h-10 text-secondary font-semibold hover:text-white transition-colors">
            Discard
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
