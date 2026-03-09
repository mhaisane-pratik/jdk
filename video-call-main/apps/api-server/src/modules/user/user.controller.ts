import { Request, Response } from "express";
import { supabase } from "../../config/supabase";

/* ================= GET ALL USERS ================= */
export async function getAllUsers(req: Request, res: Response) {
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👥 GET ALL USERS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const { data, error } = await supabase
      .from("chat_users")
      .select("username, display_name, profile_picture, bio, is_online, last_seen")
      .order("username", { ascending: true });

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} users`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    res.json(data || []);
  } catch (error: any) {
    console.error("❌ getAllUsers error:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= UPSERT USER ================= */
export async function upsertUser(req: Request, res: Response) {
  try {
    const { username, display_name, profile_picture, bio } = req.body;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💾 UPSERT USER");
    console.log("Username:", username);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const { data, error } = await supabase
      .from("chat_users")
      .upsert(
        {
          username,
          display_name: display_name || username,
          profile_picture: profile_picture || null,
          bio: bio || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "username" }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    console.log("✅ User saved:", data.username);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    res.json(data);
  } catch (error: any) {
    console.error("❌ Upsert user error:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= GET USER PROFILE ================= */
export async function getUserProfile(req: Request, res: Response) {
  try {
    const { username } = req.params;

    console.log(`🔍 GET USER PROFILE: ${username}`);

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const { data, error } = await supabase
      .from("chat_users")
      .select("*")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("❌ Database error:", error);
      throw error;
    }

   if (!data) {
  console.log("⚠️ User not found:", username);
  return res.json(null); // return 200 instead of 404
}

    console.log("✅ User found:", data.username);
    res.json(data);
  } catch (error: any) {
    console.error("❌ Get user profile error:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= UPDATE SETTINGS ================= */
export async function updateSettings(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const { theme, wallpaper, notification_enabled, sound_enabled } = req.body;

    console.log(`⚙️ UPDATE SETTINGS for ${username}`);

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const { data, error } = await supabase
      .from("chat_users")
      .update({
        theme,
        wallpaper,
        notification_enabled,
        sound_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("username", username)
      .select()
      .single();

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    console.log("✅ Settings updated for:", username);
    res.json(data);
  } catch (error: any) {
    console.error("❌ Update settings error:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= UPDATE ONLINE STATUS ================= */
export async function updateOnlineStatus(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const { is_online } = req.body;

    console.log(`📡 UPDATE ONLINE STATUS for ${username}: ${is_online}`);

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const { error } = await supabase
      .from("chat_users")
      .update({
        is_online,
        last_seen: new Date().toISOString(),
      })
      .eq("username", username);

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    console.log("✅ Online status updated for:", username);
    res.json({ success: true, is_online });
  } catch (error: any) {
    console.error("❌ Update online status error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Export as object for backwards compatibility
export const userController = {
  getAllUsers,
  upsertUser,
  getUserProfile,
  updateSettings,
  updateOnlineStatus,
};