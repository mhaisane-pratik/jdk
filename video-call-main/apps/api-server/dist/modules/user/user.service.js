"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const supabase_1 = require("../../config/supabase");
exports.userService = {
    async getAllUsers() {
        const { data, error } = await supabase_1.supabase
            .from("chat_users")
            .select("username, display_name, profile_picture, bio, is_online, last_seen")
            .order("username", { ascending: true });
        if (error)
            throw error;
        return data || [];
    },
    async upsertUser(data) {
        const { data: user, error } = await supabase_1.supabase
            .from("chat_users")
            .upsert({
            username: data.username,
            display_name: data.display_name || data.username,
            profile_picture: data.profile_picture || null,
            bio: data.bio || "",
            updated_at: new Date().toISOString(),
        }, { onConflict: "username" })
            .select()
            .single();
        if (error)
            throw error;
        return user;
    },
    async getUserProfile(username) {
        const { data, error } = await supabase_1.supabase
            .from("chat_users")
            .select("*")
            .eq("username", username)
            .single();
        if (error && error.code !== "PGRST116")
            throw error;
        return data;
    },
    async getUserProfiles(usernames) {
        const { data, error } = await supabase_1.supabase
            .from("chat_users")
            .select("*")
            .in("username", usernames);
        if (error)
            throw error;
        return data || [];
    },
    async updateSettings(username, settings) {
        const { data, error } = await supabase_1.supabase
            .from("chat_users")
            .update({
            ...settings,
            updated_at: new Date().toISOString(),
        })
            .eq("username", username)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async updateOnlineStatus(username, is_online) {
        const { error } = await supabase_1.supabase
            .from("chat_users")
            .update({
            is_online,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .eq("username", username);
        if (error)
            throw error;
    },
    async searchUsers(query) {
        const { data, error } = await supabase_1.supabase
            .from("chat_users")
            .select("username, display_name, profile_picture, bio")
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
            .limit(20);
        if (error)
            throw error;
        return data || [];
    },
};
//# sourceMappingURL=user.service.js.map