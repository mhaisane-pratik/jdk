import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import { FaSignOutAlt, FaImage, FaInfoCircle, FaArrowLeft } from "react-icons/fa";
import GroupInfoModal from "./GroupInfoModal";
import "./ChatHeader.css";

const API_URL = import.meta.env.VITE_API_URL as string;

interface ChatHeaderProps {
  receiver: string;
  roomId: string;
  onMediaClick: () => void;
  onBack?: () => void;
}

export default function ChatHeader({
  receiver,
  roomId,
  onMediaClick,
  onBack,
}: ChatHeaderProps) {
  const navigate = useNavigate();
  const { onlineUsers, setCurrentUser, setSelectedRoom, chatRooms, currentUser, userProfiles } = useChat();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState<any>(null);

  const room = chatRooms.find((r) => r.id === roomId);
  const isGroup = room?.is_group || false;
  const memberCount = room?.member_count;
  const groupIcon = room?.group_icon;

  // Use cached profile if available
  const cachedProfile = !isGroup ? userProfiles.get(receiver) : null;
  const displayName = isGroup
    ? room?.group_name
    : cachedProfile?.display_name || receiverInfo?.display_name || receiver;

  const isOnline = !isGroup && onlineUsers.has(receiver);

  useEffect(() => {
    // Fetch receiver info only if not in cache and not a group
    if (!isGroup && receiver && receiver !== currentUser?.username && !cachedProfile) {
      fetchReceiverInfo();
    }
  }, [receiver, isGroup, currentUser, cachedProfile]);

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
    localStorage.removeItem("chatUser");
    localStorage.removeItem("selectedRoom");
    if (roomId) socket.emit("leave_room", roomId);
    socket.disconnect();
    setCurrentUser(null);
    setSelectedRoom(null);
    navigate("/chat-login");
  };

  const handleHeaderClick = () => {
    if (isGroup) setShowGroupInfo(true);
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
      <div className={`chat-header ${isGroup ? 'clickable' : ''}`} onClick={handleHeaderClick}>
        <div className="receiver-info">
          {onBack && (
            <button className="back-btn-mobile" onClick={(e) => { e.stopPropagation(); onBack(); }} aria-label="Back">
              <FaArrowLeft />
            </button>
          )}

          {isGroup ? (
            <div className="group-header-icon">{groupIcon || "👥"}</div>
          ) : (
            <img
              src={
                cachedProfile?.profile_picture ||
                receiverInfo?.profile_picture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=40`
              }
              alt={receiver}
              className="receiver-avatar"
            />
          )}

          <div className="receiver-details">
            <h3 className="receiver-name">{displayName}</h3>

            {isGroup ? (
              <span className="group-status">
                👥 Group · {memberCount || 0} member{memberCount !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className={`online-status ${isOnline ? "online" : "offline"}`}>
                {isOnline
                  ? "Online"
                  : (cachedProfile?.last_seen || receiverInfo?.last_seen)
                    ? `Last seen ${formatLastSeen(cachedProfile?.last_seen || receiverInfo?.last_seen)}`
                    : "Offline"}
              </span>
            )}
          </div>
        </div>

        <div className="header-actions">
          {isGroup && (
            <button className="header-btn" onClick={(e) => { e.stopPropagation(); setShowGroupInfo(true); }} title="Group info">
              <FaInfoCircle />
            </button>
          )}
          <button className="header-btn" onClick={(e) => { e.stopPropagation(); onMediaClick(); }} title="View shared media">
            <FaImage />
          </button>
          <button className="header-btn" onClick={(e) => { e.stopPropagation(); handleLogout(); }} title="Logout">
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      {showGroupInfo && isGroup && (
        <GroupInfoModal groupId={roomId} onClose={() => setShowGroupInfo(false)} />
      )}
    </>
  );
}