// File: video-call-main/src/features/chat/SettingsPanel.tsx

import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { WALLPAPERS, getWallpapersByCategory, WallpaperOption } from "./wallpapers";
import "./SettingsPanel.css";
const API_URL = import.meta.env.VITE_API_URL as string;
interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { currentUser, setCurrentUser, theme, setTheme, wallpaper, setWallpaper } = useChat();
  const [activeTab, setActiveTab] = useState<"profile" | "theme" | "wallpaper" | "notifications">("profile");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: currentUser?.display_name || "",
    bio: currentUser?.bio || "",
    profile_picture: currentUser?.profile_picture || "",
  });
  const [saving, setSaving] = useState(false);
  
  // ✅ Wallpaper filter state
  const [wallpaperCategory, setWallpaperCategory] = useState<'all' | WallpaperOption['category']>('all');

  const themes = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
  ];

  // ✅ Get filtered wallpapers
  const filteredWallpapers = wallpaperCategory === 'all' 
    ? WALLPAPERS 
    : getWallpapersByCategory(wallpaperCategory);

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
         const res = await fetch(`${API_URL}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          display_name: formData.display_name,
          bio: formData.bio,
          profile_picture: formData.profile_picture,
        }),
      });

      const data = await res.json();
      setCurrentUser(data);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    if (!currentUser) return;

    try {
await fetch(`${API_URL}/api/v1/users/${currentUser.username}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });

      setTheme(newTheme);
      localStorage.setItem("chatTheme", newTheme);
    } catch (err) {
      console.error("Failed to update theme", err);
    }
  };

  const handleWallpaperChange = async (newWallpaper: string) => {
    if (!currentUser) return;

    try {
      await fetch(`http://localhost:4000/api/v1/users/${currentUser.username}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallpaper: newWallpaper }),
      });

      setWallpaper(newWallpaper);
      localStorage.setItem("chatWallpaper", newWallpaper);
    } catch (err) {
      console.error("Failed to update wallpaper", err);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!currentUser) return;

    try {
      await fetch(`http://localhost:4000/api/v1/users/${currentUser.username}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_enabled: enabled }),
      });

      setCurrentUser({ ...currentUser, notification_enabled: enabled });
    } catch (err) {
      console.error("Failed to update notifications", err);
    }
  };

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel">
        {/* Header */}
        <div className="settings-header">
          <button className="back-btn" onClick={onClose}>
            ←
          </button>
          <h2>Settings</h2>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
          <button
            className={activeTab === "theme" ? "active" : ""}
            onClick={() => setActiveTab("theme")}
          >
            🎨 Theme
          </button>
          <button
            className={activeTab === "wallpaper" ? "active" : ""}
            onClick={() => setActiveTab("wallpaper")}
          >
            🖼️ Wallpaper
          </button>
          <button
            className={activeTab === "notifications" ? "active" : ""}
            onClick={() => setActiveTab("notifications")}
          >
            🔔 Notifications
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="profile-tab">
              <div className="profile-header">
                <img
                  src={
                    formData.profile_picture ||
                    `https://ui-avatars.com/api/?name=${currentUser?.username}&background=random&size=200`
                  }
                  alt="Profile"
                  className="profile-picture"
                />
                {editing && (
                  <button className="change-photo-btn">Change Photo</button>
                )}
              </div>

              <div className="profile-fields">
                <div className="field-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={currentUser?.username || ""}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="field-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) =>
                      setFormData({ ...formData, display_name: e.target.value })
                    }
                    disabled={!editing}
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="field-group">
                  <label>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    disabled={!editing}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="profile-actions">
                {!editing ? (
                  <button className="edit-btn" onClick={() => setEditing(true)}>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          display_name: currentUser?.display_name || "",
                          bio: currentUser?.bio || "",
                          profile_picture: currentUser?.profile_picture || "",
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="save-btn"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === "theme" && (
            <div className="theme-tab">
              <h3>Choose Your Theme</h3>
              <p className="tab-description">
                Select a theme that suits your style
              </p>

              <div className="theme-options">
                {themes.map((themeOption) => (
                  <div
                    key={themeOption.value}
                    className={`theme-option ${
                      theme === themeOption.value ? "selected" : ""
                    }`}
                    onClick={() => handleThemeChange(themeOption.value)}
                  >
                    <span className="theme-icon">{themeOption.icon}</span>
                    <span className="theme-label">{themeOption.label}</span>
                    {theme === themeOption.value && (
                      <span className="selected-check">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Wallpaper Tab - UPDATED */}
          {activeTab === "wallpaper" && (
            <div className="wallpaper-tab">
              <h3>Chat Wallpaper</h3>
              <p className="tab-description">
                Choose from {WALLPAPERS.length} professional wallpapers
              </p>

              {/* ✅ Category Filter */}
              <div className="wallpaper-categories">
                {['all', 'gradient', 'pattern', 'nature', 'abstract', 'minimal'].map((cat) => (
                  <button
                    key={cat}
                    className={`category-btn ${wallpaperCategory === cat ? 'active' : ''}`}
                    onClick={() => setWallpaperCategory(cat as any)}
                  >
                    {cat === 'all' ? '🌐 All' : 
                     cat === 'gradient' ? '🌈 Gradients' :
                     cat === 'pattern' ? '🔲 Patterns' :
                     cat === 'nature' ? '🌲 Nature' :
                     cat === 'abstract' ? '✨ Abstract' : '⚫ Minimal'}
                  </button>
                ))}
              </div>

              {/* ✅ Wallpaper Grid */}
              <div className="wallpaper-options">
                {filteredWallpapers.map((wallpaperOption) => (
                  <div
                    key={wallpaperOption.id}
                    className={`wallpaper-option ${
                      wallpaper === wallpaperOption.id ? "selected" : ""
                    }`}
                    onClick={() => handleWallpaperChange(wallpaperOption.id)}
                  >
                    <div
                      className="wallpaper-preview"
                      style={{ background: wallpaperOption.preview }}
                    >
                      {wallpaper === wallpaperOption.id && (
                        <span className="selected-check">✓</span>
                      )}
                    </div>
                    <span className="wallpaper-label">
                      {wallpaperOption.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="notifications-tab">
              <h3>Notification Settings</h3>
              <p className="tab-description">
                Manage how you receive notifications
              </p>

              <div className="notification-options">
                <div className="notification-item">
                  <div className="notification-info">
                    <span className="notification-icon">🔔</span>
                    <div>
                      <h4>Message Notifications</h4>
                      <p>Get notified when you receive new messages</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={currentUser?.notification_enabled ?? true}
                      onChange={(e) =>
                        handleNotificationToggle(e.target.checked)
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={currentUser?.sound_enabled ?? true}
                      onChange={(e) => {
                        // Handle sound toggle
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <span className="notification-icon">💻</span>
                    <div>
                      <h4>Desktop Notifications</h4>
                      <p>Show notifications on your desktop</p>
                    </div>
                  </div>
                  <button
                    className="permission-btn"
                    onClick={() => {
                      if ("Notification" in window) {
                        Notification.requestPermission();
                      }
                    }}
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}



