// File: apps/api-server/src/main.ts

import "reflect-metadata";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Load environment variables FIRST
dotenv.config();

import { initSocket } from "./socket";
import { AppDataSource } from "./config/data-source";
import { directDbReason, isDirectDbEnabled, pool } from "./db";

import proxyRoutes from "./modules/chat/proxy.route";
import ssoAuthRoutes from "./modules/auth/auth.sso";
import apiKeyRoutes from "./modules/api-key/api-key.module";
import {
  apiKeyAuthMiddleware,
} from "./middleware/api-key.middleware";
import { ensureApiKeyTable } from "./modules/api-key/api-key.service";
import { ensureMessageReceiptsTable } from "./modules/message/message-receipts.service";
// Import calendar route

// Import chat routes (with error handling)
let userRoutes: any;
let chatRoutes: any;
let messageRoutes: any;
let adminRoutes: any;

try {
  userRoutes = require("./modules/user/user.module").default;
  chatRoutes = require("./modules/chat/chat.module").default;
  messageRoutes = require("./modules/message/message.module").default;
  adminRoutes = require("./modules/admin/admin.module").default;
  console.log("✅ Chat modules imported successfully");
} catch (err: any) {
  console.error("❌ Failed to import chat modules:", err.message);
  console.error("   Creating modules...");
}

const app = express();
const server = http.createServer(app);

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);



app.use("/api/v1", proxyRoutes);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


initSocket(io);

/* ================= BASIC ROUTES ================= */
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "🚀 ZatChat Backend is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      dbTest: "/db-test",
      apiKeys: "/api/v1/integrations/api-keys",
      onboarding: "/api/v1/integrations/api-keys/onboard",
      calendar: "/api/v1/calendar",
      users: "/api/v1/users",
      chats: "/api/v1/chats",
      messages: "/api/v1/messages",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/db-test", async (_req, res) => {
  if (!isDirectDbEnabled) {
    return res.status(503).json({
      status: "skipped",
      error: "Direct database connection disabled",
      reason: directDbReason,
    });
  }

  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "connected",
      dbTime: result.rows[0],
      database: "PostgreSQL/Supabase",
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({
      status: "error",
      error: "Database not connected",
    });
  }
});

/* ================= CHAT API ROUTES ================= */
// Register chat routes BEFORE other routes
if (userRoutes) {
  app.use("/api/v1/users", apiKeyAuthMiddleware, userRoutes);
  console.log("✅ User routes registered at /api/v1/users");
} else {
  console.warn("⚠️  User routes not available");
}

if (chatRoutes) {
  app.use("/api/v1/chats", apiKeyAuthMiddleware, chatRoutes);
  console.log("✅ Chat routes registered at /api/v1/chats");
} else {
  console.warn("⚠️  Chat routes not available");
}

if (messageRoutes) {
  app.use("/api/v1/messages", apiKeyAuthMiddleware, messageRoutes);
  console.log(`✅ Message routes registered at /api/v1/messages`);
} else {
  console.warn(`⚠️  Message routes not available`);
}

if (adminRoutes) {
  app.use("/api/v1/admin", apiKeyAuthMiddleware, adminRoutes);
  console.log(`✅ Admin routes registered at /api/v1/admin`);
} else {
  console.warn(`⚠️  Admin routes not available`);
}

// Calendar routes
console.log(`✅ Calendar routes registered at /api/v1/calendar`);
app.use("/api/v1/auth", ssoAuthRoutes);
console.log("✅ SSO routes mounted at /api/v1/auth");
app.use("/api/v1/integrations/api-keys", apiKeyRoutes);

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: [
      "GET /",
      "GET /health",
      "GET /db-test",
      "POST /api/v1/auth/sso-token",
      "POST /api/v1/auth/sso-login",
      "POST /api/v1/users",
      "GET /api/v1/users/:username",
      "GET /api/v1/chats/rooms/:username",
      "GET /api/v1/chats/history/:roomId",
      "GET /api/v1/calendar",
    ],
  });
});

/* ================= ERROR HANDLER ================= */
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Server error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Something went wrong",
    });
  }
);



/* ================= START SERVER ================= */
const PORT = process.env.PORT || 4000;

// Start server WITHOUT TypeORM first (for testing)
server.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 ZatChat Backend Server Started");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 HTTP Server    : http://localhost:${PORT}`);
  console.log(`🔌 Socket.io      : ws://localhost:${PORT}`);
  console.log(`📁 File Uploads   : http://localhost:${PORT}/uploads`);
  console.log(`🌍 Environment    : ${process.env.NODE_ENV || "development"}`);
  console.log(`📅 Calendar API   : http://localhost:${PORT}/api/v1/calendar`);
  console.log(`👤 Users API      : http://localhost:${PORT}/api/v1/users`);
  console.log(`💬 Chats API      : http://localhost:${PORT}/api/v1/chats`);
  console.log(`📨 Messages API   : http://localhost:${PORT}/api/v1/messages`);
  console.log(
    `🔑 API Key Onboard: http://localhost:${PORT}/api/v1/integrations/api-keys/onboard`
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (!isDirectDbEnabled) {
    console.warn(
      `⚠️  Skipping direct Postgres initialization${directDbReason ? `: ${directDbReason}` : ""}`
    );
    console.log("📝 Chat features will continue using the Supabase client");
    return;
  }

  // Initialize optional direct Postgres features after server starts
  (async () => {
    try {
      await AppDataSource.initialize();
      console.log("✅ TypeORM connected");
      console.log(
        "📦 Entities:",
        AppDataSource.entityMetadatas.map((e) => e.name)
      );
    } catch (err: any) {
      console.error("⚠️  TypeORM initialization warning (non-critical):", err.message);
      console.log("📝 Chat features will still work with Supabase client");
    }

    try {
      await ensureApiKeyTable();
      console.log("🔐 API key table ready");
    } catch (err: any) {
      console.error("⚠️  API key table warning (non-critical):", err.message);
    }

    await ensureMessageReceiptsTable();
  })();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    const destroyPromise = AppDataSource.isInitialized
      ? AppDataSource.destroy()
      : Promise.resolve();

    destroyPromise
      .then(() => {
        console.log("✅ Database connection closed");
        process.exit(0);
      })
      .catch(() => process.exit(0));
  });
});

process.on("SIGINT", () => {
  console.log("⚠️  SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    const destroyPromise = AppDataSource.isInitialized
      ? AppDataSource.destroy()
      : Promise.resolve();

    destroyPromise
      .then(() => {
        console.log("✅ Database connection closed");
        process.exit(0);
      })
      .catch(() => process.exit(0));
  });
});
