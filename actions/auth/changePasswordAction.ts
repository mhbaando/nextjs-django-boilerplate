"use server";

import { publicRequest } from "@/lib/api-public";
import { resolveApiErrorMessage } from "@/lib/auth-api";

interface ChangePasswordFormData {
  email: string;
  currentPassword: string;
  newPassword: string;
}

type ChangePasswordResult =
  | { error: true; message: string }
  | { error: false; message: string };

export async function changePasswordAction(
  formData: ChangePasswordFormData,
): Promise<ChangePasswordResult> {
  const { email, currentPassword, newPassword } = formData;

  if (!email || !currentPassword || !newPassword) {
    return {
      error: true,
      message: "Please provide all required information.",
    };
  }

  try {
    const response = await publicRequest(
      "post",
      "/auth/force-change-password/",
      {
        email,
        current_password: currentPassword,
        new_password: newPassword,
      },
    );

    const data = response.data as {
      error?: boolean;
      message?: string;
    };

    if (data.error) {
      return {
        error: true,
        message: data.message || "Password change failed.",
      };
    }

    return {
      error: false,
      message: data.message || "Password changed successfully.",
    };
  } catch (error: unknown) {
    return {
      error: true,
      message: resolveApiErrorMessage(error, "Password change failed."),
    };
  }
}
