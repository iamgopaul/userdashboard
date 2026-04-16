export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type Post = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};
