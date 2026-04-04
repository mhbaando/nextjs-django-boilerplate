"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/getSession";

export async function logoutAction() {
  const session = await getSession();

  session.accessToken = undefined;
  session.refreshToken = undefined;
  session.user = undefined;

  await session.save();

  const cookieStore = await cookies();
  cookieStore.delete("trusted_device");

  return { success: true };
}
