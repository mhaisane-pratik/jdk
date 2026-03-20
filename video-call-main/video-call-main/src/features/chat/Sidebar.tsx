import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import ChatList from "./ChatList";
import NewChatModal from "./NewChatModal";
import CreateGroupModal from "./CreateGroupModal";
import SettingsPanel from "./SettingsPanel";
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
} from "lucide-react";

interface SidebarProps {
  onSettingsClick: () => void;
  isMobile: boolean;
}

type FilterType = "all" | "unread" | "groups";

export default function Sidebar({ onSettingsClick, isMobile }: SidebarProps) {
  const { chatRooms, selectedRoom } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
    <div className="w-full md:w-[420px] h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center p-3 gap-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <button
          className="menu-button w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          title="Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-95"
          onClick={() => setShowNewChat(true)}
          title="New chat"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-3 gap-1 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${
            activeFilter === "all"
              ? "border-green-500 text-green-600 dark:text-green-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeFilter === "unread"
              ? "border-green-500 text-green-600 dark:text-green-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveFilter("unread")}
        >
          <CheckCheck size={16} className="stroke-[1.5]" />
          Unread
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full ml-1">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeFilter === "groups"
              ? "border-green-500 text-green-600 dark:text-green-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveFilter("groups")}
        >
          <Users size={16} className="stroke-[1.5]" />
          Groups
          {groupsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-gray-500 text-white text-xs font-semibold rounded-full ml-1">
              {groupsCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <ChatList rooms={filteredRooms} searchTerm={searchTerm} activeFilter={activeFilter} />
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setShowMenu(false)} />
          <div className="absolute top-16 left-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-[1000] min-w-[220px] overflow-hidden border border-gray-200 dark:border-gray-700 dropdown-menu animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              onClick={() => {
                setShowNewChat(true);
                setShowMenu(false);
              }}
            >
              <MessageSquare size={18} className="text-gray-500 dark:text-gray-400" />
              <span>New chat</span>
            </button>
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              onClick={() => {
                setShowCreateGroup(true);
                setShowMenu(false);
              }}
            >
              <UserPlus size={18} className="text-gray-500 dark:text-gray-400" />
              <span>New group</span>
            </button>
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              onClick={() => {
                setShowSettings(true);
                setShowMenu(false);
              }}
            >
              <Settings size={18} className="text-gray-500 dark:text-gray-400" />
              <span>Settings</span>
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
              onClick={() => {
                // Handle logout
                alert("Logout");
                setShowMenu(false);
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
    </div>
  );
}