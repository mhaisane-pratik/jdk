import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../contexts/ChatContext";
import { socket } from "../api/socket";
import "./Login.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ChatLogin() {
  const navigate = useNavigate();
  const { setCurrentUser, currentUser } = useChat();
  
  // Login mode: 'username' or 'mobile'
  const [loginMode, setLoginMode] = useState<'username' | 'mobile'>('username');
  
  // Username fields
  const [name, setName] = useState("");
  
  // Mobile fields
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileStep, setMobileStep] = useState<'mobile' | 'otp' | 'username'>('mobile');
  const [mobileDisplayName, setMobileDisplayName] = useState("");
  
  // Common
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for focus management
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const mobileDisplayNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const existingUser = localStorage.getItem("chatUser");
    if (existingUser || currentUser) {
      console.log("✅ User already logged in, redirecting...");
      navigate("/chat", { replace: true });
      return;
    }

    if (loginMode === 'username') {
      usernameInputRef.current?.focus();
    } else {
      if (mobileStep === 'mobile') mobileInputRef.current?.focus();
      else if (mobileStep === 'otp') otpInputRef.current?.focus();
      else if (mobileStep === 'username') mobileDisplayNameRef.current?.focus();
    }
  }, [navigate, currentUser, loginMode, mobileStep]);

  // Validation functions
  const validateUsername = (username: string) => {
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 20) return "Username must be less than 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Only letters, numbers, and underscores allowed";
    return "";
  };

  const validateMobile = (mobile: string) => {
    if (!mobile) return "Please enter a mobile number";
    if (!/^\d{10}$/.test(mobile)) return "Enter a valid 10-digit mobile number";
    return "";
  };

  // Username login
  const submitUsername = async () => {
    const trimmedName = name.trim();
    setError("");

    if (!trimmedName) {
      setError("Please enter a username");
      usernameInputRef.current?.focus();
      return;
    }

    const validationError = validateUsername(trimmedName);
    if (validationError) {
      setError(validationError);
      usernameInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    console.log("🔐 Attempting login for:", trimmedName);

    try {
      const healthCheck = await fetch(`${API_URL}/health`, {
        method: 'GET',
      });

      if (!healthCheck.ok) {
        throw new Error("Backend server is not responding");
      }

      let res = await fetch(`${API_URL}/api/v1/users/${trimmedName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let userData;

      if (res.ok) {
        userData = await res.json();
        console.log("✅ Existing user found:", userData);
      } else {
        res = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: trimmedName,
            display_name: trimmedName,
            theme: "light",
            wallpaper: "default",
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${res.status}`);
        }

        userData = await res.json();
        console.log("✅ New user created:", userData);
      }

      localStorage.setItem("chatUser", trimmedName);
      setCurrentUser(userData);

      if (socket.connected) {
        socket.emit("user_join", { username: trimmedName });
      } else {
        socket.connect();
        socket.once("connect", () => {
          socket.emit("user_join", { username: trimmedName });
        });
      }

      setTimeout(() => {
        navigate("/chat", { replace: true });
      }, 100);

    } catch (err: any) {
      console.error("❌ Login failed:", err);
      
      let errorMessage = "Failed to login. ";
      
      if (err.message.includes("fetch")) {
        errorMessage += "Cannot connect to server. Please check if backend is running.";
      } else if (err.message.includes("Backend server")) {
        errorMessage += "Backend server is not responding.";
      } else {
        errorMessage += err.message || "Please try again.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile login functions
  const handleSendOtp = () => {
    const validationError = validateMobile(mobileNumber);
    if (validationError) {
      setError(validationError);
      mobileInputRef.current?.focus();
      return;
    }

    alert(`📱 OTP 123456 sent to ${mobileNumber} (simulated)`);
    setMobileStep('otp');
    setError("");
    setTimeout(() => otpInputRef.current?.focus(), 100);
  };

  const handleVerifyOtp = () => {
    if (!otp) {
      setError("Please enter the OTP");
      otpInputRef.current?.focus();
      return;
    }

    if (otp !== "123456") {
      setError("Invalid OTP. Please try again.");
      otpInputRef.current?.focus();
      return;
    }

    setMobileStep('username');
    setError("");
    setTimeout(() => mobileDisplayNameRef.current?.focus(), 100);
  };

  const handleMobileUsernameSubmit = async () => {
    const trimmedName = mobileDisplayName.trim();
    setError("");

    if (!trimmedName) {
      setError("Please enter a username");
      mobileDisplayNameRef.current?.focus();
      return;
    }

    const validationError = validateUsername(trimmedName);
    if (validationError) {
      setError(validationError);
      mobileDisplayNameRef.current?.focus();
      return;
    }

    setIsLoading(true);
    const mobile = mobileNumber.trim();

    try {
      let res = await fetch(`${API_URL}/api/v1/users/${trimmedName}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      let userData;

      if (res.ok) {
        userData = await res.json();
        console.log("✅ Existing user found:", userData);
      } else {
        res = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedName,
            display_name: trimmedName,
            mobile: mobile,
            theme: "light",
            wallpaper: "default",
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${res.status}`);
        }

        userData = await res.json();
        console.log("✅ New user created with mobile:", userData);
      }

      localStorage.setItem("chatUser", trimmedName);
      setCurrentUser(userData);

      if (socket.connected) {
        socket.emit("user_join", { username: trimmedName });
      } else {
        socket.connect();
        socket.once("connect", () => {
          socket.emit("user_join", { username: trimmedName });
        });
      }

      setTimeout(() => {
        navigate("/chat", { replace: true });
      }, 100);

    } catch (err: any) {
      console.error("❌ Mobile+username login failed:", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (loginMode === 'username' && name.trim() && !isLoading) {
        submitUsername();
      } else if (loginMode === 'mobile') {
        if (mobileStep === 'mobile') {
          handleSendOtp();
        } else if (mobileStep === 'otp') {
          handleVerifyOtp();
        } else if (mobileStep === 'username' && mobileDisplayName.trim() && !isLoading) {
          handleMobileUsernameSubmit();
        }
      }
    }
  };

  const resetMobileFlow = () => {
    setMobileStep('mobile');
    setMobileNumber("");
    setOtp("");
    setMobileDisplayName("");
    setError("");
  };

  const handleHomeClick = () => {
    navigate("/dashboard");
  };

  return (
    <div className="chat-login-container">
      {/* Home Icon Button - fully written, no placeholders */}
      <button 
        className="home-icon-button"
        onClick={handleHomeClick}
        aria-label="Go to Dashboard"
        title="Go to Dashboard"
        disabled={isLoading}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </button>

      <div className="login-wrapper">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              <span className="logo-letter">Z</span>
            </div>
            <h1 className="logo-text">
              <span className="logo-primary">ZAT</span>
              <span className="logo-secondary">CHAT</span>
            </h1>
          </div>
          <p className="tagline">Simple, Fast, Secure Messaging</p>
        </div>

        <div className="login-card">
          <div className="card-header">
            <p className="card-subtitle">
              {loginMode === 'username' 
                ? "Enter your username to get started" 
                : mobileStep === 'mobile'
                ? "Enter your mobile number"
                : mobileStep === 'otp'
                ? "Enter the OTP sent to your mobile"
                : "Choose a username for chat"}
            </p>
          </div>

          {/* Login Mode Toggle */}
          <div className="login-mode-toggle">
            <button
              className={`mode-btn ${loginMode === 'username' ? 'active' : ''}`}
              onClick={() => {
                setLoginMode('username');
                setError("");
                resetMobileFlow();
              }}
              disabled={isLoading}
            >
              👤 Username
            </button>
            <button
              className={`mode-btn ${loginMode === 'mobile' ? 'active' : ''}`}
              onClick={() => {
                setLoginMode('mobile');
                setError("");
                resetMobileFlow();
              }}
              disabled={isLoading}
            >
              📱 Mobile
            </button>
          </div>

          {loginMode === 'username' ? (
            /* Username Login Form */
            <>
              <div className="form-group">
                <label htmlFor="username" className="input-label">
                  <span className="label-icon">👤</span>
                  Your Username
                </label>
                <input
                  ref={usernameInputRef}
                  id="username"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your username (e.g., aaa)"
                  className={`login-input ${error ? 'error' : ''}`}
                  maxLength={20}
                  autoComplete="off"
                  disabled={isLoading}
                />
                {name.length > 0 && (
                  <span className="char-count">{name.length}/20</span>
                )}
              </div>
            </>
          ) : (
            /* Mobile Login Form with steps */
            <>
              {mobileStep === 'mobile' && (
                <>
                  <div className="form-group">
                    <label htmlFor="mobile" className="input-label">
                      <span className="label-icon">📱</span>
                      Mobile Number
                    </label>
                    <input
                      ref={mobileInputRef}
                      id="mobile"
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                        if (error) setError("");
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter 10-digit mobile number"
                      className={`login-input ${error ? 'error' : ''}`}
                      maxLength={10}
                      autoComplete="off"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={!mobileNumber || mobileNumber.length !== 10 || isLoading}
                    className={`login-btn send-otp-btn ${isLoading ? "loading" : ""}`}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">📨</span>
                        Send OTP
                      </>
                    )}
                  </button>
                </>
              )}

              {mobileStep === 'otp' && (
                <>
                  <div className="form-group">
                    <label htmlFor="otp" className="input-label">
                      <span className="label-icon">🔢</span>
                      Enter OTP
                    </label>
                    <input
                      ref={otpInputRef}
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                        if (error) setError("");
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter 6-digit OTP"
                      className={`login-input ${error ? 'error' : ''}`}
                      maxLength={6}
                      autoComplete="off"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={!otp || otp.length !== 6 || isLoading}
                    className={`login-btn verify-otp-btn ${isLoading ? "loading" : ""}`}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">✓</span>
                        Verify OTP
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setMobileStep('mobile')}
                    className="back-to-mobile-btn"
                    disabled={isLoading}
                  >
                    ← Change mobile number
                  </button>
                </>
              )}

              {mobileStep === 'username' && (
                <>
                  <div className="form-group">
                    <label htmlFor="mobileDisplayName" className="input-label">
                      <span className="label-icon">👤</span>
                      Choose a Username
                    </label>
                    <input
                      ref={mobileDisplayNameRef}
                      id="mobileDisplayName"
                      type="text"
                      value={mobileDisplayName}
                      onChange={(e) => {
                        setMobileDisplayName(e.target.value);
                        if (error) setError("");
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter your chat username"
                      className={`login-input ${error ? 'error' : ''}`}
                      maxLength={20}
                      autoComplete="off"
                      disabled={isLoading}
                    />
                    {mobileDisplayName.length > 0 && (
                      <span className="char-count">{mobileDisplayName.length}/20</span>
                    )}
                  </div>

                  <button
                    onClick={handleMobileUsernameSubmit}
                    disabled={!mobileDisplayName.trim() || isLoading}
                    className={`login-btn ${isLoading ? "loading" : ""}`}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Logging in...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">→</span>
                        Continue to Chat
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setMobileStep('otp')}
                    className="back-to-mobile-btn"
                    disabled={isLoading}
                  >
                    ← Back to OTP
                  </button>
                </>
              )}
            </>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          {loginMode === 'username' && (
            <button
              onClick={submitUsername}
              disabled={!name.trim() || isLoading}
              className={`login-btn ${isLoading ? "loading" : ""}`}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Connecting...
                </>
              ) : (
                <>
                  <span className="btn-icon">→</span>
                  Continue to Chat
                </>
              )}
            </button>
          )}
        </div>

        <div className="login-footer">
          <p className="footer-text">
            By entering, you agree to our{" "}
            <a href="#" className="footer-link">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="footer-link">
              Privacy
            </a>
          </p>
        </div>

        {/* Backend Connection Indicator */}
        <div className="connection-indicator">
          <div className="indicator-dot"></div>
          <span>Checking connection...</span>
        </div>
      </div>
    </div>
  );
}