// File: video-call-main/src/test-chat.ts

import { socket } from "./api/socket";

console.log("🧪 Testing Chat System");

// Test 1: Socket Connection
socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
  
  // Test 2: Join room
  const testRoom = "alice__bob";
  socket.emit("join_room", testRoom);
  console.log("✅ Joined room:", testRoom);    
  
  // Test 3: Send test message
  setTimeout(() => {
    const testMessage = {
      roomId: testRoom,
      sender: "alice",
      receiver: "bob",
      message: "Test message from debug script",
    };
    
    socket.emit("send_message", testMessage);
    console.log("✅ Sent test message");
  }, 1000);
  
  // Test 4: Listen for messages
  socket.on("receive_message", (msg) => {
    console.log("✅ Received message:", msg);
  });
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error);
});


