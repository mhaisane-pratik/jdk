import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { User, MessageSquare, Phone, Video, Info } from "lucide-react";

interface UserInfoModalProps {
  username: string;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export default function UserInfoModal({ username, onClose }: UserInfoModalProps) {
  const { userProfiles, loadUserProfile } = useChat();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const data = await loadUserProfile(username);
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [username, loadUserProfile]);

  if (!username) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-[10001] flex max-h-[86vh] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/45 bg-white/90 shadow-[0_30px_90px_rgba(2,6,23,0.35)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90">
        <div className="relative flex items-center justify-between border-b border-slate-200/80 p-5 dark:border-slate-700">
          <h2 className="m-0 text-xl font-semibold tracking-tight text-slate-800 dark:text-white">
            Contact Info
          </h2>
          <button
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-2xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
               <div className="mb-3 h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-500" />
               <p>Loading profile...</p>
            </div>
          ) : profile ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <img
                  src={profile.profile_picture || `https://ui-avatars.com/api/?name=${profile.display_name || username}&background=0D9488&color=fff&size=128&bold=true`}
                  alt={username}
                  className="h-32 w-32 rounded-3xl object-cover shadow-2xl ring-4 ring-white dark:ring-slate-800"
                />
                {profile.is_online && (
                  <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900" />
                )}
              </div>

              <h3 className="m-0 text-2xl font-bold text-slate-900 dark:text-white text-center">
                {profile.display_name || username}
              </h3>
              <p className="mt-1 text-slate-500 dark:text-slate-400">@{username}</p>

              <div className="mt-8 flex w-full justify-around border-t border-b border-slate-100 py-6 dark:border-slate-800">
                <div className="flex flex-col items-center gap-2">
                   <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                     <MessageSquare size={20} />
                   </button>
                   <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Message</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                     <Phone size={20} />
                   </button>
                   <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Audio</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
                     <Video size={20} />
                   </button>
                   <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Video</span>
                </div>
              </div>

              <div className="mt-6 w-full space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Info size={14} />
                    <span>Bio</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {profile.bio || "No bio yet."}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <User size={14} />
                    <span>General Info</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Username</span>
                      <span className="font-medium text-slate-900 dark:text-white">@{username}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Status</span>
                      <span className={`font-semibold ${profile.is_online ? "text-emerald-500" : "text-slate-400"}`}>
                        {profile.is_online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500">User not found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
