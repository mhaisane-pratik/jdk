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
      <div className="flex h-full items-center justify-center bg-white p-5 dark:bg-[#1A1D21]">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4A154B] text-2xl font-black text-white shadow-md">
              {(currentUser?.display_name || currentUser?.username || "?").charAt(0).toUpperCase()}
            </div>
            <h2 className="mb-1 text-2xl font-black text-[#1D1C1D] dark:text-white">
              Welcome back, {currentUser?.display_name || currentUser?.username}
            </h2>
            <p className="text-[15px] text-[#616061] dark:text-slate-400">
              Send a direct message to get started.
            </p>
          </div>

          <div className="rounded-lg border border-[#E2E2E2] bg-white p-6 shadow-sm dark:border-[#2C2D30] dark:bg-[#222529]">
            <label htmlFor="receiver" className="mb-2 block text-[13px] font-bold text-[#1D1C1D] dark:text-slate-200">
              To:
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
              placeholder="Enter a username…"
              className="w-full rounded-md border border-[#8D8D8D]/60 px-3 py-2.5 text-[15px] outline-none transition focus:border-[#1264A3] focus:ring-1 focus:ring-[#1264A3] dark:bg-[#1A1D21] dark:text-white"
              autoFocus
              disabled={isLoading}
            />

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-2.5 text-sm text-red-600">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleStartChat}
              disabled={!receiverName.trim() || isLoading}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#007a5a] py-2.5 font-bold text-white transition hover:bg-[#148567] disabled:cursor-not-allowed disabled:opacity-50 ${
                isLoading ? "opacity-60" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>Starting…</span>
                </>
              ) : (
                <span>Start conversation</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
}



