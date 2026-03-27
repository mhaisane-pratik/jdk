import { Request, Response } from "express";
import { supabase } from "../../config/supabase";
import multer from "multer";
import path from "path";
import fs from "fs";

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

/* ================= PROFILE UPLOAD SETUP ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/profiles");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = "dp-" + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    if (
      allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
      allowedTypes.test(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid image type"));
    }
  },
}).single("photo");

/* ================= UPLOAD PROFILE PICTURE ================= */
export async function uploadProfilePicture(req: Request, res: Response) {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const { username } = req.params;

      const fileUrl = `http://localhost:4000/uploads/profiles/${req.file.filename}`;

      const { data, error } = await supabase
        .from("chat_users")
        .update({
          profile_picture: fileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("username", username)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Profile picture updated for ${username}: ${fileUrl}`);
      res.json({ success: true, profile_picture: fileUrl, user: data });
    } catch (error: any) {
      console.error("❌ Profile picture upload error:", error);
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ error: error.message });
    }
  });
}

// Export as object for backwards compatibility
export const userController = {
  getAllUsers,
  upsertUser,
  getUserProfile,
  updateSettings,
  updateOnlineStatus,
  uploadProfilePicture,
};