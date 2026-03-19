import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ChatProvider, useChat } from "./contexts/ChatContext";
import ChatLayout from "./features/chat/ChatLayout";
import ProtectedRoute from "./app/ProtectedRoute";

const API_URL = import.meta.env.VITE_API_URL as string;

function SSOHandler({ children }: { children: React.ReactNode }) {
  const { setCurrentUser } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const ssoToken = url.searchParams.get("sso_token");
    if (!ssoToken) return;

    // Clean URL after processing
    window.history.replaceState({}, document.title, "/chat");

    fetch(`${API_URL}/api/v1/auth/sso-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: ssoToken }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("chatUser", data.user.username);
          navigate("/chat", { replace: true });
        }
      });
  }, [setCurrentUser, navigate]);

  return <>{children}</>;
}

export default function App() {
  return (
    <ChatProvider>
      <SSOHandler>
        <Routes>
          {/* Direct to chat, always */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatLayout />
              </ProtectedRoute>
            }
          />
          {/* Fallback for all other routes: always go to /chat */}
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </SSOHandler>
    </ChatProvider>
  );
}