import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../api/socket";
import { useChat } from "../../contexts/ChatContext";
import ChatList from "./ChatList";
import NewChatModal from "./NewChatModal";
import CreateGroupModal from "./CreateGroupModal";
import SettingsPanel from "./SettingsPanel";
import EditProfileModal from "./EditProfileModal";
import {
  Menu,
  Search,
  X,
  Plus,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  CheckCheck,
  UserPlus,
  UserCircle2,
} from "lucide-react";

interface SidebarProps {
  onSettingsClick: () => void;
  isMobile: boolean;
}

type FilterType = "all" | "unread" | "groups";

export default function Sidebar({ onSettingsClick, isMobile }: SidebarProps) {
  const navigate = useNavigate();
  const { chatRooms, selectedRoom, allowGroupCreation, currentUser, setCurrentUser, setSelectedRoom, appName, appLogo } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    setSearchTerm("");
    setActiveFilter("all");
  }, [selectedRoom]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest(".dropdown-menu") && !target.closest(".menu-button")) {
          setShowMenu(false);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  const filteredRooms = chatRooms.filter((room) => {
    const matchesSearch = room.is_group
      ? room.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
      : (room.other_user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         room.participant_1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         room.participant_2?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeFilter === "unread") {
      return room.unread_count > 0;
    } else if (activeFilter === "groups") {
      return room.is_group === true;
    }
    return true;
  });

  const unreadCount = chatRooms.filter((r) => r.unread_count > 0).length;
  const groupsCount = chatRooms.filter((r) => r.is_group).length;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#3F0E40] text-[#CFC3CF]">

      {/* Workspace Header (Slack) */}
      <div className="sticky top-0 z-20 flex flex-col border-b border-white/10">

        {/* Top Workspace Row */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
           <button
             className="menu-button flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left transition hover:bg-white/10"
             onClick={(e) => {
               e.stopPropagation();
               setShowMenu(!showMenu);
             }}
             title="Menu"
           >
             {appLogo && (
                <img src={appLogo} alt="" className="h-6 w-6 rounded-md object-cover" />
             )}
             <span className="truncate text-[17px] font-bold text-white">
               {appName || "ZatChat"}
             </span>
             <Menu size={16} className="flex-shrink-0 text-white/80" />
           </button>

           <button
             className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#3F0E40] shadow-sm transition hover:bg-white/90"
             onClick={() => setShowNewChat(true)}
             title="New message"
           >
             <Plus size={18} strokeWidth={2.5} />
           </button>
        </div>

        {/* Search Row */}
        <div className="px-3 py-2.5">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder={`Search ${appName || "ZatChat"}`}
              className="w-full rounded-md border border-white/20 bg-black/20 py-2 pl-9 pr-8 text-sm font-medium text-white outline-none transition placeholder:text-white/55 focus:border-white/40 focus:bg-black/25"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-3 py-2">
        <button
          className={`rounded-full px-3 py-1 text-[13px] font-medium transition-all ${
            activeFilter === "all"
              ? "bg-white/20 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        <button
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium transition-all ${
            activeFilter === "unread"
              ? "bg-white/20 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => setActiveFilter("unread")}
        >
          Unread
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#CD2553] px-1.5 py-0.5 text-[11px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium transition-all ${
            activeFilter === "groups"
              ? "bg-white/20 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => setActiveFilter("groups")}
        >
          <Users size={14} className="stroke-[2]" />
          Channels
          {groupsCount > 0 && (
            <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {groupsCount}
            </span>
          )}
        </button>
      </div>

      {/* Section label */}
      <div className="flex items-center justify-between px-4 pb-1 pt-2">
        <span className="text-[13px] font-semibold text-white/60">
          {activeFilter === "groups" ? "Channels" : "Direct messages"}
        </span>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <ChatList rooms={filteredRooms} searchTerm={searchTerm} activeFilter={activeFilter} />
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setShowMenu(false)} />
          <div className="dropdown-menu absolute right-3 top-16 z-[1000] min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 dark:border-slate-700 dark:bg-slate-800">
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => {
                setShowNewChat(true);
                setShowMenu(false);
              }}
            >
              <MessageSquare size={18} className="text-slate-500 dark:text-slate-400" />
              <span>New chat</span>
            </button>
            {allowGroupCreation && (
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  setShowCreateGroup(true);
                  setShowMenu(false);
                }}
              >
                <UserPlus size={18} className="text-slate-500 dark:text-slate-400" />
                <span>New group</span>
              </button>
            )}
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => {
                setShowEditProfile(true);
                setShowMenu(false);
              }}
            >
              <UserCircle2 size={18} className="text-slate-500 dark:text-slate-400" />
              <span>Edit profile</span>
            </button>
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => {
                setShowSettings(true);
                setShowMenu(false);
              }}
            >
              <Settings size={18} className="text-slate-500 dark:text-slate-400" />
              <span>Settings</span>
            </button>
            {(currentUser?.username === 'admin' || currentUser?.is_admin === true) && (
              <button
                className="w-full px-4 py-3 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3 transition-colors"
                onClick={() => {
                  window.location.href = '/admin'; // Redirects to admin dashboard
                }}
              >
                <Settings size={18} />
                <span>Admin Dashboard</span>
              </button>
            )}
            <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
            <button
              className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
              onClick={() => {
                localStorage.removeItem("chatUser");
                localStorage.removeItem("selectedRoom");
                if (selectedRoom) socket.emit("leave_room", selectedRoom);
                socket.disconnect();
                setCurrentUser(null);
                setSelectedRoom(null);
                navigate("/chat-login");
              }}
            >
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showEditProfile && currentUser && (
        <EditProfileModal
          user={currentUser}
          onClose={() => setShowEditProfile(false)}
          onSaved={(updatedUser) => {
            setCurrentUser({
              ...currentUser,
              ...updatedUser,
            });
          }}
        />
      )}
    </div>
  );
} 





