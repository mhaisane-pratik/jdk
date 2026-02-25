import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import "./ChatItem.css";

const API_URL = import.meta.env.VITE_API_URL as string;

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
  onClick: () => void;
}

export default function ChatItem({
  roomId,
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
  onClick,
}: ChatItemProps) {
  const { currentUser, onlineUsers, refreshRooms } = useChat();
  const [showMenu, setShowMenu] = useState(false);

  // 🔥 Online check (IMPORTANT)
  const isOnline = !isGroup && onlineUsers.has(displayName);

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const renderLastMessage = () => {
    if (!lastMessage) return "No messages yet";

    if (lastMessageSender === currentUser?.username) {
      return <>You: {lastMessage}</>;
    }

    if (isGroup && lastMessageSender) {
      return (
        <>
          {lastMessageSender}: {lastMessage}
        </>
      );
    }

    return lastMessage;
  };

  return (
    <div
      className={`chat-item ${isSelected ? "selected" : ""} ${
        isPinned ? "pinned" : ""
      } ${isMuted ? "muted" : ""}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="chat-avatar-wrapper">
        {isGroup ? (
          <div className="group-avatar">
            {displayName?.charAt(0)?.toUpperCase()}
          </div>
        ) : (
          <>
            <img
              src={
                avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  displayName
                )}&background=random`
              }
              alt={displayName}
              className="chat-avatar"
            />
            {isOnline && <span className="online-badge"></span>}
          </>
        )}
      </div>

      {/* Content */}
      <div className="chat-content">
        <div className="chat-item-header">
          <div className="chat-user-name">
            <h4>{displayName}</h4>
            {isPinned && <span className="pin-badge">📌</span>}
            {isMuted && <span className="mute-badge">🔇</span>}
          </div>
          <span className="chat-time">
            {formatTime(lastMessageTime)}
          </span>
        </div>

        <div className="chat-preview">
          <p className="last-message">{renderLastMessage()}</p>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}