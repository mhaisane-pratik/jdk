"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageController = void 0;
exports.deleteMessage = deleteMessage;
exports.forwardMessages = forwardMessages;
exports.getMessageById = getMessageById;
exports.getMessageSeenByUsers = getMessageSeenByUsers;
const supabase_1 = require("../../config/supabase");
const message_receipts_service_1 = require("./message-receipts.service");
async function deleteMessage(req, res) {
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
            const { data: msg, error: fetchError } = await supabase_1.supabase
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
            const { error } = await supabase_1.supabase
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
        }
        else {
            const { data: existing } = await supabase_1.supabase
                .from("deleted_messages")
                .select("*")
                .eq("message_id", messageId)
                .eq("deleted_by", username)
                .single();
            if (!existing) {
                const { error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error("❌ Delete message error:", error);
        res.status(500).json({ error: error.message });
    }
}
async function forwardMessages(req, res) {
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
        const { data: messages, error: fetchError } = await supabase_1.supabase
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
        const { data, error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error("❌ Forward messages error:", error);
        res.status(500).json({ error: error.message });
    }
}
async function getMessageById(req, res) {
    try {
        const { messageId } = req.params;
        const { data, error } = await supabase_1.supabase
            .from("zatchat")
            .select("*")
            .eq("id", messageId)
            .single();
        if (error) {
            console.error("❌ Fetch error:", error);
            return res.status(404).json({ error: "Message not found" });
        }
        res.json(data);
    }
    catch (error) {
        console.error("❌ Get message error:", error);
        res.status(500).json({ error: error.message });
    }
}
async function getMessageSeenByUsers(req, res) {
    try {
        const { messageId } = req.params;
        const { username } = req.query;
        if (!messageId) {
            return res.status(400).json({ error: "Message ID is required" });
        }
        if (!username || typeof username !== "string") {
            return res.status(400).json({ error: "Username is required" });
        }
        const { data: message, error: messageError } = await supabase_1.supabase
            .from("zatchat")
            .select("id, room_id, sender_name")
            .eq("id", messageId)
            .single();
        if (messageError || !message) {
            return res.status(404).json({ error: "Message not found" });
        }
        const { data: room, error: roomError } = await supabase_1.supabase
            .from("chat_rooms")
            .select("participant_1, participant_2, is_group, member_count")
            .eq("id", message.room_id)
            .single();
        if (roomError || !room) {
            return res.status(404).json({ error: "Chat room not found" });
        }
        const participants = [
            room.participant_1,
            ...(room.participant_2
                ? String(room.participant_2)
                    .split(",")
                    .map((participant) => participant.trim())
                    .filter(Boolean)
                : []),
        ];
        if (!participants.includes(username)) {
            return res.status(403).json({ error: "You are not allowed to view these receipts" });
        }
        const receipts = await (0, message_receipts_service_1.getMessageSeenBy)(messageId);
        const filteredReceipts = receipts.filter((receipt) => receipt.viewer_username !== message.sender_name);
        res.json({
            messageId,
            roomId: message.room_id,
            isGroup: Boolean(room.is_group),
            sender: message.sender_name,
            totalParticipants: Math.max(participants.length - 1, 0),
            seenCount: filteredReceipts.length,
            seenBy: filteredReceipts.map((receipt) => ({
                username: receipt.viewer_username,
                display_name: receipt.display_name || receipt.viewer_username,
                profile_picture: receipt.profile_picture,
                seen_at: receipt.seen_at,
            })),
        });
    }
    catch (error) {
        console.error("❌ Get message seen-by error:", error);
        res.status(500).json({ error: error.message });
    }
}
exports.messageController = {
    deleteMessage,
    forwardMessages,
    getMessageById,
    getMessageSeenByUsers,
};
//# sourceMappingURL=message.controller.js.map