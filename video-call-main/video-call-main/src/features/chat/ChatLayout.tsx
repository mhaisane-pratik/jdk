import React, { useEffect, useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import ChatSelect from "./ChatSelect";
import SettingsPanel from "./SettingsPanel";
import { socket } from "../../api/socket";
import { Home, MessageSquare, Bell, MoreHorizontal } from "lucide-react";

export default function ChatLayout() {
  const navigate = useNavigate();

  const {
    currentUser,
    selectedRoom,
    theme,
    wallpaper,
    setSelectedRoom,
  } = useChat();

  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isReady, setIsReady] = useState(false);

  /* ================= SCREEN RESIZE ================= */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile && selectedRoom) {
        setSelectedRoom(selectedRoom); // keep state stable
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const savedUser = localStorage.getItem("chatUser");

    if (!savedUser && !currentUser) {
      navigate("/chat-login", { replace: true });
      return;
    }

    setIsReady(true);
  }, [currentUser, navigate]);

  /* ================= SOCKET JOIN ================= */
  useEffect(() => {
    if (currentUser && socket.connected) {
      socket.emit("user_join", {
        username: currentUser.username,
      });
    }
  }, [currentUser]);

  /* ================= BACK BUTTON ================= */
  const handleBack = () => {
    setSelectedRoom(null); // THIS is key fix
  };

  /* ================= LOADING ================= */
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-300">
          Initializing...
        </p>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  const userInitial = (currentUser?.display_name || currentUser?.username || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className={`fixed inset-0 flex h-[100dvh] w-screen overflow-hidden bg-[#3F0E40] ${
        theme === "dark" ? "dark" : ""
      }`}
      data-wallpaper={wallpaper}
    >
      {/* ================= WORKSPACE RAIL (Slack) ================= */}
      <div
        className={`${
          isMobile && selectedRoom ? "hidden" : "hidden md:flex"
        } h-full w-[68px] flex-shrink-0 flex-col items-center gap-1 bg-[#3A0E3B] py-3`}
      >
        {/* Workspace badge */}
        <button
          className="mb-2 flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-lg font-black text-[#3F0E40] shadow-md transition hover:rounded-xl"
          title="Workspace"
        >
          {userInitial}
        </button>

        <RailButton icon={<Home size={22} />} label="Home" active />
        <RailButton icon={<MessageSquare size={22} />} label="DMs" />
        <RailButton icon={<Bell size={22} />} label="Activity" />
        <RailButton icon={<MoreHorizontal size={22} />} label="More" />

        <div className="mt-auto">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A154B] text-sm font-bold text-white ring-2 ring-white/40 transition hover:ring-white/70"
            onClick={() => setShowSettings(true)}
            title={currentUser?.username || "You"}
          >
            {currentUser?.profile_picture ? (
              <img
                src={currentUser.profile_picture}
                alt="me"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              userInitial
            )}
          </button>
        </div>
      </div>

      {/* ================= SIDEBAR ================= */}
      <div
        className={`
          ${isMobile ? "absolute inset-y-0 left-0 z-30" : "relative"}
          ${isMobile && selectedRoom ? "hidden" : "block"}
          h-full w-full max-w-full bg-[#3F0E40] shadow-xl md:w-[300px] lg:w-[320px] xl:w-[340px]
        `}
      >
        <Sidebar
          onSettingsClick={() => setShowSettings(true)}
          isMobile={isMobile}
        />
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className="relative h-full min-w-0 flex-1 bg-white dark:bg-[#1A1D21] md:my-0 md:rounded-none">
        {selectedRoom ? (
          <ChatWindow onBack={handleBack} />
        ) : (
          <ChatSelect />
        )}
      </div>

      {/* ================= SETTINGS ================= */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

/* Slack workspace-rail icon button */
function RailButton({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition ${
        active ? "text-white" : "text-white/70 hover:text-white"
      }`}
      title={label}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-[14px] transition ${
          active ? "bg-white/25" : "hover:bg-white/10"
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}