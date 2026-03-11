import type { User } from "@/types/chat.types";
import { X } from "lucide-react";
import { Avatar, Tag } from "antd";

interface SelectedUsersProps {
  users: User[];
  onRemove: (userId: string) => void;
}

/**
 * Component to display a list of tags representing selected users
 */
export const SelectedUsers = ({ users, onRemove }: SelectedUsersProps) => {
  if (users.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-accent/10 min-h-[60px] max-h-[120px] overflow-y-auto mt-2">
      {users.map((user) => (
        <Tag
          key={user.id}
          closable
          onClose={(e) => {
            e.preventDefault();
            onRemove(user.id);
          }}
          closeIcon={<X className="h-3 w-3 mt-1 mr-1" />}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-primary/10 text-primary border-primary/20 hover:border-primary/40 transition-all font-medium"
        >
          <Avatar size={20} src={user.avatarUrl} className="shrink-0">
             {user.displayName[0].toUpperCase()}
          </Avatar>
          <span className="text-xs truncate max-w-[80px]">{user.displayName}</span>
        </Tag>
      ))}
    </div>
  );
};
