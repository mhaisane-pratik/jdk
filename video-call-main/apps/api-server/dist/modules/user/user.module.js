"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController = __importStar(require("./user.controller"));
const router = (0, express_1.Router)();
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📝 Loading user routes...");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
router.get("/", userController.getAllUsers);
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
exports.default = router;
//# sourceMappingURL=user.module.js.map