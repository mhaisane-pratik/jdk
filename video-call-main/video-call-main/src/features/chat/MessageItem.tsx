import React, { useState, useRef, useEffect } from "react";
import { Message } from "./ChatWindow";

interface MessageItemProps {
  message: Message;
  isSent: boolean;
  currentUser: string;
  onReply: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  onRefresh: () => void;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export default function MessageItem({ 
  message, 
  isSent, 
  currentUser,
  onReply, 
  onDelete,
  onForward,
  onRefresh 
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [imageFullscreen, setImageFullscreen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMessageStatus = () => {
    if (!isSent) return null;
    if (message.is_seen) {
      return <span className="text-indigo-400 text-[10px] ml-1">✓✓</span>;
    }
    if (message.is_delivered) {
      return <span className="text-gray-500 dark:text-gray-400 text-[10px] ml-1">✓✓</span>;
    }
    return <span className="text-gray-500 dark:text-gray-400 text-[10px] ml-1">✓</span>;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActions]);

  const handleMessageClick = () => {
    setShowActions(!showActions);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (message.message) {
        await navigator.clipboard.writeText(message.message);
        showNotification("✓ Message copied", "success");
        setShowActions(false);
      }
    } catch (err) {
      showNotification("Failed to copy message", "error");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const deleteFor = isSent 
      ? window.confirm("Delete for everyone?\n\nOK = Everyone | Cancel = Just you")
        ? "everyone"
        : "me"
      : "me";
    const confirmMessage = deleteFor === "everyone"
      ? "Delete this message for everyone?"
      : "Delete this message for you?";
    if (!window.confirm(confirmMessage)) return;
    setIsDeleting(true);
    setShowActions(false);
    try {
      const response = await fetch(`${API_URL}/api/v1/messages/${message.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, deleteFor }),
      });
      if (!response.ok) throw new Error("Failed to delete");
      showNotification(`✓ Message deleted`, "success");
      setTimeout(() => onRefresh(), 500);
    } catch (err) {
      showNotification("Failed to delete message", "error");
      setIsDeleting(false);
    }
  };

  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    alert("Forward feature coming soon!");
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    onReply(message);
  };

  const showNotification = (text: string, type: "success" | "error") => {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-lg text-sm font-semibold shadow-lg z-[1000000] animate-slideDownNotification ${type === 'success' ? 'bg-indigo-500' : 'bg-red-500'} text-white`;
    notification.textContent = text;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  if (isDeleting) {
    return (
      <div className={`flex mb-2 px-4 ${isSent ? "justify-end" : "justify-start"}`}>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 italic px-3 py-2 rounded-2xl border border-yellow-300 dark:border-yellow-700 flex items-center gap-2 animate-pulse">
          <span className="animate-spin">⏳</span>
          <span className="text-xs font-semibold">Deleting...</span>
        </div>
      </div>
    );
  }

  if (message.is_deleted) {
    return (
      <div className={`flex mb-2 px-4 ${isSent ? "justify-end" : "justify-start"}`}>
        <div className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic px-3 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 flex items-center gap-2">
          <span>🚫</span>
          <span className="text-xs font-medium">
            {message.deleted_for === "everyone" 
              ? "This message was deleted" 
              : "You deleted this message"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className={`flex mb-2 px-4 relative ${isSent ? "justify-end" : "justify-start"}`}
      >
        <div className={`relative max-w-[70%] ${isSent ? "order-2" : "order-1"}`} onClick={handleMessageClick}>
          {message.message_type === "text" && (
            <div
              className={`relative rounded-2xl px-3 py-2 pb-6 shadow-sm ${
                isSent
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
              }`}
            >
              {message.reply_to && (
                <div className="mb-1.5 rounded-lg overflow-hidden cursor-pointer hover:opacity-90">
                  <div className="flex">
                    <div className={`w-1 flex-shrink-0 ${isSent ? "bg-white/90" : "bg-indigo-500"}`}></div>
                    <div className={`flex-1 p-1 ${isSent ? "bg-white/15" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                      <div className={`font-semibold text-[10px] mb-0.5 ${isSent ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {message.reply_to.sender_name}
                      </div>
                      <div className="text-[10px] line-clamp-2 opacity-85 text-gray-700 dark:text-gray-300">
                        {message.reply_to.message || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {message.is_forwarded && (
                <div className="flex items-center gap-1 text-[10px] italic opacity-80 mb-1 font-medium">
                  <span>↪️</span>
                  <span>Forwarded</span>
                </div>
              )}

              <p className="m-0 pr-12 text-sm leading-relaxed break-words whitespace-pre-wrap select-text">
                {message.message}
              </p>
              
              <div className="absolute bottom-1.5 right-2 flex items-center gap-0.5">
                <span className={`text-[10px] ${isSent ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                  {formatTime(message.created_at)}
                </span>
                {getMessageStatus()}
              </div>
            </div>
          )}

          {message.message_type === "image" && message.file_url && (
            <div
              className={`relative rounded-2xl p-1 max-w-[280px] shadow-sm ${
                isSent
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {message.reply_to && (
                <div className="m-1 mb-2 rounded-lg overflow-hidden cursor-pointer hover:opacity-90">
                  <div className="flex">
                    <div className={`w-1 flex-shrink-0 ${isSent ? "bg-white/90" : "bg-indigo-500"}`}></div>
                    <div className={`flex-1 p-1 ${isSent ? "bg-white/15" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                      <div className={`font-semibold text-[10px] mb-0.5 ${isSent ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {message.reply_to.sender_name}
                      </div>
                      <div className="text-[10px] line-clamp-2 opacity-85 text-gray-700 dark:text-gray-300">
                        {message.reply_to.message || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <img
                src={`${API_URL}/api/v1/proxy-image?url=${encodeURIComponent(message.file_url)}`}
                alt="Shared"
                className="w-full max-h-[300px] object-cover rounded-xl cursor-pointer transition-transform hover:scale-102"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageFullscreen(true);
                }}
                loading="lazy"
              />
              
              {message.message && (
                <p className={`m-1 text-sm break-words select-text ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {message.message}
                </p>
              )}
              <div className="absolute bottom-2 right-2 flex items-center gap-0.5">
                <span className={`text-[10px] ${isSent ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                  {formatTime(message.created_at)}
                </span>
                {getMessageStatus()}
              </div>
            </div>
          )}

          {message.message_type === "file" && message.file_url && (
            <div
              className={`relative rounded-2xl p-2 min-w-[240px] max-w-[320px] shadow-sm ${
                isSent
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {message.reply_to && (
                <div className="mb-1.5 rounded-lg overflow-hidden cursor-pointer hover:opacity-90">
                  <div className="flex">
                    <div className={`w-1 flex-shrink-0 ${isSent ? "bg-white/90" : "bg-indigo-500"}`}></div>
                    <div className={`flex-1 p-1 ${isSent ? "bg-white/15" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                      <div className={`font-semibold text-[10px] mb-0.5 ${isSent ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {message.reply_to.sender_name}
                      </div>
                      <div className="text-[10px] line-clamp-2 opacity-85 text-gray-700 dark:text-gray-300">
                        {message.reply_to.message || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <a
                href={message.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-1.5 rounded-lg no-underline text-inherit hover:bg-black/5 dark:hover:bg-white/10 transition"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                  isSent ? "text-white" : "text-indigo-600 dark:text-indigo-400"
                }`}>
                  📎
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold truncate ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                    {message.file_name || "Download File"}
                  </div>
                  {message.file_size && (
                    <div className={`text-[10px] mt-0.5 ${isSent ? "text-white/75" : "text-gray-500 dark:text-gray-400"}`}>
                      {(message.file_size / 1024).toFixed(2)} KB
                    </div>
                  )}
                </div>
              </a>
              {message.message && (
                <p className={`mt-1.5 mb-0 text-sm break-words select-text ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {message.message}
                </p>
              )}
              <div className="absolute bottom-2 right-2 flex items-center gap-0.5">
                <span className={`text-[10px] ${isSent ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                  {formatTime(message.created_at)}
                </span>
                {getMessageStatus()}
              </div>
            </div>
          )}

          {showActions && (
            <div className={`absolute flex gap-1 p-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[100000] animate-slideInActions ${
              isSent ? "bottom-full right-0" : "bottom-full left-0"
            }`}>
              <button
                onClick={handleReply}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <span>↩️</span>
                <span>Reply</span>
              </button>

              {message.message && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition"
                >
                  <span>📋</span>
                  <span>Copy</span>
                </button>
              )}

              <button
                onClick={handleForward}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition"
              >
                <span>➡️</span>
                <span>Forward</span>
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {imageFullscreen && (
        <>
          <div
            className="fixed inset-0 bg-black/90 z-[999999] animate-fadeIn"
            onClick={() => setImageFullscreen(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000000] max-w-[90vw] max-h-[90vh] animate-zoomIn">
            <button
              className="absolute -top-12 right-0 w-10 h-10 bg-white/90 rounded-full text-3xl cursor-pointer flex items-center justify-center hover:bg-white transition hover:rotate-90"
              onClick={() => setImageFullscreen(false)}
            >
              ×
            </button>
            <img
              src={`${API_URL}/api/v1/proxy-image?url=${encodeURIComponent(message.file_url)}`}
              alt="Full size"
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <a
              href={message.file_url}
              download
              className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-white/90 px-5 py-2.5 rounded-lg no-underline text-gray-900 font-semibold text-sm hover:bg-white transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️ Download
            </a>
          </div>
        </>
      )}
    </>
  );
}