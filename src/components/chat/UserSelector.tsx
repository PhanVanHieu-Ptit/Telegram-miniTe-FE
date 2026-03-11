import { useState, useEffect, useCallback } from "react";
import { Select, Spin, Avatar } from "antd";
import { searchUsers } from "@/api/user.api";
import type { User } from "@/types/chat.types";
import { Search } from "lucide-react";

interface UserSelectorProps {
  selectedUserIds: string[];
  onSelect: (user: User) => void;
  onDeselect: (userId: string) => void;
}

/**
 * Multi-select user selector with debounced server-side search
 */
export const UserSelector = ({ selectedUserIds, onSelect, onDeselect }: UserSelectorProps) => {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<User[]>([]);
  const [searchValue, setSearchValue] = useState("");
  
  // Implementation of debounced search to avoid excessive API calls
  useEffect(() => {
    if (!searchValue.trim()) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setFetching(true);
      try {
        const users = await searchUsers({ query: searchValue });
        setOptions(users);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setFetching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSelect = useCallback((val: any) => {
    const user = options.find(u => u.id === val.value);
    if (user) onSelect(user);
    setSearchValue(""); // Clear search after selection
  }, [options, onSelect]);

  const handleDeselect = useCallback((val: any) => {
    onDeselect(val.value);
  }, [onDeselect]);

  return (
    <Select
      mode="multiple"
      labelInValue
      placeholder="Search users to add..."
      suffixIcon={<Search className="h-4 w-4 text-muted-foreground mr-1" />}
      filterOption={false}
      onSearch={setSearchValue}
      onSelect={handleSelect}
      onDeselect={handleDeselect}
      style={{ width: '100%' }}
      notFoundContent={fetching ? <Spin size="small" /> : (searchValue ? "No users found" : "Type to search users")}
      className="conversation-user-selector"
      popupClassName="user-selector-popup"
      options={options.map(user => ({
        label: (
          <div className="flex items-center gap-2.5 py-1">
            <Avatar size="small" src={user.avatarUrl} className="shrink-0 bg-primary/20">
              {user.displayName[0].toUpperCase()}
            </Avatar>
            <span className="font-medium">{user.displayName}</span>
          </div>
        ) ,
        value: user.id,
      }))}
      value={selectedUserIds.map(id => ({ value: id }))}
    />
  );
};
