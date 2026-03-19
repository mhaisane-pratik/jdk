import { Routes, Route, Navigate } from "react-router-dom";
import { ChatProvider } from "./contexts/ChatContext";

import ChatLogin from "./pages/Login";
import ChatLayout from "./features/chat/ChatLayout";
import ProtectedRoute from "./app/ProtectedRoute";

export default function App() {
  return (
    <ChatProvider>
      <Routes>
        {/* Default route → Login */}
        <Route path="/" element={<Navigate to="/chat-login" replace />} />

        <Route path="/chat-login" element={<ChatLogin />} />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/chat-login" replace />} />
      </Routes>
    </ChatProvider>
  );
}