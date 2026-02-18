// File: video-call-main/src/features/chat/MessageItem.tsx

import React, { useState, useRef, useEffect } from "react";
import { Message } from "./ChatWindow";
import "./MessageItem.css";

interface MessageItemProps {
  message: Message;
  isSent: boolean;
  currentUser: string; // ✅ This is now just a string (username)
  onReply: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  onRefresh: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function MessageItem({ 
  message, 
  isSent, 
  currentUser, // ✅ This is the username string
  onReply, 
  onDelete,
  onForward,
  onRefresh 
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [imageFullscreen, setImageFullscreen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debug log to verify currentUser
  useEffect(() => {
    console.log("🔍 MessageItem rendered:", {
      messageId: message.id.substring(0, 8),
      currentUser: currentUser,
      currentUserType: typeof currentUser,
      isSent: isSent
    });
  }, [message.id, currentUser]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMessageStatus = () => {
    if (!isSent) return null;

    if (message.is_seen) {
      return <span className="status-icon seen">✓✓</span>;
    }
    if (message.is_delivered) {
      return <span className="status-icon delivered">✓✓</span>;
    }
    return <span className="status-icon sent">✓</span>;
  };

  // Click outside to close actions
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
      console.error("Failed to copy:", err);
      showNotification("Failed to copy message", "error");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // ✅ Verify currentUser is valid
    if (!currentUser || currentUser === "undefined" || currentUser === "null") {
      console.error("❌ Invalid currentUser:", currentUser);
      showNotification("Error: User session invalid", "error");
      return;
    }

    console.log("🗑️ Delete initiated:", {
      messageId: message.id,
      currentUser: currentUser,
      isSent: isSent
    });
    
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
      console.log("📡 Sending delete request:", {
        url: `${API_URL}/api/v1/messages/${message.id}`,
        username: currentUser,
        deleteFor: deleteFor
      });

      const response = await fetch(`${API_URL}/api/v1/messages/${message.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: currentUser, // ✅ Send username string
          deleteFor: deleteFor,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete message");
      }

      console.log("✅ Delete successful:", result);
      
      showNotification(
        `✓ ${result.message || "Message deleted"}`, 
        "success"
      );

      setTimeout(() => {
        onRefresh();
      }, 500);

    } catch (err: any) {
      console.error("❌ Delete failed:", err);
      showNotification(err.message || "Failed to delete message", "error");
      setIsDeleting(false);
    }
  };

  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    
    if (onForward) {
      onForward(message);
    } else {
      alert("Forward feature coming soon!");
    }
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    onReply(message);
  };

  const showNotification = (text: string, type: "success" | "error") => {
    const notification = document.createElement('div');
    notification.className = `message-notification ${type}`;
    notification.textContent = text;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  if (isDeleting) {
    return (
      <div className={`message-wrapper ${isSent ? "sent" : "received"}`}>
        <div className="message-bubble deleting">
          <span className="deleting-icon">⏳</span>
          <span className="deleting-text">Deleting...</span>
        </div>
      </div>
    );
  }

  if (message.is_deleted) {
    return (
      <div className={`message-wrapper ${isSent ? "sent" : "received"}`}>
        <div className="message-bubble deleted">
          <span className="deleted-icon">🚫</span>
          <span className="deleted-text">
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
        className={`message-wrapper ${isSent ? "sent" : "received"} ${showActions ? "active" : ""}`}
      >
        <div className="message-content" onClick={handleMessageClick}>
          {message.message_type === "text" && (
            <div className="message-bubble text">
              {message.reply_to && (
                <div className="message-quote">
                  <div className="quote-header">
                    <div className="quote-line"></div>
                    <div className="quote-content">
                      <div className="quote-sender">
                        {message.reply_to.sender_name}
                      </div>
                      <div className="quote-text">
                        {message.reply_to.message || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {message.is_forwarded && (
                <div className="forwarded-label">
                  <span className="forwarded-icon">↪️</span>
                  <span>Forwarded</span>
                </div>
              )}

              <p className="message-text">{message.message}</p>
              
              <div className="message-meta">
                <span className="message-time">{formatTime(message.created_at)}</span>
                {getMessageStatus()}
              </div>
            </div>
          )}

          {message.message_type === "image" && message.file_url && (
            <div className="message-bubble image">
              {message.reply_to && (
                <div className="message-quote image-quote">
                  <div className="quote-header">
                    <div className="quote-line"></div>
                    <div className="quote-content">
                      <div className="quote-sender">
                        {message.reply_to.sender_name}
                      </div>
                      <div className="quote-text">
                        {message.reply_to.message || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <img
                src={message.file_url}
                alt="Shared"
                className="message-image"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageFullscreen(true);
                }}
                loading="lazy"
              />
              {message.message && (
                <p className="file-caption">{message.message}</p>
              )}
              <div className="message-meta">
                <span className="message-time">{formatTime(message.created_at)}</span>
                {getMessageStatus()}
              </div>
            </div>
          )}

          {message.message_type === "file" && message.file_url && (
            <div className="message-bubble file">
              {message.reply_to && (
                <div className="message-quote file-quote">
                  <div className="quote-header">
                    <div className="quote-line"></div>
                    <div className="quote-content">
                      <div className="quote-sender">
                        {message.reply_to.sender_name}
                      </div>
                      <div className="quote-text">
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
                className="file-link"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="file-icon">📎</div>
                <div className="file-info">
                  <span className="file-name">
                    {message.file_name || "Download File"}
                  </span>
                  {message.file_size && (
                    <span className="file-size">
                      {(message.file_size / 1024).toFixed(2)} KB
                    </span>
                  )}
                </div>
              </a>
              {message.message && (
                <p className="file-caption">{message.message}</p>
              )}
              <div className="message-meta">
                <span className="message-time">{formatTime(message.created_at)}</span>
                {getMessageStatus()}
              </div>
            </div>
          )}
        </div>

        {showActions && (
          <div className={`message-actions ${isSent ? "sent" : "received"}`}>
            <button 
              onClick={handleReply} 
              className="action-btn reply-btn"
              title="Reply"
            >
              <span className="btn-icon">↩️</span>
              <span className="btn-label">Reply</span>
            </button>

            {message.message && (
              <button 
                onClick={handleCopy} 
                className="action-btn copy-btn"
                title="Copy"
              >
                <span className="btn-icon">📋</span>
                <span className="btn-label">Copy</span>
              </button>
            )}

            <button 
              onClick={handleForward} 
              className="action-btn forward-btn"
              title="Forward"
            >
              <span className="btn-icon">➡️</span>
              <span className="btn-label">Forward</span>
            </button>

            <button 
              onClick={handleDelete} 
              className="action-btn delete-btn"
              title="Delete"
            >
              <span className="btn-icon">🗑️</span>
              <span className="btn-label">Delete</span>
            </button>
          </div>
        )}
      </div>

      {imageFullscreen && (
        <>
          <div
            className="image-fullscreen-overlay"
            onClick={() => setImageFullscreen(false)}
          />
          <div className="image-fullscreen">
            <button
              className="close-fullscreen"
              onClick={() => setImageFullscreen(false)}
            >
              ×
            </button>
            <img src={message.file_url} alt="Full size" />
            <a
              href={message.file_url}
              download
              className="download-fullscreen"
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