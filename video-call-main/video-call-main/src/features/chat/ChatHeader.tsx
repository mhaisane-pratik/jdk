import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import GroupInfoModal from "./GroupInfoModal";
import UserInfoModal from "./UserInfoModal";

import {
  LogOut,
  Image,
  Info,
  ArrowLeft,
  Users,
  MoreVertical,
  Video,
  Crown,
  Shield,
  UserCircle2,
  Search,
  Clock,
  Home
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env.VITE_API_URL as string;

interface ChatHeaderProps {
  receiver: string;
  roomId: string;
  onMediaClick: () => void;
  onBack?: () => void;
  onClearChat?: () => void;
  onSearchAction?: () => void;
}

export default function ChatHeader({
  receiver,
  roomId,
  onMediaClick,
  onBack,
  onClearChat,
  onSearchAction,
}: ChatHeaderProps) {
  const navigate = useNavigate();
  const { onlineUsers, setCurrentUser, setSelectedRoom, chatRooms, currentUser, userProfiles, typingUsers } = useChat();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);

  const room = chatRooms.find((r) => r.id === roomId);
  const isGroup = room?.is_group || false;
  const memberCount = room?.member_count;
  const groupIcon = room?.group_icon;
  const isAdmin = room?.created_by === currentUser?.username;

  const cachedProfile = !isGroup ? userProfiles.get(receiver) : null;
  const displayName = isGroup
    ? room?.group_name
    : cachedProfile?.display_name || receiverInfo?.display_name || receiver;

  const isOnline = !isGroup && onlineUsers.has(receiver);

  useEffect(() => {
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
    if (isGroup) {
      setShowGroupInfo(true);
    } else {
      setShowUserInfo(true);
    }
  };

  const handleClearChat = () => {
    if (onClearChat) {
      onClearChat();
      setShowOptions(false);
    }
  };

  return (
    <>
      <div
        className={`
          flex h-[62px] items-center justify-between border-b px-3 py-2 md:h-[74px] md:px-6
          border-slate-200/80 dark:border-slate-700
          bg-gradient-to-r from-slate-50/95 via-white to-blue-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
          backdrop-blur
          transition-all duration-300
          shadow-sm
          w-full flex-shrink-0
          ${isGroup ? "cursor-pointer hover:from-slate-100/80 hover:to-blue-100/70 dark:hover:from-slate-900 dark:hover:to-slate-800" : ""}
        `}
        onClick={handleHeaderClick}
      >
        {/* Left Section */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 max-w-[calc(100%-120px)] md:max-w-none">
          {/* Mobile back button */}
          {onBack && (
            <button
              className={`
                flex md:hidden items-center justify-center
                w-8 h-8 rounded-lg
                bg-white/80 dark:bg-slate-700
                text-slate-600 dark:text-slate-300
                hover:bg-white dark:hover:bg-slate-600
                active:scale-95
                transition-all duration-200
                flex-shrink-0
              `}
              onClick={(e) => { e.stopPropagation(); onBack(); }}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {isGroup ? (
              <div
                className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl
                  bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500
                  flex items-center justify-center text-white
                  shadow-[0_8px_20px_rgba(59,130,246,0.35)]
                  text-base md:text-xl
                  ring-2 ring-white dark:ring-slate-800
                `}
              >
                {groupIcon || <Users size={20} className="md:w-6 md:h-6" />}
              </div>
            ) : (
              <>
                <img
                  src={
                    cachedProfile?.profile_picture ||
                    receiverInfo?.profile_picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D9488&color=fff&size=48&font-size=0.33&bold=true`
                  }
                  alt={receiver}
                  className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl object-cover
                    ring-2 ring-white dark:ring-slate-800
                    shadow-md
                  `}
                />
                {!isGroup && (
                  <span
                    className={`
                      absolute -bottom-0.5 -right-0.5
                      w-3 h-3 md:w-3.5 md:h-3.5 rounded-full
                      ${isOnline
                        ? "bg-emerald-500 ring-2 ring-white dark:ring-slate-800"
                        : "bg-slate-400 ring-2 ring-white dark:ring-slate-800"
                      }
                    `}
                  />
                )}
              </>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2">
              <h3
                className={`
                  font-semibold truncate text-slate-900 dark:text-white
                  text-sm md:text-base lg:text-lg
                  max-w-[130px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-[340px]
                `}
              >
                {displayName}
              </h3>
              {isGroup && isAdmin && (
                <Crown size={14} className="text-amber-500 flex-shrink-0 md:w-4 md:h-4" />
              )}
              {isGroup && room?.is_verified && (
                <Shield size={14} className="text-blue-500 flex-shrink-0 md:w-4 md:h-4" />
              )}
            </div>
            
            {isGroup ? (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 md:text-sm">
                <Users size={12} className="flex-shrink-0 md:w-3.5 md:h-3.5" />
                <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[150px]">
                  {memberCount || 0} member{memberCount !== 1 ? "s" : ""}
                </span>
                <span className="mx-1 hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 xs:inline" />
                <span className="hidden xs:inline truncate max-w-[60px]">
                  {room?.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 md:text-sm">
                {isOnline ? (
                  <div className="flex min-w-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500 md:h-2 md:w-2" />
                    <span className="font-medium truncate max-w-[60px] xs:max-w-[80px]">Online</span>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-1 text-slate-500 dark:text-slate-400">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400 md:h-2 md:w-2" />
                    <span className="font-medium truncate max-w-[60px] xs:max-w-[80px]">Offline</span>
                  </div>
                )}
                {typingUsers[roomId] && typingUsers[roomId].has(receiver) && (
                  <>
                    <span className="mx-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="max-w-[60px] truncate font-medium text-blue-600 dark:text-blue-400 animate-pulse xs:max-w-[80px]">
                      typing...
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
          <button
            className={`
              flex items-center justify-center
              w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl
              bg-white/80 dark:bg-slate-700
              text-slate-600 dark:text-slate-300
              hover:bg-white dark:hover:bg-slate-600
              hover:text-indigo-600 dark:hover:text-indigo-400
              active:scale-95
              transition-all duration-200
              flex-shrink-0
            `}
            onClick={(e) => { e.stopPropagation(); window.location.href = "http://localhost:5174/dashboard"; }}
            title="Go to Dashboard"
          >
            <Home size={16} className="md:w-[18px] md:h-[18px]" />
          </button>

          <button
            className={`
              hidden sm:flex items-center justify-center
              w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl
              bg-white/80 dark:bg-slate-700
              text-slate-600 dark:text-slate-300
              hover:bg-white dark:hover:bg-slate-600
              hover:text-blue-600 dark:hover:text-blue-400
              active:scale-95
              transition-all duration-200
              flex-shrink-0
            `}
            onClick={(e) => { e.stopPropagation(); }}
            title="Video call"
          >
            <Video size={16} className="md:w-[18px] md:h-[18px]" />
          </button>

          {isGroup && (
            <button
              className={`
                flex items-center justify-center
                w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl
                bg-white/80 dark:bg-slate-700
                text-slate-600 dark:text-slate-300
                hover:bg-white dark:hover:bg-slate-600
                hover:text-blue-600 dark:hover:text-blue-400
                active:scale-95
                transition-all duration-200
                flex-shrink-0
              `}
              onClick={(e) => { e.stopPropagation(); setShowGroupInfo(true); }}
              title="Group info"
            >
              <Info size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
          )}

          <button
            className={`
              flex items-center justify-center
              w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl
              bg-white/80 dark:bg-slate-700
              text-slate-600 dark:text-slate-300
              hover:bg-white dark:hover:bg-slate-600
              hover:text-blue-600 dark:hover:text-blue-400
              active:scale-95
              transition-all duration-200
              flex-shrink-0
            `}
            onClick={(e) => { e.stopPropagation(); onMediaClick(); }}
            title="Shared media"
          >
            <Image size={16} className="md:w-[18px] md:h-[18px]" />
          </button>

          <div className="relative">
            <button
              className={`
                flex items-center justify-center
                w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl
                bg-white/80 dark:bg-slate-700
                text-slate-600 dark:text-slate-300
                hover:bg-white dark:hover:bg-slate-600
                active:scale-95
                transition-all duration-200
                flex-shrink-0
              `}
              onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
              title="More options"
            >
              <MoreVertical size={16} className="md:w-[18px] md:h-[18px]" />
            </button>

            {showOptions && (
              <>
                <div 
                  className="fixed inset-0 z-[999]" 
                  onClick={() => setShowOptions(false)} 
                />
                <div className="absolute right-0 top-10 z-[1000] min-w-[170px] rounded-2xl border border-slate-200 bg-white py-1 shadow-xl animate-fadeIn md:top-12 md:min-w-[190px] dark:border-slate-700 dark:bg-slate-800">
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 md:px-4 md:py-2.5 md:text-sm dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (isGroup) setShowGroupInfo(true);
                      else setShowUserInfo(true);
                      setShowOptions(false); 
                    }}
                  >
                    <UserCircle2 size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">View contact</span>
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 md:px-4 md:py-2.5 md:text-sm dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={(e) => { e.stopPropagation(); if (onSearchAction) onSearchAction(); setShowOptions(false); }}
                  >
                    <Search size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">Search messages</span>
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 md:px-4 md:py-2.5 md:text-sm dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={(e) => { e.stopPropagation(); handleClearChat(); }}
                  >
                    <Clock size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">Clear chat</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showGroupInfo && isGroup && (
        <GroupInfoModal groupId={roomId} onClose={() => setShowGroupInfo(false)} />
      )}

      {showUserInfo && !isGroup && (
        <UserInfoModal username={receiver} onClose={() => setShowUserInfo(false)} />
      )}
    </>
  );
}