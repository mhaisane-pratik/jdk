"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
const controller = new auth_controller_1.AuthController();
if (!controller.login) {
    console.error("❌ CRITICAL: AuthController.login is undefined!");
}
router.post("/login", controller.login);
exports.default = router;
//# sourceMappingURL=auth.module.js.map