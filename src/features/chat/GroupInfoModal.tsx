import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import "./GroupInfoModal.css";

interface GroupInfoModalProps {
  groupId: string;
  onClose: () => void;
}

interface GroupMember {
  username: string;
  display_name: string;
  profile_picture?: string;
  is_online?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export default function GroupInfoModal({ groupId, onClose }: GroupInfoModalProps) {
  const { currentUser, chatRooms, refreshRooms, setSelectedRoom } = useChat();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<GroupMember[]>([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState<Set<string>>(new Set());

  const room = chatRooms.find((r) => r.id === groupId);
  const isAdmin = room?.created_by === currentUser?.username;

  useEffect(() => {
    if (room) {
      setNewGroupName(room.group_name || "");
      loadGroupMembers();
    }
  }, [room]);

  const loadGroupMembers = async () => {
    if (!room?.participant_2) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // participant_2 contains comma-separated usernames
      const memberUsernames = room.participant_2.split(",").map((u) => u.trim());
      
      console.log("📋 Loading members:", memberUsernames);

      // Fetch user details for each member
      const memberPromises = memberUsernames.map(async (username) => {
        try {
          const res = await fetch(`${API_URL}/api/v1/users/${username}`);
          if (res.ok) {
            const userData = await res.json();
            return {
              username: userData.username,
              display_name: userData.display_name || userData.username,
              profile_picture: userData.profile_picture,
              is_online: userData.is_online,
            };
          }
        } catch (err) {
          console.error(`Failed to load user ${username}:`, err);
        }
        return {
          username,
          display_name: username,
        };
      });

      const loadedMembers = await Promise.all(memberPromises);
      setMembers(loadedMembers.filter(Boolean) as GroupMember[]);
      console.log("✅ Members loaded:", loadedMembers.length);
    } catch (err) {
      console.error("❌ Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/users`);
      if (response.ok) {
        const allUsers = await response.json();
        
        // Filter out current members and current user
        const currentMemberUsernames = members.map((m) => m.username);
        const filtered = allUsers
          .filter(
            (u: any) =>
              !currentMemberUsernames.includes(u.username) &&
              u.username !== currentUser?.username
          )
          .map((u: any) => ({
            username: u.username,
            display_name: u.display_name || u.username,
            profile_picture: u.profile_picture,
            is_online: u.is_online,
          }));

        setAvailableUsers(filtered);
      }
    } catch (err) {
      console.error("Failed to load available users:", err);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || !isAdmin) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/chats/update-group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          groupName: newGroupName.trim(),
        }),
      });

