import { Routes, Route, Navigate } from "react-router-dom";
import { ChatProvider } from "./contexts/ChatContext";

import ChatLogin from "./pages/Login";
import ChatLayout from "./features/chat/ChatLayout";
import ProtectedRoute from "./app/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <ChatProvider>
      <Routes>
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
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/chat-login" replace />} />
      </Routes>
    </ChatProvider>
  );
}

