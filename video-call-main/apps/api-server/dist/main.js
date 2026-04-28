"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const socket_1 = require("./socket");
const data_source_1 = require("./config/data-source");
const db_1 = require("./db");
const proxy_route_1 = __importDefault(require("./modules/chat/proxy.route"));
const auth_sso_1 = __importDefault(require("./modules/auth/auth.sso"));
const api_key_module_1 = __importDefault(require("./modules/api-key/api-key.module"));
const api_key_middleware_1 = require("./middleware/api-key.middleware");
const api_key_service_1 = require("./modules/api-key/api-key.service");
const message_receipts_service_1 = require("./modules/message/message-receipts.service");
let userRoutes;
let chatRoutes;
let messageRoutes;
let adminRoutes;
try {
    userRoutes = require("./modules/user/user.module").default;
    chatRoutes = require("./modules/chat/chat.module").default;
    messageRoutes = require("./modules/message/message.module").default;
    adminRoutes = require("./modules/admin/admin.module").default;
    console.log("✅ Chat modules imported successfully");
}
catch (err) {
    console.error("❌ Failed to import chat modules:", err.message);
    console.error("   Creating modules...");
}
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
app.use("/api/v1", proxy_route_1.default);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "uploads")));
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
(0, socket_1.initSocket)(io);
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
    try {
        const result = await db_1.pool.query("SELECT NOW()");
        res.json({
            status: "connected",
            dbTime: result.rows[0],
            database: "PostgreSQL/Supabase",
        });
    }
    catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({
            status: "error",
            error: "Database not connected",
        });
    }
});
if (userRoutes) {
    app.use("/api/v1/users", api_key_middleware_1.apiKeyAuthMiddleware, userRoutes);
    console.log("✅ User routes registered at /api/v1/users");
}
else {
    console.warn("⚠️  User routes not available");
}
if (chatRoutes) {
    app.use("/api/v1/chats", api_key_middleware_1.apiKeyAuthMiddleware, chatRoutes);
    console.log("✅ Chat routes registered at /api/v1/chats");
}
else {
    console.warn("⚠️  Chat routes not available");
}
if (messageRoutes) {
    app.use("/api/v1/messages", api_key_middleware_1.apiKeyAuthMiddleware, messageRoutes);
    console.log("✅ Message routes registered at /api/v1/messages");
}
else {
    console.warn("⚠️  Message routes not available");
}
if (adminRoutes) {
    app.use("/api/v1/admin", api_key_middleware_1.apiKeyAuthMiddleware, adminRoutes);
    console.log("✅ Admin routes registered at /api/v1/admin");
}
else {
    console.warn("⚠️  Admin routes not available");
}
console.log("✅ Calendar routes registered at /api/v1/calendar");
app.use("/api/v1/auth", auth_sso_1.default);
app.use("/api/v1/integrations/api-keys", api_key_module_1.default);
app.use((req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `Cannot ${req.method} ${req.path}`,
        availableRoutes: [
            "GET /",
            "GET /health",
            "GET /db-test",
            "POST /api/v1/users",
            "GET /api/v1/users/:username",
            "GET /api/v1/chats/rooms/:username",
            "GET /api/v1/chats/history/:roomId",
            "GET /api/v1/calendar",
        ],
    });
});
app.use((err, req, res, next) => {
    console.error("❌ Server error:", err);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "Something went wrong",
    });
});
const PORT = process.env.PORT || 4000;
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
    console.log(`🔑 API Key Onboard: http://localhost:${PORT}/api/v1/integrations/api-keys/onboard`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Promise.all([data_source_1.AppDataSource.initialize(), (0, api_key_service_1.ensureApiKeyTable)(), (0, message_receipts_service_1.ensureMessageReceiptsTable)()])
        .then(() => {
        console.log("✅ TypeORM connected");
        console.log("📦 Entities:", data_source_1.AppDataSource.entityMetadatas.map((e) => e.name));
        console.log("🔐 API key table ready");
        console.log("👀 Message receipts table ready");
    })
        .catch((err) => {
        console.error("⚠️  Database initialization warning (non-critical):", err.message);
        console.log("📝 Chat features will still work with Supabase client");
    });
});
process.on("SIGTERM", () => {
    console.log("⚠️  SIGTERM signal received: closing HTTP server");
    server.close(() => {
        console.log("✅ HTTP server closed");
        data_source_1.AppDataSource.destroy()
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
        data_source_1.AppDataSource.destroy()
            .then(() => {
            console.log("✅ Database connection closed");
            process.exit(0);
        })
            .catch(() => process.exit(0));
    });
});
//# sourceMappingURL=main.js.map