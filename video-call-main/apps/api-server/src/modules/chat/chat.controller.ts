import { Request, Response } from "express";
import { supabase } from "../../config/supabase";
import multer from "multer";
import path from "path";
import fs from "fs";

/* ================= GET CHAT HISTORY ================= */
export async function getChatHistory(req: Request, res: Response) {
  try {
    const { roomId } = req.params;
    const { username } = req.query;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📥 GET CHAT HISTORY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Room ID:", roomId);
    console.log("Username:", username);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    // Get all messages for this room
    const { data: messages, error: messagesError } = await supabase
      .from("zatchat")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("❌ Database error:", messagesError);
      throw messagesError;
    }

    let filteredMessages = messages || [];

    // If username provided, filter deleted messages
    if (username && typeof username === "string") {
      console.log("🔍 Filtering deleted messages for:", username);

      // Get messages deleted by this user
      const { data: deletedByUser, error: deletedError } = await supabase
        .from("deleted_messages")
        .select("message_id")
        .eq("deleted_by", username);

      if (deletedError) {
        console.error("⚠️ Error fetching deleted messages:", deletedError);
      }

      const deletedIds = new Set(deletedByUser?.map((d) => d.message_id) || []);

      console.log(`🗑️ User has ${deletedIds.size} deleted messages`);

      // Filter messages
      filteredMessages = filteredMessages.filter((msg) => {
        // Hide if deleted for everyone
        if (msg.is_deleted && msg.deleted_for === "everyone") {
          return false;
        }

        // Hide if deleted by this user "for me"
        if (deletedIds.has(msg.id)) {
          return false;
        }

        return true;
      });
    } else {
      // No username - just filter messages deleted for everyone
      filteredMessages = filteredMessages.filter(
        (msg) => !(msg.is_deleted && msg.deleted_for === "everyone")
      );
    }

    console.log(`✅ Returning ${filteredMessages.length} messages (from ${messages?.length || 0} total)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    res.json(filteredMessages);
  } catch (error: any) {
    console.error("❌ getChatHistory error:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= GET CHAT ROOMS (FIXED FOR GROUPS) ================= */
export async function getChatRooms(req: Request, res: Response) {
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

    // ✅ FIXED: Get all rooms where user is participant_1 OR participant_2 contains the username
    // For groups, participant_2 is a comma-separated string like "aaa,bbb,ccc"
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("*")
      .or(`participant_1.eq.${username},participant_2.like.%${username}%`)
      .order("last_message_time", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    // ✅ Filter to ensure username is actually in the participants (not just a substring)
    const filteredData = (data || []).filter((room) => {
      if (room.participant_1 === username) return true;
      
      // For groups or 1-1 chats, check if username is in participant_2
      if (room.participant_2) {
        const participants = room.participant_2.split(",").map((p: string) => p.trim());
        return participants.includes(username);
      }
      
      return false;
    });

    const processedRooms = filteredData.map((room) => {
      // ✅ Check if this is a group
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

      // ✅ Regular 1-1 chat
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
  } catch (error: any) {
    console.error("❌ getChatRooms error:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= MARK AS READ ================= */
export async function markAsRead(req: Request, res: Response) {
  try {
    const { roomId, username } = req.params;

    console.log(`✓✓ Marking messages as read for ${username} in ${roomId}`);

    if (!roomId || !username) {
      return res.status(400).json({ error: "Room ID and username are required" });
    }

    // Update messages - NO updated_at field in zatchat table
    const { error: msgError } = await supabase
      .from("zatchat")
      .update({ 
        is_seen: true, 
        is_delivered: true
      })
      .eq("room_id", roomId)
      .eq("receiver_name", username)
      .eq("is_seen", false);

    if (msgError) {
      console.error("❌ Error updating messages:", msgError);
      throw msgError;
    }

    // Update room unread count
    const { data: room, error: roomFetchError } = await supabase
      .from("chat_rooms")
      .select("participant_1, participant_2")
      .eq("id", roomId)
      .single();

    if (roomFetchError) {
      console.error("❌ Error fetching room:", roomFetchError);
    } else if (room) {
      const field =
        room.participant_1 === username
          ? "unread_count_user1"
          : "unread_count_user2";

      // chat_rooms table DOES have updated_at
      const { error: updateError } = await supabase
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
  } catch (error: any) {
    console.error("❌ markAsRead error:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= CREATE ROOM (UPDATED FOR GROUPS) ================= */
export async function createRoom(req: Request, res: Response) {
  try {
    const { 
      roomId, 
      participant1, 
      participant2,
      isGroup,
      groupName,
      groupIcon,
      memberCount,
      createdBy
    } = req.body;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🏠 CREATE/CHECK ROOM");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Room ID:", roomId);
    console.log("Is Group:", isGroup);
    if (isGroup) {
      console.log("Group Name:", groupName);
      console.log("Members:", participant2);
      console.log("Member Count:", memberCount);
    } else {
      console.log("Participants:", participant1, "↔️", participant2);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!roomId || !participant1 || !participant2) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if room exists
    const { data: existing, error: fetchError } = await supabase
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

    // Create new room (works for both 1-1 and group)
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        id: roomId,
        participant_1: participant1,
        participant_2: participant2, // For groups, this contains comma-separated members
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
  } catch (error: any) {
    console.error("❌ createRoom error:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= UPDATE GROUP ================= */
export async function updateGroup(req: Request, res: Response) {
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

    // Build updates object dynamically
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (groupName !== undefined) {
      updates.group_name = groupName;
    }

    if (participants !== undefined) {
      updates.participant_2 = participants;
    }

    if (memberCount !== undefined) {
      updates.member_count = memberCount;
    }

    const { data, error } = await supabase
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
  } catch (error: any) {
    console.error("❌ updateGroup error:", error);
    res.status(500).json({ error: error.message });
  }
}

/* ================= FILE UPLOAD SETUP ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("📁 Created uploads directory:", uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|mp4|webm|mp3|wav/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
}).single("file");

/* ================= FILE UPLOAD ================= */
export async function uploadFile(req: Request, res: Response) {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("❌ Multer error:", err);
      return res.status(400).json({ 
        error: err.message,
        code: err.code 
      });
    } else if (err) {
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

      const fileUrl = `http://localhost:4000/uploads/${req.file.filename}`;
      
      let messageType = "file";
      if (req.file.mimetype.startsWith("image/")) {
        messageType = "image";
      } else if (req.file.mimetype.startsWith("video/")) {
        messageType = "video";
      } else if (req.file.mimetype.startsWith("audio/")) {
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
    } catch (error: any) {
      console.error("❌ Upload processing error:", error);
      
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) {
            console.error("❌ Failed to delete file:", unlinkErr);
          }
        });
      }

      res.status(500).json({ error: error.message });
    }
  });
}

/* ================= EXPORT ALL ================= */
export const chatController = {
  getChatHistory,
  getChatRooms,
  markAsRead,
  uploadFile,
  createRoom,
  updateGroup,
};