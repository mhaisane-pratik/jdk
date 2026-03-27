import { Request, Response } from "express";
import { supabase } from "../../config/supabase";

export async function getDashboardStats(req: Request, res: Response) {
  try {
    // 1. Get active users count
    const { data: onlineUsers, error: usersError } = await supabase
      .from("chat_users")
      .select("username, display_name, profile_picture")
      .eq("is_online", true);

    if (usersError) throw usersError;

    // 2. Get current Admins list and their total chat count
    const { data: adminUsers, error: adminError } = await supabase
      .from("chat_users")
      .select("username, display_name, profile_picture, can_create_group")
      .eq("is_admin", true);

    const adminUsersWithCounts = await Promise.all((adminUsers || []).map(async (admin) => {
      const { count } = await supabase
        .from("chat_rooms")
        .select('*', { count: 'exact', head: true })
        .or(`participant_1.eq.${admin.username},participant_2.like.%${admin.username}%`);
        
      return { ...admin, total_chats: count || 0 };
    }));

    // 3. Get applications (API clients)
    const { data: apps, error: appsError } = await supabase
      .from("api_clients")
      .select("*")
      .order("created_at", { ascending: false });

    // 4. Get total groups
    const { count: groupsCount } = await supabase
      .from("chat_rooms")
      .select('*', { count: 'exact', head: true })
      .eq('is_group', true);

    // If the table doesn't exist yet, we'll gracefully return a dummy array
    if (appsError && appsError.code === '42P01') { 
       return res.json({
         activeUsers: onlineUsers?.length || 0,
         totalGroups: groupsCount || 0,
         onlineUsersList: onlineUsers || [],
         adminUsersList: adminUsersWithCounts || [],
         applications: [
           { 
             id: "default", 
             app_name: "ZatChat", 
             api_key: "ZATCHAT_PRATEEK9373", 
             allow_group_creation: true,
             allow_chat_creation: true,
             allow_media_sharing: true,
             max_group_size: 50,
             max_message_length: 1000,
             app_logo: 'https://ui-avatars.com/api/?name=Zat+Chat&background=4f46e5&color=fff'
           }
         ],
         setupRequired: true
       });
    } else if (appsError) {
      throw appsError;
    }

    res.json({
      activeUsers: onlineUsers?.length || 0,
      totalGroups: groupsCount || 0,
      onlineUsersList: onlineUsers || [],
      adminUsersList: adminUsersWithCounts || [],
      applications: apps || [],
      setupRequired: false
    });
  } catch (error: any) {
    console.error("❌ Admin stats error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateAppConfig(req: Request, res: Response) {
  try {
    const { appId } = req.params;
    const { 
      allow_group_creation, 
      app_name, 
      app_logo, 
      allow_chat_creation, 
      allow_media_sharing, 
      max_group_size, 
      max_message_length 
    } = req.body;

    if (appId === "default") {
        return res.status(400).json({ error: "Please run the Supabase SQL setup script first to configure database settings." });
    }

    const updates: any = {};
    if (allow_group_creation !== undefined) updates.allow_group_creation = allow_group_creation;
    if (app_name !== undefined) updates.app_name = app_name;
    if (app_logo !== undefined) updates.app_logo = app_logo;
    if (allow_chat_creation !== undefined) updates.allow_chat_creation = allow_chat_creation;
    if (allow_media_sharing !== undefined) updates.allow_media_sharing = allow_media_sharing;
    if (max_group_size !== undefined) updates.max_group_size = max_group_size;
    if (max_message_length !== undefined) updates.max_message_length = max_message_length;

    const { data, error } = await supabase
      .from("api_clients")
      .update(updates)
      .eq("id", appId)
      .select()
      .single();

    if (error) {
       if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Application configuration not found in database. The unique ID could not be located." });
       }
       throw error;
    }

    console.log(`✅ Updated app config for ${data.app_name}`);
    res.json({ success: true, application: data });
  } catch (error: any) {
    console.error("❌ Admin config update error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const { is_admin, can_create_group, admin_password } = req.body;

    const updatePayload: any = { is_admin };
    if (can_create_group !== undefined) updatePayload.can_create_group = can_create_group;
    if (admin_password !== undefined) updatePayload.admin_password = admin_password;

    const { data, error } = await supabase
      .from("chat_users")
      .update(updatePayload)
      .eq("username", username)
      .select()
      .single();

    if (error) {
       if (error.code === '42P01' || error.message.includes('column "is_admin" of relation "chat_users" does not exist')) {
           return res.status(400).json({ error: "Please run the add_admin_role.sql script in Supabase first." });
       }
       throw error;
    }

    if (!data) {
        return res.status(404).json({ error: "User not found" });
    }

    console.log(`✅ Updated ${username} admin status to ${is_admin}`);
    res.json({ success: true, user: data });
  } catch (error: any) {
    console.error("❌ Admin role update error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function verifyAdminPassword(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    // The super admin password bypass
    if (username === 'admin' && password === 'admin123') {
       return res.json({ success: true, isSuperAdmin: true });
    }

    const { data, error } = await supabase
      .from("chat_users")
      .select("is_admin, admin_password")
      .eq("username", username)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "User not found or database error" });
    }

    if (!data.is_admin) {
      return res.status(403).json({ error: "Access Denied: You are not an admin!" });
    }

    if (!data.admin_password || data.admin_password !== password) {
      return res.status(401).json({ error: "Incorrect Security Password." });
    }

    res.json({ success: true, isSuperAdmin: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function banUser(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const { is_banned } = req.body;

    const { data, error } = await supabase
      .from("chat_users")
      .update({ is_banned })
      .eq("username", username)
      .select()
      .single();

    if (error) throw error;

    // Instantly terminate their session if banning them
    if (is_banned) {
      req.app.get("io")?.emit("user_banned", { username });
    }

    res.json({ success: true, user: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function warnUser(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const { message } = req.body;

    // Fetch existing warning count
    const { data: uData } = await supabase.from("chat_users").select("warning_count").eq("username", username).single();
    const newCount = (uData?.warning_count || 0) + 1;

    const { data, error } = await supabase
      .from("chat_users")
      .update({ warning_count: newCount })
      .eq("username", username)
      .select()
      .single();

    if (error) throw error;

    // WebSockets force a terrifying red flash onto their screen
    req.app.get("io")?.emit("user_warned", { username, message, warning_count: newCount });

    res.json({ success: true, message: "User warned successfully", warning_count: newCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getGroupsDirectory(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("is_group", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export const adminController = {
  getDashboardStats,
  updateAppConfig,
  updateUserRole,
  verifyAdminPassword,
  banUser,
  warnUser,
  getGroupsDirectory,
};
