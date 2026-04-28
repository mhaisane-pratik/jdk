import React, { useEffect, useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import ChatSelect from "./ChatSelect";
import SettingsPanel from "./SettingsPanel";
import { socket } from "../../api/socket";

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
  return (
    <div
      className={`fixed inset-0 flex h-[100dvh] w-screen overflow-hidden ${
        theme === "dark" ? "dark bg-slate-950" : "bg-slate-100"
      }`}
      data-wallpaper={wallpaper}
    >
      {/* ================= SIDEBAR ================= */}
      <div
        className={`
          ${isMobile ? "absolute inset-y-0 left-0 z-30" : "relative"}
          ${isMobile && selectedRoom ? "hidden" : "block"}
          h-full w-full max-w-full border-r border-slate-200/80 bg-white/90 shadow-xl backdrop-blur md:w-[360px] lg:w-[390px] xl:w-[420px] dark:border-slate-700 dark:bg-slate-900/90
        `}
      >
        <Sidebar
          onSettingsClick={() => setShowSettings(true)}
          isMobile={isMobile}
        />
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className="relative h-full min-w-0 flex-1 bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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