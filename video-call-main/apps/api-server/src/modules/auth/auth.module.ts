import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const controller = new AuthController();

// 🛑 DEBUG CHECK
if (!controller.login) {
  console.error("❌ CRITICAL: AuthController.login is undefined!");
}

// ✅ Route
router.post("/login", controller.login);

export default router;