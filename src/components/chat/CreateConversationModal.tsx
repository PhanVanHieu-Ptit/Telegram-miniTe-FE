import { useState, useCallback, useMemo } from "react";
import { Modal, Form, Input, Radio, Button, Space, Typography, Tooltip } from "antd";
import { Camera, Users, User as UserIcon, HelpCircle } from "lucide-react";
import { UserSelector } from "./UserSelector";
import { SelectedUsers } from "./SelectedUsers";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import type { User } from "@/types/chat.types";

const { Text } = Typography;

interface CreateConversationModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Main modal for creating new private chats or group conversations
 * Integrates form validation, member selection, and the useCreateConversation hook
 */
export const CreateConversationModal = ({ open, onClose }: CreateConversationModalProps) => {
  const [form] = Form.useForm();
  const [type, setType] = useState<"private" | "group">("private");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const { createConversation, loading } = useCreateConversation();

  const handleFinish = useCallback(async (values: any) => {
    const userIds = selectedUsers.map(u => u.id);
    
    // Attempt creation through the custom hook
    const result = await createConversation({
      ...values,
      type,
      userIds,
    });
    
    // Result present indicates success
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
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      }
      return [...prev, user];
    });
  }, []);

  const removeUser = useCallback((userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  // Validation feedback for user count
  const validationHelp = useMemo(() => {
    const count = selectedUsers.length;
    if (type === "private") {
      if (count === 0) return <Text type="danger" className="text-xs">At least 1 member required for a chat</Text>;
      if (count > 1) return <Text type="warning" className="text-xs">Multiple users selected. Consider a Group chat instead.</Text>;
    } else {
      if (count < 2) return <Text type="danger" className="text-xs">A group requires at least 2 members</Text>;
    }
    return null;
  }, [selectedUsers.length, type]);

  return (
    <Modal
      title={
        <Space align="center" size="small">
          {type === "private" ? <UserIcon className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
          <span className="text-lg font-bold">{type === "private" ? "Create New Chat" : "Create New Group"}</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={500}
      centered
      className="create-conversation-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ type: "private" }}
        className="mt-6"
      >
        <div className="flex flex-col items-center mb-8">
          <Radio.Group 
            value={type} 
            onChange={(e) => {
              setType(e.target.value);
              // Clear names when switching to private
              if (e.target.value === "private") form.setFieldValue("name", "");
            }}
            optionType="button"
            buttonStyle="solid"
            className="w-full flex"
          >
            <Radio.Button value="private" className="flex-1 flex justify-center !rounded-l-xl">
              <div className="flex items-center gap-2 py-1 justify-center">
                <UserIcon className="h-4 w-4" />
                <span>Private Chat</span>
              </div>
            </Radio.Button>
            <Radio.Button value="group" className="flex-1 flex justify-center !rounded-r-xl">
              <div className="flex items-center gap-2 py-1 justify-center">
                <Users className="h-4 w-4" />
                <span>Group Chat</span>
              </div>
            </Radio.Button>
          </Radio.Group>
          <Text type="secondary" className="text-xs mt-3 flex items-center gap-1">
             <HelpCircle className="h-3 w-3" />
             {type === "private" ? "Chat directly with one person" : "Chat with multiple people at once"}
          </Text>
        </div>

        {type === "group" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <Form.Item
              name="name"
              label={<span className="font-semibold text-foreground/80">Group Name</span>}
              rules={[{ required: true, message: "Please enter group name" }]}
            >
              <Input placeholder="E.g. Project Team, Family Chat" size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="avatar"
              label={<span className="font-semibold text-foreground/80">Group Avatar URL</span>}
            >
              <Input 
                 placeholder="https://example.com/image.jpg" 
                 size="large" 
                 className="rounded-lg" 
                 prefix={<Camera className="h-4 w-4 text-muted-foreground mr-1" />} 
              />
            </Form.Item>
          </div>
        )}

        <Form.Item 
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-foreground/80">Add Members</span>
              <Tooltip title="Start typing to search for users by name">
                <Text type="secondary" className="text-xs cursor-help">Search Tips</Text>
              </Tooltip>
            </div>
          }
        >
          <UserSelector 
            selectedUserIds={selectedUsers.map(u => u.id)}
            onSelect={toggleUser}
            onDeselect={removeUser}
          />
          <div className="mt-1 flex justify-between">
             {validationHelp}
             <Text className="text-xs font-mono">{selectedUsers.length} selected</Text>
          </div>
        </Form.Item>

        <div className="mb-8">
           <SelectedUsers 
             users={selectedUsers} 
             onRemove={removeUser}
           />
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            size="large" 
            block 
            className="h-12 text-md font-bold rounded-xl shadow-lg"
          >
            Create {type === "group" ? "Group" : "Chat"}
          </Button>
          <Button onClick={handleClose} type="text" block className="h-10 hover:bg-accent/50 text-muted-foreground">
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
