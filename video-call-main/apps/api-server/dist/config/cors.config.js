"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
const corsOptions = {
    origin: [
        "http://localhost:5173",
        "https://glittery-cranachan-2d7045.netlify.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
};
exports.corsMiddleware = (0, cors_1.default)(corsOptions);
//# sourceMappingURL=cors.config.js.map