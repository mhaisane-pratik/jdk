import React, { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { socket } from "../../api/socket";
import { Message } from "./ChatWindow";
const API_URL = import.meta.env.VITE_API_URL as string;

// Professional icons
import {
  Smile,
  Paperclip,
  Send,
  X,
  Image as ImageIcon,
  FileText,
  Archive,
  Mic,
  CornerUpRight,
  Loader2,
  AlertCircle,
  Paperclip as PaperclipIcon,
  ChevronRight,
  Sparkles
} from 'lucide-react';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
      textareaRef.current.style.height = newHeight + "px";
    }
  }, [text]);

  // Smart suggestions based on conversation context
  const quickReplies = [
    "Thanks! 👍",
    "I'll get back to you soon",
    "Got it, thanks!",
    "Let me check",
    "Perfect! 👌",
    "On it! 🚀"
  ];

  useEffect(() => {
    if (text.startsWith('/')) {
      const commands = ['/help', '/status', '/clear', '/mute', '/block'];
      setSuggestions(commands.filter(cmd => cmd.startsWith(text)));
      setShowSuggestions(true);
    } else if (text.length > 2) {
      setSuggestions(quickReplies.filter(reply => 
        reply.toLowerCase().includes(text.toLowerCase())
      ));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [text]);

  const handleTyping = (value: string) => {
    setText(value);
    socket.emit("typing", { roomId, sender });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { roomId, sender });
    }, 1000);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadError("File size must be less than 50MB");
      return;
    }

    const allowedTypes = [
      'image/', 'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument', 'text/plain',
      'application/zip', 'audio/', 'video/'
    ];
    
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      setUploadError("File type not supported");
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadProgress(0);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      setUploadError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    const trimmedText = text.trim();
    if (!receiver) {
      alert("Error: Receiver not set. Please restart the chat.");
      return;
    }
    if (!trimmedText && !selectedFile) return;

    if (trimmedText) {
      socket.emit("send_message", {
        roomId,
        sender,
        receiver,
        message: trimmedText,
        reply_to_id: replyingTo?.id || null,
      });
    }

    if (selectedFile) {
      setUploading(true);
      setUploadError(null);
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("roomId", roomId);
      formData.append("sender", sender);
      formData.append("receiver", receiver);

      try {
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const res = await fetch(`${API_URL}/api/v1/chats/upload`, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!res.ok) throw new Error(`Upload failed with status: ${res.status}`);
        
        const data = await res.json();
        if (data?.file_url) {
          socket.emit("send_file", {
            roomId,
            sender,
            receiver,
            message_type: data.message_type,
            file_url: data.file_url,
            file_name: data.file_name,
            file_size: data.file_size,
          });
        } else {
          throw new Error("No file URL in response");
        }

        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error: any) {
        setUploadError("Upload failed. Please try again.");
        setUploadProgress(0);
        setUploading(false);
        return;
      }
    }

    socket.emit("stop_typing", { roomId, sender });
    setText("");
    clearFileSelection();
    setShowEmoji(false);
    onCancelReply();
    setUploading(false);
    textareaRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon size={20} />;
    if (file.type.includes('pdf')) return <FileText size={20} />;
    if (file.type.includes('zip')) return <Archive size={20} />;
    return <PaperclipIcon size={20} />;
  };

  return (
    <div
      className={`
        fixed z-[90]
        bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)]
        border border-gray-100
        left-0 right-0
        bottom-[12px]
        mx-3 sm:mx-4 md:mx-6
        backdrop-blur-sm bg-opacity-95
        transition-all duration-300
        hover:shadow-[0_8px_35px_rgba(0,0,0,0.15)]
        md:left-[420px] md:w-auto
      `}
    >
      {/* Smart Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 mx-3 sm:mx-4 md:mx-0 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-slideUp"
        >
          <div className="p-2 max-h-[200px] overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center gap-2 group"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {text.startsWith('/') ? (
                  <Sparkles size={16} className="text-blue-500 flex-shrink-0" />
                ) : (
                  <CornerUpRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm text-gray-700 flex-1 truncate">{suggestion}</span>
                <ChevronRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div
          className={`
            flex items-center gap-2 sm:gap-3 py-2 sm:py-3 px-3 sm:px-4
            bg-gradient-to-r from-blue-50 to-indigo-50
            rounded-t-[24px] border-b border-blue-100
            animate-slideDown
          `}
        >
          <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full flex-shrink-0"></div>
          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-blue-600 lowercase flex items-center gap-1">
              <CornerUpRight size={10} className="sm:w-3 sm:h-3" />
              <span className="truncate">Replying to {replyingTo.sender_name}</span>
            </span>
            <span className="text-xs sm:text-[13px] text-gray-600 truncate">
              {replyingTo.message || `${replyingTo.message_type}`}
            </span>
          </div>
          <button
            className="w-6 h-6 sm:w-8 sm:h-8 border-none bg-white/50 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition-all flex-shrink-0 backdrop-blur-sm group"
            onClick={onCancelReply}
          >
            <X size={14} className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div
          className={`
            flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4
            bg-gradient-to-r from-gray-50 to-gray-100/50
            rounded-t-[24px] border-b border-gray-200
            animate-slideDown
          `}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              {filePreview ? (
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg sm:rounded-xl shadow-md"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                  {getFileIcon(selectedFile)}
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                  {uploadProgress}%
                </div>
              )}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs sm:text-[14px] font-medium text-gray-900 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[250px]">
                {selectedFile.name}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>
          <button
            className="w-6 h-6 sm:w-8 sm:h-8 border-none bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-all flex-shrink-0 shadow-sm group"
            onClick={clearFileSelection}
            disabled={uploading}
          >
            <X size={14} className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center gap-2 py-1.5 sm:py-2 px-3 sm:px-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-[24px] border-b border-red-200 text-red-600 text-xs sm:text-[13px] animate-shake">
          <AlertCircle size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">{uploadError}</span>
          <button 
            onClick={() => setUploadError(null)}
            className="ml-auto hover:bg-red-100 rounded-full p-1 flex-shrink-0"
          >
            <X size={12} className="sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <>
          <div className="fixed inset-0 z-[9999] bg-black/5 backdrop-blur-sm" onClick={() => setShowEmoji(false)} />
          <div
            className="fixed z-[10000] shadow-2xl rounded-2xl overflow-hidden animate-scaleUp"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '90px',
              maxWidth: 'calc(100vw - 32px)'
            }}
          >
            <div className="scale-[0.85] sm:scale-100 origin-bottom">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width="350px"
                height="400px"
                searchPlaceholder="Search emoji..."
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
              />
            </div>
          </div>
        </>
      )}

      {/* Input Controls */}
      <div
        className={`
          flex items-end gap-1 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3
        `}
      >
        <button
          className={`
            w-9 h-9 sm:w-[42px] sm:h-[42px] flex items-center justify-center rounded-full
            text-gray-600
            hover:bg-gray-100
            transition-all duration-200 hover:scale-110
            disabled:opacity-40 disabled:hover:scale-100
            flex-shrink-0 relative group
            ${showEmoji ? 'bg-gray-100 text-blue-500' : ''}
          `}
          onClick={() => setShowEmoji(!showEmoji)}
          title="Emoji"
          disabled={uploading}
        >
          <Smile size={18} className="sm:w-[22px] sm:h-[22px] group-hover:rotate-12 transition-transform" />
        </button>

        <label
          className={`
            w-9 h-9 sm:w-[42px] sm:h-[42px] flex items-center justify-center rounded-full
            text-gray-600
            hover:bg-gray-100
            transition-all duration-200 hover:scale-110
            disabled:opacity-40
            flex-shrink-0 cursor-pointer relative group
          `}
          title="Attach file"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,audio/*,video/*"
            disabled={uploading}
          />
          <Paperclip size={18} className="sm:w-[22px] sm:h-[22px] group-hover:-rotate-12 transition-transform" />
        </label>

        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="
              w-full
              px-3 sm:px-4
              py-0
              rounded-xl
              bg-gray-100
              border border-transparent
              text-[15px]
              placeholder-gray-500
              focus:border-transparent
              focus:bg-white
              focus:shadow-none
              outline-none
              transition-all duration-200
              resize-none
              disabled:opacity-50
              min-h-[35px]
              max-h-[100px]
              overflow-y-auto
                flex items-center 
            "
            disabled={uploading}
            autoFocus
          />

          
          {text && (
            <button
              className="absolute right-2 sm:right-3 bottom-2.5 sm:bottom-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setText('')}
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        <button
          className={`
            w-10 h-10 sm:w-[46px] sm:h-[46px] flex items-center justify-center rounded-full
            bg-gradient-to-r from-blue-500 to-indigo-500
            text-white
            shadow-lg shadow-blue-500/30
            transition-all duration-200
            hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105
            active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
            flex-shrink-0 relative group
            ${text || selectedFile ? 'animate-soft-pulse' : ''}
          `}
          onClick={sendMessage}
          disabled={(!text.trim() && !selectedFile) || uploading}
          title="Send"
        >
          {uploading ? (
            <Loader2 size={18} className="sm:w-[22px] sm:h-[22px] animate-spin" />
          ) : (
            <Send size={18} className="sm:w-[22px] sm:h-[22px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          )}
        </button>

        {/* Voice message button */}
        <button
          className={`
            w-9 h-9 sm:w-[42px] sm:h-[42px] hidden sm:flex items-center justify-center rounded-full
            text-gray-600
            hover:bg-gray-100
            transition-all duration-200 hover:scale-110
            flex-shrink-0 relative group
            ${isRecording ? 'bg-red-100 text-red-500 animate-pulse' : ''}
          `}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          title={isRecording ? "Recording... release to send" : "Hold to record"}
        >
          <Mic size={18} className="sm:w-[22px] sm:h-[22px] group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}