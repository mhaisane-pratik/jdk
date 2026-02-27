import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import "./ChatItem.css";

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
  const { currentUser, onlineUsers } = useChat();
  const [showMenu, setShowMenu] = useState(false);

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
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  const renderPreviewText = () => {
    if (!lastMessage) return "No messages yet";

    // Image detection
    if (lastMessage.startsWith("http") && 
        (lastMessage.includes(".jpg") ||
         lastMessage.includes(".png") ||
         lastMessage.includes(".jpeg") ||
         lastMessage.includes(".webp"))) {
      return "📷 Photo";
    }

    // File detection
    if (lastMessage.startsWith("http") && lastMessage.includes(".")) {
      return "📎 File";
    }

    // If current user sent
    if (lastMessageSender === currentUser?.username) {
      return <> <strong>You:</strong> {lastMessage} </>;
    }

    // Group preview
    if (isGroup && lastMessageSender) {
      return (
        <>
          <strong>{lastMessageSender}:</strong> {lastMessage}
        </>
      );
    }

    return lastMessage;
  };

  return (
    <div
      className={`chat-item ${isSelected ? "selected" : ""} 
      ${isPinned ? "pinned" : ""} 
      ${isMuted ? "muted" : ""}`}
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
            <h4 className={unreadCount > 0 ? "bold-name" : ""}>
  {displayName}
</h4>
            {isPinned && <span className="pin-badge">📌</span>}
            {isMuted && <span className="mute-badge">🔇</span>}
          </div>

          <span className="chat-time">
            {formatTime(lastMessageTime)}
          </span>
        </div>

        <div className="chat-preview">
        
         <p className={`last-message ${unreadCount > 0 ? "bold" : ""}`}>
  {renderPreviewText()}
</p>
          {unreadCount > 0 && (
            <span className="unread-badge">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}