"use server";

import { cookies } from "next/headers";
import { publicRequest } from "@/lib/api-public";
import { getSession } from "@/lib/getSession";
import { resolveApiErrorMessage } from "@/lib/auth-api";

interface VerifyOtpForm {
  email: string;
  code: string;
  deviceInfo: {
    platform: string;
    device: string;
    browser: string;
    os: string;
    ip: string;
    city: string;
    country: string;
  };
}

type VerifyOtpResult =
  | { error: true; message: string }
  | { error: false; user: unknown };

export async function verifyOtpAction(
  formData: VerifyOtpForm,
): Promise<VerifyOtpResult> {
  const { email, code, deviceInfo } = formData;

  if (!email || !code) {
    return {
      error: true,
      message: "Please fill in all details.",
    };
  }

  const session = await getSession();

  try {
    const response = await publicRequest("post", "/token/verify-otp/", {
      email,
      otp_code: code,
      device_info: deviceInfo,
    });

    const data = response.data as {
      error?: boolean;
      message?: string;
      access_token?: string;
      refresh_token?: string;
      trusted_device_id?: string;
      user?: {
        id: string;
        email: string;
        full_name?: string | null;
        username?: string | null;
        avatar?: string | null;
      };
    };

    if (data.error) {
      return {
        error: true,
        message: data.message || "Verification failed.",
      };
    }

    if (!data.access_token || !data.refresh_token || !data.user) {
      return {
        error: true,
        message: "Verification response is incomplete. Please try again.",
      };
    }

    session.accessToken = data.access_token;
    session.refreshToken = data.refresh_token;

    session.user = {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.full_name,
      username: data.user.username,
      avatar: data.user.avatar,
    };

    if (data.trusted_device_id) {
      const cookieStore = await cookies();
      cookieStore.set("trusted_device", data.trusted_device_id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    await session.save();

    return {
      error: false,
      user: data.user,
    };
  } catch (error: unknown) {
    return {
      error: true,
      message: resolveApiErrorMessage(error, "Verification failed."),
    };
  }
}
