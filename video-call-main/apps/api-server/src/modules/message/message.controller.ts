// File: apps/api-server/src/modules/message/message.controller.ts

import { Request, Response } from "express";
import { supabase } from "../../config/supabase";

export async function deleteMessage(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const { username, deleteFor } = req.body;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🗑️  DELETE MESSAGE REQUEST");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Message ID:", messageId);
    console.log("Username:", username);
    console.log("Delete For:", deleteFor);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!username || username === "undefined" || username === "null") {
      console.error("❌ Invalid username:", username);
      return res.status(400).json({ 
        error: "Username is required and cannot be undefined",
        received: username
      });
    }

    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required" });
    }

    const deleteOption = deleteFor || "me";

    if (deleteOption === "everyone") {
      // Get message to verify ownership
      const { data: msg, error: fetchError } = await supabase
        .from("zatchat")
        .select("sender_name")
        .eq("id", messageId)
        .single();

      if (fetchError) {
        console.error("❌ Fetch error:", fetchError);
        return res.status(404).json({ error: "Message not found" });
      }

      if (!msg || msg.sender_name !== username) {
        console.error("❌ Permission denied. Message sender:", msg?.sender_name, "User:", username);
        return res.status(403).json({
          error: "You can only delete your own messages for everyone",
        });
      }

      // Mark as deleted for everyone
      const { error } = await supabase
        .from("zatchat")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_for: "everyone",
        })
        .eq("id", messageId);

      if (error) {
        console.error("❌ Delete error:", error);
        throw error;
      }

      console.log("✅ Message deleted for everyone by:", username);
    } else {
      // Delete for me only (soft delete)
      // First check if already deleted
      const { data: existing } = await supabase
        .from("deleted_messages")
        .select("*")
        .eq("message_id", messageId)
        .eq("deleted_by", username)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from("deleted_messages")
          .insert({
            message_id: messageId,
            deleted_by: username,
            deleted_for: "me",
            deleted_at: new Date().toISOString(),
          });

        if (error) {
          console.error("❌ Soft delete error:", error);
          throw error;
        }
      }

      console.log("✅ Message deleted for:", username);
    }

    res.json({ 
      success: true, 
      deleteFor: deleteOption,
      message: `Message deleted ${deleteOption === "everyone" ? "for everyone" : "for you"}`,
      deletedBy: username,
      messageId: messageId
    });
  } catch (error: any) {
    console.error("❌ Delete message error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function forwardMessages(req: Request, res: Response) {
  try {
    const { messageIds, toRooms, sender } = req.body;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📤 FORWARD MESSAGES REQUEST");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Message IDs:", messageIds);
    console.log("To Rooms:", toRooms?.length);
    console.log("Sender:", sender);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!messageIds || !toRooms || !sender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch original messages
    const { data: messages, error: fetchError } = await supabase
      .from("zatchat")
      .select("*")
      .in("id", messageIds);

    if (fetchError) {
      console.error("❌ Fetch error:", fetchError);
      throw fetchError;
    }

    if (!messages || messages.length === 0) {
      return res.status(404).json({ error: "Messages not found" });
    }

    const forwardedMessages = [];

    // Create forwarded messages for each room
    for (const room of toRooms) {
      for (const msg of messages) {
        const newMsg = {
          room_id: room.roomId,
          sender_name: sender,
          receiver_name: room.receiver,
          message: msg.message || "",
          message_type: msg.message_type,
          file_url: msg.file_url,
          file_name: msg.file_name,
          file_size: msg.file_size,
          is_forwarded: true,
          forwarded_from: msg.sender_name,
          is_delivered: false,
          is_seen: false,
          created_at: new Date().toISOString(),
        };

        forwardedMessages.push(newMsg);
      }
    }

    // Insert forwarded messages
    const { data, error } = await supabase
      .from("zatchat")
      .insert(forwardedMessages)
      .select();

    if (error) {
      console.error("❌ Insert error:", error);
      throw error;
    }

    console.log(`✅ Forwarded ${data?.length} messages successfully`);

    res.json({ 
      success: true, 
      messages: data,
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error("❌ Forward messages error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function getMessageById(req: Request, res: Response) {
  try {
    const { messageId } = req.params;

    const { data, error } = await supabase
      .from("zatchat")
      .select("*")
      .eq("id", messageId)
      .single();

    if (error) {
      console.error("❌ Fetch error:", error);
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(data);
  } catch (error: any) {
    console.error("❌ Get message error:", error);
    res.status(500).json({ error: error.message });
  }
}

export const messageController = {
  deleteMessage,
  forwardMessages,
  getMessageById,
};