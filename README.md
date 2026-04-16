# User Dashboard

A full-stack social platform where users can register, manage their profiles, and post to a shared feed.

## Tech Stack

**Frontend:** React 18, React Router v7, TypeScript, Tailwind CSS, Vite  
**Backend:** Express.js, PostgreSQL, Drizzle ORM, JWT auth, Multer  
**Runtime:** Bun

## Features

- User registration and JWT-based authentication
- Profile management: display name, bio, website URL, avatar upload
- Chronological post feed (max 500 characters per post)
- Paginated feed with all users' posts

## Project Structure

```
user-dashboard/
├── client/          # React frontend
│   └── src/
│       ├── pages/       # Login, Signup, Dashboard
│       ├── components/  # Profile, Feed, PostCard, CreatePost
│       ├── context/     # AuthContext
│       └── lib/api.ts   # API client
├── server/          # Express backend
│   └── src/
│       ├── routes/      # auth, profile, feed
│       ├── db/          # Drizzle schema & connection
│       └── middleware.ts
└── dev.ts           # Concurrent dev server launcher
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- PostgreSQL running on port `5433`

### Setup

```bash
# Install dependencies
bun install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL and JWT_SECRET

# Run database migrations
cd server && bun run db:push && cd ..

# Start both servers
bun run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL=postgresql://username@localhost:5433/user_dashboard
JWT_SECRET=your-random-secret-here
PORT=3001
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start both frontend and backend |
| `bun run dev:client` | Start frontend only |
| `bun run dev:server` | Start backend only |
| `cd server && bun run db:generate` | Generate Drizzle migrations |
| `cd server && bun run db:migrate` | Run pending migrations |
| `cd server && bun run db:studio` | Open Drizzle Studio |

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | No | Create account |
| POST | `/api/login` | No | Login |
| GET | `/api/me` | Yes | Get current user |
| PATCH | `/api/me` | Yes | Update profile |
| POST | `/api/me/avatar` | Yes | Upload avatar (max 2MB, JPEG/PNG/WebP/GIF) |
| GET | `/api/posts` | No | Get feed (supports `limit` & `offset`) |
| POST | `/api/posts` | Yes | Create post |
