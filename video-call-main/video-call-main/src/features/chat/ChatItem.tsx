import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";

interface ChatItemProps {
  roomId: string;
  displayName: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageSender?: string;
  lastMessageTime?: string;
  isGroup: boolean;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isSelected?: boolean;
  typingUsers?: string[];
  onClick: () => void;
}

export default function ChatItem({
  displayName,
  avatarUrl,
  lastMessage,
  lastMessageSender,
  lastMessageTime,
  isGroup,
  unreadCount = 0,
  isPinned = false,
  isMuted = false,
  isSelected,
  typingUsers,
  onClick,
}: ChatItemProps) {
  const { currentUser, onlineUsers } = useChat();
  const [showMenu, setShowMenu] = useState(false);

  const isOnline = !isGroup && onlineUsers.has(displayName);

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    
    let safeString = dateString;
    if (!safeString.includes('Z') && !safeString.includes('+')) {
      safeString = safeString.replace(' ', 'T') + 'Z';
    }

    const date = new Date(safeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const renderPreviewText = () => {
    if (typingUsers && typingUsers.length > 0) {
      return (
        <span className="text-green-500 dark:text-green-400 font-semibold italic animate-pulse">
          {isGroup && typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : 'typing...'}
        </span>
      );
    }
    
    if (!lastMessage) return "No messages yet";
    if (
      lastMessage.startsWith("http") &&
      (lastMessage.includes(".jpg") ||
        lastMessage.includes(".png") ||
        lastMessage.includes(".jpeg") ||
        lastMessage.includes(".webp"))
    ) {
      return "📷 Photo";
    }
    if (lastMessage.startsWith("http") && lastMessage.includes(".")) {
      return "📎 File";
    }
    if (lastMessageSender === currentUser?.username) {
      return (
        <>
          <strong>You:</strong> {lastMessage}
        </>
      );
    }
    if (isGroup && lastMessageSender) {
      return (
        <>
          <strong>{lastMessageSender}:</strong> {lastMessage}
        </>
      );
    }
    return lastMessage;
  };

  const hasUnread = unreadCount > 0;

  return (
    <div
      className={`group mx-1 flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-[5px] transition-colors ${
        isSelected
          ? "bg-[#1164A3] text-white"
          : hasUnread
          ? "text-white hover:bg-white/10"
          : "text-[#CFC3CF] hover:bg-white/10"
      } ${isMuted ? "opacity-60" : ""}`}
      onClick={onClick}
      title={displayName}
    >
      {/* Leading glyph: # for channels, presence-dot avatar for DMs */}
      {isGroup ? (
        <span
          className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center text-[17px] leading-none ${
            isSelected ? "text-white" : "text-[#CFC3CF] group-hover:text-white"
          }`}
        >
          #
        </span>
      ) : (
        <span className="relative flex-shrink-0">
          <img
            src={
              avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                displayName
              )}&background=random`
            }
            alt={displayName}
            className="h-[20px] w-[20px] rounded-[4px] object-cover"
          />
          <span
            className={`absolute -bottom-[3px] -right-[3px] h-[10px] w-[10px] rounded-full border-2 ${
              isSelected ? "border-[#1164A3]" : "border-[#3F0E40]"
            } ${isOnline ? "bg-[#2BAC76]" : "bg-transparent ring-1 ring-[#CFC3CF]"}`}
          />
        </span>
      )}

      {/* Name */}
      <span
        className={`flex-1 truncate text-[15px] ${
          hasUnread ? "font-bold text-white" : "font-normal"
        }`}
      >
        {displayName}
      </span>

      {/* Trailing: typing / pin / unread pill */}
      {typingUsers && typingUsers.length > 0 && (
        <span className="flex-shrink-0 text-[11px] italic text-[#2BAC76]">typing…</span>
      )}
      {isPinned && <span className="flex-shrink-0 text-[11px] opacity-70">📌</span>}
      {isMuted && <span className="flex-shrink-0 text-[11px] opacity-70">🔇</span>}
      {hasUnread && (
        <span className="flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#CD2553] px-1 text-[11px] font-bold text-white">
          {unreadCount}
        </span>
      )}
    </div>
  );
}