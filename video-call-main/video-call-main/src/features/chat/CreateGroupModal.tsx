import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";

interface CreateGroupModalProps {
  onClose: () => void;
}

interface User {
  username: string;
  display_name: string;
  profile_picture?: string;
  is_online?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export default function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const { currentUser, chatRooms, refreshRooms, setSelectedRoom } = useChat();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"select" | "name">("select");

  useEffect(() => {
    loadAvailableUsers();
  }, [chatRooms, currentUser?.username]);

  const loadAvailableUsers = () => {
    setLoading(true);
    setError("");
    const usersFromRooms = new Set<string>();
    chatRooms.forEach((room) => {
      if (!room.is_group) {
        if (
          room.other_user &&
          room.other_user !== currentUser?.username &&
          room.other_user.length > 2
        ) {
          usersFromRooms.add(room.other_user);
        }
      }
    });
    const userList: User[] = Array.from(usersFromRooms).map((username) => ({
      username,
      display_name: username,
    }));
    setAvailableUsers(userList);
    if (userList.length === 0) {
      setError("No users available. Start a chat first to add members to a group.");
    }
    setLoading(false);
  };

  const toggleUser = (username: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(username)) {
        newSet.delete(username);
      } else {
        newSet.add(username);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (selectedUsers.size < 2) {
      setError("Please select at least 2 members");
      return;
    }
    setError("");
    setStep("name");
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (selectedUsers.size < 2) {
      setError("Please select at least 2 members");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const timestamp = Date.now();
      const groupId = `group_${currentUser?.username}_${timestamp}`;
      const allParticipants = [
        currentUser?.username,
        ...Array.from(selectedUsers),
      ].filter(Boolean);
      const roomRes = await fetch(`${API_URL}/api/v1/chats/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: groupId,
          participant1: currentUser?.username,
          participant2: allParticipants.join(","),
          isGroup: true,
          groupName: groupName.trim(),
          groupIcon: getGroupIcon(groupName),
          memberCount: allParticipants.length,
          createdBy: currentUser?.username,
        }),
      });
      if (!roomRes.ok) {
        const errorData = await roomRes.json();
        throw new Error(errorData.error || "Failed to create group");
      }
      await roomRes.json();
      socket.emit("new_group_created", {
        groupId,
        groupName: groupName.trim(),
        members: allParticipants,
        creator: currentUser?.username,
      });
      onClose();
      await refreshRooms();
      setTimeout(() => {
        setSelectedRoom(groupId);
      }, 800);
      alert(`✅ Group "${groupName}" created with ${allParticipants.length} members!`);
    } catch (err: any) {
      console.error("❌ Failed to create group:", err);
      setError(err.message || "Failed to create group. Please try again.");
      setLoading(false);
    }
  };

  const getGroupIcon = (name: string): string => {
    const icons = ["👥", "🎉", "💼", "🎓", "🏆", "🌟", "🚀", "💡"];
    const index = name.length % icons.length;
    return icons[index];
  };

  const filteredUsers = availableUsers.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[10000]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-md max-h-[85vh] flex flex-col z-[10001] overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          {step === "name" && (
            <button
              className="text-2xl cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 w-9 h-9 rounded flex items-center justify-center"
              onClick={() => setStep("select")}
            >
              ←
            </button>
          )}
          <h2 className="flex-1 m-0 text-xl font-semibold text-gray-800 dark:text-white">
            {step === "select" ? "Add Group Members" : "Group Name"}
          </h2>
          <button
            className="text-2xl cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 w-9 h-9 rounded flex items-center justify-center"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {step === "select" && (
          <>
            <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-gray-800">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p>Loading users...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {selectedUsers.size > 0 && (
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4 text-sm font-semibold text-blue-600 dark:text-blue-300 text-center">
                      {selectedUsers.size} member{selectedUsers.size !== 1 ? "s" : ""} selected
                    </div>
                  )}

                  <div className="max-h-[350px] overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <div className="text-7xl mb-4 opacity-50">👥</div>
                        <p className="text-base font-medium text-gray-600 dark:text-gray-300">No users found</p>
                        <span className="text-sm text-gray-400">
                          {availableUsers.length === 0
                            ? "Start a chat to add users to groups"
                            : "Try a different search term"}
                        </span>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.username}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition mb-1 ${
                            selectedUsers.has(user.username)
                              ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => toggleUser(user.username)}
                        >
                          <img
                            src={
                              user.profile_picture ||
                              `https://ui-avatars.com/api/?name=${user.username}&background=random`
                            }
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">{user.display_name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.username}</div>
                          </div>
                          {selectedUsers.has(user.username) && (
                            <span className="text-blue-500 text-2xl font-bold flex-shrink-0">✓</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
              {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-sm font-medium">{error}</div>}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <button
                className="flex-1 py-3.5 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3.5 px-6 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleNext}
                disabled={selectedUsers.size < 2 || loading}
              >
                Next {selectedUsers.size > 0 && `(${selectedUsers.size})`}
              </button>
            </div>
          </>
        )}

        {step === "name" && (
          <>
            <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-gray-800">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-lg">
                  {getGroupIcon(groupName || "Group")}
                </div>
              </div>
              <div className="mb-8 relative">
                <label htmlFor="groupName" className="block mb-2 font-medium text-sm text-gray-700 dark:text-gray-300">
                  Group Name
                </label>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter group name"
                  maxLength={50}
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <span className="absolute right-0 bottom-[-24px] text-xs text-gray-400">{groupName.length}/50</span>
              </div>
              <div className="mt-4">
                <h4 className="m-0 mb-3 text-sm text-gray-600 dark:text-gray-400 font-semibold">
                  Members ({selectedUsers.size + 1})
                </h4>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3.5 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold">You (Admin)</div>
                  {Array.from(selectedUsers).map((username) => (
                    <div key={username} className="px-3.5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full text-sm font-medium">
                      {username}
                    </div>
                  ))}
                </div>
              </div>
              {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-sm font-medium">{error}</div>}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <button
                className="flex-1 py-3.5 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                onClick={() => setStep("select")}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="flex-1 py-3.5 px-6 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateGroup}
                disabled={loading || !groupName.trim()}
              >
                {loading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}