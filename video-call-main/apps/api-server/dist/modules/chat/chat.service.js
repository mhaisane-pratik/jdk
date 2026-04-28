"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = void 0;
const supabase_1 = require("../../config/supabase");
exports.chatService = {
    async updateRoomLastMessage(roomId, message, sender) {
        const { data: room } = await supabase_1.supabase
            .from("chat_rooms")
            .select("*")
            .eq("id", roomId)
            .single();
        if (room) {
            const receiverField = room.participant_1 === sender
                ? "unread_count_user2"
                : "unread_count_user1";
            const { error } = await supabase_1.supabase
                .from("chat_rooms")
                .update({
                last_message: message.substring(0, 100),
                last_message_time: new Date().toISOString(),
                last_message_sender: sender,
                [receiverField]: (room[receiverField] || 0) + 1,
                updated_at: new Date().toISOString(),
            })
                .eq("id", roomId);
            if (error)
                throw error;
        }
        else {
            const participants = roomId.split("__");
            const { error } = await supabase_1.supabase.from("chat_rooms").insert({
                id: roomId,
                participant_1: participants[0],
                participant_2: participants[1],
                last_message: message.substring(0, 100),
                last_message_time: new Date().toISOString(),
                last_message_sender: sender,
                unread_count_user1: participants[0] === sender ? 0 : 1,
                unread_count_user2: participants[1] === sender ? 0 : 1,
            });
            if (error)
                throw error;
        }
    },
    async deleteMessage(messageId, deletedBy, deleteFor) {
        if (deleteFor === "everyone") {
            const { error } = await supabase_1.supabase
                .from("zatchat")
                .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_for: "everyone",
            })
                .eq("id", messageId);
            if (error)
                throw error;
        }
        else {
            const { error } = await supabase_1.supabase.from("deleted_messages").insert({
                message_id: messageId,
                deleted_by: deletedBy,
                deleted_for: "me",
            });
            if (error)
                throw error;
        }
    },
    async getUnreadCount(username) {
        const { data: rooms } = await supabase_1.supabase
            .from("chat_rooms")
            .select("participant_1, unread_count_user1, unread_count_user2")
            .or(`participant_1.eq.${username},participant_2.eq.${username}`);
        if (!rooms)
            return 0;
        return rooms.reduce((total, room) => {
            const count = room.participant_1 === username
                ? room.unread_count_user1
                : room.unread_count_user2;
            return total + (count || 0);
        }, 0);
    },
};
//# sourceMappingURL=chat.service.js.map