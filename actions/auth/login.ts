"use server";
import { saveTrustedDeviceCookie } from "@/lib/cookies";

// --- Interfaces ---

export interface LoginCredentials {
  email: string;
  password: string;
  cookie?: string | null;
}

interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
}

export type ApiResponse = {
  error: boolean;
  message?: string;
  otp_required?: boolean;
  change_password_required?: boolean;
  user?: User;
  access_token?: string;
  refresh_token?: string;
  email?: string;
};

export type VerifyOTPResponse = {
  error: boolean;
  message?: string;
  user?: User;
  access_token?: string;
  refresh_token?: string;
  // This field captures specific validation errors from Django
  otp_code?: string[];
  trusted_device_id?: string;
};

interface RefreshTokenCredentials {
  refresh: string;
}

export type RefreshTokenResponse = {
  detail?: string;
  code?: string;
  message?: string;
  error?: boolean;
  access?: string;
  refresh?: string;
};

const BASE_API_URL = process.env.API_BASE_URL;

export async function loginUser(
  credentials: LoginCredentials,
): Promise<ApiResponse> {
  try {
    if (!credentials.email || !credentials.password) {
      return {
        error: true,
        message: "Fadlan buuxi iimaylka iyo fure sireedka.",
      };
    }

    // Prepare headers, forwarding the raw cookie header if it exists.
    const headers: { [key: string]: string } = {};
    if (credentials.cookie) {
      headers["Cookie"] = credentials.cookie;
    }

    const response = await fetch(`${BASE_API_URL}/auth/login/`, {
      method: "POST",
      headers,
      body: JSON.stringify(credentials),
    });

    // Check if the response is not OK (non-2xx status)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: true,
        message:
          errorData.message ||
          errorData.detail ||
          `HTTP Error: ${response.status} ${response.statusText}`,
      };
    }

    const data: ApiResponse = await response.json();

    return data;
  } catch (error) {
    return {
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "Khalad aan la aqoon ayaa dhacay.",
    };
  }
}

interface VerifyOTPCredentails {
  email: string;
  otp_code: string;
}

export async function verifyOTP(
  credentials: VerifyOTPCredentails,
): Promise<VerifyOTPResponse> {
  try {
    if (!credentials.email || !credentials.otp_code) {
      return {
        error: true,
        message: "Fadlan buuxi iimaylka ama OTP-ga.",
      };
    }

    const response = await fetch(`${BASE_API_URL}/token/verify-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    // Check if the response is not OK (non-2xx status)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: true,
        message:
          errorData.message ||
          errorData.detail ||
          `HTTP Error: ${response.status} ${response.statusText}`,
      };
    }

    const data: VerifyOTPResponse = await response.json();

    if (data.trusted_device_id) {
      await saveTrustedDeviceCookie(data.trusted_device_id);
    }

    return data;
  } catch (error) {
    return {
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "Khalad aan la aqoon ayaa dhacay.",
    };
  }
}

interface RefreshTokenCredentials {
  refresh: string;
}

export async function refreshToken(
  credentials: RefreshTokenCredentials,
): Promise<RefreshTokenResponse> {
  try {
    if (!credentials.refresh) {
      return {
        error: true,
        message: "Fadlan soo gali refresh token.",
      };
    }

    const response = await fetch(`${BASE_API_URL}/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    // Check if the response is not OK (non-2xx status)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: true,
        message:
          errorData.message ||
          errorData.detail ||
          `HTTP Error: ${response.status} ${response.statusText}`,
      };
    }

    const data: RefreshTokenResponse = await response.json();
    return data;
  } catch (error) {
    return {
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "Khalad aan la aqoon ayaa dhacay.",
    };
  }
}
