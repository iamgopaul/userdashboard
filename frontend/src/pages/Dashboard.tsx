import { useAuth } from "../context/AuthContext";
import Feed from "../components/Feed";
import Profile from "../components/Profile";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-lg">Twitter 2.0</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              @{user?.username}
            </span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Profile sidebar */}
          <aside className="md:sticky md:top-20">
            <Profile />
          </aside>

          {/* Feed */}
          <section>
            <Feed />
          </section>
        </div>
      </main>
    </div>
  );
}
