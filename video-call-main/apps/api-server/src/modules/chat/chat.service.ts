// File: apps/api-server/src/modules/chat/chat.service.ts

import { supabase } from "../../config/supabase";

export const chatService = {
  async updateRoomLastMessage(
    roomId: string,
    message: string,
    sender: string
  ) {
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (room) {
      // Increment unread count for receiver
      const receiverField =
        room.participant_1 === sender
          ? "unread_count_user2"
          : "unread_count_user1";

      const { error } = await supabase
        .from("chat_rooms")
        .update({
          last_message: message.substring(0, 100),
          last_message_time: new Date().toISOString(),
          last_message_sender: sender,
          [receiverField]: (room[receiverField] || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId);

      if (error) throw error;
    } else {
      // Create new room
      const participants = roomId.split("__");
      const { error } = await supabase.from("chat_rooms").insert({
        id: roomId,
        participant_1: participants[0],
        participant_2: participants[1],
        last_message: message.substring(0, 100),
        last_message_time: new Date().toISOString(),
        last_message_sender: sender,
        unread_count_user1: participants[0] === sender ? 0 : 1,
        unread_count_user2: participants[1] === sender ? 0 : 1,
      });

      if (error) throw error;
    }
  },

  async deleteMessage(messageId: string, deletedBy: string, deleteFor: string) {
    if (deleteFor === "everyone") {
      // Mark message as deleted for everyone
      const { error } = await supabase
        .from("zatchat")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_for: "everyone",
        })
        .eq("id", messageId);

      if (error) throw error;
    } else {
      // Mark as deleted for one user
      const { error } = await supabase.from("deleted_messages").insert({
        message_id: messageId,
        deleted_by: deletedBy,
        deleted_for: "me",
      });

      if (error) throw error;
    }
  },

  async getUnreadCount(username: string) {
    const { data: rooms } = await supabase
      .from("chat_rooms")
      .select("participant_1, unread_count_user1, unread_count_user2")
      .or(`participant_1.eq.${username},participant_2.eq.${username}`);

    if (!rooms) return 0;

    return rooms.reduce((total, room) => {
      const count =
        room.participant_1 === username
          ? room.unread_count_user1
          : room.unread_count_user2;
      return total + (count || 0);
    }, 0);
  },
};