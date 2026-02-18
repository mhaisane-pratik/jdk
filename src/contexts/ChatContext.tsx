import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { socket } from "../api/socket";

interface ChatUser {
  id?: string;
  username: string;
  display_name: string;
  profile_picture?: string;
  bio?: string;
  theme?: string;
  wallpaper?: string;
  notification_enabled?: boolean;
  sound_enabled?: boolean;
  is_online?: boolean;
  last_seen?: string;
}

interface ChatRoom {
  id: string;
  participant_1: string;
  participant_2: string;
  other_user: string;
  last_message: string;
  last_message_time: string;
  last_message_sender: string;
  unread_count: number;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_muted?: boolean;
  is_group?: boolean;
  group_name?: string;
  group_icon?: string;
  member_count?: number;
  created_by?: string;
}

interface ChatContextType {
  currentUser: ChatUser | null;
  setCurrentUser: (user: ChatUser | null) => void;
  chatRooms: ChatRoom[];
  setChatRooms: (rooms: ChatRoom[]) => void;
  selectedRoom: string | null;
  setSelectedRoom: (roomId: string | null) => void;
  theme: string;
  setTheme: (theme: string) => void;
  wallpaper: string;
  setWallpaper: (wallpaper: string) => void;
  refreshRooms: () => Promise<void>;
  onlineUsers: Set<string>;
  isSocketConnected: boolean;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [theme, setTheme] = useState("light");
  const [wallpaper, setWallpaper] = useState("solid-white");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [isLoading, setIsLoading] = useState(false);
  
  const hasInitialized = useRef(false);

  // Fast initialization - only restore from localStorage
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    console.log("⚡ Fast ChatContext initialization...");

    const savedUsername = localStorage.getItem("chatUser");
    const savedTheme = localStorage.getItem("chatTheme") || "light";
    const savedWallpaper = localStorage.getItem("chatWallpaper") || "solid-white";
    const savedRoomId = localStorage.getItem("selectedRoom");

    setTheme(savedTheme);
    setWallpaper(savedWallpaper);

    if (savedRoomId) {
      setSelectedRoom(savedRoomId);
    }

    if (savedUsername) {
      setCurrentUser({
        username: savedUsername,
        display_name: savedUsername,
        theme: savedTheme,
        wallpaper: savedWallpaper,
      });

      fetchUserProfile(savedUsername);
    }

    console.log("✅ Context initialized instantly");
  }, []);

  // Save preferences
  useEffect(() => {
    if (selectedRoom) {
      localStorage.setItem("selectedRoom", selectedRoom);
    }
  }, [selectedRoom]);

  useEffect(() => {
    localStorage.setItem("chatTheme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("chatWallpaper", wallpaper);
  }, [wallpaper]);

  // Socket connection
  useEffect(() => {
    const handleConnect = () => {
      setIsSocketConnected(true);
      if (currentUser) {
        socket.emit("user_join", { username: currentUser.username });
      }
      if (selectedRoom) {
        socket.emit("join_room", selectedRoom);
      }
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [currentUser, selectedRoom]);

  // Room listeners
  useEffect(() => {
    const handleRoomUpdated = ({ roomId, lastMessage, sender, timestamp }: any) => {
      setChatRooms((prev) =>
        prev
          .map((room) => {
            if (room.id === roomId) {
              return {
                ...room,
                last_message: lastMessage,
                last_message_sender: sender,
                last_message_time: timestamp,
                unread_count:
                  sender !== currentUser?.username && selectedRoom !== roomId
                    ? room.unread_count + 1
                    : room.unread_count,
              };
            }
            return room;
          })
          .sort(
            (a, b) =>
              new Date(b.last_message_time).getTime() -
              new Date(a.last_message_time).getTime()
          )
      );
    };

    const handleUserOnline = ({ username }: any) => {
      setOnlineUsers((prev) => new Set(prev).add(username));
    };

    const handleUserOffline = ({ username }: any) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    };

    const handleNewGroupCreated = ({ groupId }: any) => {
      console.log("🎉 New group created, refreshing rooms...");
      refreshRooms();
    };

    socket.on("room_updated", handleRoomUpdated);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("new_group_created", handleNewGroupCreated);

    return () => {
      socket.off("room_updated", handleRoomUpdated);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("new_group_created", handleNewGroupCreated);
    };
  }, [currentUser, selectedRoom]);

  const fetchUserProfile = async (username: string) => {
    try {
      let res = await fetch(`${API_URL}/api/v1/users/${username}`);
      let userData;

      if (res.ok) {
        userData = await res.json();
      } else {
        res = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            display_name: username,
          }),
        });

        if (res.ok) {
          userData = await res.json();
        }
      }

      if (userData) {
        setCurrentUser(userData);
        setTheme(userData.theme || "light");
        setWallpaper(userData.wallpaper || "solid-white");

        if (socket.connected) {
          socket.emit("user_join", { username: userData.username });
        }
      }
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
    }
  };

  // ✅ UPDATED: Force refresh rooms every time
  const refreshRooms = async () => {
    if (!currentUser) {
      console.log("⚠️ Cannot refresh rooms - no currentUser");
      return;
    }

    setIsLoading(true);
    console.log("🔄 Refreshing rooms for:", currentUser.username);

    try {
      const url = `${API_URL}/api/v1/chats/rooms/${currentUser.username}`;
      console.log("📡 Fetching from:", url);

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("✅ Rooms loaded:", data.length);
      console.log("📦 Rooms data:", data);

      setChatRooms(data);
    } catch (err) {
      console.error("❌ Error refreshing rooms:", err);
      setChatRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Auto-load rooms when user is set
  useEffect(() => {
    if (currentUser && currentUser.username) {
      console.log("👤 User detected, loading rooms...");
      refreshRooms();
    }
  }, [currentUser?.username]); // ✅ Trigger on username change

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        chatRooms,
        setChatRooms,
        selectedRoom,
        setSelectedRoom,
        theme,
        setTheme,
        wallpaper,
        setWallpaper,
        refreshRooms,
        onlineUsers,
        isSocketConnected,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};