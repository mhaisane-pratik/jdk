import React, { useState, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL as string;

export default function ChatSelect() {
  const { currentUser, setSelectedRoom, refreshRooms, loadUserProfile } = useChat();
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
      // Try to get the user, if not found, create them automatically
      let userExists = false;
      const res = await fetch(`${API_URL}/api/v1/users/${trimmedReceiver}`);
      if (res.ok) {
        userExists = true;
      } else {
        // Try to create the user automatically
        const createRes = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedReceiver,
            display_name: trimmedReceiver,
          }),
        });
        if (createRes.ok) {
          userExists = true;
        } else {
          setError(`Could not create or find user \"${trimmedReceiver}\".`);
          setIsLoading(false);
          return;
        }
      }
      await loadUserProfile(trimmedReceiver);
      const participants = [currentUser?.username, trimmedReceiver].sort();
      const roomId = participants.join("__");
      console.log("🏠 Creating/getting room:", roomId);
      await fetch(`${API_URL}/api/v1/chats/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          participant1: participants[0],
          participant2: participants[1],
        }),
      });
      localStorage.setItem(`room_${roomId}_receiver`, trimmedReceiver);
      setSelectedRoom(roomId);
      await refreshRooms();
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 p-5">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <img
                src={
                  currentUser?.profile_picture ||
                  `https://ui-avatars.com/api/?name=${currentUser?.username}&background=2563eb&color=fff&size=80&font-size=0.4&bold=true`
                }
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-blue-500 mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Hello, {currentUser?.display_name || currentUser?.username}!
              </h2>
              <p className="text-base text-gray-600">Who would you like to chat with today?</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl mb-5">
            <div className="mb-4">
              <label htmlFor="receiver" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-1">💬</span> Enter username to start chatting
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleStartChat}
              disabled={!receiverName.trim() || isLoading}
              className={`w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg ${
                isLoading ? "opacity-60" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Starting chat...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Start Chatting</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center">
         
          </div>
        </div>
      </div>
    );
}    



