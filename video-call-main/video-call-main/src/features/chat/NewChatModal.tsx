import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";

const API_URL = import.meta.env.VITE_API_URL as string;

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
      const res = await fetch(`${API_URL}/api/v1/users/${username}`);
      if (!res.ok) {
        setError("User not found");
        setLoading(false);
        return;
      }
      const roomId = [currentUser?.username, username].sort().join("__");
      await refreshRooms();
      setSelectedRoom(roomId);
      onClose();
    } catch (err) {
      console.error("Failed to start chat", err);
      setError("Failed to start chat");
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
      <div className="fixed inset-0 bg-black/70 z-[10000]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-md flex flex-col z-[10001] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="m-0 text-xl font-semibold text-gray-800 dark:text-white">New Chat</h2>
          <button
            className="text-2xl cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 w-9 h-9 rounded flex items-center justify-center"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enter the username of the person you want to chat with
          </p>

          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyPress}
              placeholder="Enter username"
              autoFocus
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-sm font-medium mb-4">{error}</div>}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            className="flex-1 py-3.5 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-3.5 px-6 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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