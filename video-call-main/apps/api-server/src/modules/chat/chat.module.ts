import { Router } from "express";
import * as chatController from "./chat.controller";

const router = Router();

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📝 Loading chat routes...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// Test route
router.get("/test", (req, res) => {
  res.json({
    status: "ok",
    message: "Chat routes are working!",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "GET /api/v1/chats/test",
      "GET /api/v1/chats/history/:roomId",
      "GET /api/v1/chats/rooms/:username",
      "POST /api/v1/chats/mark-read/:roomId/:username",
      "POST /api/v1/chats/upload",
      "POST /api/v1/chats/create-room",
      "PUT /api/v1/chats/update-group", // ✅ NEW
    ],
  });
});

// Chat history - GET messages for a room
router.get("/history/:roomId", chatController.getChatHistory);

// Get all rooms for a user
router.get("/rooms/:username", chatController.getChatRooms);

// Mark messages as read
router.post("/mark-read/:roomId/:username", chatController.markAsRead);

// Upload file
router.post("/upload", chatController.uploadFile);

// Create room
router.post("/create-room", chatController.createRoom);

// ✅ NEW: Update group
router.put("/update-group", chatController.updateGroup);

console.log("✅ Chat routes configured:");
console.log("   GET  /api/v1/chats/history/:roomId");
console.log("   GET  /api/v1/chats/rooms/:username");
console.log("   POST /api/v1/chats/mark-read/:roomId/:username");
console.log("   POST /api/v1/chats/upload");
console.log("   POST /api/v1/chats/create-room");
console.log("   PUT  /api/v1/chats/update-group"); // ✅ NEW
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

export default router;
