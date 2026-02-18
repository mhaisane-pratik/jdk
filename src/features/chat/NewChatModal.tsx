// File: video-call-main/src/features/chat/NewChatModal.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import "./NewChatModal.css";

interface NewChatModalProps {
  onClose: () => void;
}

export default function NewChatModal({ onClose }: NewChatModalProps) {
  const { currentUser, setSelectedRoom, refreshRooms } = useChat();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    if (username === currentUser?.username) {
      setError("You cannot chat with yourself");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if user exists
      const res = await fetch(`http://localhost:4000/api/v1/users/${username}`);
      
      if (!res.ok) {
        setError("User not found");
        setLoading(false);
        return;
      }

      // Create room ID
      const roomId = [currentUser?.username, username]
        .sort()
        .join("__");

      // Refresh rooms and select the new one
      await refreshRooms();
      setSelectedRoom(roomId);
      onClose();
    } catch (err) {
      setError("Failed to start chat");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStartChat();
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="new-chat-modal">
        <div className="modal-header">
          <h2>New Chat</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Enter the username of the person you want to chat with
          </p>

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter username"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="start-btn"
            onClick={handleStartChat}
            disabled={loading || !username.trim()}
          >
            {loading ? "Starting..." : "Start Chat"}
          </button>
        </div>
      </div>
    </>
  );
}