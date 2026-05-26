import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface SsoRouteFactoryOptions {
  ssoJwtSecret: string;
  ssoMasterKey: string;
  issueJwt: (payload: { username: string }) => Promise<string> | string;
  upsertUser: (payload: {
    username: string;
    display_name?: string;
    profile_picture?: string;
    app_id?: string;
  }) => Promise<any>;
  issuer?: string;
}

export function createZatChatSsoRouter(options: SsoRouteFactoryOptions): Router {
  const router = Router();
  const issuer = options.issuer || "zatchat-sso";

  router.post("/sso-token", (req: Request, res: Response) => {
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

  router.post("/sso-login", async (req: Request, res: Response) => {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: "Missing SSO token" });
    }

    try {
      let decoded: any;
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
        app_id,
      });

      const chatToken = await options.issueJwt({ username: user.username || username });

      return res.json({
        success: true,
        user,
        token: chatToken,
      });
    } catch (err: any) {
      return res.status(401).json({
        error: "Invalid token",
        details: err.message,
      });
    }
  });

  return router;
}
