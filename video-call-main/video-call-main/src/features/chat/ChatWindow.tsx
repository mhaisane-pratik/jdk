import React, { useEffect, useState, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import { getWallpaperById } from "./wallpapers";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import InputArea from "./InputArea";
import MediaViewer from "./MediaViewer";

const API_URL = import.meta.env.VITE_API_URL as string;
const API_KEY = "ZATCHAT_PRATEEK9373";

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

const getWallpaperStyle = (wallpaperId: string): React.CSSProperties => {
  const wallpaperConfig = getWallpaperById(wallpaperId);
  if (wallpaperConfig) {
    return { background: wallpaperConfig.css };
  }
  return { background: "#efeae2" };
};

export default function ChatWindow({ onBack }: { onBack?: () => void }) {
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
    }
  }, [selectedRoom, currentUser, room]);

  useEffect(() => {
    if (!selectedRoom || !currentUser) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setMessages([]);
    setError(null);
    setReplyingTo(null);
    setShowMedia(false);
    loadMessages();
    if (!hasJoinedRoom.current && socket.connected) {
      socket.emit("join_room", selectedRoom);
      hasJoinedRoom.current = true;
    }
    return () => {
      if (hasJoinedRoom.current) {
        socket.emit("leave_room", selectedRoom);
        hasJoinedRoom.current = false;
      }
    };
  }, [selectedRoom, currentUser]);

  useEffect(() => {
    if (!selectedRoom || !currentUser) return;
    const handleReceiveMessage = (msg: Message) => {
      if (msg.room_id !== selectedRoom) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        if (msg.reply_to_id && !msg.reply_to) {
          const replyToMsg = prev.find((m) => m.id === msg.reply_to_id);
          if (replyToMsg) msg.reply_to = replyToMsg;
        }
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
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_delivered: true } : m))
      );
    };
    const handleMessageSeen = ({ messageIds }: { messageIds: string[] }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id) ? { ...m, is_seen: true, is_delivered: true } : m
        )
      );
    };
    const handleTyping = ({ sender }: { sender: string }) => {
      if (sender !== currentUser.username) setTypingUser(sender);
    };
    const handleStopTyping = () => setTypingUser(null);
    const handleMessageDeleted = ({ messageId, deletedFor }: any) => {
      if (deletedFor === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, is_deleted: true, deleted_for: "everyone" } : m
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
      setLoading(false);
      return;
    }
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/api/v1/chats/history/${selectedRoom}?username=${currentUser.username}`;
      const res = await fetch(url, { headers: { "x-api-key": API_KEY } });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data: Message[] = await res.json();
      const processedMessages = data.map((msg) => {
        if (msg.reply_to_id) {
          const replyToMsg = data.find((m) => m.id === msg.reply_to_id);
          if (replyToMsg) msg.reply_to = replyToMsg;
        }
        return msg;
      });
      const sortedMessages = processedMessages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMessages);
      if (sortedMessages.length > 0) markAsRead();
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
      await fetch(`${API_URL}/api/v1/chats/mark-read/${selectedRoom}/${currentUser.username}`, {
        method: "POST",
        headers: { "x-api-key": API_KEY },
      });
    } catch (err) {
      console.error("❌ Mark as read failed:", err);
    }
  };

  const handleReply = (message: Message) => setReplyingTo(message);
  const handleCancelReply = () => setReplyingTo(null);
  const handleDeleteRefresh = () => setTimeout(() => loadMessages(), 500);
  const handleMediaClick = () => setShowMedia(true);
  const handleMediaClose = () => setShowMedia(false);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-cover" style={getWallpaperStyle(wallpaper)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600 dark:text-gray-300 text-base">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-cover" style={getWallpaperStyle(wallpaper)}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">❌</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Error Loading Chat</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-base">{error}</p>
          <button
            onClick={loadMessages}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-base font-semibold hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!receiver || !currentUser) {
    return (
      <div className="flex flex-col h-screen bg-cover" style={getWallpaperStyle(wallpaper)}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Invalid Chat</h3>
          <p className="text-gray-600 dark:text-gray-300 text-base">Could not load chat session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-cover relative overflow-hidden" style={getWallpaperStyle(wallpaper)}>
      <ChatHeader
        receiver={receiver}
        roomId={selectedRoom || ""}
        onMediaClick={handleMediaClick}
        onBack={onBack}
      />

      <MessageList
        messages={messages}
        currentUser={currentUser.username}
        onReply={handleReply}
        onRefresh={handleDeleteRefresh}
      />

      {typingUser && (
        <div className="px-4 py-2 flex gap-2.5 absolute bottom-[72px] left-0 right-0 pointer-events-none">
          <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl shadow-md">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-full">
            {typingUser} is typing...
          </span>
        </div>
      )}

      <InputArea
        roomId={selectedRoom || ""}
        sender={currentUser.username}
        receiver={receiver}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />

      {showMedia && <MediaViewer roomId={selectedRoom || ""} onClose={handleMediaClose} />}
    </div>
  );
}