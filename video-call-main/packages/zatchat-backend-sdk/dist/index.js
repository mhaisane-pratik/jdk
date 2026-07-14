// src/index.ts
import { Router } from "express";
import jwt from "jsonwebtoken";
function createZatChatSsoRouter(options) {
  const router = Router();
  const issuer = options.issuer || "zatchat-sso";
  router.post("/sso-token", (req, res) => {
    const masterKey = req.headers["x-sso-master-key"];
    if (!masterKey || masterKey !== options.ssoMasterKey) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { username, display_name, profile_picture, app_id } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }
    const ssoToken = jwt.sign(
      { username, display_name, profile_picture, app_id },
      options.ssoJwtSecret,
      { expiresIn: "10m", issuer }
    );
    return res.json({ success: true, ssoToken });
  });
  router.post("/sso-login", async (req, res) => {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: "Missing SSO token" });
    }
    try {
      let decoded;
      try {
        decoded = jwt.verify(token, options.ssoJwtSecret, { issuer });
      } catch {
        decoded = jwt.verify(token, options.ssoJwtSecret);
      }
      const { username, display_name, profile_picture, app_id } = decoded;
      if (!username) {
        return res.status(400).json({ error: "Username missing in token" });
      }
      const user = await options.upsertUser({
        username,
        display_name,
        profile_picture,
        app_id
      });
      const chatToken = await options.issueJwt({ username: user.username || username });
      return res.json({
        success: true,
        user,
        token: chatToken
      });
    } catch (err) {
      return res.status(401).json({
        error: "Invalid token",
        details: err.message
      });
    }
  });
  return router;
}
export {
  createZatChatSsoRouter
};
