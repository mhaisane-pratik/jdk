import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../../config/supabase";

const router = express.Router();

router.post("/sso-login", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing SSO token" });
  }

  try {
    const decoded: any = jwt.verify(
      token,
      process.env.SSO_JWT_SECRET!
    );

    // Grab the data we actually need from the token
    const { username, display_name } = decoded;

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
