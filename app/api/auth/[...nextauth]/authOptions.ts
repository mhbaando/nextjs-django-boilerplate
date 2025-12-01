import { NextAuthOptions } from "next-auth";
import { jwtDecode } from "jwt-decode";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginUser, refreshToken, verifyOTP } from "@/actions/auth/login";

// --- Type Augmentation ---
// This extends the default NextAuth types to include our custom properties
// like accessToken, otp_required, etc. for full type safety.

declare module "next-auth" {
  interface User {
    id?: string;
    username?: string;
    accessToken?: string;
    refreshToken?: string;
    otp_required?: boolean;
    change_password_required?: boolean;
    email?: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      image: string | null;
    };
    accessToken: string;
    error?: "RefreshAccessTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number; // Stored as a timestamp in milliseconds
    error?: "RefreshAccessTokenError";
    otp_required?: boolean;
    change_password_required?: boolean;
  }
}

// --- Helper Functions ---

/**
 * Refreshes an expired access token using the refresh token.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await refreshToken({
      refresh: token.refreshToken,
    });

    if (response.error || !response.access) {
      throw new Error(response.message || "Failed to refresh access token");
    }

    const decodedToken = jwtDecode<{ exp: number }>(response.access);
    const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds

    return {
      ...token,
      accessToken: response.access,
      accessTokenExpires: expirationTime,
      refreshToken: response.refresh ?? token.refreshToken, // Use new refresh token if provided
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// --- Credentials Providers ---

/**
 * Provider for the initial email/password login step.
 */
const loginCredentialsProvider = CredentialsProvider({
  id: "login", // Matches the first argument to `signIn()`
  name: "Login",
  credentials: {
    email: { label: "Email", type: "text" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials, req) {
    if (!credentials?.email || !credentials?.password) {
      throw new Error("Email and Password are required.");
    }

    // Read the raw 'Cookie' header from the incoming request.
    const cookieHeader = req.headers?.cookie ?? null;

    // Call the tenant-aware server action to authenticate against Django,
    // passing the entire cookie header.
    const res = await loginUser({
      email: credentials.email,
      password: credentials.password,
      cookie: cookieHeader,
    });

    // Case 1: A standard authentication error occurred (e.g., wrong password)
    if (res.error) {
      // Throw the specific error message from the server.
      throw new Error(res.message);
    }

    // Case 2: Multi-step flow is required. Throw a structured error that the client can parse.
    if (res.otp_required) {
      throw new Error(
        JSON.stringify({
          error: true,
          otp_required: true,
          message: res.message || "OTP verification required",
          email: res.email,
        }),
      );
    }
    if (res.change_password_required) {
      throw new Error(
        JSON.stringify({
          error: true,
          change_password_required: true,
          message: res.message || "Password change required",
          email: res.email,
        }),
      );
    }

    // Case 3: Successful, direct login. Return the full user object with tokens.
    if (res.user && res.access_token && res.refresh_token) {
      return {
        id: res.user.id,
        email: res.user.email,
        image: res.user.avatar,
        username: res.user.username,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      };
    }

    // Fallback case: The API response was malformed.
    throw new Error("Invalid response from the authentication server.");
  },
});

/**
 * Provider for the second step: OTP verification.
 */
const otpCredentialsProvider = CredentialsProvider({
  id: "otp",
  name: "OTP",
  credentials: {
    email: { label: "Email", type: "text" },
    otp_code: { label: "OTP", type: "text" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials.otp_code) {
      throw new Error("Otp-ga Ma noqon Karo mid faaruq ah.");
    }

    // Call the tenant-aware server action to verify the OTP
    const res = await verifyOTP(credentials);

    if (res.error) {
      throw new Error(res.message || "OTP-ga Lama Xaqiijin Karo.");
    }

    if (res.user && res.access_token && res.refresh_token) {
      return {
        id: res.user.id,
        email: res.user.email,
        image: res.user.avatar,
        username: res.user.username,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      };
    }

    throw new Error("Invalid response from server after OTP verification.");
  },
});

// --- Main NextAuth Configuration ---

export const authOptions: NextAuthOptions = {
  providers: [loginCredentialsProvider, otpCredentialsProvider],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * This callback is invoked whenever a JWT is created or updated.
     * The `user` object is only passed on the very first sign-in.
     */
    async jwt({ token, user }) {
      // 1. Initial Sign-in: The `user` object is available.
      if (user) {
        // This case handles a full, successful sign-in (not a multi-step flow trigger)
        const decodedToken = jwtDecode<{ exp: number }>(
          user.accessToken as string,
        );
        const expirationTime = decodedToken.exp * 1000;

        // Populate the JWT with essential data from the `user` object (from `authorize`).
        return {
          id: user.id as string,
          username: user.username as string,
          accessToken: user.accessToken as string,
          refreshToken: user.refreshToken as string,
          accessTokenExpires: expirationTime,
          email: user.email as string,
        };
      }

      // 2. Subsequent Requests: The `user` object is not available.
      // Check if the current access token is still valid.
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // 3. Token Expired: The access token has expired, so we must try to refresh it.
      if (!token.refreshToken) {
        // If there's no refresh token, we cannot continue.
        return { ...token, error: "RefreshAccessTokenError" };
      }

      // We have a refresh token, so attempt to get a new access token.
      return refreshAccessToken(token);
    },

    /**
     * This callback is invoked whenever a session is checked.
     * It makes the data from the JWT available to the client-side session object.
     */
    async session({ session, token }) {
      if (token) {
        // Transfer essential user data from the token to the session object.
        session.user = {
          id: token.id,
          username: token.username,
          email: token.email!,
          image: token.picture ?? null,
        };
        // Make the access token and any errors available on the session.
        session.accessToken = token.accessToken;
        session.error = token.error;
      }

      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
    error: "/sign-in", // Redirect users to our custom sign-in page on NextAuth errors
  },
};
