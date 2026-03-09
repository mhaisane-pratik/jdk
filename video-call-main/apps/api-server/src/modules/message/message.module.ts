// File: apps/api-server/src/modules/message/message.module.ts

import { Router } from "express";
import * as messageController from "./message.controller";

const router = Router();

console.log("📝 Loading message routes...");

// Test route
router.get("/test", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Message routes are working!",
    timestamp: new Date().toISOString()
  });
});

// Message routes
router.get("/:messageId", messageController.getMessageById);
router.delete("/:messageId", messageController.deleteMessage);
router.post("/forward", messageController.forwardMessages);

console.log("✅ Message routes configured:");
console.log("   GET    /api/v1/messages/test");
console.log("   GET    /api/v1/messages/:messageId");
console.log("   DELETE /api/v1/messages/:messageId");
console.log("   POST   /api/v1/messages/forward");

export default router;