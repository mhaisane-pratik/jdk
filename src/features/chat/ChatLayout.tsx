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
  const { currentUser, selectedRoom, theme, wallpaper } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Quick check for user
    const savedUser = localStorage.getItem("chatUser");
    
    if (!savedUser && !currentUser) {
      console.log("⚠️ No user, redirecting to login");
      navigate("/chat-login", { replace: true });
      return;
    }

    // Mark as ready immediately if we have a user
    if (savedUser || currentUser) {
      setIsReady(true);
    }

    if (currentUser && socket.connected) {
      socket.emit("user_join", { username: currentUser.username });
    }
  }, [currentUser, navigate]);

  // Show minimal loading only if absolutely necessary
  if (!isReady && !currentUser) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Initializing...</p>
      </div>
    );
  }

  return (
    <div className={`chat-layout theme-${theme}`} data-wallpaper={wallpaper}>
      <Sidebar
        onSettingsClick={() => setShowSettings(true)}
        isMobile={isMobile}
      />

      {selectedRoom ? <ChatWindow /> : <ChatSelect />}

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}