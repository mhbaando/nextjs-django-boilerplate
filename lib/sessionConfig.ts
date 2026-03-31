import type { SessionOptions } from "iron-session";

/**
 * 🔐 Session configuration
 */
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!, // MUST be 32+ chars
  cookieName: "app_session",

  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",

    // ⏱ session lifetime
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

/**
 * 🧠 Session Data Shape
 */
export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  change_password_required?: boolean;
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
    username?: string | null;
    avatar?: string | null;
  };
}
