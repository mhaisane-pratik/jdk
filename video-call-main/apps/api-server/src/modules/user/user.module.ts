import { Router } from "express";
import * as userController from "./user.controller";

const router = Router();

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📝 Loading user routes...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// Test route
router.get("/test", (req, res) => {
  res.json({
    status: "ok",
    message: "User routes are working!",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "GET /api/v1/users",
      "GET /api/v1/users/test",
      "GET /api/v1/users/:username",
      "POST /api/v1/users",
      "PUT /api/v1/users/:username/settings",
      "PUT /api/v1/users/:username/status",
      "POST /api/v1/users/:username/profile-picture",
    ],
  });
});

// ✅ IMPORTANT: Place this BEFORE /:username to avoid conflicts
router.get("/", userController.getAllUsers);

// User routes
router.post("/", userController.upsertUser);
router.get("/:username", userController.getUserProfile);
router.put("/:username/settings", userController.updateSettings);
router.put("/:username/status", userController.updateOnlineStatus);
router.post("/:username/profile-picture", userController.uploadProfilePicture);

console.log("✅ User routes configured:");
console.log("   GET  /api/v1/users (all users)");
console.log("   GET  /api/v1/users/test");
console.log("   GET  /api/v1/users/:username");
console.log("   POST /api/v1/users");
console.log("   PUT  /api/v1/users/:username/settings");
console.log("   PUT  /api/v1/users/:username/status");
console.log("   POST /api/v1/users/:username/profile-picture");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

export default router;