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
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const mobileDisplayNameRef = useRef<HTMLInputElement>(null);

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

  /* ================= USERNAME LOGIN ================= */

  const submitUsername = async () => {
    const trimmedName = name.trim();
    setError("");

    if (!trimmedName) {
      setError("Please enter a username");
      return;
    }

    const validationError = validateUsername(trimmedName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // 🔹 Check backend health
      const health = await fetch(`${API_URL}/health`);
      if (!health.ok) throw new Error("Backend not responding");

      let userData: any = null;

      // 🔹 Try fetch existing user
      const res = await fetch(`${API_URL}/api/v1/users/${trimmedName}`);
      if (res.ok) {
        userData = await res.json();
      }

      // 🔹 If user not found → create
      if (!userData) {
        const createRes = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedName,
            display_name: trimmedName,
            theme: "light",
            wallpaper: "default",
          }),
        });

        if (!createRes.ok) {
          throw new Error("Failed to create user");
        }

        userData = await createRes.json();
      }

      // 🔹 Safety check
      if (!userData) {
        throw new Error("User data invalid");
      }

      localStorage.setItem("chatUser", trimmedName);
      setCurrentUser(userData);

      if (!socket.connected) socket.connect();

      socket.emit("user_join", { username: trimmedName });

      navigate("/chat", { replace: true });

    } catch (err: any) {
      console.error(err);
      setError("Failed to start chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= MOBILE LOGIN ================= */

  const handleSendOtp = () => {
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError("Enter valid 10 digit mobile number");
      return;
    }

    alert("OTP 123456 sent (demo)");
    setMobileStep("otp");
  };

  const handleVerifyOtp = () => {
    if (otp !== "123456") {
      setError("Invalid OTP");
      return;
    }
    setMobileStep("username");
  };

  const handleMobileUsernameSubmit = async () => {
    const trimmedName = mobileDisplayName.trim();
    setError("");

    if (!trimmedName) {
      setError("Enter username");
      return;
    }

    setIsLoading(true);

    try {
      let userData: any = null;

      const res = await fetch(`${API_URL}/api/v1/users/${trimmedName}`);
      if (res.ok) {
        userData = await res.json();
      }

      if (!userData) {
        const createRes = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedName,
            display_name: trimmedName,
            mobile: mobileNumber,
          }),
        });

        if (!createRes.ok) throw new Error("Create failed");
        userData = await createRes.json();
      }

      if (!userData) throw new Error("Invalid user");

      localStorage.setItem("chatUser", trimmedName);
      setCurrentUser(userData);

      if (!socket.connected) socket.connect();
      socket.emit("user_join", { username: trimmedName });

      navigate("/chat", { replace: true });

    } catch (err) {
      setError("Failed to start chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-login-container">
      <div className="login-wrapper">
        <h1>ZAT CHAT</h1>

        {loginMode === "username" ? (
          <>
            <input
              ref={usernameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter username"
            />
            <button onClick={submitUsername} disabled={isLoading}>
              Start Chat
            </button>
          </>
        ) : (
          <>
            {mobileStep === "mobile" && (
              <>
                <input
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Mobile number"
                />
                <button onClick={handleSendOtp}>Send OTP</button>
              </>
            )}

            {mobileStep === "otp" && (
              <>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
                <button onClick={handleVerifyOtp}>Verify</button>
              </>
            )}

            {mobileStep === "username" && (
              <>
                <input
                  value={mobileDisplayName}
                  onChange={(e) => setMobileDisplayName(e.target.value)}
                  placeholder="Choose username"
                />
                <button onClick={handleMobileUsernameSubmit}>
                  Continue
                </button>
              </>
            )}
          </>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button onClick={() => setLoginMode(loginMode === "username" ? "mobile" : "username")}>
          Switch Login Mode
        </button>
      </div>
    </div>
  );
}