import React, { useMemo, useState } from "react";

interface ChatUser {
  username: string;
  display_name?: string;
  profile_picture?: string;
  bio?: string;
}

interface EditProfileModalProps {
  user: ChatUser;
  onClose: () => void;
  onSaved: (updatedUser: ChatUser) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env.VITE_API_URL as string;

export default function EditProfileModal({ user, onClose, onSaved }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.display_name || user.username);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user.profile_picture || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fallbackAvatar = useMemo(
    () => `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user.username)}&background=random`,
    [displayName, user.username]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }

    setError("");
    setSelectedFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
  };

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Display name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let profilePicture = user.profile_picture || null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("photo", selectedFile);

        const uploadRes = await fetch(`${API_URL}/api/v1/users/${user.username}/profile-picture`, {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData?.error || "Failed to upload profile picture.");
        }

        profilePicture = uploadData?.profile_picture || profilePicture;
      }

      const upsertRes = await fetch(`${API_URL}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          display_name: trimmedName,
          profile_picture: profilePicture,
          bio: user.bio || "",
        }),
      });

      const upsertData = await upsertRes.json();
      if (!upsertRes.ok) {
        throw new Error(upsertData?.error || "Failed to save profile.");
      }

      onSaved(upsertData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[12000] bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[12001] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Profile</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-col items-center gap-3">
            <img
              src={previewUrl || fallbackAvatar}
              alt="Profile"
              className="h-24 w-24 rounded-full border-2 border-slate-200 object-cover shadow-sm dark:border-slate-700"
            />
            <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              Change Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/30"
              placeholder="Enter display name"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

















