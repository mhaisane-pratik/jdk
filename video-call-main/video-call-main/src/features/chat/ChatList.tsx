import React from "react";
import { useChat } from "../../contexts/ChatContext";
import ChatItem from "./ChatItem";
import "./ChatList.css";

interface ChatListProps {
  rooms: any[];
  searchTerm?: string;
  activeFilter?: string;
}

export default function ChatList({ rooms }: ChatListProps) {
  const {
    currentUser,
    selectedRoom,
    setSelectedRoom,
    userProfiles,
  } = useChat();

  if (!currentUser) return null;

  if (!rooms || rooms.length === 0) {
    return (
      <div className="empty-chat-list">
        <p>No chats yet</p>
        <span>Start a new conversation</span>
      </div>
    );
  }

  return (
    <div className="chat-list">
      {rooms.map((room) => {
        const isGroup = room.is_group === true;

        // ✅ Always use backend field first
        const otherUsername = !isGroup
          ? room.other_user ||
            (room.participant_1 === currentUser.username
              ? room.participant_2
              : room.participant_1)
          : "";

        const profile = userProfiles.get(otherUsername);

        const displayName = isGroup
          ? room.group_name || "Group"
          : profile?.display_name || otherUsername || "Unknown";

        return (
          <ChatItem
            key={room.id}
            roomId={room.id}
            displayName={displayName}
            avatarUrl={profile?.profile_picture}
            lastMessage={room.last_message}
            lastMessageSender={room.last_message_sender}
            lastMessageTime={room.last_message_time}
            unreadCount={room.unread_count}
            isGroup={isGroup}
            isPinned={room.is_pinned}
            isMuted={room.is_muted}
            isSelected={selectedRoom === room.id}
            onClick={() => setSelectedRoom(room.id)}
          />
        );
      })}
    </div>
  );
}