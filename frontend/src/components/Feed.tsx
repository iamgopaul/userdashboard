import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Post } from "../types";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";

export default function Feed() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const data = await api.getFeed(token);
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  function handleNewPost(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  return (
    <div className="space-y-4">
      <CreatePost onPost={handleNewPost} />

      {loading && (
        <div className="text-center py-10 text-gray-400 text-sm">Loading feed…</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No posts yet. Be the first to post!
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
