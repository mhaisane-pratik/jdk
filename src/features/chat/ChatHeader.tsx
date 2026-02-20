import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import { FaSignOutAlt, FaImage, FaInfoCircle, FaArrowLeft } from "react-icons/fa";
import GroupInfoModal from "./GroupInfoModal";
import "./ChatHeader.css";

interface ChatHeaderProps {
  receiver: string;
  roomId: string;
  onMediaClick: () => void;
  onBack?: () => void; // ✅ Added onBack prop for mobile
}

const API_URL = import.meta.env.VITE_API_URL as string;

export default function ChatHeader({
  receiver,
  roomId,
  onMediaClick,
  onBack,
}: ChatHeaderProps) {
  const navigate = useNavigate();
  const { onlineUsers, setCurrentUser, setSelectedRoom, chatRooms, currentUser } = useChat();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState<any>(null);

  // Find the room
  const room = chatRooms.find((r) => r.id === roomId);
  const isGroup = room?.is_group || false;
  const memberCount = room?.member_count;
  const groupIcon = room?.group_icon;
  
  // Only check online status for 1-1 chats
  const isOnline = !isGroup && onlineUsers.has(receiver);

  useEffect(() => {
    // ✅ Only fetch user info for 1-1 chats, not groups
    if (!isGroup && receiver && receiver !== currentUser?.username) {
      fetchReceiverInfo();
    }
  }, [receiver, isGroup, currentUser]);

  const fetchReceiverInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/users/${receiver}`);
      if (res.ok) {
        const data = await res.json();
        setReceiverInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch receiver info:", err);
    }
  };

  const handleLogout = () => {
    console.log("🚪 Logging out...");

    localStorage.removeItem("chatUser");
    localStorage.removeItem("selectedRoom");
    console.log("🧹 Cleared localStorage");

    if (roomId) {
      socket.emit("leave_room", roomId);
    }

    socket.disconnect();

    setCurrentUser(null);
    setSelectedRoom(null);

    navigate("/chat-login");
    console.log("✅ Logged out successfully");
  };

  const handleHeaderClick = () => {
    if (isGroup) {
      setShowGroupInfo(true);
    }
  };

  const formatLastSeen = (lastSeen: string): string => {
    const now = new Date();
    const last = new Date(lastSeen);
    const diffMs = now.getTime() - last.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return last.toLocaleDateString();
  };

  return (
    <>
      <div 
        className={`chat-header ${isGroup ? 'clickable' : ''}`}
        onClick={handleHeaderClick}
      >
        <div className="receiver-info">
          {/* ✅ Back button – shown only on mobile when onBack is provided */}
          {onBack && (
            <button
              className="back-btn-mobile"
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              aria-label="Back"
            >
              <FaArrowLeft />
            </button>
          )}

          {/* ✅ Show group icon OR user avatar */}
          {isGroup ? (
            <div className="group-header-icon">{groupIcon || "👥"}</div>
          ) : (
            <img
              src={
                receiverInfo?.profile_picture ||
                `https://ui-avatars.com/api/?name=${receiver}&background=random&size=40`
              }
              alt={receiver}
              className="receiver-avatar"
            />
          )}
          
          <div className="receiver-details">
            <h3 className="receiver-name">
              {isGroup ? room?.group_name : receiverInfo?.display_name || receiver}
            </h3>
            
            {/* ✅ Show group status OR online status */}
            {isGroup ? (
              <span className="group-status">
                👥 Group · {memberCount || 0} member{memberCount !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className={`online-status ${isOnline ? "online" : "offline"}`}>
                {isOnline 
                  ? "Online" 
                  : receiverInfo?.last_seen 
                    ? `Last seen ${formatLastSeen(receiverInfo.last_seen)}` 
                    : "Offline"}
              </span>
            )}
          </div>
        </div>

        <div className="header-actions">
          {/* ✅ Show group info button for groups */}
          {isGroup && (
            <button
              className="header-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowGroupInfo(true);
              }}
              title="Group info"
            >
              <FaInfoCircle />
            </button>
          )}
          
          <button
            className="header-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMediaClick();
            }}
            title="View shared media"
          >
            <FaImage />
          </button>
          
          <button
            className="header-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            title="Logout"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && isGroup && (
        <GroupInfoModal
          groupId={roomId}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </>
  );
}