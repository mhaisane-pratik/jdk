"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatController = void 0;
exports.getChatHistory = getChatHistory;
exports.getChatRooms = getChatRooms;
exports.markAsRead = markAsRead;
exports.createRoom = createRoom;
exports.updateGroup = updateGroup;
exports.uploadFile = uploadFile;
exports.clearChat = clearChat;
const supabase_1 = require("../../config/supabase");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const message_receipts_service_1 = require("../message/message-receipts.service");
async function getChatHistory(req, res) {
    try {
        const { roomId } = req.params;
        const { username, before } = req.query;
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📥 GET CHAT HISTORY (PAGINATED)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Room ID:", roomId);
        console.log("Username:", username);
        if (before)
            console.log("Before:", before);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        if (!roomId) {
            return res.status(400).json({ error: "Room ID is required" });
        }
        let query = supabase_1.supabase
            .from("zatchat")
            .select("*")
            .eq("room_id", roomId)
            .order("created_at", { ascending: false })
            .limit(50);
        if (before && typeof before === "string") {
            query = query.lt("created_at", before);
        }
        const { data: messages, error: messagesError } = await query;
        if (messagesError) {
            console.error("❌ Database error:", messagesError);
            throw messagesError;
        }
        let filteredMessages = messages || [];
        if (username && typeof username === "string") {
            console.log("🔍 Filtering deleted messages for:", username);
            const { data: deletedByUser, error: deletedError } = await supabase_1.supabase
                .from("deleted_messages")
                .select("message_id")
                .eq("deleted_by", username);
            if (deletedError)
                console.error("⚠️ Error fetching deleted messages:", deletedError);
            const deletedIds = new Set(deletedByUser?.map((d) => d.message_id) || []);
            filteredMessages = filteredMessages.filter((msg) => {
                if (msg.is_deleted && msg.deleted_for === "everyone")
                    return false;
                if (deletedIds.has(msg.id))
                    return false;
                return true;
            });
        }
        else {
            filteredMessages = filteredMessages.filter((msg) => !(msg.is_deleted && msg.deleted_for === "everyone"));
        }
        filteredMessages.reverse();
        const hasMore = (messages?.length || 0) === 50;
        console.log(`✅ Returning ${filteredMessages.length} messages. HasMore: ${hasMore}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        res.json({
            messages: filteredMessages,
            hasMore,
        });
    }
    catch (error) {
        console.error("❌ getChatHistory error:", error);
        res.status(500).json({ error: error.message });
    }
}
async function getChatRooms(req, res) {
    try {
        const { username } = req.params;
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🏠 GET CHAT ROOMS");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Username:", username);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }
        const { data, error } = await supabase_1.supabase
            .from("chat_rooms")
            .select("*")
            .or(`participant_1.eq.${username},participant_2.like.%${username}%`)
            .order("last_message_time", { ascending: false, nullsFirst: false });
        if (error) {
            console.error("❌ Database error:", error);
            throw error;
        }
        const filteredData = (data || []).filter((room) => {
            if (room.participant_1 === username)
                return true;
            if (room.participant_2) {
                const participants = room.participant_2.split(",").map((p) => p.trim());
                return participants.includes(username);
            }
            return false;
        });
        const processedRooms = filteredData.map((room) => {
            if (room.is_group) {
                return {
                    ...room,
                    type: "group",
                    name: room.group_name,
                    is_group: true,
                    group_icon: room.group_icon,
                    member_count: room.member_count,
                    participant_count: room.member_count,
                    unread_count: room.participant_1 === username ? room.unread_count_user1 : room.unread_count_user2,
                    is_pinned: room.participant_1 === username ? room.is_pinned_user1 : room.is_pinned_user2,
                    is_archived: room.participant_1 === username ? room.is_archived_user1 : room.is_archived_user2,
                    is_muted: room.participant_1 === username ? room.is_muted_user1 : room.is_muted_user2,
                };
            }
            const isUser1 = room.participant_1 === username;
            return {
                ...room,
                type: "private",
                is_group: false,
                unread_count: isUser1 ? room.unread_count_user1 : room.unread_count_user2,
                is_pinned: isUser1 ? room.is_pinned_user1 : room.is_pinned_user2,
                is_archived: isUser1 ? room.is_archived_user1 : room.is_archived_user2,
                is_muted: isUser1 ? room.is_muted_user1 : room.is_muted_user2,
                other_user: isUser1 ? room.participant_2 : room.participant_1,
            };
        });
        console.log(`✅ Found ${processedRooms.length} rooms for ${username}`);
        console.log(`   - Groups: ${processedRooms.filter(r => r.is_group).length}`);
        console.log(`   - Private: ${processedRooms.filter(r => !r.is_group).length}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        res.json(processedRooms);
    }
    catch (error) {
        console.error("❌ getChatRooms error:", error);
        res.status(500).json({ error: error.message });
    }
}
async function markAsRead(req, res) {
    try {
        const { roomId, username } = req.params;
        console.log(`✓✓ Marking messages as read for ${username} in ${roomId}`);
        if (!roomId || !username) {
            return res.status(400).json({ error: "Room ID and username are required" });
        }
        const { data: seenMessages, error: msgError } = await supabase_1.supabase
            .from("zatchat")
            .update({
            is_seen: true,
            is_delivered: true
        })
            .eq("room_id", roomId)
            .eq("receiver_name", username)
            .eq("is_seen", false)
            .select("id");
        if (msgError) {
            console.error("❌ Error updating messages:", msgError);
            throw msgError;
        }
        if (seenMessages?.length) {
            await (0, message_receipts_service_1.recordMessageSeen)(seenMessages.map((message) => message.id), username);
        }
        const { data: room, error: roomFetchError } = await supabase_1.supabase
            .from("chat_rooms")
            .select("participant_1, participant_2")
            .eq("id", roomId)
            .single();
        if (roomFetchError) {
            console.error("❌ Error fetching room:", roomFetchError);
        }
        else if (room) {
            const field = room.participant_1 === username
                ? "unread_count_user1"
                : "unread_count_user2";
            const { error: updateError } = await supabase_1.supabase
                .from("chat_rooms")
                .update({
                [field]: 0,
                updated_at: new Date().toISOString()
            })
                .eq("id", roomId);
            if (updateError) {
                console.error("❌ Error updating room unread count:", updateError);
            }
        }
        console.log("✅ Messages marked as read");
        res.json({ success: true });
    }
    catch (error) {
        console.error("❌ markAsRead error:", error);
        res.status(500).json({ error: error.message });
    }
}
async function createRoom(req, res) {
    try {
        const { roomId, participant1, participant2, isGroup, groupName, groupIcon, memberCount, createdBy } = req.body;
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🏠 CREATE/CHECK ROOM");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Room ID:", roomId);
        console.log("Is Group:", isGroup);
        if (isGroup) {
            console.log("Group Name:", groupName);
            console.log("Members:", participant2);
            console.log("Member Count:", memberCount);
        }
        else {
            console.log("Participants:", participant1, "↔️", participant2);
        }
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        if (!roomId || !participant1 || !participant2) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const { data: existing, error: fetchError } = await supabase_1.supabase
            .from("chat_rooms")
            .select("*")
            .eq("id", roomId)
            .single();
        if (fetchError && fetchError.code !== "PGRST116") {
            console.error("❌ Error checking room:", fetchError);
            throw fetchError;
        }
        if (existing) {
            console.log("✅ Room already exists");
            return res.json({ room: existing, created: false });
        }
        const ensureUserExists = async (username) => {
            const { error: createError } = await supabase_1.supabase
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
            if (createError) {
                console.error(`❌ Error ensuring user ${username}:`, createError);
                throw createError;
            }
        };
        try {
            await ensureUserExists(participant1);
            if (isGroup) {
                const members = participant2.split(",").map((m) => m.trim());
                for (const member of members) {
                    await ensureUserExists(member);
                }
            }
            else {
                await ensureUserExists(participant2);
            }
        }
        catch (err) {
            console.error("❌ Failed to ensure users exist:", err);
            return res.status(500).json({ error: "Failed to create users for chat room" });
        }
        if (isGroup) {
            const { data: userConfig } = await supabase_1.supabase
                .from("chat_users")
                .select("can_create_group")
                .eq("username", participant1)
                .single();
            if (!userConfig?.can_create_group) {
                const { data: config } = await supabase_1.supabase
                    .from("api_clients")
                    .select("allow_group_creation, max_group_size")
                    .limit(1)
                    .single();
                if (config && config.allow_group_creation === false) {
                    return res.status(403).json({ error: "Group creation is currently disabled by the administrator." });
                }
                const maxGroupSize = config?.max_group_size || 50;
                if (memberCount > maxGroupSize) {
                    return res.status(400).json({ error: `Maximum group size is currently limited to ${maxGroupSize} members.` });
                }
            }
            else {
                const { data: config } = await supabase_1.supabase.from("api_clients").select("max_group_size").limit(1).single();
                const maxGroupSize = config?.max_group_size || 50;
                if (memberCount > maxGroupSize) {
                    return res.status(400).json({ error: `Maximum group size is currently limited to ${maxGroupSize} members.` });
                }
            }
        }
        const { data, error } = await supabase_1.supabase
            .from("chat_rooms")
            .insert({
            id: roomId,
            participant_1: participant1,
            participant_2: participant2,
            is_group: isGroup || false,
            group_name: groupName || null,
            group_icon: groupIcon || null,
            member_count: memberCount || 2,
            created_by: createdBy || participant1,
            last_message: isGroup ? `${participant1} created the group` : "",
            last_message_time: new Date().toISOString(),
            last_message_sender: participant1,
            unread_count_user1: 0,
            unread_count_user2: 0,
            is_pinned_user1: false,
            is_pinned_user2: false,
            is_archived_user1: false,
            is_archived_user2: false,
            is_muted_user1: false,
            is_muted_user2: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error) {
            console.error("❌ Failed to create room:", error);
            throw error;
        }
        console.log(isGroup ? "✅ Group created successfully" : "✅ Room created successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        res.json({ room: data, created: true });
    }
    catch (error) {
        console.error("❌ createRoom error:", error);
        res.status(500).json({ error: error.message });
    }
}
async function updateGroup(req, res) {
    try {
        const { groupId, groupName, participants, memberCount } = req.body;
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔄 UPDATE GROUP");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Group ID:", groupId);
        if (groupName !== undefined) {
            console.log("New Name:", groupName);
        }
        if (participants !== undefined) {
            console.log("New Participants:", participants);
        }
        if (memberCount !== undefined) {
            console.log("New Member Count:", memberCount);
        }
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        if (!groupId) {
            return res.status(400).json({ error: "Group ID is required" });
        }
        const updates = {
            updated_at: new Date().toISOString(),
        };
        if (groupName !== undefined) {
            updates.group_name = groupName;
        }
        if (participants !== undefined) {
            updates.participant_2 = participants;
        }
        if (memberCount !== undefined) {
            const { data: config } = await supabase_1.supabase.from("api_clients").select("max_group_size").limit(1).single();
            const maxGroupSize = config?.max_group_size || 50;
            if (memberCount > maxGroupSize) {
                return res.status(400).json({ error: `Group size exceeds current limit of ${maxGroupSize}.` });
            }
            updates.member_count = memberCount;
        }
        const { data, error } = await supabase_1.supabase
            .from("chat_rooms")
            .update(updates)
            .eq("id", groupId)
            .eq("is_group", true)
            .select()
            .single();
        if (error) {
            console.error("❌ Failed to update group:", error);
            throw error;
        }
        console.log("✅ Group updated successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        res.json({ success: true, group: data });
    }
    catch (error) {
        console.error("❌ updateGroup error:", error);
        res.status(500).json({ error: error.message });
    }
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, "../../uploads");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
            console.log("📁 Created uploads directory:", uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = uniqueSuffix + path_1.default.extname(file.originalname);
        cb(null, filename);
    },
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|mp4|webm|mp3|wav/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type: ${file.mimetype}`));
        }
    },
}).single("file");
async function uploadFile(req, res) {
    upload(req, res, async (err) => {
        if (err instanceof multer_1.default.MulterError) {
            console.error("❌ Multer error:", err);
            return res.status(400).json({
                error: err.message,
                code: err.code
            });
        }
        else if (err) {
            console.error("❌ Upload error:", err);
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        try {
            const { roomId, sender, receiver } = req.body;
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📤 FILE UPLOAD");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("File:", req.file.originalname);
            console.log("Size:", (req.file.size / 1024).toFixed(2), "KB");
            console.log("Type:", req.file.mimetype);
            console.log("Room:", roomId);
            console.log("From:", sender, "→", receiver);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            if (!roomId || !sender || !receiver) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            const { data: config } = await supabase_1.supabase.from("api_clients").select("allow_media_sharing").limit(1).single();
            if (config && config.allow_media_sharing === false) {
                if (req.file) {
                    fs_1.default.unlink(req.file.path, () => { });
                }
                return res.status(403).json({ error: "Media sharing is currently disabled." });
            }
            const fileUrl = `http://localhost:4000/uploads/${req.file.filename}`;
            let messageType = "file";
            if (req.file.mimetype.startsWith("image/")) {
                messageType = "image";
            }
            else if (req.file.mimetype.startsWith("video/")) {
                messageType = "video";
            }
            else if (req.file.mimetype.startsWith("audio/")) {
                messageType = "audio";
            }
            console.log("✅ File uploaded successfully");
            console.log("URL:", fileUrl);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            res.json({
                success: true,
                file_url: fileUrl,
                file_name: req.file.originalname,
                file_size: req.file.size,
                message_type: messageType,
                mimetype: req.file.mimetype,
                roomId,
                sender,
                receiver,
            });
        }
        catch (error) {
            console.error("❌ Upload processing error:", error);
            if (req.file) {
                fs_1.default.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error("❌ Failed to delete file:", unlinkErr);
                    }
                });
            }
            res.status(500).json({ error: error.message });
        }
    });
}
async function clearChat(req, res) {
    try {
        const { roomId } = req.params;
        const { username } = req.query;
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🗑️ CLEAR CHAT (ONE-SIDED/GLOBAL)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Room ID:", roomId);
        if (username)
            console.log("Requested By:", username);
        if (!roomId)
            return res.status(400).json({ error: "Room ID is required" });
        const { data: messages, error: fetchError } = await supabase_1.supabase
            .from("zatchat")
            .select("id")
            .eq("room_id", roomId);
        if (fetchError)
            throw fetchError;
        const messageIds = messages?.map(m => m.id) || [];
        if (username && typeof username === 'string') {
            console.log(`Executing localized clear for user: ${username}`);
            if (messageIds.length > 0) {
                const { data: existing } = await supabase_1.supabase
                    .from("deleted_messages")
                    .select("message_id")
                    .eq("deleted_by", username)
                    .in("message_id", messageIds);
                const existingSet = new Set(existing?.map(e => e.message_id) || []);
                const newIds = messageIds.filter(id => !existingSet.has(id));
                if (newIds.length > 0) {
                    const insertPayload = newIds.map(id => ({
                        message_id: id,
                        deleted_by: username,
                        deleted_at: new Date().toISOString()
                    }));
                    const { error: cascadeError } = await supabase_1.supabase
                        .from("deleted_messages")
                        .insert(insertPayload);
                    if (cascadeError)
                        throw cascadeError;
                }
            }
            console.log(`✅ Successfully wiped local view of ${messageIds.length} messages.`);
        }
        else {
            console.log("Executing global physical table wipe.");
            if (messageIds.length > 0) {
                await supabase_1.supabase.from("deleted_messages").delete().in("message_id", messageIds);
            }
            const { error: deleteError } = await supabase_1.supabase.from("zatchat").delete().eq("room_id", roomId);
            if (deleteError)
                throw deleteError;
            console.log(`✅ Successfully wiped ${messageIds.length} messages and cascaded dependencies globally.`);
        }
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        res.json({ success: true, message: "Chat cleared successfully" });
    }
    catch (error) {
        console.error("❌ clearChat error:", error);
        res.status(500).json({ error: error.message });
    }
}
exports.chatController = {
    getChatHistory,
    getChatRooms,
    markAsRead,
    uploadFile,
    createRoom,
    updateGroup,
    clearChat,
};
//# sourceMappingURL=chat.controller.js.map