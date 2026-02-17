export interface Auth {
  user: User;
}

export interface SharedData {
  name: string;
  auth: Auth;
  [key: string]: unknown;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  avatar?: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
