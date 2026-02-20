// File: video-call-main/src/features/chat/ChatSelect.tsx

import React, { useState, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useNavigate } from "react-router-dom";
import "./ChatSelect.css";

const API_URL = import.meta.env.VITE_API_URL as string;

export default function ChatSelect() {
  const { currentUser, setSelectedRoom, refreshRooms } = useChat();
  const navigate = useNavigate();
  const [receiverName, setReceiverName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartChat = async () => {
    const trimmedReceiver = receiverName.trim();

    if (!trimmedReceiver) {
      setError("Please enter a username");
      return;
    }

    if (trimmedReceiver === currentUser?.username) {
      setError("You cannot chat with yourself");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check if user exists
      const res = await fetch(`${API_URL}/api/v1/users/${trimmedReceiver}`);

      if (!res.ok) {
        setError(`User "${trimmedReceiver}" not found. They need to login first.`);
        setIsLoading(false);
        return;
      }

      // Create room ID (alphabetically sorted)
      const participants = [currentUser?.username, trimmedReceiver].sort();
      const roomId = participants.join("__");

      console.log("🏠 Creating/getting room:", roomId);

      // Create room in database if it doesn't exist
      const roomRes = await fetch(`${API_URL}/api/v1/chats/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          participant1: participants[0],
          participant2: participants[1],
        }),
      });

      if (!roomRes.ok) {
        console.warn("⚠️  Failed to create room, but continuing anyway");
      } else {
        console.log("✅ Room created/verified");
      }

      // 🔴 IMPORTANT: Store receiver in localStorage
      localStorage.setItem(`room_${roomId}_receiver`, trimmedReceiver);

      // Set the selected room
      setSelectedRoom(roomId);

      // Refresh rooms list
      await refreshRooms();

      // Clear form
      setReceiverName("");
      setError("");
    } catch (err) {
      console.error("❌ Failed to start chat:", err);
      setError("Failed to start chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && receiverName.trim()) {
      handleStartChat();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chatUser");
    navigate("/chat-login");
  };

  return (
    <div className="chat-select-container">
      <div className="select-wrapper">
        <div className="select-header">
          <div className="user-info-section">
            <img
              src={
                currentUser?.profile_picture ||
                `https://ui-avatars.com/api/?name=${currentUser?.username}&background=random&size=80`
              }
              alt="Profile"
              className="user-avatar-large"
            />
            <h2>Hello, {currentUser?.display_name || currentUser?.username}!</h2>
            <p className="user-subtitle">Who would you like to chat with?</p>
          </div>
        </div>

        <div className="select-card">
          <div className="form-group">
            <label htmlFor="receiver" className="input-label">
              <span className="label-icon">💬</span>
              Enter username to chat
            </label>
            <input
              ref={inputRef}
              id="receiver"
              type="text"
              value={receiverName}
              onChange={(e) => {
                setReceiverName(e.target.value);
                if (error) setError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="e.g., john_doe"
              className="select-input"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            onClick={handleStartChat}
            disabled={!receiverName.trim() || isLoading}
            className={`start-chat-btn ${isLoading ? "loading" : ""}`}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Starting...
              </>
            ) : (
              <>
                <span className="btn-icon">💬</span>
                Start Chatting
              </>
            )}
          </button>
        </div>

        <div className="select-actions">
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}