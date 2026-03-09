// src/config/cors.config.ts
import cors from "cors";
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://glittery-cranachan-2d7045.netlify.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
};

export const corsMiddleware = cors(corsOptions);