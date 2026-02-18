import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import "./ChatItem.css";

interface ChatItemProps {
  room: any;
  isSelected: boolean;
  onClick: () => void;
}

export default function ChatItem({ room, isSelected, onClick }: ChatItemProps) {
  const { currentUser, onlineUsers, refreshRooms } = useChat();
  const [showMenu, setShowMenu] = useState(false);

  // Determine if this is a group
  const isGroup = room.is_group || room.type === "group";
  
  // Get chat name
  const chatName = isGroup 
    ? (room.group_name || room.name || "Group") 
    : (room.other_user || room.participant_1 === currentUser?.username ? room.participant_2 : room.participant_1);
  
  // Avatar URL for private chats
  const avatarUrl = isGroup
    ? null
    : `https://ui-avatars.com/api/?name=${chatName}&background=random`;
  
  // Check online status (only for private chats)
  const isOnline = !isGroup && onlineUsers.has(chatName);

  // Format timestamp
  const formatTime = (dateString: string) => {
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

  const handlePin = async () => {
    try {
      await fetch(
        `http://localhost:4000/api/v1/chats/pin/${room.id}/${currentUser?.username}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinned: !room.is_pinned }),
        }
      );
      refreshRooms();
      setShowMenu(false);
    } catch (err) {
      console.error("Failed to pin chat", err);
    }
  };

  const handleMute = async () => {
    try {
      await fetch(
        `http://localhost:4000/api/v1/chats/mute/${room.id}/${currentUser?.username}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ muted: !room.is_muted }),
        }
      );
      refreshRooms();
      setShowMenu(false);
    } catch (err) {
      console.error("Failed to mute chat", err);
    }
  };

  // Render last message with sender name for groups
  const renderLastMessage = () => {
    if (!room.last_message) return "No messages yet";

    let prefix = "";
    if (room.last_message_sender === currentUser?.username) {
      prefix = "You: ";
    } else if (isGroup && room.last_message_sender) {
      // Show sender name in group chats
      return (
        <>
          <span className="sender-name">{room.last_message_sender}: </span>
          {room.last_message}
        </>
      );
    }

    return (
      <>
        {prefix && <span className="you-label">{prefix}</span>}
        {room.last_message}
      </>
    );
  };

  // Get group icon
  const getGroupIcon = () => {
    if (room.group_icon) return room.group_icon;
    if (room.group_name) return room.group_name.charAt(0).toUpperCase();
    return "👥";
  };

  return (
    <div
      className={`chat-item ${isSelected ? "selected" : ""} ${
        room.is_pinned ? "pinned" : ""
      } ${room.is_muted ? "muted" : ""}`}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
    >
      {/* Avatar: group or private */}
      <div className="chat-avatar-wrapper">
        {isGroup ? (
          <div className="group-avatar">
            {getGroupIcon()}
          </div>
        ) : (
          <>
            <img
              src={avatarUrl}
              alt={chatName}
              className="chat-avatar"
            />
            {isOnline && <span className="online-badge"></span>}
          </>
        )}
      </div>

      <div className="chat-content">
        <div className="chat-header">
          <div className="chat-user-name">
            <h4>{chatName}</h4>
            {room.is_pinned && <span className="pin-badge">📌</span>}
            {room.is_muted && <span className="mute-badge">🔇</span>}
          </div>
          <span className="chat-time">
            {formatTime(room.last_message_time)}
          </span>
        </div>

        <div className="chat-preview">
          <p className="last-message">
            {renderLastMessage()}
          </p>
          {room.unread_count > 0 && (
            <span className="unread-badge">{room.unread_count}</span>
          )}
        </div>

        {/* Group metadata: member count */}
        {isGroup && (room.member_count || room.participant_count) && (
          <div className="group-meta">
            👥 {room.member_count || room.participant_count} members
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showMenu && (
        <>
          <div
            className="menu-overlay"
            onClick={() => setShowMenu(false)}
          />
          <div className="chat-context-menu">
            <button onClick={handlePin}>
              {room.is_pinned ? "📌 Unpin chat" : "📌 Pin chat"}
            </button>
            <button onClick={handleMute}>
              {room.is_muted ? "🔔 Unmute notifications" : "🔇 Mute notifications"}
            </button>
            <button onClick={() => setShowMenu(false)}>❌ Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}