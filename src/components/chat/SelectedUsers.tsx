import type { User } from "@/types/chat.types";
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
    <div className="flex flex-wrap items-center gap-2.5 p-4 border border-white/5 bg-white/[0.02] rounded-2xl min-h-[70px] max-h-[140px] overflow-y-auto mt-2 shadow-inner">
      {users.map((user) => (
        <Tag
          key={user.id}
          closable
          onClose={(e) => {
            e.preventDefault();
            onRemove(user.id);
          }}
          className="flex items-center gap-2 py-1.5 px-3.5 rounded-xl bg-white/5 text-white border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all font-bold text-[11px] tracking-wide"
        >
          <Avatar size={22} src={user.avatarUrl} className="shrink-0 border border-white/10">
            {user.displayName[0].toUpperCase()}
          </Avatar>
          <span className="truncate max-w-[100px] ml-1">{user.displayName}</span>
        </Tag>
      ))}
    </div>
  );
};
