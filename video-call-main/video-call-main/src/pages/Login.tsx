import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useChat } from "../contexts/ChatContext";
import { socket } from "../api/socket";
import { Home, User, MessageSquare } from "lucide-react";
import "./Login.css";

const API_URL = import.meta.env.VITE_API_URL as string;
const API_KEY = "ZATCHAT_PRATEEK9373";

export default function ChatLogin() {
  const navigate = useNavigate();
  const { setCurrentUser, currentUser } = useChat();

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWhatsAppLoading, setShowWhatsAppLoading] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    const existingUser = localStorage.getItem("chatUser");
    if (existingUser || currentUser) {
      navigate("/chat", { replace: true });
    }
  }, [navigate, currentUser]);

  // Focus username input on mount
  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const validateUsername = (name: string) => {
    if (name.length < 3) return "Username must be at least 3 characters";
    if (name.length > 20) return "Username must be less than 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(name))
      return "Only letters, numbers, and underscores allowed";
    return "";
  };

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    const valError = validateUsername(trimmedUsername);
    if (valError) {
      setError(valError);
      return;
    }

    setShowWhatsAppLoading(true);
    setIsLoading(true);
    setError("");

    try {
      // Health check
      const health = await fetch(`${API_URL}/health`);
      if (!health.ok) throw new Error("Backend not responding");

      // Try to get existing user or create new one
      let userData: any = null;
      const res = await fetch(`${API_URL}/api/v1/users/${trimmedUsername}`);
      if (res.ok) userData = await res.json();

      if (!userData) {
        const createRes = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify({
            username: trimmedUsername,
            display_name: trimmedUsername,
          }),
        });
        if (!createRes.ok) throw new Error("Failed to create user");
        userData = await createRes.json();
      }

      localStorage.setItem("chatUser", trimmedUsername);
      setCurrentUser(userData);

      if (!socket.connected) socket.connect();
      socket.emit("user_join", { username: trimmedUsername });

      // Wait 10 seconds to show WhatsApp loading animation
      setTimeout(() => {
        setShowWhatsAppLoading(false);
        setIsLoading(false);
        navigate("/chat", { replace: true });
      }, 10000);
    } catch (err: any) {
      setShowWhatsAppLoading(false);
      setIsLoading(false);
      setError(err.message || "Login failed");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="login-page">
      {/* Home button */}
      <Link to="/" className="home-button">
        <Home size={20} />
        <span>Home</span>
      </Link>

      <div className="login-container">
        <div className="login-card">
          {/* WhatsApp-style Loading Overlay */}
          {showWhatsAppLoading && (
            <div className="whatsapp-loading-overlay">
              <div className="whatsapp-loading-content">
                <div className="whatsapp-logo">
                  <MessageSquare size={48} />
                </div>
                <div className="whatsapp-loading-bar">
                  <div className="whatsapp-loading-progress"></div>
                </div>
                <p className="whatsapp-loading-text">Connecting...</p>
              </div>
            </div>
          )}

          {/* Brand - ZatChat */}
          <div className="brand">
            <div className="logo">
              <MessageSquare size={32} />
            </div>
            <h1>ZatChat</h1>
            <p>Connect with anyone, anywhere</p>
          </div>

          {/* Error message */}
          {error && <div className="error-message">⚠️ {error}</div>}

          {/* Simple Username Login Form */}
          <div className="form">
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input
                ref={usernameInputRef}
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
            </div>
            <button
              className="login-button"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading && !showWhatsAppLoading ? (
                <span className="spinner" />
              ) : (
                "Start Chatting"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}