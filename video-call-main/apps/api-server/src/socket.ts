import { Server, Socket } from "socket.io";
import { supabase } from "./config/supabase";

interface UserSocket {
  socketId: string;
  username: string;
}

export function initSocket(io: Server) {
  console.log("🔌 Socket.io server initialized");

  const onlineUsers = new Map<string, string>(); // username -> socketId
  const typingUsers = new Map<string, Set<string>>(); // roomId -> Set of usernames

  io.on("connection", (socket: Socket) => {
    console.log("✅ New connection:", socket.id);

    /* ================= USER JOIN ================= */
    socket.on("user_join", async ({ username }) => {
      if (!username) return;
      console.log(`👤 User joined: ${username}`);

      // Store user's socket
      onlineUsers.set(username, socket.id);

      // Update online status in database
      try {
        await supabase
          .from("chat_users")
          .upsert({
            username,
            is_online: true,
            last_seen: new Date().toISOString(),
          });

        // Notify all users that this user is online
        io.emit("user_online", { username });
      } catch (err) {
        console.error("❌ Error updating user status:", err);
      }
    });

    /* ================= JOIN ROOM ================= */
    socket.on("join_room", (roomId: string) => {
      console.log(`➡️  Socket ${socket.id} joining room: ${roomId}`);
      socket.join(roomId);
      console.log(`✅ Socket joined room: ${roomId}`);
    });

    /* ================= LEAVE ROOM ================= */
    socket.on("leave_room", (roomId: string) => {
      console.log(`⬅️  Socket ${socket.id} leaving room: ${roomId}`);
      socket.leave(roomId);
    });

    /* ================= NEW GROUP CREATED ================= */
    socket.on("new_group_created", async ({ groupId, groupName, members, creator }: any) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🎉 NEW GROUP CREATED");
      console.log("━━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━");
      console.log("Group:", groupName);
      console.log("ID:", groupId);
      console.log("Creator:", creator);
      console.log("Members:", members);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // Notify all members about the new group
      if (Array.isArray(members)) {
        members.forEach((member: string) => {
          const memberSocket = onlineUsers.get(member);
          if (memberSocket) {
            io.to(memberSocket).emit("new_group_created", {
              groupId,
              groupName,
              creator,
              memberCount: members.length,
            });
            console.log(`✅ Notified ${member} about new group`);
          } else {
            console.log(`⚠️  ${member} is offline, will see group on next login`);
          }
        });
      }

      // Also emit to the room itself
      io.to(groupId).emit("new_group_created", {
        groupId,
        groupName,
        creator,
        memberCount: members.length,
      });

      console.log("✅ Group creation notifications sent");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    });

    /* ================= MEMBER REMOVED FROM GROUP ================= */
    socket.on("member_removed", async ({ groupId, removedUser, groupName }: any) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("👋 MEMBER REMOVED FROM GROUP");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Group:", groupName);
      console.log("Group ID:", groupId);
      console.log("Removed User:", removedUser);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // Notify the removed user
      const memberSocket = onlineUsers.get(removedUser);
      if (memberSocket) {
        io.to(memberSocket).emit("removed_from_group", {
          groupId,
          groupName,
        });
        console.log(`✅ Notified ${removedUser} they were removed`);
      } else {
        console.log(`⚠️  ${removedUser} is offline`);
      }
      
      // Notify other members in the group
      io.to(groupId).emit("group_member_removed", {
        groupId,
        removedUser,
        groupName,
      });
      console.log(`✅ Notified group members about removal`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    });

    /* ================= MEMBERS ADDED TO GROUP ================= */
    socket.on("members_added", async ({ groupId, groupName, newMembers, addedBy }: any) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("➕ MEMBERS ADDED TO GROUP");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Group:", groupName);
      console.log("Group ID:", groupId);
      console.log("New Members:", newMembers.join(", "));
      console.log("Added By:", addedBy);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // Notify new members
      if (Array.isArray(newMembers)) {
        newMembers.forEach((member: string) => {
          const memberSocket = onlineUsers.get(member);
          if (memberSocket) {
            io.to(memberSocket).emit("added_to_group", {
              groupId,
              groupName,
              addedBy,
            });
            console.log(`✅ Notified ${member} they were added`);
          } else {
            console.log(`⚠️  ${member} is offline`);
          }
        });
      }
      
      // Notify existing members
      io.to(groupId).emit("group_members_added", {
        groupId,
        groupName,
        newMembers,
        addedBy,
      });
      console.log(`✅ Notified existing group members`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    });

    /* ================= MEMBER LEFT GROUP ================= */
    socket.on("member_left", async ({ groupId, username, groupName }: any) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🚪 MEMBER LEFT GROUP");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Group:", groupName);
      console.log("Group ID:", groupId);
      console.log("Left User:", username);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // Notify other members in the group
      io.to(groupId).emit("group_member_left", {
        groupId,
        groupName,
        username,
      });
      console.log(`✅ Notified group members that ${username} left`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    });

    /* ================= GROUP NAME UPDATED ================= */
    socket.on("group_name_updated", async ({ groupId, newName, updatedBy }: any) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✏️ GROUP NAME UPDATED");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Group ID:", groupId);
      console.log("New Name:", newName);
      console.log("Updated By:", updatedBy);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // Notify all members in the group
      io.to(groupId).emit("group_name_updated", {
        groupId,
        newName,
        updatedBy,
      });
      console.log(`✅ Notified group members about name change`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    });

    /* ================= SEND MESSAGE ================= */
    socket.on("send_message", async (payload) => {
      console.log("📨 SEND_MESSAGE:", payload);

      const { roomId, sender, receiver, message, reply_to_id } = payload;

      if (!roomId || !sender || !receiver || !message) {
        console.error("❌ Invalid payload");
        return;
      }

      try {
        // Ensure room exists
        await ensureRoomExists(roomId, sender, receiver);

        // Insert message
        const { data, error } = await supabase
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

        if (error) throw error;

        console.log("✅ Message saved:", data.id);

        // Update room
        await updateRoom(roomId, message, sender);

        // Broadcast to room
        io.to(roomId).emit("receive_message", data);

        // Notify room update
        io.emit("room_updated", {
          roomId,
          lastMessage: message.substring(0, 50),
          sender,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error("❌ send_message error:", err);
        socket.emit("error", { message: err.message });
      }
    });

    /* ================= SEND FILE ================= */
    socket.on("send_file", async (payload) => {
      console.log("📁 SEND_FILE:", payload);

      const { roomId, sender, receiver, message_type, file_url, file_name, file_size } = payload;

      if (!roomId || !sender || !receiver || !file_url) {
        console.error("❌ Invalid file payload");
        return;
      }

      try {
        // Ensure room exists
        await ensureRoomExists(roomId, sender, receiver);

        // Insert file message
        const { data, error } = await supabase
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

        if (error) throw error;

        console.log("✅ File message saved:", data.id);

        // Update room
        const displayMessage = message_type === "image" ? "📷 Photo" : "📎 File";
        await updateRoom(roomId, displayMessage, sender);

        // Broadcast to room
        io.to(roomId).emit("receive_message", data);

        // Notify room update
        io.emit("room_updated", {
          roomId,
          lastMessage: displayMessage,
          sender,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error("❌ send_file error:", err);
        socket.emit("error", { message: err.message });
      }
    });

    /* ================= TYPING INDICATOR ================= */
    socket.on("typing", ({ roomId, sender }) => {
      if (!roomId || !sender) return;

      // Add user to typing set for this room
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      typingUsers.get(roomId)!.add(sender);

      // Broadcast to others in room
      socket.to(roomId).emit("typing", { sender, roomId });
      console.log(`⌨️  ${sender} is typing in ${roomId}`);
    });

    socket.on("stop_typing", ({ roomId, sender }) => {
      if (!roomId || !sender) return;

      // Remove user from typing set
      if (typingUsers.has(roomId)) {
        typingUsers.get(roomId)!.delete(sender);
        if (typingUsers.get(roomId)!.size === 0) {
          typingUsers.delete(roomId);
        }
      }

      // Broadcast to others in room
      socket.to(roomId).emit("stop_typing", { sender, roomId });
      console.log(`⌨️  ${sender} stopped typing in ${roomId}`);
    });

    /* ================= MESSAGE SEEN ================= */
    socket.on("message_seen", async ({ roomId, viewer, messageIds }) => {
      if (!roomId || !viewer) return;

      try {
        let query = supabase
          .from("zatchat")
          .update({ is_seen: true, is_delivered: true })
          .eq("room_id", roomId)
          .neq("sender_name", viewer)
          .eq("is_seen", false);

        if (messageIds && messageIds.length > 0) {
          query = query.in("id", messageIds);
        }

        const { data } = await query.select("id");

        if (data?.length) {
          const seenIds = data.map((m) => m.id);
          io.to(roomId).emit("message_seen", { messageIds: seenIds });
          console.log(`✓✓ ${viewer} saw ${seenIds.length} messages in ${roomId}`);
        }
      } catch (err) {
        console.error("❌ message_seen error:", err);
      }
    });

    /* ================= MESSAGE DELIVERED ================= */
    socket.on("message_delivered", async ({ roomId, messageId }) => {
      if (!roomId || !messageId) return;

      try {
        await supabase
          .from("zatchat")
          .update({ is_delivered: true })
          .eq("id", messageId);

        io.to(roomId).emit("message_delivered", { messageId });
      } catch (err) {
        console.error("❌ message_delivered error:", err);
      }
    });

    /* ================= DELETE MESSAGE ================= */
    socket.on("delete_message", async ({ messageId, username, deleteFor, roomId }) => {
      if (!messageId || !username || !deleteFor) return;

      try {
        // Fetch the message content first to see if it matches the room's last_message
        const { data: msgData } = await supabase.from("zatchat").select("message, message_type").eq("id", messageId).single();

        if (deleteFor === "everyone") {
          await supabase
            .from("zatchat")
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString(),
              deleted_for: "everyone",
            })
            .eq("id", messageId);

          io.to(roomId).emit("message_deleted", { messageId, deleteFor: "everyone" });
          
          // Cross-verify sidebar caching overlap
          if (msgData) {
             const displayMatch = msgData.message ? msgData.message.substring(0, 100) : msgData.message_type === "image" ? "📷 Photo" : "📎 File";
             const { data: roomData } = await supabase.from("chat_rooms").select("last_message").eq("id", roomId).single();
             
             if (roomData && roomData.last_message === displayMatch) {
               await supabase.from("chat_rooms").update({ last_message: "🚫 This message was deleted" }).eq("id", roomId);
               io.emit("room_updated", { roomId, lastMessage: "🚫 This message was deleted", sender: username, timestamp: new Date().toISOString() });
             }
          }
        } else {
          await supabase.from("deleted_messages").insert({
            message_id: messageId,
            deleted_by: username,
            deleted_for: "me",
          });

          socket.emit("message_deleted", { messageId, deleteFor: "me" });
        }
      } catch (err) {
        console.error("❌ delete_message error:", err);
      }
    });

    /* ================= FORWARD MESSAGE ================= */
    socket.on("forward_message", async ({ messages, toRooms }) => {
      try {
        for (const room of toRooms) {
          for (const msg of messages) {
            io.to(room.roomId).emit("receive_message", msg);
          }
        }
      } catch (err) {
        console.error("❌ forward_message error:", err);
      }
    });

    /* ================= DISCONNECT ================= */
    socket.on("disconnect", async () => {
      console.log("❌ Socket disconnected:", socket.id);

      // Find username by socket ID
      let disconnectedUser = "";
      for (const [username, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUser = username;
          break;
        }
      }

      if (disconnectedUser) {
        onlineUsers.delete(disconnectedUser);

        // Update database
        try {
          await supabase
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
        } catch (err) {
          console.error("❌ Error updating offline status:", err);
        }
      }
    });
  });

  // Helper functions
  async function ensureRoomExists(roomId: string, sender: string, receiver: string) {
    const { data: existing } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("id", roomId)
      .single();

    if (!existing) {
      const participants = [sender, receiver].sort();
      await supabase.from("chat_rooms").insert({
        id: roomId,
        participant_1: participants[0],
        participant_2: participants[1],
        last_message: "",
        last_message_time: new Date().toISOString(),
        last_message_sender: sender,
        unread_count_user1: 0,
        unread_count_user2: 0,
      });
      console.log("✅ Room created:", roomId);
    }
  }

  async function updateRoom(roomId: string, message: string, sender: string) {
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (room) {
      const isUser1 = room.participant_1 === sender;
      const unreadField = isUser1 ? "unread_count_user2" : "unread_count_user1";

      await supabase
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