import { supabase } from "../../config/supabase";

export const userService = {
  /* ================= GET ALL USERS ================= */
  async getAllUsers() {
    const { data, error } = await supabase
      .from("chat_users")
      .select("username, display_name, profile_picture, bio, is_online, last_seen")
      .order("username", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /* ================= UPSERT USER ================= */
  async upsertUser(data: {
    username: string;
    display_name?: string;
    profile_picture?: string;
    bio?: string;
  }) {
    const { data: user, error } = await supabase
      .from("chat_users")
      .upsert(
        {
          username: data.username,
          display_name: data.display_name || data.username,
          profile_picture: data.profile_picture || null,
          bio: data.bio || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "username" }
      )
      .select()
      .single();

    if (error) throw error;
    return user;
  },

  /* ================= GET USER PROFILE ================= */
  async getUserProfile(username: string) {
    const { data, error } = await supabase
      .from("chat_users")
      .select("*")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  /* ================= GET MULTIPLE USER PROFILES ================= */
  async getUserProfiles(usernames: string[]) {
    const { data, error } = await supabase
      .from("chat_users")
      .select("*")
      .in("username", usernames);

    if (error) throw error;
    return data || [];
  },

  /* ================= UPDATE SETTINGS ================= */
  async updateSettings(
    username: string,
    settings: {
      theme?: string;
      wallpaper?: string;
      notification_enabled?: boolean;
      sound_enabled?: boolean;
    }
  ) {
    const { data, error } = await supabase
      .from("chat_users")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("username", username)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /* ================= UPDATE ONLINE STATUS ================= */
  async updateOnlineStatus(username: string, is_online: boolean) {
    const { error } = await supabase
      .from("chat_users")
      .update({
        is_online,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("username", username);

    if (error) throw error;
  },

  /* ================= SEARCH USERS ================= */
  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from("chat_users")
      .select("username, display_name, profile_picture, bio")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data || [];
  },
};