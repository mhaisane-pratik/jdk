// File: video-call-main/src/features/chat/ChatWindow.tsx

import React, { useEffect, useState, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import { getWallpaperById } from "./wallpapers"; // ✅ Import wallpaper helper
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import InputArea from "./InputArea";
import MediaViewer from "./MediaViewer";
import "./ChatWindow.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface Message {
  id: string;
  room_id?: string;
  sender_name: string;
  receiver_name: string;
  message?: string;
  message_type: "text" | "image" | "file";
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_delivered: boolean;
  is_seen: boolean;
  is_deleted?: boolean;
  deleted_for?: string;
  deleted_at?: string;
  reply_to_id?: string;
  reply_to?: Message | null;
  is_forwarded?: boolean;
  forwarded_from?: string;
  created_at: string;
}

// ✅ Updated wallpaper style getter
const getWallpaperStyle = (wallpaperId: string): React.CSSProperties => {
  const wallpaperConfig = getWallpaperById(wallpaperId);
  
  if (wallpaperConfig) {
    return {
      background: wallpaperConfig.css
    };
  }
  
  // Fallback to default
  return {
    background: "#efeae2"
  };
};

export default function ChatWindow() {
  const { currentUser, selectedRoom, chatRooms, wallpaper } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [receiver, setReceiver] = useState<string>("");
  const [showMedia, setShowMedia] = useState(false);

  const room = chatRooms.find((r) => r.id === selectedRoom);
  const hasJoinedRoom = useRef(false);
  const isLoadingRef = useRef(false);

  console.log("🔍 ChatWindow rendered:", {
    selectedRoom,
    currentUser: currentUser?.username,
    wallpaper,
    messagesCount: messages.length,
    showMedia,
  });

  // ... (rest of your existing code stays exactly the same)

  // Determine receiver
  useEffect(() => {
    if (!selectedRoom || !currentUser) return;

    let receiverName = "";

    if (room?.other_user) {
      receiverName = room.other_user;
    } else {
      const stored = localStorage.getItem(`room_${selectedRoom}_receiver`);
      if (stored) {
        receiverName = stored;
      } else {
        const participants = selectedRoom.split("__");
        receiverName = participants.find((p) => p !== currentUser.username) || "";
      }
    }

    if (receiverName) {
      setReceiver(receiverName);
      localStorage.setItem(`room_${selectedRoom}_receiver`, receiverName);
      console.log("✅ Receiver set:", receiverName);
    }
  }, [selectedRoom, currentUser, room]);

  // Load messages when room changes
  useEffect(() => {
    if (!selectedRoom || !currentUser) {
      console.log("⚠️ Cannot load - missing room or user");
      setMessages([]);
      setLoading(false);
      return;
    }

    console.log("📥 Loading messages for room:", selectedRoom);
    setMessages([]);
    setError(null);
    setReplyingTo(null);
    setShowMedia(false);
    loadMessages();

    if (!hasJoinedRoom.current && socket.connected) {
      socket.emit("join_room", selectedRoom);
      hasJoinedRoom.current = true;
      console.log("✅ Joined room via socket");
    }

    return () => {
      if (hasJoinedRoom.current) {
        socket.emit("leave_room", selectedRoom);
        hasJoinedRoom.current = false;
        console.log("👋 Left room");
      }
    };
  }, [selectedRoom, currentUser]);

  // Socket listeners
  useEffect(() => {
    if (!selectedRoom || !currentUser) return;

    console.log("🎧 Setting up socket listeners for:", selectedRoom);

    const handleReceiveMessage = (msg: Message) => {
      console.log("📨 RECEIVED MESSAGE:", msg.id);

      if (msg.room_id !== selectedRoom) {
        console.log("⚠️ Message for different room, ignoring");
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          console.log("⚠️ Duplicate message, skipping");
          return prev;
        }
        
        if (msg.reply_to_id && !msg.reply_to) {
          const replyToMsg = prev.find(m => m.id === msg.reply_to_id);
          if (replyToMsg) {
            msg.reply_to = replyToMsg;
            console.log("✅ Linked reply_to message");
          }
        }
        
        console.log("✅ Adding message to UI");
        return [...prev, msg];
      });

      if (msg.sender_name !== currentUser.username) {
        setTimeout(() => {
          socket.emit("message_seen", {
            roomId: selectedRoom,
            viewer: currentUser.username,
            messageIds: [msg.id],
          });
        }, 500);
      }
    };

    const handleMessageDelivered = ({ messageId }: { messageId: string }) => {
      console.log("✓ Message delivered:", messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_delivered: true } : m))
      );
    };

    const handleMessageSeen = ({ messageIds }: { messageIds: string[] }) => {
      console.log("✓✓ Messages seen:", messageIds.length);
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id)
            ? { ...m, is_seen: true, is_delivered: true }
            : m
        )
      );
    };

    const handleTyping = ({ sender }: { sender: string }) => {
      if (sender !== currentUser.username) {
        setTypingUser(sender);
      }
    };

    const handleStopTyping = () => {
      setTypingUser(null);
    };

    const handleMessageDeleted = ({ messageId, deletedFor }: any) => {
      console.log("🗑️ Message deleted:", messageId, "for:", deletedFor);
      
      if (deletedFor === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, is_deleted: true, deleted_for: "everyone" }
              : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_delivered", handleMessageDelivered);
    socket.on("message_seen", handleMessageSeen);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("message_deleted", handleMessageDeleted);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_delivered", handleMessageDelivered);
      socket.off("message_seen", handleMessageSeen);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [selectedRoom, currentUser]);

  const loadMessages = async () => {
    if (isLoadingRef.current || !selectedRoom || !currentUser) {
      console.log("⚠️ Cannot load messages");
      setLoading(false);
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const url = `${API_URL}/api/v1/chats/history/${selectedRoom}?username=${currentUser.username}`;
      console.log("📡 Fetching from:", url);

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data: Message[] = await res.json();
      console.log("📦 Received", data.length, "messages");

      const processedMessages = data.map(msg => {
        if (msg.reply_to_id) {
          const replyToMsg = data.find(m => m.id === msg.reply_to_id);
          if (replyToMsg) {
            msg.reply_to = replyToMsg;
          }
        }
        return msg;
      });

      const sortedMessages = processedMessages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMessages(sortedMessages);
      console.log("✅ Messages loaded into state");

      if (sortedMessages.length > 0) {
        markAsRead();
      }
    } catch (err: any) {
      console.error("❌ Failed to load messages:", err);
      setError("Failed to load messages. Please try again.");
      setMessages([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const markAsRead = async () => {
    if (!selectedRoom || !currentUser) return;

    try {
      await fetch(
        `${API_URL}/api/v1/chats/mark-read/${selectedRoom}/${currentUser.username}`,
        { method: "POST" }
      );
      console.log("✅ Messages marked as read");
    } catch (err) {
      console.error("❌ Mark as read failed:", err);
    }
  };

  const handleReply = (message: Message) => {
    console.log("↩️ Setting reply to:", message.id);
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    console.log("✖️ Canceling reply");
    setReplyingTo(null);
  };

  const handleDeleteRefresh = () => {
    console.log("🔄 Refreshing messages after delete");
    setTimeout(() => loadMessages(), 500);
  };

  const handleMediaClick = () => {
    console.log("📷 Opening media viewer");
    setShowMedia(true);
  };

  const handleMediaClose = () => {
    console.log("✖️ Closing media viewer");
    setShowMedia(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="chat-window" style={getWallpaperStyle(wallpaper)}>
        <div className="loading-chat">
          <div className="spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="chat-window" style={getWallpaperStyle(wallpaper)}>
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3>Error Loading Chat</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadMessages}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Invalid state
  if (!receiver || !currentUser) {
    return (
      <div className="chat-window" style={getWallpaperStyle(wallpaper)}>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Invalid Chat</h3>
          <p>Could not load chat session.</p>
        </div>
      </div>
    );
  }

  // Main chat window
  return (
    <div className="chat-window" style={getWallpaperStyle(wallpaper)}>
      <ChatHeader 
        receiver={receiver} 
        roomId={selectedRoom || ""} 
        onMediaClick={handleMediaClick}
      />

      <MessageList
        messages={messages}
        currentUser={currentUser.username}
        onReply={handleReply}
        onRefresh={handleDeleteRefresh}
      />

      {typingUser && (
        <div className="typing-indicator">
          <div className="typing-bubble">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <span className="typing-text">{typingUser} is typing...</span>
        </div>
      )}

      <InputArea
        roomId={selectedRoom || ""}
        sender={currentUser.username}
        receiver={receiver}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />

      {showMedia && (
        <MediaViewer 
          roomId={selectedRoom || ""} 
          onClose={handleMediaClose} 
        />
      )}
    </div>
  );
}