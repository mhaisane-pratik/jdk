import { useNavigate } from "react-router-dom";
import { useState, FormEvent, useEffect } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      sessionStorage.setItem("authToken", "token");
      sessionStorage.setItem("user", username || "User");
      localStorage.setItem("zatchat-user-id", crypto.randomUUID());
      navigate("/dashboard");
    }, 800);
  };

  const handleGoogleLogin = () => {
    alert("Google login integration here");
  };

  const styles = getStyles(isMobile);

  return (
    <>
      <style>{keyframesCSS}</style>
      <div style={styles.container}>
        {/* LEFT IMAGE PANEL */}
        <div style={styles.leftPanel}>
          <div style={styles.imageOverlay}>
            <div style={styles.overlayContent}>
              <h1 style={styles.mainHeading}>Zat Meet</h1>
              <p style={styles.subHeading}>
                Secure meetings. Real-time collaboration. Connect with your team
                anywhere, anytime.
              </p>
              <div style={styles.featureList}>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>🔒</span>
                  <span>End-to-End Encrypted</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>🎥</span>
                  <span>HD Video Quality</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>⚡</span>
                  <span>Lightning Fast</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}
        <div style={styles.rightPanel}>
          <div style={styles.loginContent}>
            {/* Brand Header */}
            <div style={styles.brandHeader}>
              <div style={styles.logoIcon}>Z</div>
              <span style={styles.brandName}>Zat Meet</span>
            </div>

            {/* Welcome Text */}
            <div style={styles.textHeader}>
              <h2 style={styles.welcomeTitle}>Welcome back</h2>
              <p style={styles.welcomeSubtitle}>
                Login to your secure workspace
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(37, 99, 235, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(37, 99, 235, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={styles.actionsRow}>
                <label style={styles.checkboxContainer}>
                  <input type="checkbox" style={styles.checkbox} />
                  <span style={styles.checkboxLabel}>Remember me</span>
                </label>
                <a href="#" style={styles.forgotLink}>
                  Forgot password?
                </a>
              </div>

              <button
                style={{
                  ...styles.btnPrimary,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
                type="submit"
                disabled={isLoading}
                onMouseEnter={(e) => {
                  if (!isLoading && !isMobile) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(37, 99, 235, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px rgba(37, 99, 235, 0.35)";
                  }
                }}
              >
                {isLoading ? <span style={styles.loader}></span> : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerLine}></span>
              <span style={styles.dividerText}>or continue with</span>
              <span style={styles.dividerLine}></span>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              style={styles.btnGoogle}
              onClick={handleGoogleLogin}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.borderColor = "#2563eb";
                  e.currentTarget.style.backgroundColor =
                    "rgba(37, 99, 235, 0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }
              }}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width="20"
                height="20"
              />
              Continue with Google
            </button>

            {/* Footer Links */}
            <div style={styles.bottomText}>
              Don't have an account?{" "}
              <a href="#" style={styles.signupLink}>
                Create one
              </a>
            </div>

            <div style={styles.legalFooter}>
              © 2026 Zat Meet · End-to-End Encrypted
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== KEYFRAMES CSS ====================
const keyframesCSS = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ==================== DYNAMIC STYLES FUNCTION ====================
function getStyles(isMobile: boolean): { [key: string]: React.CSSProperties } {
  return {
    container: {
      display: "flex",
      flexDirection: isMobile ? "column" : ("row" as const),
      width: "100vw",
      height: "100vh",
      margin: 0,
      padding: 0,
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: "hidden",
      position: "fixed",
      top: 0,
      left: 0,
    },

    // LEFT PANEL STYLES
    leftPanel: {
      width: isMobile ? "100%" : "50%",
      height: isMobile ? "35vh" : "100vh",
      background:
        "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(37, 99, 235, 0.9) 100%), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071') center/cover no-repeat",
      position: "relative",
      flexShrink: 0,
      overflow: "hidden",
    },

    imageOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "30px 25px" : "80px 60px",
    },

    overlayContent: {
      maxWidth: isMobile ? "100%" : "540px",
      color: "#ffffff",
    },

    mainHeading: {
      fontSize: isMobile ? "32px" : "56px",
      fontWeight: 800,
      marginBottom: isMobile ? "12px" : "20px",
      lineHeight: 1.1,
      letterSpacing: isMobile ? "-1px" : "-1.5px",
      color: "#ffffff",
      margin: isMobile ? "0 0 12px 0" : "0 0 20px 0",
    },

    subHeading: {
      fontSize: isMobile ? "14px" : "18px",
      opacity: 0.95,
      lineHeight: 1.7,
      marginBottom: isMobile ? "24px" : "40px",
      color: "#ffffff",
      margin: isMobile ? "0 0 24px 0" : "0 0 40px 0",
    },

    featureList: {
      display: "flex",
      flexDirection: isMobile ? ("row" as const) : ("column" as const),
      gap: isMobile ? "12px" : "20px",
      overflowX: isMobile ? "auto" : "visible",
    },

    featureItem: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? "10px" : "14px",
      fontSize: isMobile ? "13px" : "16px",
      fontWeight: 500,
      opacity: 0.95,
      color: "#ffffff",
      whiteSpace: isMobile ? ("nowrap" as const) : ("normal" as const),
    },

    featureIcon: {
      fontSize: isMobile ? "20px" : "26px",
    },

    // RIGHT PANEL STYLES
    rightPanel: {
      width: isMobile ? "100%" : "50%",
      height: isMobile ? "65vh" : "100vh",
      background: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "30px 25px" : "60px 80px",
      overflow: "auto",
      flexShrink: 0,
      position: "relative",
    },

    loginContent: {
      width: "100%",
      maxWidth: isMobile ? "100%" : "460px",
    },

    brandHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: isMobile ? "12px" : "14px",
      marginBottom: isMobile ? "28px" : "40px",
    },

    logoIcon: {
      width: isMobile ? "46px" : "52px",
      height: isMobile ? "46px" : "52px",
      background: "linear-gradient(135deg, #0f172a, #2563eb)",
      color: "#ffffff",
      borderRadius: isMobile ? "12px" : "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: isMobile ? "22px" : "26px",
      boxShadow: "0 8px 16px rgba(37, 99, 235, 0.35)",
    },

    brandName: {
      fontSize: isMobile ? "24px" : "26px",
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: "-0.5px",
    },

    textHeader: {
      textAlign: "center" as const,
      marginBottom: isMobile ? "28px" : "36px",
    },

    welcomeTitle: {
      fontSize: isMobile ? "26px" : "30px",
      fontWeight: 700,
      margin: "0 0 10px 0",
      color: "#1e293b",
      letterSpacing: "-0.6px",
    },

    welcomeSubtitle: {
      fontSize: isMobile ? "15px" : "16px",
      color: "#64748b",
      margin: 0,
    },

    form: {
      width: "100%",
      marginBottom: isMobile ? "20px" : "24px",
    },

    inputGroup: {
      marginBottom: isMobile ? "18px" : "20px",
    },

    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: 600,
      marginBottom: "10px",
      color: "#1e293b",
    },

    input: {
      width: "100%",
      padding: isMobile ? "14px 16px" : "15px 18px",
      fontSize: "15px",
      fontFamily: "'Inter', sans-serif",
      borderRadius: isMobile ? "10px" : "12px",
      border: "2px solid #e2e8f0",
      transition: "all 0.2s ease",
      background: "#ffffff",
      color: "#1e293b",
      outline: "none",
    },

    actionsRow: {
      display: "flex",
      flexDirection: isMobile ? ("column" as const) : ("row" as const),
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      marginBottom: isMobile ? "20px" : "24px",
      gap: isMobile ? "12px" : "0",
    },

    checkboxContainer: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      cursor: "pointer",
      color: "#1e293b",
      userSelect: "none" as const,
    },

    checkbox: {
      width: "18px",
      height: "18px",
      cursor: "pointer",
      accentColor: "#2563eb",
    },

    checkboxLabel: {
      fontSize: "14px",
    },

    forgotLink: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#2563eb",
      textDecoration: "none",
      transition: "color 0.2s ease",
      alignSelf: isMobile ? "flex-end" : "auto",
    },

    btnPrimary: {
      width: "100%",
      height: isMobile ? "50px" : "54px",
      background: "linear-gradient(135deg, #0f172a, #2563eb)",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: 600,
      borderRadius: isMobile ? "10px" : "12px",
      border: "none",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    divider: {
      display: "flex",
      alignItems: "center",
      margin: isMobile ? "20px 0" : "24px 0",
      fontSize: "14px",
      color: "#64748b",
      width: "100%",
    },

    dividerLine: {
      flex: 1,
      height: "1px",
      background: "#e2e8f0",
    },

    dividerText: {
      padding: "0 16px",
      fontSize: "14px",
      color: "#64748b",
    },

    btnGoogle: {
      width: "100%",
      height: isMobile ? "50px" : "54px",
      background: "#ffffff",
      border: "2px solid #e2e8f0",
      borderRadius: isMobile ? "10px" : "12px",
      fontWeight: 600,
      fontSize: "15px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      transition: "all 0.2s ease",
      color: "#1e293b",
    },

    bottomText: {
      marginTop: isMobile ? "24px" : "28px",
      textAlign: "center" as const,
      fontSize: "14px",
      color: "#64748b",
      width: "100%",
    },

    signupLink: {
      color: "#2563eb",
      fontWeight: 600,
      textDecoration: "none",
      transition: "color 0.2s ease",
    },

    legalFooter: {
      marginTop: isMobile ? "20px" : "24px",
      fontSize: isMobile ? "12px" : "13px",
      textAlign: "center" as const,
      color: "#94a3b8",
      opacity: 0.8,
      width: "100%",
    },

    loader: {
      width: "22px",
      height: "22px",
      border: "3px solid rgba(255, 255, 255, 0.3)",
      borderTop: "3px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      display: "inline-block",
    },
  };
}