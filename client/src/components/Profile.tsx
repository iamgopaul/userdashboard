import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function Profile() {
  const { token, user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName ?? "",
    bio: user?.bio ?? "",
    websiteUrl: user?.websiteUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const updated = await api.uploadAvatar(token, file);
      setUser(updated);
    } catch {
      // silently ignore upload errors
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateMe(token, form);
      setUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    setForm({
      displayName: user?.displayName ?? "",
      bio: user?.bio ?? "",
      websiteUrl: user?.websiteUrl ?? "",
    });
    setError("");
    setEditing(true);
  }

  if (!user) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full p-1 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Change photo"
          >
            {uploading ? (
              <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* Info */}
      {editing ? (
        <div className="space-y-3">
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Link</label>
            <input
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))}
              placeholder="https://yoursite.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg py-1.5 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg py-1.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-1">
          <h2 className="font-semibold text-gray-900">{user.displayName}</h2>
          <p className="text-xs text-gray-400">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-600 mt-2 text-left">{user.bio}</p>
          )}
          {user.websiteUrl && (
            <a
              href={user.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {user.websiteUrl.replace(/^https?:\/\//, "")}
            </a>
          )}
          <button
            onClick={startEdit}
            className="mt-3 w-full border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg py-1.5 transition-colors"
          >
            Edit profile
          </button>
        </div>
      )}
    </div>
  );
}
