// File: video-call-main/src/features/chat/ChatLayout.tsx

import React, { useEffect, useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import ChatSelect from "./ChatSelect";
import SettingsPanel from "./SettingsPanel";
import { socket } from "../../api/socket";
import "./ChatLayout.css";

export default function ChatLayout() {
  const navigate = useNavigate();
  const { currentUser, selectedRoom, theme, wallpaper, setSelectedRoom } = useChat(); // ✅ use setSelectedRoom
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("chatUser");
    if (!savedUser && !currentUser) {
      navigate("/chat-login", { replace: true });
      return;
    }

    if (savedUser || currentUser) {
      setIsReady(true);
    }

    if (currentUser && socket.connected) {
      socket.emit("user_join", { username: currentUser.username });
    }
  }, [currentUser, navigate]);

  const handleBack = () => {
    setSelectedRoom(null); // ✅ clear selected room
  };

  if (!isReady && !currentUser) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Initializing...</p>
      </div>
    );
  }

  const layoutClass = `chat-layout theme-${theme} ${selectedRoom ? 'show-chat' : ''}`;

  return (
    <div className={layoutClass} data-wallpaper={wallpaper}>
      <Sidebar onSettingsClick={() => setShowSettings(true)} isMobile={isMobile} />
      {selectedRoom ? <ChatWindow onBack={handleBack} /> : <ChatSelect />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}