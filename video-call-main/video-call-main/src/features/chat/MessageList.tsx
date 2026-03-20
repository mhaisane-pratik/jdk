import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import { Message } from "./ChatWindow";
import { groupMessagesByDate } from "../../utils/dateHelper";

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 scroll-smooth">
      <div className="py-4 flex flex-col w-full">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 dark:text-gray-400 mx-auto">
            <div className="text-7xl mb-5 opacity-50">💬</div>
            <p className="text-base m-0 text-gray-400 dark:text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.keys(groupedMessages).map((dateLabel) => (
            <div key={dateLabel} className="w-full">
              <div className="flex items-center justify-center my-4 sticky top-2 z-10">
                <span className="bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                  {dateLabel}
                </span>
              </div>
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