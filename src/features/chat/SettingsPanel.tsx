// File: video-call-main/src/features/chat/SettingsPanel.tsx

import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import {
  WALLPAPERS,
  getWallpapersByCategory,
  WallpaperOption,
} from "./wallpapers";
import "./SettingsPanel.css";

const API_URL = import.meta.env.VITE_API_URL as string; // ✅ Production API

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    currentUser,
    setCurrentUser,
    theme,
    setTheme,
    wallpaper,
    setWallpaper,
  } = useChat();

  const [activeTab, setActiveTab] = useState<
    "profile" | "theme" | "wallpaper" | "notifications"
  >("profile");

  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    display_name: currentUser?.display_name || "",
    bio: currentUser?.bio || "",
    profile_picture: currentUser?.profile_picture || "",
  });

  const [saving, setSaving] = useState(false);

  const [wallpaperCategory, setWallpaperCategory] = useState<
    "all" | WallpaperOption["category"]
  >("all");

  const themes = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
  ];

  const filteredWallpapers =
    wallpaperCategory === "all"
      ? WALLPAPERS
      : getWallpapersByCategory(wallpaperCategory);

  // ✅ PROFILE SAVE
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

      if (!res.ok) throw new Error("Failed");

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

  // ✅ THEME CHANGE
  const handleThemeChange = async (newTheme: string) => {
    if (!currentUser) return;

    try {
      await fetch(
        `${API_URL}/api/v1/users/${currentUser.username}/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: newTheme }),
        }
      );

      setTheme(newTheme);
      localStorage.setItem("chatTheme", newTheme);
    } catch (err) {
      console.error("Failed to update theme", err);
    }
  };

  // ✅ WALLPAPER CHANGE
  const handleWallpaperChange = async (newWallpaper: string) => {
    if (!currentUser) return;

    try {
      await fetch(
        `${API_URL}/api/v1/users/${currentUser.username}/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallpaper: newWallpaper }),
        }
      );

      setWallpaper(newWallpaper);
      localStorage.setItem("chatWallpaper", newWallpaper);
    } catch (err) {
      console.error("Failed to update wallpaper", err);
    }
  };

  // ✅ NOTIFICATION TOGGLE
  const handleNotificationToggle = async (enabled: boolean) => {
    if (!currentUser) return;

    try {
      await fetch(
        `${API_URL}/api/v1/users/${currentUser.username}/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_enabled: enabled }),
        }
      );

      setCurrentUser({
        ...currentUser,
        notification_enabled: enabled,
      });
    } catch (err) {
      console.error("Failed to update notifications", err);
    }
  };

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <button className="back-btn" onClick={onClose}>
            ←
          </button>
          <h2>Settings</h2>
        </div>

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

        <div className="settings-content">
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
              </div>

              <div className="profile-fields">
                <input
                  type="text"
                  value={formData.display_name}
                  disabled={!editing}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_name: e.target.value,
                    })
                  }
                  placeholder="Display Name"
                />

                <textarea
                  value={formData.bio}
                  disabled={!editing}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Bio"
                />
              </div>

              {!editing ? (
                <button onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}