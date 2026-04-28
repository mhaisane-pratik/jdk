"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    constructor() {
        this.login = async (req, res) => {
            const { username } = req.body;
            if (!username)
                return res.status(400).json({ error: "Username required" });
            const user = await this.service.loginOrRegister(username);
            res.json({
                id: user.id,
                username: user.username,
                company_id: user.companyId,
            });
        };
        this.service = new auth_service_1.AuthService();
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map