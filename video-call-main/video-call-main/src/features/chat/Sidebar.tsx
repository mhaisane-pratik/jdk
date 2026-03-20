import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import ChatList from "./ChatList";
import NewChatModal from "./NewChatModal";
import CreateGroupModal from "./CreateGroupModal";
import SettingsPanel from "./SettingsPanel";

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
        if (!target.closest(".dropdown-menu") && !target.closest(".hamburger-btn")) {
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
    <div className="w-full md:w-[420px] h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center p-2.5 gap-2 bg-gray-100 dark:bg-gray-800">
        <button
          className="w-10 h-10 flex items-center justify-center text-2xl text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          title="Menu"
        >
          ☰
        </button>

        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full pl-9 pr-8 py-2 rounded-full border-none bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <button
          className="w-10 h-10 flex items-center justify-center text-2xl text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
          onClick={() => setShowNewChat(true)}
          title="New chat"
        >
          ✚
        </button>
      </div>

      <div className="flex px-2.5 gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-3 text-sm font-medium transition border-b-3 ${
            activeFilter === "all"
              ? "border-green-500 text-green-600 dark:text-green-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition border-b-3 flex items-center justify-center gap-1 ${
            activeFilter === "unread"
              ? "border-green-500 text-green-600 dark:text-green-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveFilter("unread")}
        >
          Unread
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full ml-1">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition border-b-3 flex items-center justify-center gap-1 ${
            activeFilter === "groups"
              ? "border-green-500 text-green-600 dark:text-green-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveFilter("groups")}
        >
          Groups
          {groupsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-gray-500 text-white text-xs rounded-full ml-1">
              {groupsCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChatList rooms={filteredRooms} searchTerm={searchTerm} activeFilter={activeFilter} />
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setShowMenu(false)} />
          <div className="absolute top-14 left-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-[1000] min-w-[200px] overflow-hidden border border-gray-200 dark:border-gray-700 dropdown-menu">
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              onClick={() => {
                setShowNewChat(true);
                setShowMenu(false);
              }}
            >
              <span>💬</span> New chat
            </button>
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              onClick={() => {
                setShowCreateGroup(true);
                setShowMenu(false);
              }}
            >
              <span>👥</span> New group
            </button>
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              onClick={() => {
                setShowSettings(true);
                setShowMenu(false);
              }}
            >
              <span>⚙️</span> Settings
            </button>
            <button
              className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
              onClick={() => alert("Logout")}
            >
              <span>🚪</span> Log out
            </button>
          </div>
        </>
      )}

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}