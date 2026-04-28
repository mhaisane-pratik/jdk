"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
const supabase_1 = require("./config/supabase");
const message_receipts_service_1 = require("./modules/message/message-receipts.service");
function initSocket(io) {
    console.log("🔌 Socket.io server initialized");
    const onlineUsers = new Map();
    const typingUsers = new Map();
    io.on("connection", (socket) => {
        console.log("✅ New connection:", socket.id);
        socket.on("user_join", async ({ username }) => {
            if (!username)
                return;
            console.log(`👤 User joined: ${username}`);
            onlineUsers.set(username, socket.id);
            try {
                await supabase_1.supabase
                    .from("chat_users")
                    .upsert({
                    username,
                    is_online: true,
                    last_seen: new Date().toISOString(),
                });
                io.emit("user_online", { username });
            }
            catch (err) {
                console.error("❌ Error updating user status:", err);
            }
        });
        socket.on("join_room", (roomId) => {
            console.log(`➡️  Socket ${socket.id} joining room: ${roomId}`);
            socket.join(roomId);
            console.log(`✅ Socket joined room: ${roomId}`);
        });
        socket.on("leave_room", (roomId) => {
            console.log(`⬅️  Socket ${socket.id} leaving room: ${roomId}`);
            socket.leave(roomId);
        });
        socket.on("new_group_created", async ({ groupId, groupName, members, creator }) => {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("🎉 NEW GROUP CREATED");
            console.log("━━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━");
            console.log("Group:", groupName);
            console.log("ID:", groupId);
            console.log("Creator:", creator);
            console.log("Members:", members);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            if (Array.isArray(members)) {
                members.forEach((member) => {
                    const memberSocket = onlineUsers.get(member);
                    if (memberSocket) {
                        io.to(memberSocket).emit("new_group_created", {
                            groupId,
                            groupName,
                            creator,
                            memberCount: members.length,
                        });
                        console.log(`✅ Notified ${member} about new group`);
                    }
                    else {
                        console.log(`⚠️  ${member} is offline, will see group on next login`);
                    }
                });
            }
            io.to(groupId).emit("new_group_created", {
                groupId,
                groupName,
                creator,
                memberCount: members.length,
            });
            console.log("✅ Group creation notifications sent");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        });
        socket.on("member_removed", async ({ groupId, removedUser, groupName }) => {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("👋 MEMBER REMOVED FROM GROUP");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("Group:", groupName);
            console.log("Group ID:", groupId);
            console.log("Removed User:", removedUser);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            const memberSocket = onlineUsers.get(removedUser);
            if (memberSocket) {
                io.to(memberSocket).emit("removed_from_group", {
                    groupId,
                    groupName,
                });
                console.log(`✅ Notified ${removedUser} they were removed`);
            }
            else {
                console.log(`⚠️  ${removedUser} is offline`);
            }
            io.to(groupId).emit("group_member_removed", {
                groupId,
                removedUser,
                groupName,
            });
            console.log(`✅ Notified group members about removal`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        });
        socket.on("members_added", async ({ groupId, groupName, newMembers, addedBy }) => {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("➕ MEMBERS ADDED TO GROUP");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("Group:", groupName);
            console.log("Group ID:", groupId);
            console.log("New Members:", newMembers.join(", "));
            console.log("Added By:", addedBy);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            if (Array.isArray(newMembers)) {
                newMembers.forEach((member) => {
                    const memberSocket = onlineUsers.get(member);
                    if (memberSocket) {
                        io.to(memberSocket).emit("added_to_group", {
                            groupId,
                            groupName,
                            addedBy,
                        });
                        console.log(`✅ Notified ${member} they were added`);
                    }
                    else {
                        console.log(`⚠️  ${member} is offline`);
                    }
                });
            }
            io.to(groupId).emit("group_members_added", {
                groupId,
                groupName,
                newMembers,
                addedBy,
            });
            console.log(`✅ Notified existing group members`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        });
        socket.on("member_left", async ({ groupId, username, groupName }) => {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("🚪 MEMBER LEFT GROUP");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("Group:", groupName);
            console.log("Group ID:", groupId);
            console.log("Left User:", username);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            io.to(groupId).emit("group_member_left", {
                groupId,
                groupName,
                username,
            });
            console.log(`✅ Notified group members that ${username} left`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        });
        socket.on("group_name_updated", async ({ groupId, newName, updatedBy }) => {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("✏️ GROUP NAME UPDATED");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("Group ID:", groupId);
            console.log("New Name:", newName);
            console.log("Updated By:", updatedBy);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            io.to(groupId).emit("group_name_updated", {
                groupId,
                newName,
                updatedBy,
            });
            console.log(`✅ Notified group members about name change`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        });
        socket.on("send_message", async (payload) => {
            console.log("📨 SEND_MESSAGE:", payload);
            const { roomId, sender, receiver, message, reply_to_id } = payload;
            if (!roomId || !sender || !receiver || !message) {
                console.error("❌ Invalid payload");
                return;
            }
            try {
                await ensureRoomExists(roomId, sender, receiver);
                const { data, error } = await supabase_1.supabase
                    .from("zatchat")
                    .insert([
                    {
                        room_id: roomId,
                        sender_name: sender,
                        receiver_name: receiver,
                        message: message,
                        message_type: "text",
                        reply_to_id: reply_to_id || null,
                        is_delivered: false,
                        is_seen: false,
                    },
                ])
                    .select()
                    .single();
                if (error)
                    throw error;
                console.log("✅ Message saved:", data.id);
                await updateRoom(roomId, message, sender);
                io.to(roomId).emit("receive_message", data);
                io.emit("room_updated", {
                    roomId,
                    lastMessage: message.substring(0, 50),
                    sender,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (err) {
                console.error("❌ send_message error:", err);
                socket.emit("error", { message: err.message });
            }
        });
        socket.on("send_file", async (payload) => {
            console.log("📁 SEND_FILE:", payload);
            const { roomId, sender, receiver, message_type, file_url, file_name, file_size } = payload;
            if (!roomId || !sender || !receiver || !file_url) {
                console.error("❌ Invalid file payload");
                return;
            }
            try {
                await ensureRoomExists(roomId, sender, receiver);
                const { data, error } = await supabase_1.supabase
                    .from("zatchat")
                    .insert([
                    {
                        room_id: roomId,
                        sender_name: sender,
                        receiver_name: receiver,
                        message_type: message_type,
                        file_url: file_url,
                        file_name: file_name,
                        file_size: file_size,
                        is_delivered: false,
                        is_seen: false,
                    },
                ])
                    .select()
                    .single();
                if (error)
                    throw error;
                console.log("✅ File message saved:", data.id);
                const displayMessage = message_type === "image" ? "📷 Photo" : "📎 File";
                await updateRoom(roomId, displayMessage, sender);
                io.to(roomId).emit("receive_message", data);
                io.emit("room_updated", {
                    roomId,
                    lastMessage: displayMessage,
                    sender,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (err) {
                console.error("❌ send_file error:", err);
                socket.emit("error", { message: err.message });
            }
        });
        socket.on("typing", ({ roomId, sender }) => {
            if (!roomId || !sender)
                return;
            if (!typingUsers.has(roomId)) {
                typingUsers.set(roomId, new Set());
            }
            typingUsers.get(roomId).add(sender);
            socket.to(roomId).emit("typing", { sender, roomId });
            console.log(`⌨️  ${sender} is typing in ${roomId}`);
        });
        socket.on("stop_typing", ({ roomId, sender }) => {
            if (!roomId || !sender)
                return;
            if (typingUsers.has(roomId)) {
                typingUsers.get(roomId).delete(sender);
                if (typingUsers.get(roomId).size === 0) {
                    typingUsers.delete(roomId);
                }
            }
            socket.to(roomId).emit("stop_typing", { sender, roomId });
            console.log(`⌨️  ${sender} stopped typing in ${roomId}`);
        });
        socket.on("message_seen", async ({ roomId, viewer, messageIds }) => {
            if (!roomId || !viewer)
                return;
            try {
                let targetQuery = supabase_1.supabase
                    .from("zatchat")
                    .select("id")
                    .eq("room_id", roomId)
                    .neq("sender_name", viewer);
                if (messageIds && messageIds.length > 0) {
                    targetQuery = targetQuery.in("id", messageIds);
                }
                const { data: targetMessages, error: targetError } = await targetQuery;
                if (targetError)
                    throw targetError;
                if (targetMessages?.length) {
                    const targetIds = targetMessages.map((message) => message.id);
                    await supabase_1.supabase
                        .from("zatchat")
                        .update({ is_seen: true, is_delivered: true })
                        .in("id", targetIds);
                    await (0, message_receipts_service_1.recordMessageSeen)(targetIds, viewer);
                    io.to(roomId).emit("message_seen", { messageIds: targetIds });
                    console.log(`✓✓ ${viewer} saw ${targetIds.length} messages in ${roomId}`);
                }
            }
            catch (err) {
                console.error("❌ message_seen error:", err);
            }
        });
        socket.on("message_delivered", async ({ roomId, messageId }) => {
            if (!roomId || !messageId)
                return;
            try {
                await supabase_1.supabase
                    .from("zatchat")
                    .update({ is_delivered: true })
                    .eq("id", messageId);
                io.to(roomId).emit("message_delivered", { messageId });
            }
            catch (err) {
                console.error("❌ message_delivered error:", err);
            }
        });
        socket.on("delete_message", async ({ messageId, username, deleteFor, roomId }) => {
            if (!messageId || !username || !deleteFor)
                return;
            try {
                const { data: msgData } = await supabase_1.supabase.from("zatchat").select("message, message_type").eq("id", messageId).single();
                if (deleteFor === "everyone") {
                    await supabase_1.supabase
                        .from("zatchat")
                        .update({
                        is_deleted: true,
                        deleted_at: new Date().toISOString(),
                        deleted_for: "everyone",
                    })
                        .eq("id", messageId);
                    io.to(roomId).emit("message_deleted", { messageId, deleteFor: "everyone" });
                    if (msgData) {
                        const displayMatch = msgData.message ? msgData.message.substring(0, 100) : msgData.message_type === "image" ? "📷 Photo" : "📎 File";
                        const { data: roomData } = await supabase_1.supabase.from("chat_rooms").select("last_message").eq("id", roomId).single();
                        if (roomData && roomData.last_message === displayMatch) {
                            await supabase_1.supabase.from("chat_rooms").update({ last_message: "🚫 This message was deleted" }).eq("id", roomId);
                            io.emit("room_updated", { roomId, lastMessage: "🚫 This message was deleted", sender: username, timestamp: new Date().toISOString() });
                        }
                    }
                }
                else {
                    await supabase_1.supabase.from("deleted_messages").insert({
                        message_id: messageId,
                        deleted_by: username,
                        deleted_for: "me",
                    });
                    socket.emit("message_deleted", { messageId, deleteFor: "me" });
                }
            }
            catch (err) {
                console.error("❌ delete_message error:", err);
            }
        });
        socket.on("forward_message", async ({ messages, toRooms }) => {
            try {
                for (const room of toRooms) {
                    for (const msg of messages) {
                        io.to(room.roomId).emit("receive_message", msg);
                    }
                }
            }
            catch (err) {
                console.error("❌ forward_message error:", err);
            }
        });
        socket.on("disconnect", async () => {
            console.log("❌ Socket disconnected:", socket.id);
            let disconnectedUser = "";
            for (const [username, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUser = username;
                    break;
                }
            }
            if (disconnectedUser) {
                onlineUsers.delete(disconnectedUser);
                try {
                    await supabase_1.supabase
                        .from("chat_users")
                        .update({
                        is_online: false,
                        last_seen: new Date().toISOString(),
                    })
                        .eq("username", disconnectedUser);
                    io.emit("user_offline", {
                        username: disconnectedUser,
                        lastSeen: new Date().toISOString(),
                    });
                    console.log(`👋 ${disconnectedUser} went offline`);
                }
                catch (err) {
                    console.error("❌ Error updating offline status:", err);
                }
            }
        });
    });
    async function ensureUserExists(username) {
        const { error } = await supabase_1.supabase
            .from("chat_users")
            .upsert({
            username: username,
            display_name: username,
            is_online: true,
            last_seen: new Date().toISOString(),
        }, {
            onConflict: "username",
            ignoreDuplicates: true,
        });
        if (error) {
            console.error("❌ Error ensuring user in chat_users:", error);
            throw error;
        }
    }
    async function ensureRoomExists(roomId, sender, receiver) {
        const { data: existing } = await supabase_1.supabase
            .from("chat_rooms")
            .select("id")
            .eq("id", roomId)
            .single();
        if (!existing) {
            try {
                await ensureUserExists(sender);
                await ensureUserExists(receiver);
            }
            catch (err) {
                console.error("❌ Failed to ensure users exist:", err);
                throw err;
            }
            const participants = [sender, receiver].sort();
            const { data, error } = await supabase_1.supabase.from("chat_rooms").insert({
                id: roomId,
                participant_1: participants[0],
                participant_2: participants[1],
                last_message: "",
                last_message_time: new Date().toISOString(),
                last_message_sender: sender,
                unread_count_user1: 0,
                unread_count_user2: 0,
            }).select();
            if (error) {
                console.error("❌ Error creating room:", error);
                throw error;
            }
            console.log("✅ Room created:", roomId);
        }
    }
    async function updateRoom(roomId, message, sender) {
        const { data: room } = await supabase_1.supabase
            .from("chat_rooms")
            .select("*")
            .eq("id", roomId)
            .single();
        if (room) {
            const isUser1 = room.participant_1 === sender;
            const unreadField = isUser1 ? "unread_count_user2" : "unread_count_user1";
            await supabase_1.supabase
                .from("chat_rooms")
                .update({
                last_message: message.substring(0, 100),
                last_message_time: new Date().toISOString(),
                last_message_sender: sender,
                [unreadField]: (room[unreadField] || 0) + 1,
                updated_at: new Date().toISOString(),
            })
                .eq("id", roomId);
        }
    }
    return io;
}
//# sourceMappingURL=socket.js.map