import jwt from "jsonwebtoken";

export const TEST_JWT_SECRET = "test-secret";

/** Makes every method call on the chain return itself, and awaiting it resolves to `result`. */
export function makeChain(result: unknown): any {
  return new Proxy(function () {}, {
    get(_: unknown, prop: string | symbol) {
      if (prop === "then") {
        return (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
          Promise.resolve(result).then(res, rej);
      }
      if (prop === "catch") {
        return (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn);
      }
      if (prop === "finally") {
        return (fn: () => void) => Promise.resolve(result).finally(fn);
      }
      return (..._args: unknown[]) => makeChain(result);
    },
    apply() {
      return makeChain(result);
    },
  });
}

/** Queue up return values for sequential db calls within a single request. */
export function createDbMock() {
  let queue: unknown[] = [];

  function next() {
    return queue.shift() ?? [];
  }

  const db = {
    select: (..._: unknown[]) => makeChain(next()),
    insert: (..._: unknown[]) => makeChain(next()),
    update: (..._: unknown[]) => makeChain(next()),
  };

  function setResults(...results: unknown[]) {
    queue = [...results];
  }

  return { db, setResults };
}

/** Build a valid Bearer token for a test user. */
export function makeToken(sub: string, username: string): string {
  return jwt.sign({ sub, username }, TEST_JWT_SECRET, { expiresIn: "7d" });
}

/** A representative user row as drizzle would return it. */
export function makeUserRow(overrides: Partial<{
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  bio: string | null;
  website_url: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}> = {}) {
  return {
    id: "user-1",
    username: "testuser",
    email: "test@example.com",
    password_hash: "hashed:password123",
    display_name: "Test User",
    bio: null,
    website_url: null,
    avatar_url: null,
    created_at: new Date("2024-01-01T00:00:00Z"),
    updated_at: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  };
}
