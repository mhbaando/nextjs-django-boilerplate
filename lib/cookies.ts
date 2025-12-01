"use server";

import { cookies } from "next/headers";

export async function saveTrustedDeviceCookie(deviceId: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: "trusted_device",
    value: deviceId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
