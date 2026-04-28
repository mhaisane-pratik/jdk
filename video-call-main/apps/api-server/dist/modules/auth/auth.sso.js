"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../../config/supabase");
const router = express_1.default.Router();
function signSsoToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.SSO_JWT_SECRET, {
        expiresIn: "10m",
        issuer: "zatchat-sso",
    });
}
router.post("/sso-token", async (req, res) => {
    const masterKey = req.headers["x-sso-master-key"];
    if (!process.env.SSO_MASTER_KEY) {
        return res.status(500).json({ error: "SSO_MASTER_KEY is not configured" });
    }
    if (!masterKey || masterKey !== process.env.SSO_MASTER_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const { username, display_name, profile_picture, app_id } = req.body || {};
    if (!username) {
        return res.status(400).json({ error: "username is required" });
    }
    const ssoToken = signSsoToken({
        username,
        display_name,
        profile_picture,
        app_id,
    });
    return res.json({ success: true, ssoToken });
});
router.post("/sso-login", async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: "Missing SSO token" });
    }
    try {
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.SSO_JWT_SECRET, {
                issuer: "zatchat-sso",
            });
        }
        catch {
            decoded = jsonwebtoken_1.default.verify(token, process.env.SSO_JWT_SECRET);
        }
        const { username, display_name, profile_picture } = decoded;
        if (!username) {
            return res.status(400).json({ error: "Username missing in token" });
        }
        const { data: user, error } = await supabase_1.supabase
            .from("chat_users")
            .upsert({
            username,
            display_name: display_name || username,
            profile_picture: profile_picture || null,
            updated_at: new Date().toISOString(),
        }, { onConflict: "username" })
            .select()
            .single();
        if (error)
            throw error;
        const chatToken = jsonwebtoken_1.default.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({
            success: true,
            user,
            token: chatToken,
        });
    }
    catch (err) {
        res.status(401).json({
            error: "Invalid token",
            details: err.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.sso.js.map