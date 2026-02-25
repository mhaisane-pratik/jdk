// File: video-call-main/src/features/chat/Sidebar.tsx

import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import ChatList from "./ChatList";
import NewChatModal from "./NewChatModal";
import CreateGroupModal from "./CreateGroupModal";
import SettingsPanel from "./SettingsPanel";
import "./Sidebar.css";

interface SidebarProps {
  onSettingsClick: () => void;
  isMobile: boolean;
}

type FilterType = "all" | "unread" | "groups";

export default function Sidebar({ onSettingsClick, isMobile }: SidebarProps) {
  const { chatRooms, selectedRoom } = useChat(); // 👈 get selectedRoom
  const [showMenu, setShowMenu] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // 👇 Reset filters whenever a new room is selected
  useEffect(() => {
    setSearchTerm("");
    setActiveFilter("all");
  }, [selectedRoom]);

  // Close menu when clicking outside
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

  // Filter rooms based on search and active filter
  const filteredRooms = chatRooms.filter((room) => {
    // Search filter
    const matchesSearch = room.is_group
      ? room.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
      : (room.other_user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         room.participant_1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         room.participant_2?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filter
    if (activeFilter === "unread") {
      return room.unread_count > 0;
    } else if (activeFilter === "groups") {
      return room.is_group === true;
    }

    return true; // "all" filter
  });

  // Count unread and groups
  const unreadCount = chatRooms.filter((r) => r.unread_count > 0).length;
  const groupsCount = chatRooms.filter((r) => r.is_group).length;

  return (
    <div className="sidebar">
      {/* Top bar with search */}
      <div className="sidebar-top">
        <button
          className="hamburger-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          title="Menu"
        >
          ☰
        </button>

        <div className="search-bar">
          <span className="search-icon"></span>
          <input
            type="text"
            placeholder="Search or start new chat"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <button
          className="new-chat-btn"
          onClick={() => setShowNewChat(true)}
          title="New chat"
        >
          {/* Icon */}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-tab ${activeFilter === "unread" ? "active" : ""}`}
          onClick={() => setActiveFilter("unread")}
        >
          Unread
          {unreadCount > 0 && (
            <span className="filter-badge">{unreadCount}</span>
          )}
        </button>
        <button
          className={`filter-tab ${activeFilter === "groups" ? "active" : ""}`}
          onClick={() => setActiveFilter("groups")}
        >
          Groups
          {groupsCount > 0 && (
            <span className="filter-badge-secondary">{groupsCount}</span>
          )}
        </button>
      </div>

      {/* Chat list */}
      <div className="chat-list-container">
        <ChatList rooms={filteredRooms} searchTerm={searchTerm} activeFilter={activeFilter} />
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div className="menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="dropdown-menu">
            <button onClick={() => setShowNewChat(true)}>
              <span className="menu-icon">💬</span>
              New chat
            </button>
            <button onClick={() => setShowCreateGroup(true)}>
              <span className="menu-icon">👥</span>
              New group
            </button>
            <button
              onClick={() => {
                setShowSettings(true);
                setShowMenu(false);
              }}
            >
              <span className="menu-icon">⚙️</span>
              Settings
            </button>
            <button className="logout-btn" onClick={() => alert("Logout")}>
              <span className="menu-icon">🚪</span>
              Log out
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}