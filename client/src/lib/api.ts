import type { User, Post } from "../types";

const BASE = "/api";

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}

export const api = {
  register: (body: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) =>
    fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handle<{ token: string; user: User }>(r)),

  login: (body: { username: string; password: string }) =>
    fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handle<{ token: string; user: User }>(r)),

  getMe: (token: string) =>
    fetch(`${BASE}/me`, { headers: authHeaders(token) }).then((r) =>
      handle<User>(r)
    ),

  updateMe: (
    token: string,
    body: { displayName?: string; bio?: string; websiteUrl?: string }
  ) =>
    fetch(`${BASE}/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(body),
    }).then((r) => handle<User>(r)),

  uploadAvatar: (token: string, file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return fetch(`${BASE}/me/avatar`, {
      method: "POST",
      headers: authHeaders(token),
      body: fd,
    }).then((r) => handle<User>(r));
  },

  getFeed: (token: string, offset = 0) =>
    fetch(`${BASE}/posts?limit=20&offset=${offset}`, {
      headers: authHeaders(token),
    }).then((r) => handle<Post[]>(r)),

  createPost: (token: string, content: string) =>
    fetch(`${BASE}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ content }),
    }).then((r) => handle<Post>(r)),
};
