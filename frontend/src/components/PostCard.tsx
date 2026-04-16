import type { Post } from "../types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        {post.author.avatarUrl ? (
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-semibold text-sm">
            {post.author.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-gray-900">
              {post.author.displayName}
            </span>
            <span className="text-xs text-gray-400">@{post.author.username}</span>
            <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
              {timeAgo(post.createdAt)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">
            {post.content}
          </p>
        </div>
      </div>
    </article>
  );
}
