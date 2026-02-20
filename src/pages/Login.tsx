import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../contexts/ChatContext";
import { socket } from "../api/socket";
import "./Login.css";

const API_URL = "https://bac-fa0o.onrender.com";

export default function ChatLogin() {
  const navigate = useNavigate();
  const { setCurrentUser, currentUser } = useChat();

  const [loginMode, setLoginMode] = useState<'username' | 'mobile'>('username');
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileStep, setMobileStep] = useState<'mobile' | 'otp' | 'username'>('mobile');
  const [mobileDisplayName, setMobileDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const existingUser = localStorage.getItem("chatUser");
    if (existingUser || currentUser) {
      navigate("/chat", { replace: true });
      return;
    }
    if (loginMode === 'username') usernameInputRef.current?.focus();
  }, [navigate, currentUser, loginMode]);

  const validateUsername = (username: string) => {
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 20) return "Username must be less than 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Only letters, numbers, and underscores allowed";
    return "";
  };

  const handleUserAuth = async (username: string, extraData = {}) => {
    setIsLoading(true);
    setError("");
    try {
      // Check health
      const health = await fetch(`${API_URL}/health`);
      if (!health.ok) throw new Error("Backend not responding");

      let userData: any = null;
      const res = await fetch(`${API_URL}/api/v1/users/${username}`);
      if (res.ok) {
        userData = await res.json();
      }

      if (!userData) {
        const createRes = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            display_name: username,
            theme: "light",
            wallpaper: "default",
            ...extraData
          }),
        });
        if (!createRes.ok) throw new Error("Failed to create user");
        userData = await createRes.json();
      }

      localStorage.setItem("chatUser", username);
      setCurrentUser(userData);
      if (!socket.connected) socket.connect();
      socket.emit("user_join", { username });
      navigate("/chat", { replace: true });
    } catch (err: any) {
      setError("Connection failed. Please check your server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-login-container">
      {/* Home Button */}
      <button className="home-icon-button" onClick={() => navigate("/")}>
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
      </button>

      <div className="login-wrapper">
        {/* Header/Logo Section */}
        <header className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              <span className="logo-letter">Z</span>
            </div>
            <div className="logo-text">
              <span className="logo-primary">ZAT</span>
              <span className="logo-secondary">CHAT</span>
            </div>
          </div>
          <p className="tagline">Connect instantly with anyone, anywhere.</p>
        </header>

        {/* Main Card */}
        <main className="login-card">
          <div className="card-header">
            <h2>{loginMode === 'username' ? 'Welcome Back' : 'Mobile Login'}</h2>
            <p className="card-subtitle">Please enter your details to continue</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="login-mode-toggle">
            <button 
              className={`mode-btn ${loginMode === 'username' ? 'active' : ''}`}
              onClick={() => { setLoginMode('username'); setError(""); }}
            >
              Username
            </button>
            <button 
              className={`mode-btn ${loginMode === 'mobile' ? 'active' : ''}`}
              onClick={() => { setLoginMode('mobile'); setError(""); }}
            >
              Mobile
            </button>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          {loginMode === "username" ? (
            <div className="form-group">
              <label className="input-label">
                <span className="label-icon">👤</span> Username
              </label>
              <input
                ref={usernameInputRef}
                className={`login-input ${error ? 'error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. janesmith_99"
                disabled={isLoading}
              />
              <span className="char-count">{name.length}/20</span>
              <button 
                className={`login-btn ${isLoading ? 'loading' : ''}`} 
                onClick={() => {
                  const valErr = validateUsername(name.trim());
                  if (valErr) setError(valErr);
                  else handleUserAuth(name.trim());
                }} 
                disabled={isLoading}
              >
                {isLoading ? <div className="spinner" /> : "Start Chatting"}
              </button>
            </div>
          ) : (
            <div className="form-group">
              {mobileStep === "mobile" && (
                <>
                  <label className="input-label">📱 Mobile Number</label>
                  <input
                    className="login-input"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="10 digit number"
                  />
                  <button className="login-btn send-otp-btn" onClick={() => {
                    if (!/^\d{10}$/.test(mobileNumber)) setError("Enter 10 digits");
                    else { setMobileStep("otp"); setError(""); }
                  }}>
                    Send OTP
                  </button>
                </>
              )}

              {mobileStep === "otp" && (
                <>
                  <label className="input-label">🔑 Enter OTP</label>
                  <input
                    className="login-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code (123456)"
                  />
                  <button className="login-btn verify-otp-btn" onClick={() => {
                    if (otp !== "123456") setError("Invalid OTP");
                    else { setMobileStep("username"); setError(""); }
                  }}>
                    Verify OTP
                  </button>
                  <button className="back-to-mobile-btn" onClick={() => setMobileStep("mobile")}>
                    Change Number
                  </button>
                </>
              )}

              {mobileStep === "username" && (
                <>
                  <label className="input-label">✨ Choose Display Name</label>
                  <input
                    className="login-input"
                    value={mobileDisplayName}
                    onChange={(e) => setMobileDisplayName(e.target.value)}
                    placeholder="What should we call you?"
                  />
                  <button 
                    className={`login-btn ${isLoading ? 'loading' : ''}`} 
                    onClick={() => handleUserAuth(mobileDisplayName.trim(), { mobile: mobileNumber })}
                    disabled={isLoading}
                  >
                    {isLoading ? <div className="spinner" /> : "Complete Setup"}
                  </button>
                </>
              )}
            </div>
          )}
        </main>

        <footer className="login-footer">
          <p className="footer-text">
            By joining, you agree to our <a href="#" className="footer-link">Terms of Service</a>
          </p>
        </footer>
      </div>

      <div className="connection-indicator">
        <div className="indicator-dot"></div>
        <span>Server Online</span>
      </div>
    </div>
  );
}