      if (res.ok) {
        await refreshRooms();
        setEditingName(false);
        alert("✅ Group name updated!");
      }
    } catch (err) {
      console.error("Failed to update group name:", err);
      alert("❌ Failed to update group name");
    }
  };

  const handleRemoveMember = async (username: string) => {
    if (!isAdmin) return;

    if (!confirm(`Remove ${username} from the group?`)) return;

    try {
      const updatedMembers = members
        .filter((m) => m.username !== username)
        .map((m) => m.username);

      const res = await fetch(`${API_URL}/api/v1/chats/update-group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          participants: updatedMembers.join(","),
          memberCount: updatedMembers.length,
        }),
      });

      if (res.ok) {
        // Notify removed member
        socket.emit("member_removed", {
          groupId,
          removedUser: username,
          groupName: room?.group_name,
        });

        await refreshRooms();
        loadGroupMembers();
        alert(`✅ ${username} removed from group`);
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
      alert("❌ Failed to remove member");
    }
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.size === 0) return;

    try {
      const currentMembers = members.map((m) => m.username);
      const newMembers = Array.from(selectedNewMembers);
      const allMembers = [...currentMembers, ...newMembers];

      const res = await fetch(`${API_URL}/api/v1/chats/update-group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          participants: allMembers.join(","),
          memberCount: allMembers.length,
        }),
      });

      if (res.ok) {
        // Notify new members
        socket.emit("members_added", {
          groupId,
          groupName: room?.group_name,
          newMembers,
          addedBy: currentUser?.username,
        });

        await refreshRooms();
        loadGroupMembers();
        setShowAddMembers(false);
        setSelectedNewMembers(new Set());
        alert(`✅ ${newMembers.length} member(s) added!`);
      }
    } catch (err) {
      console.error("Failed to add members:", err);
      alert("❌ Failed to add members");
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;

    try {
      const updatedMembers = members
        .filter((m) => m.username !== currentUser?.username)
        .map((m) => m.username);

      if (updatedMembers.length === 0) {
        // Last member leaving - delete group
        alert("You are the last member. The group will be deleted.");
        // TODO: Implement group deletion
        setSelectedRoom(null);
        await refreshRooms();
        onClose();
        return;
      }

      const res = await fetch(`${API_URL}/api/v1/chats/update-group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          participants: updatedMembers.join(","),
          memberCount: updatedMembers.length,
        }),
      });

      if (res.ok) {
        socket.emit("member_left", {
          groupId,
          username: currentUser?.username,
          groupName: room?.group_name,
        });

        setSelectedRoom(null);
        await refreshRooms();
        onClose();
        alert("✅ You left the group");
      }
    } catch (err) {
      console.error("Failed to leave group:", err);
      alert("❌ Failed to leave group");
    }
  };

  if (!room || !room.is_group) {
    return null;
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="group-info-modal">
        {/* Header */}
        <div className="modal-header">
          <button className="back-btn" onClick={onClose}>
            ←
          </button>
          <h2>Group Info</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Group Icon & Name */}
          <div className="group-header-section">
            <div className="group-icon-display">{room.group_icon || "👥"}</div>
            
            {editingName && isAdmin ? (
              <div className="edit-name-section">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={50}
                  className="group-name-input"
                  autoFocus
                />
                <div className="edit-name-actions">
                  <button onClick={() => setEditingName(false)} className="cancel-btn-small">
                    Cancel
                  </button>
                  <button onClick={handleUpdateGroupName} className="save-btn-small">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="group-name-display">
                <h3>{room.group_name}</h3>
                {isAdmin && (
                  <button onClick={() => setEditingName(true)} className="edit-icon-btn">
                    ✏️
                  </button>
                )}
              </div>
            )}

            <p className="group-meta">
              Group · {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
            <p className="group-created">
              Created by {room.created_by === currentUser?.username ? "you" : room.created_by}
            </p>
          </div>

          {/* Members Section */}
          <div className="members-section">
            <div className="section-header">
              <h4>{members.length} Members</h4>
              {isAdmin && (
                <button
                  onClick={() => {
                    loadAvailableUsers();
                    setShowAddMembers(true);
                  }}
                  className="add-members-btn"
                >
                  + Add
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading members...</p>
              </div>
            ) : (
              <div className="members-list">
                {members.map((member) => (
                  <div key={member.username} className="member-item">
                    <img
                      src={
                        member.profile_picture ||
                        `https://ui-avatars.com/api/?name=${member.username}&background=random`
                      }
                      alt={member.username}
                      className="member-avatar"
                    />
                    <div className="member-info">
                      <div className="member-name">
                        {member.display_name}
                        {member.username === currentUser?.username && " (You)"}
                        {member.username === room.created_by && " 👑"}
                      </div>
                      <div className="member-username">@{member.username}</div>
                    </div>
                    {member.is_online && <span className="online-dot"></span>}
                    {isAdmin &&
                      member.username !== currentUser?.username &&
                      member.username !== room.created_by && (
                        <button
                          onClick={() => handleRemoveMember(member.username)}
                          className="remove-member-btn"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Members Panel */}
          {showAddMembers && (
            <div className="add-members-panel">
              <div className="panel-header">
                <h4>Add Members</h4>
                <button onClick={() => setShowAddMembers(false)} className="close-panel-btn">
                  ×
                </button>
              </div>
              
              <div className="available-users-list">
                {availableUsers.length === 0 ? (
                  <p className="no-users-msg">No more users available to add</p>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.username}
                      className={`user-select-item ${
                        selectedNewMembers.has(user.username) ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedNewMembers((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(user.username)) {
                            newSet.delete(user.username);
                          } else {
                            newSet.add(user.username);
                          }
                          return newSet;
                        });
                      }}
                    >
                      <img
                        src={
                          user.profile_picture ||
                          `https://ui-avatars.com/api/?name=${user.username}&background=random`
                        }
                        alt={user.username}
                        className="user-select-avatar"
                      />
                      <div className="user-select-info">
                        <div className="user-select-name">{user.display_name}</div>
                        <div className="user-select-username">@{user.username}</div>
                      </div>
                      {selectedNewMembers.has(user.username) && (
                        <span className="check-icon">✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {selectedNewMembers.size > 0 && (
                <button onClick={handleAddMembers} className="confirm-add-btn">
                  Add {selectedNewMembers.size} Member{selectedNewMembers.size !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="group-actions">
            <button onClick={handleLeaveGroup} className="leave-group-btn">
              🚪 Leave Group
            </button>
          </div>
        </div>
      </div>
    </>
  );
}