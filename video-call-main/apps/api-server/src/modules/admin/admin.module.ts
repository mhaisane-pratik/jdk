import { Router } from "express";
import * as adminController from "./admin.controller";

const router = Router();

console.log("📝 Loading admin routes...");

router.get("/dashboard", adminController.getDashboardStats);
router.get("/groups", adminController.getGroupsDirectory);
router.post("/verify-password", adminController.verifyAdminPassword);
router.put("/config/:appId", adminController.updateAppConfig);
router.put("/users/:username/role", adminController.updateUserRole);
router.put("/users/:username/ban", adminController.banUser);
router.post("/users/:username/warn", adminController.warnUser);

export default router;
