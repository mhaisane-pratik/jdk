// File: video-call-main/src/api/socket.ts

import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ["websocket", "polling"],
});

// Connection event listeners
socket.on("connect", () => {
  console.log("✅ Socket Connected:", socket.id);
  
  // Rejoin room if there's a stored room
  const savedRoom = localStorage.getItem("selectedRoom");
  const savedUser = localStorage.getItem("chatUser");
  
  if (savedRoom && savedUser) {
    console.log("🔄 Auto-rejoining room:", savedRoom);
    socket.emit("join_room", savedRoom);
    socket.emit("user_join", { username: savedUser });
  }
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection Error:", error.message);
});

socket.on("reconnect", (attemptNumber) => {
  console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
  
  // Rejoin room after reconnection
  const savedRoom = localStorage.getItem("selectedRoom");
  const savedUser = localStorage.getItem("chatUser");
  
  if (savedRoom && savedUser) {
    console.log("🔄 Rejoining room after reconnect:", savedRoom);
    socket.emit("join_room", savedRoom);
    socket.emit("user_join", { username: savedUser });
  }
});

// Make socket available globally for debugging
if (typeof window !== "undefined") {
  (window as any).socket = socket;
}

export default socket;