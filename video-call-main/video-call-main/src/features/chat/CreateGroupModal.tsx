import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import "./CreateGroupModal.css";

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

  // ✅ FIX: Disable blur on parent elements when modal opens
  useEffect(() => {
    const originalBodyFilter = document.body.style.filter;
    const originalBodyBackdrop = document.body.style.backdropFilter;
    
    document.body.style.filter = 'none';
    document.body.style.backdropFilter = 'none';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    const chatLayout = document.querySelector('.chat-layout') as HTMLElement;
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    const originalLayoutFilter = chatLayout?.style.filter;
    const originalLayoutBackdrop = chatLayout?.style.backdropFilter;
    const originalSidebarFilter = sidebar?.style.filter;
    const originalSidebarBackdrop = sidebar?.style.backdropFilter;
    
    if (chatLayout) {
      chatLayout.style.filter = 'none';
      chatLayout.style.backdropFilter = 'none';
    }
    
    if (sidebar) {
      sidebar.style.filter = 'none';
      sidebar.style.backdropFilter = 'none';
    }

    return () => {
      document.body.style.filter = originalBodyFilter;
      document.body.style.backdropFilter = originalBodyBackdrop;
      document.body.style.overflow = '';
      
      if (chatLayout) {
        chatLayout.style.filter = originalLayoutFilter || '';
        chatLayout.style.backdropFilter = originalLayoutBackdrop || '';
      }
      
      if (sidebar) {
        sidebar.style.filter = originalSidebarFilter || '';
        sidebar.style.backdropFilter = originalSidebarBackdrop || '';
      }
    };
  }, []);

  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("🔍 Loading available users...");
      console.log("Current user:", currentUser?.username);
      console.log("Chat rooms:", chatRooms.length);

      const usersFromRooms = new Set<string>();
      
      chatRooms.forEach((room) => {
        console.log("Processing room:", room);
        
        if (room.is_group) {
          return;
        }
        
        if (room.other_user && room.other_user !== currentUser?.username) {
          usersFromRooms.add(room.other_user);
        }
        
        if (room.participant_1 && room.participant_1 !== currentUser?.username) {
          usersFromRooms.add(room.participant_1);
        }
        if (room.participant_2 && room.participant_2 !== currentUser?.username) {
          usersFromRooms.add(room.participant_2);
        }
      });

      console.log("Users from rooms:", Array.from(usersFromRooms));

      try {
        const response = await fetch(`${API_URL}/api/v1/users`);
        
        if (response.ok) {
          const allUsers = await response.json();
          console.log("✅ Users from API:", allUsers);
          
          const filteredUsers = allUsers
            .filter((u: any) => u.username !== currentUser?.username)
            .map((u: any) => ({
              username: u.username,
              display_name: u.display_name || u.username,
              profile_picture: u.profile_picture,
              is_online: u.is_online,
            }));

          setAvailableUsers(filteredUsers);
          console.log("✅ Loaded", filteredUsers.length, "users");
          
          if (filteredUsers.length === 0) {
            setError("No other users found. Create more accounts to make groups.");
          }
          
          setLoading(false);
          return;
        } else {
          console.warn("⚠️ API returned:", response.status, response.statusText);
        }
      } catch (apiError) {
        console.error("❌ Failed to fetch from API:", apiError);
      }

      const userList: User[] = Array.from(usersFromRooms).map((username) => ({
        username,
        display_name: username,
      }));

      setAvailableUsers(userList);
      console.log("✅ Loaded", userList.length, "users from rooms");
      
      if (userList.length === 0) {
        setError("No users available. Start a chat first to add members to a group.");
      }
    } catch (err) {
      console.error("❌ Failed to load users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
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

      console.log("🏠 Creating group:", {
        groupId,
        name: groupName,
        members: Array.from(selectedUsers),
        creator: currentUser?.username,
      });

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

      const result = await roomRes.json();
      console.log("✅ Group created:", result);

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
      <div className="modal-overlay" onClick={onClose} />
      <div className="create-group-modal">
        <div className="modal-header">
          {step === "name" && (
            <button className="back-btn" onClick={() => setStep("select")}>
              ←
            </button>
          )}
          <h2>
            {step === "select" ? "Add Group Members" : "Group Name"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {step === "select" && (
          <>
            <div className="modal-body">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : (
                <>
                  <div className="search-container">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="search-input"
                    />
                  </div>

                  {selectedUsers.size > 0 && (
                    <div className="selected-count">
                      {selectedUsers.size} member{selectedUsers.size !== 1 ? "s" : ""}{" "}
                      selected
                    </div>
                  )}

                  <div className="users-list">
                    {filteredUsers.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <p>No users found</p>
                        <span>
                          {availableUsers.length === 0
                            ? "Start a chat to add users to groups"
                            : "Try a different search term"}
                        </span>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.username}
                          className={`user-item ${
                            selectedUsers.has(user.username) ? "selected" : ""
                          }`}
                          onClick={() => toggleUser(user.username)}
                        >
                          <img
                            src={
                              user.profile_picture ||
                              `https://ui-avatars.com/api/?name=${user.username}&background=random`
                            }
                            alt={user.username}
                            className="user-avatar"
                          />
                          <div className="user-info">
                            <span className="user-name">{user.display_name}</span>
                            <span className="user-username">@{user.username}</span>
                          </div>
                          {selectedUsers.has(user.username) && (
                            <span className="check-icon">✓</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                className="next-btn"
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
            <div className="modal-body">
              <div className="group-preview">
                <div className="group-icon-large">
                  {getGroupIcon(groupName || "Group")}
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="groupName">Group Name</label>
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
                />
                <span className="char-count">{groupName.length}/50</span>
              </div>

              <div className="members-summary">
                <h4>Members ({selectedUsers.size + 1})</h4>
                <div className="members-chips">
                  <div className="member-chip you">You (Admin)</div>
                  {Array.from(selectedUsers).map((username) => (
                    <div key={username} className="member-chip">
                      {username}
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setStep("select")}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="create-btn"
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