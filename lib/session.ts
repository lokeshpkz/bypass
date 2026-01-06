import { SessionOptions } from "iron-session";

export interface SessionData {
  user?: {
    id: string;
    username: string;
    isLoggedIn: boolean;
    role?: "admin" | "user";
    avatar?: string;
  };
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "subscription_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax", // Changing to lax to be safer with redirects
    maxAge: 60 * 60 * 24, // 24 hours
  },
};
console.log("Session Options:", { ...sessionOptions, password: "***" });


export const defaultSession: SessionData = {
  user: undefined,
};
