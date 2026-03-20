import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";

interface SettingsPanelProps {
  onClose: () => void;
}

const themes = [
  { id: "light", name: "Light", icon: "☀️" },
  { id: "dark", name: "Dark", icon: "🌙" },
];

const wallpapers = [
  { id: "solid-white", name: "White", category: "solid", css: "#ffffff" },
  { id: "solid-light", name: "Light Gray", category: "solid", css: "#f0f2f5" },
  { id: "solid-dark", name: "Dark", category: "solid", css: "#111b21" },
  { id: "chat-bg", name: "Chat BG", category: "pattern", css: "#efeae2" },
  // Add more as needed
];

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { currentUser, theme, setTheme, wallpaper, setWallpaper } = useChat();
  const [activeTab, setActiveTab] = useState<"profile" | "theme" | "wallpaper" | "notifications">("profile");
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.display_name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");

  const handleSaveProfile = () => {
    // TODO: Implement API call to update profile
    setEditing(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[1000] animate-fadeIn" onClick={onClose} />
      <div className="fixed top-0 right-0 w-full md:w-[450px] h-screen bg-white dark:bg-gray-900 shadow-2xl z-[1001] flex flex-col animate-slideInRight">
        <div className="flex items-center gap-4 p-5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            className="w-10 h-10 flex items-center justify-center text-2xl text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
            onClick={onClose}
          >
            ←
          </button>
          <h2 className="m-0 text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {["profile", "theme", "wallpaper", "notifications"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-4 px-3 text-sm font-medium whitespace-nowrap transition border-b-3 ${
                activeTab === tab
                  ? "text-green-500 border-green-500"
                  : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <img
                  src={currentUser?.profile_picture || `https://ui-avatars.com/api/?name=${currentUser?.username}&background=random`}
                  alt="Profile"
                  className="w-36 h-36 rounded-full border-4 border-green-500 object-cover"
                />
                <button className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold hover:bg-green-600 transition">
                  Change Photo
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Username</label>
                  <input
                    type="text"
                    value={currentUser?.username || ""}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!editing}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!editing}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {editing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 py-3.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 py-3.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "theme" && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose your theme</p>
              <div className="grid grid-cols-2 gap-4">
                {themes.map((t) => (
                  <div
                    key={t.id}
                    className={`relative p-6 border-2 rounded-xl cursor-pointer flex flex-col items-center gap-3 transition hover:border-green-500 hover:-translate-y-1 ${
                      theme === t.id
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => setTheme(t.id)}
                  >
                    <span className="text-5xl">{t.icon}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</span>
                    {theme === t.id && (
                      <span className="absolute top-3 right-3 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "wallpaper" && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose your wallpaper</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {wallpapers.map((w) => (
                  <div
                    key={w.id}
                    className={`cursor-pointer rounded-xl overflow-hidden border-3 transition hover:-translate-y-1 hover:shadow-lg ${
                      wallpaper === w.id ? "border-indigo-500 shadow-indigo-200" : "border-transparent"
                    }`}
                    onClick={() => setWallpaper(w.id)}
                  >
                    <div
                      className="h-20 w-full"
                      style={{ background: w.css }}
                    ></div>
                    <div className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {w.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Notification settings</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <div className="flex gap-4 items-start">
                    <span className="text-3xl">🔔</span>
                    <div>
                      <h4 className="m-0 text-sm font-semibold text-gray-900 dark:text-white">Push Notifications</h4>
                      <p className="m-0 text-xs text-gray-500 dark:text-gray-400">Receive alerts for new messages</p>
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                    <span className="absolute cursor-pointer inset-0 bg-gray-300 dark:bg-gray-600 rounded-3xl transition before:absolute before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition peer-checked:bg-green-500 peer-checked:before:translate-x-6"></span>
                  </label>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <div className="flex gap-4 items-start">
                    <span className="text-3xl">🔊</span>
                    <div>
                      <h4 className="m-0 text-sm font-semibold text-gray-900 dark:text-white">Sound</h4>
                      <p className="m-0 text-xs text-gray-500 dark:text-gray-400">Play sound for new messages</p>
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                    <span className="absolute cursor-pointer inset-0 bg-gray-300 dark:bg-gray-600 rounded-3xl transition before:absolute before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition peer-checked:bg-green-500 peer-checked:before:translate-x-6"></span>
                  </label>
                </div>

                <button className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition">
                  Request Permission
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}