import { Avatar } from "antd";
import { useMemo } from "react";

interface ConversationAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: number;
}

const avatarColors = [
  "#5B8DEF",
  "#E17076",
  "#FAA05A",
  "#7BC862",
  "#6EC9CB",
  "#EE7AAE",
  "#E8A64A",
  "#65AADD",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string) {
  if (!name) return "";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Reusable component for displaying a conversation avatar
 * Fallbacks to initials with a hashed background color if no image is provided
 */
export const ConversationAvatar = ({ name, avatarUrl, size = 48 }: ConversationAvatarProps) => {
  const color = useMemo(() => getAvatarColor(name || ""), [name]);
  const initials = useMemo(() => getInitials(name || ""), [name]);

  return (
    <Avatar
      size={size}
      src={avatarUrl}
      style={{ 
        backgroundColor: color, 
        verticalAlign: 'middle',
        fontSize: size * 0.4,
        fontWeight: 600
      }}
    >
      {!avatarUrl && initials}
    </Avatar>
  );
};
