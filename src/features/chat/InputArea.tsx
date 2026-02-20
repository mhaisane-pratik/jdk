// File: video-call-main/src/features/chat/InputArea.tsx

import React, { useState, useRef } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { socket } from "../../api/socket";
import { Message } from "./ChatWindow";
import "./InputArea.css";
const API_URL = import.meta.env.VITE_API_URL as string;

interface InputAreaProps {
  roomId: string;
  sender: string;
  receiver: string;
  replyingTo: Message | null;
  onCancelReply: () => void;
}

export default function InputArea({
  roomId,
  sender,
  receiver,
  replyingTo,
  onCancelReply,
}: InputAreaProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleTyping = (value: string) => {
    setText(value);

    // Emit typing event
    socket.emit("typing", { roomId, sender });

    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Set new timeout to stop typing after 1 second
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { roomId, sender });
    }, 1000);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
    textInputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    // Preview image
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    const trimmedText = text.trim();

    // 🔴 DEBUG: Log what we're sending
    console.log("━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━━");
    console.log("📤 InputArea sending:");
    console.log({
      roomId,
      sender,
      receiver,
      hasMessage: !!trimmedText,
      hasFile: !!selectedFile,
      messageLength: trimmedText.length,
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Validate before sending
    if (!receiver) {
      console.error("❌ Cannot send: receiver is empty!");
      alert("Error: Receiver not set. Please restart the chat.");
      return;
    }

    if (!trimmedText && !selectedFile) {
      console.warn("⚠️ Nothing to send - no text and no file");
      return;
    }

    // Send text message
    if (trimmedText) {
      const payload = {
        roomId,
        sender,
        receiver,
        message: trimmedText,
        reply_to_id: replyingTo?.id || null,
      };

      console.log("📨 Emitting text message payload:", payload);
      socket.emit("send_message", payload);
      console.log("✅ Text message emitted to socket");
    }

    // Send file
    if (selectedFile) {
      setUploading(true);
      setUploadError(null);
      console.log("📁 Starting file upload...");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("roomId", roomId);
      formData.append("sender", sender);
      formData.append("receiver", receiver);

      try {
        console.log("⬆️ Uploading file to server...");
        const res = await fetch(`${API_URL}/api/v1/chats/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Upload failed with status: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ File uploaded successfully:", data);

        if (data?.file_url) {
          const filePayload = {
            roomId,
            sender,
            receiver,
            message_type: data.message_type,
            file_url: data.file_url,
            file_name: data.file_name,
            file_size: data.file_size,
          };

          console.log("📨 Emitting file message payload:", filePayload);
          socket.emit("send_file", filePayload);
          console.log("✅ File message emitted to socket");
        } else {
          throw new Error("No file URL in response");
        }
      } catch (error: any) {
        console.error("❌ File upload error:", error);
        setUploadError("Upload failed. Please try again.");
        setUploading(false);
        return;
      }
    }

    // Clear everything
    console.log("🧹 Clearing input and stopping typing indicator");
    socket.emit("stop_typing", { roomId, sender });
    setText("");
    clearFileSelection();
    setShowEmoji(false);
    onCancelReply();
    setUploading(false);
    textInputRef.current?.focus();
    console.log("✅ Message send complete\n");
  };

  return (
    <div className="input-area">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="reply-preview-bar">
          <div className="reply-indicator"></div>
          <div className="reply-info">
            <span className="replying-to">
              Replying to {replyingTo.sender_name}
            </span>
            <span className="reply-message-preview">
              {replyingTo.message || `${replyingTo.message_type}`}
            </span>
          </div>
          <button className="cancel-reply" onClick={onCancelReply}>
            ×
          </button>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="file-preview-bar">
          <div className="preview-content">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="preview-image" />
            ) : (
              <span className="file-icon">📄</span>
            )}
            <div className="file-details">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>
          <button className="remove-file" onClick={clearFileSelection}>
            ×
          </button>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          {uploadError}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <>
          <div className="emoji-overlay" onClick={() => setShowEmoji(false)} />
          <div className="emoji-picker-container">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              width="100%"
              height="350px"
              searchPlaceholder="Search emoji..."
            />
          </div>
        </>
      )}

      {/* Input Controls */}
      <div className="input-controls">
        <button
          className="input-btn emoji-btn"
          onClick={() => setShowEmoji(!showEmoji)}
          title="Emoji"
          disabled={uploading}
        >
          😊
        </button>

        <label className="input-btn attach-btn" title="Attach file">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            disabled={uploading}
          />
          📎
        </label>

        <input
          ref={textInputRef}
          type="text"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={uploading ? "Uploading..." : "Type a message"}
          className="message-input"
          disabled={uploading}
          autoFocus
        />

        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={(!text.trim() && !selectedFile) || uploading}
          title="Send"
        >
          {uploading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}