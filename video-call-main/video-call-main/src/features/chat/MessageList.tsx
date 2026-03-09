// File: video-call-main/src/features/chat/MessageList.tsx

import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import { Message } from "./ChatWindow";
import { groupMessagesByDate } from "../../utils/dateHelper";
import "./MessageList.css";

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  onReply: (message: Message) => void;
  onRefresh: () => void;
}

export default function MessageList({
  messages,
  currentUser,
  onReply,
  onRefresh,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="message-list">
      <div className="message-container">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="empty-chat">
          
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.keys(groupedMessages).map((dateLabel) => (
            <div key={dateLabel} className="message-date-group">
              {/* ✅ Date Divider */}
              <div className="date-divider">
                <span className="date-divider-text">{dateLabel}</span>
              </div>

              {/* Messages for this date */}
              {groupedMessages[dateLabel].map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isSent={message.sender_name === currentUser}
                  currentUser={currentUser}
                  onReply={onReply}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}