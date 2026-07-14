import React, { useState, useRef, useEffect } from "react";
import { Message } from "./ChatWindow";
import { socket } from "../../api/socket";

interface MessageItemProps {
  message: Message;
  isSent: boolean;
  isGroup?: boolean;
  currentUser: string;
  onReply: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  searchQuery?: string;
  isHighlighted?: boolean;
  onRefresh: () => void;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export default function MessageItem({ 
  message, 
  isSent, 
  isGroup = false,
  currentUser,
  onReply, 
  onDelete,
  onForward,
  searchQuery,
  isHighlighted,
  onRefresh 
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<{url: string, type: string} | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSeenByModal, setShowSeenByModal] = useState(false);
  const [seenByUsers, setSeenByUsers] = useState<Array<{
    username: string;
    display_name: string;
    profile_picture?: string;
    seen_at: string;
  }>>([]);
  const [seenByLoading, setSeenByLoading] = useState(false);
  const [seenByError, setSeenByError] = useState<string | null>(null);
  const [seenByTotalParticipants, setSeenByTotalParticipants] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const API_KEY = "ZATCHAT_PRATEEK9373";

  // Parse reactions and text
  const parseMessageReactions = (rawText: string | null | undefined) => {
    if (!rawText) return { text: "", reactions: {} as Record<string, string[]> };
    const reactionRegex = /\n\[reactions:({.*?})\]$/s;
    const match = rawText.match(reactionRegex);
    if (match) {
      try {
        const reactions = JSON.parse(match[1]);
        const text = rawText.replace(reactionRegex, "");
        return { text, reactions };
      } catch (e) {}
    }
    return { text: rawText, reactions: {} as Record<string, string[]> };
  };

  const { text: plainText, reactions } = parseMessageReactions(message.message);
  
  const repliedMessageText = message.reply_to 
    ? parseMessageReactions(message.reply_to.message).text 
    : "";

  const handleReact = (emoji: string) => {
    socket.emit("message_reaction", {
      messageId: message.id,
      roomId: message.room_id,
      emoji,
      username: currentUser,
    });
    setShowActions(false);
  };

  const formatTime = (dateString: string) => {
    let safeString = dateString;
    if (!safeString.includes('Z') && !safeString.includes('+')) {
      safeString = safeString.replace(' ', 'T') + 'Z';
    }
    const date = new Date(safeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMessageStatus = () => {
    if (!isSent) return null;
    if (message.is_seen) {
      return <span className="text-cyan-300 font-bold text-[11px] ml-1 drop-shadow-sm leading-none">✓✓</span>;
    }
    if (message.is_delivered) {
      return <span className="text-white/90 text-[11px] ml-1 font-medium leading-none">✓✓</span>;
    }
    return <span className="text-white/60 text-[11px] ml-1 font-medium leading-none">✓</span>;
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

  useEffect(() => {
    if (isHighlighted && wrapperRef.current) {
      wrapperRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  const renderMessageContent = (text: string | null | undefined) => {
    if (!text) return null;
    
    // Split text by URL pattern (capturing URLs in the split result)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      // Check if this part is a URL
      if (/^https?:\/\/[^\s]+$/.test(part)) {
        return (
          <a
            key={`url-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline break-all ${
              isSent 
                ? "text-cyan-200 hover:text-cyan-100" 
                : "text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent opening actions panel on link click
          >
            {part}
          </a>
        );
      }

      // If there is no search query, return this plain text part
      if (!searchQuery) return part;

      // Otherwise, highlight the searchQuery within this text part
      try {
        const subParts = part.split(new RegExp(`(${searchQuery})`, 'gi'));
        return subParts.map((subPart, i) => {
          if (subPart.toLowerCase() === searchQuery.toLowerCase()) {
            return (
              <mark 
                key={`mark-${index}-${i}`} 
                className={`${isHighlighted ? 'bg-orange-500 text-white animate-pulse' : 'bg-yellow-300 text-black'} rounded-sm px-[2px] shadow-sm transition-colors duration-300`}
              >
                {subPart}
              </mark>
            );
          }
          return subPart;
        });
      } catch (e) {
        return part;
      }
    });
  };

  const handleMessageClick = () => {
    setShowActions(!showActions);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (plainText) {
        await navigator.clipboard.writeText(plainText);
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
    setShowActions(false);
    setShowDeleteModal(true);
  };

  const executeDelete = async (e: React.MouseEvent, deleteType: "me" | "everyone") => {
    e.stopPropagation();
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      socket.emit("delete_message", {
        messageId: message.id,
        username: currentUser,
        deleteFor: deleteType,
        roomId: message.room_id
      });
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
    if (onForward) onForward(message);
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    onReply(message);
  };

  const handleSeenBy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    setShowSeenByModal(true);
    setSeenByLoading(true);
    setSeenByError(null);

    try {
      const res = await fetch(
        `${API_URL}/api/v1/messages/${message.id}/seen-by?username=${encodeURIComponent(currentUser)}`,
        {
          headers: { "x-api-key": API_KEY },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setSeenByUsers(data.seenBy || []);
      setSeenByTotalParticipants(data.totalParticipants || 0);
    } catch (err) {
      setSeenByError("Could not load seen users.");
    } finally {
      setSeenByLoading(false);
    }
  };

  const formatSeenAt = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        className={`flex ${Object.keys(reactions).length > 0 ? "mb-4" : "mb-2"} px-4 relative transition-all duration-500 ${isSent ? "justify-end" : "justify-start"} ${isHighlighted ? "bg-black/5 dark:bg-white/5 py-1 rounded-lg" : ""}`}
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
                        {repliedMessageText || "📎 Attachment"}
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
                {renderMessageContent(plainText)}
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
              className={`relative rounded-2xl p-[3px] max-w-[280px] shadow-sm ${
                isSent
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
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
                        {repliedMessageText || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <img
                src={`${API_URL}/api/v1/proxy-image?url=${encodeURIComponent(message.file_url || '')}`}
                alt="Shared"
                className={`w-full max-h-[300px] object-cover cursor-pointer transition-transform hover:scale-102 ${
                  isSent
                    ? "rounded-xl rounded-br-sm"
                    : "rounded-xl rounded-bl-sm"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenMedia({ url: message.file_url || '', type: 'image' });
                }}
                loading="lazy"
              />
              
              {plainText && (
                <p className={`mt-2 px-2 pb-5 text-sm break-words select-text ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {renderMessageContent(plainText)}
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

          {message.message_type === "video" && message.file_url && (
            <div
              className={`relative rounded-2xl p-[3px] max-w-[280px] shadow-sm ${
                isSent
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
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
                        {repliedMessageText || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <video
                src={message.file_url}
                className={`w-full max-h-[300px] object-cover cursor-pointer ${
                  isSent
                    ? "rounded-xl rounded-br-sm"
                    : "rounded-xl rounded-bl-sm"
                }`}
                controls
                preload="metadata"
                controlsList="nodownload"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenMedia({ url: message.file_url || '', type: 'video' });
                }}
              />
              
              {plainText && (
                <p className={`mt-2 px-2 pb-5 text-sm break-words select-text ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {renderMessageContent(plainText)}
                </p>
              )}
              <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/40 rounded-full px-1.5 py-0.5 backdrop-blur-sm">
                <span className={`text-[10px] text-white/90`}>
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
                        {repliedMessageText || "📎 Attachment"}
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
              {plainText && (
                <p className={`mt-1.5 mb-0 text-sm break-words select-text ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {renderMessageContent(plainText)}
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

          {/* Reaction badges */}
          {Object.keys(reactions).length > 0 && (
            <div 
              className={`absolute bottom-[-12px] flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow-md border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition z-[10] ${
                isSent ? "right-3" : "left-3"
              }`}
              title={Object.entries(reactions)
                .map(([emoji, users]) => `${emoji} by ${users.join(", ")}`)
                .join("\n")}
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(true);
              }}
            >
              <div className="flex -space-x-1">
                {Object.keys(reactions).map((emoji) => (
                  <span key={emoji} className="text-xs">{emoji}</span>
                ))}
              </div>
              {Object.values(reactions).flat().length > 1 && (
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  {Object.values(reactions).flat().length}
                </span>
              )}
            </div>
          )}

          {showActions && (
            <div className={`absolute flex flex-col gap-2 p-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[100000] animate-slideInActions ${
              isSent ? "bottom-full right-0" : "bottom-full left-0"
            }`}>
              {/* WhatsApp reaction row */}
              <div className="flex justify-between items-center gap-1.5 pb-1.5 border-b border-gray-100 dark:border-gray-700 px-1">
                {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => {
                  const hasReacted = reactions[emoji]?.includes(currentUser);
                  return (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReact(emoji);
                      }}
                      className={`text-xl hover:scale-130 active:scale-95 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform ${
                        hasReacted ? "bg-green-100 dark:bg-green-950/50 scale-110" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-1">
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

              {isGroup && isSent && (
                <button
                  onClick={handleSeenBy}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                >
                  <span>👀</span>
                  <span>Seen by</span>
                </button>
              )}

              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {fullscreenMedia && (
        <>
          <div
            className="fixed inset-0 bg-black/90 z-[999999] animate-fadeIn"
            onClick={() => setFullscreenMedia(null)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000000] max-w-[90vw] max-h-[90vh] flex flex-col items-center animate-zoomIn">
            <button
              className="absolute -top-12 right-0 w-10 h-10 bg-white/90 rounded-full text-3xl cursor-pointer flex items-center justify-center hover:bg-white transition hover:rotate-90"
              onClick={() => setFullscreenMedia(null)}
            >
              ×
            </button>
            {fullscreenMedia.type === 'image' ? (
              <img
                src={`${API_URL}/api/v1/proxy-image?url=${encodeURIComponent(fullscreenMedia.url)}`}
                alt="Full size"
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
              />
            ) : (
              <video
                src={fullscreenMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
              />
            )}
            <a
              href={fullscreenMedia.url}
              download
              className="mt-6 bg-white/90 px-6 py-2.5 rounded-xl no-underline text-gray-900 font-bold text-sm hover:bg-white transition hover:-translate-y-1 shadow-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️ Download Media
            </a>
          </div>
        </>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col animate-scaleUp border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-base font-bold text-gray-900 dark:text-white text-center m-0">Delete message?</h3>
            </div>
            <div className="flex flex-col p-2 space-y-1">
              {isSent && (
                <button
                  onClick={(e) => executeDelete(e, "everyone")}
                  className="w-full py-3 px-4 text-red-500 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-sm disabled:opacity-50"
                  disabled={isDeleting}
                >
                  Delete for everyone
                </button>
              )}
              <button
                onClick={(e) => executeDelete(e, "me")}
                className="w-full py-3 px-4 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-sm disabled:opacity-50"
                disabled={isDeleting}
              >
                Delete for me
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteModal(false); }}
                className="w-full py-3 px-4 text-indigo-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition mt-1 text-sm disabled:opacity-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSeenByModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowSeenByModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-scaleUp border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-base font-bold text-gray-900 dark:text-white m-0">Seen by</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {seenByUsers.length} of {seenByTotalParticipants} members have seen this message
              </p>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-3">
              {seenByLoading && (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading viewers...
                </div>
              )}

              {!seenByLoading && seenByError && (
                <div className="py-8 text-center text-sm text-red-500 dark:text-red-400">
                  {seenByError}
                </div>
              )}

              {!seenByLoading && !seenByError && seenByUsers.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nobody has seen this message yet.
                </div>
              )}

              {!seenByLoading && !seenByError && seenByUsers.length > 0 && (
                <div className="space-y-2">
                  {seenByUsers.map((user) => (
                    <div
                      key={`${message.id}-${user.username}`}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5"
                    >
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-sm">
                          {(user.display_name || user.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.display_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{user.username}
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 text-right">
                        {formatSeenAt(user.seen_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowSeenByModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
