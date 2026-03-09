// File: video-call-main/src/pages/Chat.tsx

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatLayout from "../features/chat/ChatLayout";

export default function Chat() {
  const navigate = useNavigate();

  useEffect(() => {
    const chatUser = localStorage.getItem("chatUser");

    if (!chatUser) {
      navigate("/chat-login");
    }
  }, [navigate]);

  return <ChatLayout />;
}