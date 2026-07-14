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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white/95 dark:bg-slate-900/95">
      
      {/* Dynamic App Branding & Header */}
      <div className="sticky top-0 z-20 flex flex-col border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        
        {/* Top Branding Row */}
        <div className="flex items-center justify-between px-4 pb-2 pt-4 sm:px-5">
           <div className="flex items-center gap-3">
             {appLogo ? (
                <img src={appLogo} alt="App Logo" className="h-9 w-9 rounded-xl border border-slate-200 object-cover shadow-sm bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
             ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold text-white shadow-sm">
                  {appName ? appName.charAt(0).toUpperCase() : "Z"}
                </div>
             )}
            </div>
           
           <div className="flex items-center gap-1.5">
             <button
               className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
               onClick={() => setShowNewChat(true)}
               title="New chat"
             >
               <Plus size={20} />
             </button>
             <button
               className="menu-button flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
               onClick={(e) => {
                 e.stopPropagation();
                 setShowMenu(!showMenu);
               }}
               title="Menu"
             >
               <Menu size={20} />
             </button>
           </div>
        </div>

        {/* Bottom Search Row */}
        <div className="px-4 pb-3 pt-1 sm:px-5">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full rounded-2xl border border-slate-200/80 bg-white/85 py-2.5 pl-10 pr-9 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-blue-900/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/80">
        <button
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
            activeFilter === "all"
              ? "bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          }`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all ${
            activeFilter === "unread"
              ? "bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          }`}
          onClick={() => setActiveFilter("unread")}
        >
          <CheckCheck size={16} className="stroke-[1.5]" />
          Unread
          {unreadCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all ${
            activeFilter === "groups"
              ? "bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          }`}
          onClick={() => setActiveFilter("groups")}
        >
          <Users size={16} className="stroke-[1.5]" />
          Groups
          {groupsCount > 0 && (
            <span className="ml-1 rounded-full bg-slate-500 px-1.5 py-0.5 text-xs font-semibold text-white">
              {groupsCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50/70 px-2 pb-2 dark:from-slate-900 dark:to-slate-950">
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





