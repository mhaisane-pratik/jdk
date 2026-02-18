import React from "react";
import { useChat } from "../../contexts/ChatContext";
import ChatItem from "./ChatItem";
import "./ChatList.css";

interface ChatListProps {
  rooms: any[];
}

export default function ChatList({ rooms }: ChatListProps) {
  const { selectedRoom, setSelectedRoom } = useChat();

  if (rooms.length === 0) {
    return (
      <div className="empty-chat-list">
        
        <p>No chats yet</p>
        <span>Start a new conversation or create a group</span>
      </div>
    );
  }

  // Separate pinned and unpinned
  const pinnedRooms = rooms.filter((r) => r.is_pinned);
  const unpinnedRooms = rooms.filter((r) => !r.is_pinned);

  return (
    <div className="chat-list">
      {/* Pinned chats */}
      {pinnedRooms.length > 0 && (
        <>
          {pinnedRooms.map((room) => (
            <ChatItem
              key={room.id}
              room={room}
              isSelected={selectedRoom === room.id}
              onClick={() => setSelectedRoom(room.id)}
            />
          ))}
          {unpinnedRooms.length > 0 && <div className="chat-divider" />}
        </>
      )}

      {/* Regular chats */}
      {unpinnedRooms.map((room) => (
        <ChatItem
          key={room.id}
          room={room}
          isSelected={selectedRoom === room.id}
          onClick={() => setSelectedRoom(room.id)}
        />
      ))}
    </div>
  );
}