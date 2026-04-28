import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";

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
      const memberUsernames = room.participant_2.split(",").map((u) => u.trim());
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
        return { username, display_name: username };
      });
      const loadedMembers = await Promise.all(memberPromises);
      setMembers(loadedMembers.filter(Boolean) as GroupMember[]);
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
        body: JSON.stringify({ groupId, groupName: newGroupName.trim() }),
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
      const updatedMembers = members.filter((m) => m.username !== username).map((m) => m.username);
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
        alert("You are the last member. The group will be deleted.");
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
      <div
        className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-[10001] flex max-h-[86vh] w-[92%] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/45 bg-white/90 shadow-[0_30px_90px_rgba(2,6,23,0.35)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90">
        <div className="relative flex items-center gap-3 border-b border-slate-200/80 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-5 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.16),transparent_45%)]" />
          <button
            className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-2xl text-slate-600 transition hover:bg-white/70 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            ←
          </button>
          <h2 className="relative m-0 flex-1 text-xl font-semibold tracking-tight text-slate-800 dark:text-white">
            Group Info
          </h2>
          <button
            className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-2xl text-slate-600 transition hover:bg-white/70 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50/60 p-5 dark:from-slate-900 dark:to-slate-900">
          <div className="mb-6 rounded-2xl border border-slate-200/70 bg-white/80 p-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 text-5xl shadow-[0_10px_30px_rgba(16,185,129,0.35)]">
              {room.group_icon || "👥"}
            </div>

            {editingName && isAdmin ? (
              <div className="flex flex-col gap-3 mt-4">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={50}
                  className="mx-auto w-full max-w-xs rounded-xl border-2 border-cyan-500 bg-white px-4 py-2.5 text-center text-lg text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:bg-slate-700 dark:text-white dark:focus:ring-cyan-900/40"
                  autoFocus
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setEditingName(false)}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateGroupName}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-emerald-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h3 className="m-0 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{room.group_name}</h3>
                {isAdmin && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="cursor-pointer rounded-lg p-1.5 text-lg transition hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}

            <p className="mb-1 mt-3 text-sm text-slate-500 dark:text-slate-400">
              Group · {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
            <p className="m-0 text-xs text-slate-400 dark:text-slate-500">
              Created by {room.created_by === currentUser?.username ? "you" : room.created_by}
            </p>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="m-0 text-base font-semibold text-slate-800 dark:text-white">{members.length} Members</h4>
              {isAdmin && (
                <button
                  onClick={() => {
                    loadAvailableUsers();
                    setShowAddMembers(true);
                  }}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-emerald-600"
                >
                  + Add
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-300">
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-cyan-500 dark:border-slate-600 dark:border-t-cyan-400" />
                <p className="text-sm">Loading members...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map((member) => (
                  <div
                    key={member.username}
                    className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-100/80 p-3 transition hover:border-cyan-200 hover:bg-slate-100 dark:bg-slate-700/70 dark:hover:border-cyan-800 dark:hover:bg-slate-700"
                  >
                    <img
                      src={
                        member.profile_picture ||
                        `https://ui-avatars.com/api/?name=${member.username}&background=random`
                      }
                      alt={member.username}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-slate-900 dark:text-white">
                        {member.display_name}
                        {member.username === currentUser?.username && " (You)"}
                        {member.username === room.created_by && " 👑"}
                      </div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">@{member.username}</div>
                    </div>
                    {member.is_online && (
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                    )}
                    {isAdmin &&
                      member.username !== currentUser?.username &&
                      member.username !== room.created_by && (
                        <button
                          onClick={() => handleRemoveMember(member.username)}
                          className="flex-shrink-0 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showAddMembers && (
            <div className="mb-5 rounded-2xl border-2 border-cyan-100 bg-cyan-50/60 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/20">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="m-0 text-base font-semibold text-slate-800 dark:text-white">Add Members</h4>
                <button
                  onClick={() => setShowAddMembers(false)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-2xl text-slate-600 transition hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  ×
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto mb-3">
                {availableUsers.length === 0 ? (
                  <p className="py-5 text-center text-slate-500 dark:text-slate-400">No more users available to add</p>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.username}
                      className={`mb-1 flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition ${
                        selectedNewMembers.has(user.username)
                          ? "border-2 border-cyan-500 bg-white dark:bg-cyan-900/25"
                          : "hover:bg-white/70 dark:hover:bg-slate-700/70"
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
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900 dark:text-white">{user.display_name}</div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">@{user.username}</div>
                      </div>
                      {selectedNewMembers.has(user.username) && (
                        <span className="flex-shrink-0 text-xl font-bold text-cyan-500">✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {selectedNewMembers.size > 0 && (
                <button
                  onClick={handleAddMembers}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-emerald-600"
                >
                  Add {selectedNewMembers.size} Member{selectedNewMembers.size !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}

          <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
            <button
              onClick={handleLeaveGroup}
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 py-3.5 font-semibold text-white shadow-sm transition hover:from-rose-600 hover:to-orange-600"
            >
              🚪 Leave Group
            </button>
          </div>
        </div>
      </div>
    </>
  );
}