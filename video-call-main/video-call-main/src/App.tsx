import { Routes, Route, Navigate } from "react-router-dom";
import { ChatProvider } from "./contexts/ChatContext";

import Landing from "./features/landing/Landing";
import ChatLayout from "./features/chat/ChatLayout";

export default function App() {
  return (
    <ChatProvider>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<Landing />} />

        {/* Direct chat access (NO LOGIN) */}
        <Route path="/chat" element={<ChatLayout />} />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ChatProvider>
  );
}