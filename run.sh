#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Ensure Homebrew PostgreSQL@16 is running on port 5433
if ! pg_isready -p 5433 -q 2>/dev/null; then
  echo "[run] Starting PostgreSQL@16..."
  brew services start postgresql@16
  sleep 2
fi

# Push any schema changes
echo "[run] Syncing database schema..."
cd "$ROOT/server" && bun run db:push

# Start the app
echo "[run] Starting app..."
cd "$ROOT" && bun run dev
