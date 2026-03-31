"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/getSession";
import { publicRequest } from "@/lib/api-public";
import { createVerificationRedirect } from "@/lib/verification";
import { resolveApiErrorMessage } from "@/lib/auth-api";

export interface DeviceInfoPayload {
  platform: string;
  os: string;
  device: string;
  browser: string;
  ip: string;
  city: string;
  country: string;
}

interface SignInFormData {
  email: string;
  password: string;
  deviceInfo: DeviceInfoPayload;
  callbackUrl?: string;
}

type SignInResult =
  | { error: true; message: string }
  | { error: false; otpRequired: true; redirectUrl: string; email: string }
  | {
      error: false;
      changePasswordRequired: true;
      redirectUrl: string;
      email: string;
    }
  | { error: false; user: unknown };

export async function signInAction(
  formData: SignInFormData,
): Promise<SignInResult> {
  const { email, password, deviceInfo, callbackUrl } = formData;

  if (!email || !password) {
    return {
      error: true,
      message: "Please fill in both email and password.",
    };
  }

  const session = await getSession();
  const cookieStore = await cookies();
  const trustedDeviceId = cookieStore.get("trusted_device")?.value;

  try {
    const response = await publicRequest(
      "post",
      "/auth/login/",
      {
        email,
        password,
        device_info: deviceInfo,
      },
      trustedDeviceId
        ? {
            headers: {
              Cookie: `trusted_device=${encodeURIComponent(trustedDeviceId)}`,
            },
          }
        : undefined,
    );

    const data = response.data as {
      error?: boolean;
      message?: string;
      otp_required?: boolean;
      change_password_required?: boolean;
      email?: string;
      access_token?: string;
      refresh_token?: string;
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
        message: data.message || "Login failed.",
      };
    }

    if (data.otp_required) {
      const redirect = await createVerificationRedirect(
        "otp",
        data.email || email,
        "/verify-otp",
        callbackUrl,
      );

      return {
        error: false,
        otpRequired: true,
        redirectUrl: redirect.redirectUrl,
        email: data.email || email,
      };
    }

    if (data.change_password_required) {
      const redirect = await createVerificationRedirect(
        "password_change",
        data.email || email,
        "/change-password",
        callbackUrl,
      );

      return {
        error: false,
        changePasswordRequired: true,
        redirectUrl: redirect.redirectUrl,
        email: data.email || email,
      };
    }

    if (!data.access_token || !data.refresh_token || !data.user) {
      return {
        error: true,
        message: "Login response is incomplete. Please try again.",
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

    await session.save();

    return {
      error: false,
      user: data.user,
    };
  } catch (error: unknown) {
    return {
      error: true,
      message: resolveApiErrorMessage(error, "Login failed."),
    };
  }
}
