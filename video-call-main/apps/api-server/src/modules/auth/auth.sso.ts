import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../../config/supabase";

const router = express.Router();

type SsoUserPayload = {
  username: string;
  display_name?: string;
  profile_picture?: string;
  app_id?: string;
};

function signSsoToken(payload: SsoUserPayload) {
  return jwt.sign(payload, process.env.SSO_JWT_SECRET!, {
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
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.SSO_JWT_SECRET!, {
        issuer: "zatchat-sso",
      });
    } catch {
      // Backward compatibility for legacy tokens without issuer claim.
      decoded = jwt.verify(token, process.env.SSO_JWT_SECRET!);
    }

    // Grab the data we actually need from the token
    const { username, display_name, profile_picture } = decoded;

    if (!username) {
      return res.status(400).json({ error: "Username missing in token" });
    }

    // ✅ UPSERT USER IN SUPABASE 
    // 🔥 FIXED: Removed email and profile_picture because your table doesn't have those columns!
    const { data: user, error } = await supabase
      .from("chat_users")
      .upsert(
        {
          username,
          display_name: display_name || username,
          profile_picture: profile_picture || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "username" }
      )
      .select()
      .single();

    if (error) throw error;

    // ✅ CREATE CHAT TOKEN
    const chatToken = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      user,
      token: chatToken, // 🔥 IMPORTANT
    });
  } catch (err: any) {
    res.status(401).json({
      error: "Invalid token",
      details: err.message,
    });
  }
});

export default router;
