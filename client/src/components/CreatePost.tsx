import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Post } from "../types";

const MAX = 500;

export default function CreatePost({ onPost }: { onPost: (post: Post) => void }) {
  const { token, user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || !token) return;
    setError("");
    setLoading(true);
    try {
      const post = await api.createPost(token, content.trim());
      onPost(post);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setLoading(false);
    }
  }

  const remaining = MAX - content.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-4"
    >
      <div className="flex gap-3">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-semibold text-sm">
            {user?.displayName.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX))}
            rows={3}
            placeholder="What's on your mind?"
            className="w-full resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span
              className={`text-xs ${remaining < 50 ? "text-orange-500" : "text-gray-400"}`}
            >
              {remaining}
            </span>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg px-4 py-1.5 transition-colors"
            >
              {loading ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
